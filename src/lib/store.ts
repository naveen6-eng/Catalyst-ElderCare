import { prisma } from "./prisma";
import { hashPassword, hashPin } from "./auth";

export interface DBUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "PRIMARY_CAREGIVER" | "FAMILY_MEMBER" | "ELDERLY_USER";
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBCareCircle {
  id: string;
  elderName: string;
  elderDob?: Date | null;
  elderPinHash: string;
  inviteCode: string;
  emergencyPhone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBCareCircleMember {
  id: string;
  circleId: string;
  userId: string;
  relationToElder: string;
  notifyOnMissed: boolean;
  notifyDailyDigest: boolean;
}

export interface DBMedication {
  id: string;
  circleId: string;
  name: string;
  dosage: string;
  instructions?: string | null;
  timesOfDay: string[];
  currentSupply: number;
  refillThreshold: number;
  active: boolean;
  createdAt: Date;
}

export interface DBDoseLog {
  id: string;
  medicationId: string;
  circleId: string;
  scheduledTime: Date;
  takenAt?: Date | null;
  status: "SCHEDULED" | "DUE" | "TAKEN" | "SKIPPED" | "MISSED";
  notes?: string | null;
  loggedById?: string | null;
}

export interface DBAppointment {
  id: string;
  circleId: string;
  title: string;
  doctorName: string;
  location: string;
  appointmentTime: Date;
  reminderSent: boolean;
  notes?: string | null;
  createdAt: Date;
}

// In-Memory Global Fallback Store with Fictional Healthcare Demo Data
// Ensures app runs seamlessly both with PostgreSQL and standalone for zero-latency judges demo.
class MemoryDataStore {
  users: DBUser[] = [];
  circles: DBCareCircle[] = [];
  members: DBCareCircleMember[] = [];
  medications: DBMedication[] = [];
  doses: DBDoseLog[] = [];
  appointments: DBAppointment[] = [];
  initialized = false;

  initDemoData() {
    if (this.initialized) return;

    // Fictional Caregiver Demo User: Sarah Vance
    const caregiverId = "usr_caregiver_demo";
    this.users.push({
      id: caregiverId,
      email: "sarah.vance@example.com",
      passwordHash: hashPassword("password123"),
      name: "Sarah Vance",
      role: "PRIMARY_CAREGIVER",
      phone: "+1-555-0199",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Fictional Elder Care Circle: Eleanor Vance
    const circleId = "circle_demo_8291";
    this.circles.push({
      id: circleId,
      elderName: "Eleanor Vance",
      elderDob: new Date(1948, 4, 12),
      elderPinHash: hashPin("1234"),
      inviteCode: "CARE-8291",
      emergencyPhone: "+1-555-0199",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Care Circle Member relationship
    this.members.push({
      id: "mem_sarah_eleanor",
      circleId,
      userId: caregiverId,
      relationToElder: "Daughter & Primary Caregiver",
      notifyOnMissed: true,
      notifyDailyDigest: true,
    });

    // Fictional Demo Prescriptions
    const med1Id = "med_metformin_500";
    const med2Id = "med_lisinopril_10";
    const med3Id = "med_vitamin_d";

    this.medications.push(
      {
        id: med1Id,
        circleId,
        name: "Metformin",
        dosage: "500 mg",
        instructions: "Take with food and a full glass of water.",
        timesOfDay: ["08:00", "20:00"],
        currentSupply: 24,
        refillThreshold: 5,
        active: true,
        createdAt: new Date(),
      },
      {
        id: med2Id,
        circleId,
        name: "Lisinopril",
        dosage: "10 mg",
        instructions: "Take every morning to maintain healthy blood pressure.",
        timesOfDay: ["08:00"],
        currentSupply: 4, // Below threshold to trigger refill alert!
        refillThreshold: 5,
        active: true,
        createdAt: new Date(),
      },
      {
        id: med3Id,
        circleId,
        name: "Vitamin D3",
        dosage: "2000 IU",
        instructions: "Chew one tablet daily with afternoon meal.",
        timesOfDay: ["13:00"],
        currentSupply: 60,
        refillThreshold: 10,
        active: true,
        createdAt: new Date(),
      }
    );

    // Initial Today's Doses
    const today = new Date();
    const morningDoseTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0, 0);
    const afternoonDoseTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0, 0);
    const eveningDoseTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 20, 0, 0);

    // Dose 1: Taken at 8:05 AM
    this.doses.push({
      id: "dose_demo_1",
      medicationId: med1Id,
      circleId,
      scheduledTime: morningDoseTime,
      takenAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 5, 0),
      status: "TAKEN",
      notes: "Taken with breakfast oatmeal",
      loggedById: caregiverId,
    });

    // Dose 2: Lisinopril Due or Taken
    this.doses.push({
      id: "dose_demo_2",
      medicationId: med2Id,
      circleId,
      scheduledTime: morningDoseTime,
      takenAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 5, 0),
      status: "TAKEN",
      notes: null,
      loggedById: caregiverId,
    });

    // Dose 3: Afternoon Vitamin D3 Scheduled / Due
    this.doses.push({
      id: "dose_demo_3",
      medicationId: med3Id,
      circleId,
      scheduledTime: afternoonDoseTime,
      takenAt: null,
      status: "DUE",
      notes: null,
      loggedById: null,
    });

    // Dose 4: Evening Metformin Scheduled
    this.doses.push({
      id: "dose_demo_4",
      medicationId: med1Id,
      circleId,
      scheduledTime: eveningDoseTime,
      takenAt: null,
      status: "SCHEDULED",
      notes: null,
      loggedById: null,
    });

    // Demo Appointment: Upcoming visit
    const nextWeek = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);
    nextWeek.setHours(10, 30, 0, 0);
    this.appointments.push({
      id: "appt_demo_1",
      circleId,
      title: "Cardiology Follow-Up",
      doctorName: "Dr. Evelyn Reed, MD",
      location: "St. Jude Heart Clinic, Suite 402",
      appointmentTime: nextWeek,
      reminderSent: false,
      notes: "Bring current blood pressure log and medication list.",
      createdAt: new Date(),
    });

    this.initialized = true;
  }
}

// Global singleton
const globalStore = globalThis as unknown as { __carecircle_store__?: MemoryDataStore };
if (!globalStore.__carecircle_store__) {
  globalStore.__carecircle_store__ = new MemoryDataStore();
  globalStore.__carecircle_store__.initDemoData();
}

export const store = globalStore.__carecircle_store__;
