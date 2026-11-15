import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["PRIMARY_CAREGIVER", "FAMILY_MEMBER"]).default("PRIMARY_CAREGIVER"),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createCircleSchema = z.object({
  elderName: z.string().min(2, "Elder's name is required"),
  elderPin: z.string().regex(/^\d{4,6}$/, "Elder PIN must be 4 to 6 digits"),
  emergencyPhone: z.string().optional(),
  relationToElder: z.string().min(2, "Relationship is required (e.g. Daughter, Son, Nurse)"),
});

export const joinCircleSchema = z.object({
  inviteCode: z.string().min(4, "Valid invite code is required").transform(val => val.toUpperCase().trim()),
  relationToElder: z.string().min(2, "Relationship is required"),
});

export const elderPinAuthSchema = z.object({
  inviteCode: z.string().min(4, "Care Circle code required").transform(val => val.toUpperCase().trim()),
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4 to 6 digits"),
});

export const medicationSchema = z.object({
  name: z.string().min(2, "Medication name required (e.g. Metformin)"),
  dosage: z.string().min(1, "Dosage required (e.g. 500 mg)"),
  instructions: z.string().optional().nullable(),
  timesOfDay: z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time format must be HH:MM")).min(1, "At least one time slot required"),
  currentSupply: z.number().int().min(0).default(30),
  refillThreshold: z.number().int().min(0).default(5),
  active: z.boolean().default(true),
});

export const doseLogSchema = z.object({
  medicationId: z.string().min(1, "Medication ID required"),
  scheduledTime: z.string().datetime("Valid ISO datetime required"),
  status: z.enum(["TAKEN", "SKIPPED", "MISSED"]),
  notes: z.string().optional().nullable(),
});

export const appointmentSchema = z.object({
  title: z.string().min(2, "Title is required (e.g. Cardiology Visit)"),
  doctorName: z.string().min(2, "Doctor name required"),
  location: z.string().min(2, "Location or clinic required"),
  appointmentTime: z.string().datetime("Valid ISO datetime required"),
  notes: z.string().optional().nullable(),
});
