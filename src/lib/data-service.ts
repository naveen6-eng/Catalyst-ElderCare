import { prisma } from "./prisma";
import { store, DBUser, DBCareCircle, DBMedication, DBDoseLog, DBAppointment } from "./store";
import { hashPassword, hashPin } from "./auth";

// Check if Prisma database connection is available
async function hasLiveDatabase(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export const DataService = {
  // --- USERS & AUTH ---
  async findUserByEmail(email: string): Promise<DBUser | null> {
    const isLive = await hasLiveDatabase();
    if (isLive) {
      const u = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
      return u ? (u as unknown as DBUser) : null;
    }
    const found = store.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    return found || null;
  },

  async createUser(data: { email: string; password: string; name: string; role?: "PRIMARY_CAREGIVER" | "FAMILY_MEMBER"; phone?: string }): Promise<DBUser> {
    const passwordHash = hashPassword(data.password);
    const email = data.email.toLowerCase().trim();
    const isLive = await hasLiveDatabase();

    if (isLive) {
      const created = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: data.name,
          role: data.role || "PRIMARY_CAREGIVER",
          phone: data.phone || null,
        },
      });
      return created as unknown as DBUser;
    }

    const newUser: DBUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email,
      passwordHash,
      name: data.name,
      role: data.role || "PRIMARY_CAREGIVER",
      phone: data.phone || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.users.push(newUser);
    return newUser;
  },

  // --- CARE CIRCLES ---
  async findCircleById(circleId: string): Promise<DBCareCircle | null> {
    const isLive = await hasLiveDatabase();
    if (isLive) {
      const circle = await prisma.careCircle.findUnique({ where: { id: circleId } });
      return circle ? (circle as unknown as DBCareCircle) : null;
    }
    return store.circles.find(c => c.id === circleId) || null;
  },

  async findCircleByInviteCode(inviteCode: string): Promise<DBCareCircle | null> {
    const code = inviteCode.toUpperCase().trim();
    const isLive = await hasLiveDatabase();
    if (isLive) {
      const circle = await prisma.careCircle.findUnique({ where: { inviteCode: code } });
      return circle ? (circle as unknown as DBCareCircle) : null;
    }
    return store.circles.find(c => c.inviteCode.toUpperCase() === code) || null;
  },

  async createCircle(data: { elderName: string; elderPin: string; emergencyPhone?: string; userId: string; relationToElder: string }): Promise<DBCareCircle> {
    const elderPinHash = hashPin(data.elderPin);
    const inviteCode = `CARE-${Math.floor(1000 + Math.random() * 9000)}`;
    const isLive = await hasLiveDatabase();

    if (isLive) {
      const circle = await prisma.careCircle.create({
        data: {
          elderName: data.elderName,
          elderPinHash,
          inviteCode,
          emergencyPhone: data.emergencyPhone || null,
          members: {
            create: {
              userId: data.userId,
              relationToElder: data.relationToElder,
              notifyOnMissed: true,
              notifyDailyDigest: true,
            },
          },
        },
      });
      return circle as unknown as DBCareCircle;
    }

    const newCircle: DBCareCircle = {
      id: `circle_${Date.now()}`,
      elderName: data.elderName,
      elderPinHash,
      inviteCode,
      emergencyPhone: data.emergencyPhone || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.circles.push(newCircle);
    store.members.push({
      id: `mem_${Date.now()}`,
      circleId: newCircle.id,
      userId: data.userId,
      relationToElder: data.relationToElder,
      notifyOnMissed: true,
      notifyDailyDigest: true,
    });
    return newCircle;
  },

  async joinCircle(inviteCode: string, userId: string, relationToElder: string): Promise<DBCareCircle | null> {
    const circle = await this.findCircleByInviteCode(inviteCode);
    if (!circle) return null;

    const isLive = await hasLiveDatabase();
    if (isLive) {
      await prisma.careCircleMember.upsert({
        where: { circleId_userId: { circleId: circle.id, userId } },
        update: { relationToElder },
        create: { circleId: circle.id, userId, relationToElder },
      });
      return circle;
    }

    const existing = store.members.find(m => m.circleId === circle.id && m.userId === userId);
    if (!existing) {
      store.members.push({
        id: `mem_${Date.now()}`,
        circleId: circle.id,
        userId,
        relationToElder,
        notifyOnMissed: true,
        notifyDailyDigest: true,
      });
    }
    return circle;
  },

  async getCircleForUser(userId: string): Promise<DBCareCircle | null> {
    const isLive = await hasLiveDatabase();
    if (isLive) {
      const membership = await prisma.careCircleMember.findFirst({
        where: { userId },
        include: { circle: true },
      });
      return membership?.circle ? (membership.circle as unknown as DBCareCircle) : null;
    }
    const mem = store.members.find(m => m.userId === userId);
    if (!mem) return null;
    return store.circles.find(c => c.id === mem.circleId) || null;
  },

  // --- MEDICATIONS ---
  async getMedications(circleId: string): Promise<DBMedication[]> {
    const isLive = await hasLiveDatabase();
    if (isLive) {
      const meds = await prisma.medication.findMany({
        where: { circleId, active: true },
        orderBy: { createdAt: "desc" },
      });
      return meds as unknown as DBMedication[];
    }
    return store.medications.filter(m => m.circleId === circleId && m.active);
  },

  async createMedication(circleId: string, data: { name: string; dosage: string; instructions?: string | null; timesOfDay: string[]; currentSupply?: number; refillThreshold?: number }): Promise<DBMedication> {
    const isLive = await hasLiveDatabase();
    if (isLive) {
      const med = await prisma.medication.create({
        data: {
          circleId,
          name: data.name,
          dosage: data.dosage,
          instructions: data.instructions || null,
          timesOfDay: data.timesOfDay,
          currentSupply: data.currentSupply ?? 30,
          refillThreshold: data.refillThreshold ?? 5,
          active: true,
        },
      });
      return med as unknown as DBMedication;
    }

    const newMed: DBMedication = {
      id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      circleId,
      name: data.name,
      dosage: data.dosage,
      instructions: data.instructions || null,
      timesOfDay: data.timesOfDay,
      currentSupply: data.currentSupply ?? 30,
      refillThreshold: data.refillThreshold ?? 5,
      active: true,
      createdAt: new Date(),
    };
    store.medications.push(newMed);
    return newMed;
  },

  async updateMedication(id: string, circleId: string, data: Partial<DBMedication>): Promise<DBMedication | null> {
    const isLive = await hasLiveDatabase();
    if (isLive) {
      const med = await prisma.medication.update({
        where: { id },
        data,
      });
      return med as unknown as DBMedication;
    }

    const idx = store.medications.findIndex(m => m.id === id && m.circleId === circleId);
    if (idx === -1) return null;
    store.medications[idx] = { ...store.medications[idx], ...data };
    return store.medications[idx];
  },

  async deleteMedication(id: string, circleId: string): Promise<boolean> {
    const isLive = await hasLiveDatabase();
    if (isLive) {
      await prisma.medication.delete({ where: { id } });
      return true;
    }

    const idx = store.medications.findIndex(m => m.id === id && m.circleId === circleId);
    if (idx === -1) return false;
    store.medications[idx].active = false;
    return true;
  },

  // --- DOSES & SCHEDULING ---
  async getTodayDoses(circleId: string): Promise<Array<DBDoseLog & { medicationName: string; dosage: string; instructions?: string | null }>> {
    const meds = await this.getMedications(circleId);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Get existing logs for today
    const isLive = await hasLiveDatabase();
    let existingLogs: DBDoseLog[] = [];
    if (isLive) {
      const logs = await prisma.doseLog.findMany({
        where: {
          medication: { circleId },
          scheduledTime: { gte: startOfDay, lte: endOfDay },
        },
        include: { medication: true },
      });
      existingLogs = logs.map(l => ({
        id: l.id,
        medicationId: l.medicationId,
        circleId,
        scheduledTime: l.scheduledTime,
        takenAt: l.takenAt,
        status: l.status as DBDoseLog["status"],
        notes: l.notes,
        loggedById: l.loggedById,
      }));
    } else {
      existingLogs = store.doses.filter(d => d.circleId === circleId && d.scheduledTime >= startOfDay && d.scheduledTime <= endOfDay);
    }

    // Ensure all timesOfDay for all active medications have a dose entry
    const results: Array<DBDoseLog & { medicationName: string; dosage: string; instructions?: string | null }> = [];

    for (const med of meds) {
      for (const timeStr of med.timesOfDay) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

        // Find existing dose for this med & time
        let dose = existingLogs.find(
          d => d.medicationId === med.id &&
          d.scheduledTime.getHours() === hours &&
          d.scheduledTime.getMinutes() === minutes
        );

        if (!dose) {
          // Determine status based on current time
          const diffMinutes = (now.getTime() - scheduledTime.getTime()) / (1000 * 60);
          let initialStatus: DBDoseLog["status"] = "SCHEDULED";
          if (diffMinutes > 60) {
            initialStatus = "MISSED";
          } else if (diffMinutes >= -45 && diffMinutes <= 60) {
            initialStatus = "DUE";
          }

          dose = {
            id: `dose_${med.id}_${hours}_${minutes}`,
            medicationId: med.id,
            circleId,
            scheduledTime,
            takenAt: null,
            status: initialStatus,
            notes: null,
            loggedById: null,
          };

          if (!isLive) {
            store.doses.push(dose);
          }
        } else {
          // If unconfirmed and >60 min late, mark as missed
          const diffMinutes = (now.getTime() - dose.scheduledTime.getTime()) / (1000 * 60);
          if ((dose.status === "SCHEDULED" || dose.status === "DUE") && diffMinutes > 60) {
            dose.status = "MISSED";
          } else if (dose.status === "SCHEDULED" && diffMinutes >= -45 && diffMinutes <= 60) {
            dose.status = "DUE";
          }
        }

        results.push({
          ...dose,
          medicationName: med.name,
          dosage: med.dosage,
          instructions: med.instructions,
        });
      }
    }

    // Sort chronologically by scheduled time
    return results.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  },

  async logDose(params: { doseId: string; medicationId: string; circleId: string; scheduledTime: Date; status: "TAKEN" | "SKIPPED" | "MISSED"; notes?: string | null; loggedById?: string | null }): Promise<DBDoseLog> {
    const isLive = await hasLiveDatabase();
    const takenAt = params.status === "TAKEN" ? new Date() : null;

    if (isLive) {
      // Upsert dose log
      const log = await prisma.doseLog.upsert({
        where: { id: params.doseId },
        update: {
          status: params.status,
          takenAt,
          notes: params.notes || null,
          loggedById: params.loggedById || null,
        },
        create: {
          id: params.doseId,
          medicationId: params.medicationId,
          scheduledTime: params.scheduledTime,
          status: params.status,
          takenAt,
          notes: params.notes || null,
          loggedById: params.loggedById || null,
        },
      });

      // If TAKEN, decrement medication supply
      if (params.status === "TAKEN") {
        await prisma.medication.update({
          where: { id: params.medicationId },
          data: { currentSupply: { decrement: 1 } },
        });
      }

      return log as unknown as DBDoseLog;
    }

    let existing = store.doses.find(d => d.id === params.doseId);
    if (existing) {
      existing.status = params.status;
      existing.takenAt = takenAt;
      existing.notes = params.notes || null;
      existing.loggedById = params.loggedById || null;
    } else {
      existing = {
        id: params.doseId,
        medicationId: params.medicationId,
        circleId: params.circleId,
        scheduledTime: params.scheduledTime,
        takenAt,
        status: params.status,
        notes: params.notes || null,
        loggedById: params.loggedById || null,
      };
      store.doses.push(existing);
    }

    // Decrement medication supply in store
    if (params.status === "TAKEN") {
      const med = store.medications.find(m => m.id === params.medicationId);
      if (med && med.currentSupply > 0) {
        med.currentSupply -= 1;
      }
    }

    return existing;
  },

  // --- APPOINTMENTS ---
  async getAppointments(circleId: string): Promise<DBAppointment[]> {
    const isLive = await hasLiveDatabase();
    if (isLive) {
      const appts = await prisma.appointment.findMany({
        where: { circleId },
        orderBy: { appointmentTime: "asc" },
      });
      return appts as unknown as DBAppointment[];
    }
    return store.appointments
      .filter(a => a.circleId === circleId)
      .sort((a, b) => a.appointmentTime.getTime() - b.appointmentTime.getTime());
  },

  async createAppointment(circleId: string, data: { title: string; doctorName: string; location: string; appointmentTime: Date; notes?: string | null }): Promise<DBAppointment> {
    const isLive = await hasLiveDatabase();
    if (isLive) {
      const appt = await prisma.appointment.create({
        data: {
          circleId,
          title: data.title,
          doctorName: data.doctorName,
          location: data.location,
          appointmentTime: data.appointmentTime,
          notes: data.notes || null,
        },
      });
      return appt as unknown as DBAppointment;
    }

    const newAppt: DBAppointment = {
      id: `appt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      circleId,
      title: data.title,
      doctorName: data.doctorName,
      location: data.location,
      appointmentTime: data.appointmentTime,
      reminderSent: false,
      notes: data.notes || null,
      createdAt: new Date(),
    };
    store.appointments.push(newAppt);
    return newAppt;
  },

  async deleteAppointment(id: string, circleId: string): Promise<boolean> {
    const isLive = await hasLiveDatabase();
    if (isLive) {
      await prisma.appointment.delete({ where: { id } });
      return true;
    }

    const idx = store.appointments.findIndex(a => a.id === id && a.circleId === circleId);
    if (idx === -1) return false;
    store.appointments.splice(idx, 1);
    return true;
  },

  // --- ADHERENCE STATS ---
  async getAdherenceStats(circleId: string): Promise<{ totalDoses: number; taken: number; missed: number; skipped: number; adherenceRate: number }> {
    const doses = await this.getTodayDoses(circleId);
    const taken = doses.filter(d => d.status === "TAKEN").length;
    const missed = doses.filter(d => d.status === "MISSED").length;
    const skipped = doses.filter(d => d.status === "SKIPPED").length;
    const totalDoses = doses.length;
    const adherenceRate = totalDoses > 0 ? Math.round((taken / totalDoses) * 100) : 100;

    return { totalDoses, taken, missed, skipped, adherenceRate };
  },
};
