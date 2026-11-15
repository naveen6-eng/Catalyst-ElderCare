import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, hashPin, verifyPin, createSessionToken, verifySessionToken, SessionUser, ElderSession } from "@/lib/auth";
import { registerSchema, loginSchema, medicationSchema, doseLogSchema, appointmentSchema } from "@/lib/validations";
import { DataService } from "@/lib/data-service";

describe("CareCircle Security & Cryptography", () => {
  it("securely hashes and verifies passwords with salt", () => {
    const password = "SuperSecretPassword123!";
    const hash = hashPassword(password);
    expect(hash).toContain(":");
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("securely hashes and verifies senior 4-digit PINs with timing-safe check", () => {
    const pin = "1234";
    const hashed = hashPin(pin);
    expect(hashed).toContain(":");
    expect(verifyPin("1234", hashed)).toBe(true);
    expect(verifyPin("9999", hashed)).toBe(false);
    expect(verifyPin("123", hashed)).toBe(false);
  });

  it("generates and verifies HMAC session tokens with expiration", () => {
    const user: SessionUser = {
      userId: "usr_123",
      email: "test@carecircle.app",
      name: "Test Caregiver",
      role: "PRIMARY_CAREGIVER",
      circleId: "circle_abc",
    };

    const token = createSessionToken(user);
    const verified = verifySessionToken<SessionUser>(token);

    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(user.userId);
    expect(verified?.email).toBe(user.email);
    expect(verified?.role).toBe(user.role);
  });

  it("rejects tampered session tokens", () => {
    const user: SessionUser = {
      userId: "usr_123",
      email: "test@carecircle.app",
      name: "Test Caregiver",
      role: "PRIMARY_CAREGIVER",
    };

    const token = createSessionToken(user);
    const tampered = token.slice(0, -5) + "ABCDE";
    expect(verifySessionToken(tampered)).toBeNull();
  });
});

describe("CareCircle Data Validation Schemas", () => {
  it("validates correct registration payloads", () => {
    const valid = {
      email: "nurse@carecircle.app",
      password: "password123",
      name: "Nurse Joy",
      role: "PRIMARY_CAREGIVER",
    };
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid emails and short passwords", () => {
    const invalid = {
      email: "not-an-email",
      password: "123",
      name: "J",
    };
    const res = registerSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("validates prescription scheduling with HH:MM times", () => {
    const validMed = {
      name: "Metformin",
      dosage: "500 mg",
      instructions: "Take with food",
      timesOfDay: ["08:00", "20:00"],
      currentSupply: 30,
      refillThreshold: 5,
    };
    expect(medicationSchema.safeParse(validMed).success).toBe(true);

    const invalidTimes = {
      ...validMed,
      timesOfDay: ["8am"],
    };
    expect(medicationSchema.safeParse(invalidTimes).success).toBe(false);
  });
});

describe("CareCircle Medication & Dose Workflows", () => {
  it("retrieves pre-seeded demo Care Circle and medications", async () => {
    const circle = await DataService.findCircleByInviteCode("CARE-8291");
    expect(circle).not.toBeNull();
    expect(circle?.elderName).toBe("Eleanor Vance");

    const meds = await DataService.getMedications(circle!.id);
    expect(meds.length).toBeGreaterThanOrEqual(2);
    expect(meds.some(m => m.name === "Metformin")).toBe(true);
  });

  it("generates today's scheduled doses and adherence statistics", async () => {
    const circle = await DataService.findCircleByInviteCode("CARE-8291");
    const doses = await DataService.getTodayDoses(circle!.id);
    expect(doses.length).toBeGreaterThan(0);

    const stats = await DataService.getAdherenceStats(circle!.id);
    expect(stats.totalDoses).toBeGreaterThan(0);
    expect(stats.adherenceRate).toBeGreaterThanOrEqual(0);
    expect(stats.adherenceRate).toBeLessThanOrEqual(100);
  });

  it("records TAKEN dose status and decrements medication supply", async () => {
    const circle = await DataService.findCircleByInviteCode("CARE-8291");
    const meds = await DataService.getMedications(circle!.id);
    const targetMed = meds.find(m => m.name === "Metformin")!;
    const initialSupply = targetMed.currentSupply;

    const testTime = new Date();
    const doseId = `test_dose_${Date.now()}`;

    await DataService.logDose({
      doseId,
      medicationId: targetMed.id,
      circleId: circle!.id,
      scheduledTime: testTime,
      status: "TAKEN",
      notes: "Test dose taken with water",
    });

    const updatedMeds = await DataService.getMedications(circle!.id);
    const updatedTarget = updatedMeds.find(m => m.id === targetMed.id)!;
    expect(updatedTarget.currentSupply).toBe(initialSupply - 1);
  });

  it("creates and retrieves doctor appointments", async () => {
    const circle = await DataService.findCircleByInviteCode("CARE-8291");
    const futureDate = new Date(Date.now() + 86400000 * 3);

    const newAppt = await DataService.createAppointment(circle!.id, {
      title: "Geriatric Wellness Exam",
      doctorName: "Dr. Marcus Vance",
      location: "Downtown Medical Center",
      appointmentTime: futureDate,
      notes: "Annual wellness checkup",
    });

    expect(newAppt.id).toBeDefined();

    const appts = await DataService.getAppointments(circle!.id);
    expect(appts.some(a => a.id === newAppt.id)).toBe(true);
  });
});
