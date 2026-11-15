export type Role = "PRIMARY_CAREGIVER" | "FAMILY_MEMBER" | "ELDERLY_USER";

export type DoseStatus = "SCHEDULED" | "DUE" | "TAKEN" | "SKIPPED" | "MISSED";

export interface CareCircleSummary {
  id: string;
  elderName: string;
  inviteCode: string;
  memberCount: number;
}

export interface MedicationScheduleItem {
  id: string;
  name: string;
  dosage: string;
  instructions?: string | null;
  timesOfDay: string[];
  currentSupply: number;
  refillThreshold: number;
  active: boolean;
}

export interface DoseLogItem {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  takenAt?: string | null;
  status: DoseStatus;
  notes?: string | null;
}
