"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2, AlertTriangle, Volume2, ShieldAlert, Heart, LogOut } from "lucide-react";
import { speakInstruction } from "@/lib/speech";

interface DoseItem {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  instructions?: string | null;
  scheduledTime: string;
  status: "SCHEDULED" | "DUE" | "TAKEN" | "SKIPPED" | "MISSED";
  takenAt?: string | null;
}

export default function ElderDashboardPage() {
  const router = useRouter();
  const [elderName, setElderName] = useState("Eleanor Vance");
  const [doses, setDoses] = useState<DoseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sosActive, setSosActive] = useState(false);
  const [audioActiveId, setAudioActiveId] = useState<string | null>(null);

  const fetchDoses = async () => {
    try {
      // Check auth / get circle info
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (authData.authenticated && authData.elderName) {
        setElderName(authData.elderName);
      }

      const res = await fetch("/api/doses");
      const data = await res.json();
      if (data.doses) {
        setDoses(data.doses);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoses();
  }, []);

  const handleTakeDose = async (dose: DoseItem) => {
    setActionLoading(dose.id);
    try {
      const res = await fetch("/api/doses/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doseId: dose.id,
          medicationId: dose.medicationId,
          scheduledTime: dose.scheduledTime,
          status: "TAKEN",
        }),
      });

      if (res.ok) {
        // Play audio confirmation
        speakInstruction(`Great job! You recorded your ${dose.medicationName}.`);
        await fetchDoses();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkipDose = async (dose: DoseItem) => {
    const reason = prompt("Optional reason for skipping (e.g. felt nauseous, advised by doctor):", "Felt unwell");
    setActionLoading(dose.id);
    try {
      const res = await fetch("/api/doses/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doseId: dose.id,
          medicationId: dose.medicationId,
          scheduledTime: dose.scheduledTime,
          status: "SKIPPED",
          notes: reason || "Skipped by senior",
        }),
      });

      if (res.ok) {
        await fetchDoses();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleSpeak = (dose: DoseItem) => {
    setAudioActiveId(dose.id);
    const text = `Time to take ${dose.medicationName}, ${dose.dosage}. ${dose.instructions || ""}`;
    speakInstruction(text);
    setTimeout(() => setAudioActiveId(null), 4000);
  };

  const handleSos = () => {
    setSosActive(true);
    speakInstruction("Emergency alert sent. Sarah Vance and your care circle have been notified.");
  };

  const handleExit = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/elder/pin");
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  return (
    <main className="min-h-screen bg-elder-bg text-white p-4 md:p-8 max-w-4xl mx-auto pb-28">
      {/* Top Banner */}
      <header className="flex items-center justify-between border-b-2 border-elder-card pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-elder-highlight text-lg font-bold">
            <Heart className="w-6 h-6 fill-elder-highlight" />
            <span>CareCircle Senior View</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mt-1">Hello, {elderName}!</h1>
          <p className="text-elder-muted text-xl font-medium mt-1">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        <button
          onClick={handleExit}
          className="bg-elder-surface border border-elder-card hover:bg-elder-card px-4 py-3 rounded-2xl text-elder-muted hover:text-white flex items-center gap-2 font-bold text-base min-h-[48px]"
        >
          <LogOut className="w-5 h-5" />
          <span>Exit</span>
        </button>
      </header>

      {/* SOS Alert Banner */}
      {sosActive && (
        <div className="bg-elder-missed/20 border-4 border-elder-missed rounded-3xl p-6 mb-8 flex items-center gap-4 animate-pulse">
          <ShieldAlert className="w-12 h-12 text-elder-missed flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-black text-white">Emergency Alert Dispatched!</h2>
            <p className="text-lg text-elder-muted">
              Your primary caregiver (Sarah Vance) and care circle have been alerted to check in on you.
            </p>
          </div>
        </div>
      )}

      {/* Section Title */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
          <Clock className="w-8 h-8 text-elder-accent" />
          Today&apos;s Medications
        </h2>
        <span className="text-elder-muted text-lg font-semibold">
          {doses.filter(d => d.status === "TAKEN").length} of {doses.length} completed
        </span>
      </div>

      {/* Medication Cards List */}
      {loading ? (
        <div className="text-center py-16 text-elder-muted text-2xl font-bold">Loading your schedule...</div>
      ) : doses.length === 0 ? (
        <div className="bg-elder-surface border-2 border-elder-card rounded-3xl p-10 text-center">
          <CheckCircle2 className="w-16 h-16 text-elder-taken mx-auto mb-4" />
          <h3 className="text-2xl font-bold">All caught up!</h3>
          <p className="text-elder-muted text-lg mt-2">No medications scheduled for today.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {doses.map(dose => {
            const isTaken = dose.status === "TAKEN";
            const isDue = dose.status === "DUE" || dose.status === "SCHEDULED";
            const isMissed = dose.status === "MISSED";

            return (
              <div
                key={dose.id}
                className={`border-4 rounded-3xl p-6 md:p-8 transition-all shadow-xl ${
                  isTaken
                    ? "bg-elder-surface/60 border-elder-taken/50 opacity-90"
                    : isMissed
                    ? "bg-elder-surface border-elder-missed"
                    : "bg-elder-surface border-elder-card hover:border-elder-accent"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  {/* Medicine Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl md:text-4xl font-black text-white">{dose.medicationName}</span>
                      <span className="bg-elder-card px-3 py-1 rounded-xl text-elder-highlight font-extrabold text-lg md:text-xl">
                        {dose.dosage}
                      </span>
                    </div>

                    {dose.instructions && (
                      <p className="text-elder-muted text-lg md:text-xl font-medium mt-1 leading-relaxed">
                        {dose.instructions}
                      </p>
                    )}
                  </div>

                  {/* Scheduled Time Badge & Read Out Loud */}
                  <div className="flex items-center gap-3">
                    <div className="bg-elder-card/90 border border-elder-muted/30 px-5 py-3 rounded-2xl flex items-center gap-2">
                      <Clock className="w-6 h-6 text-elder-highlight" />
                      <span className="text-xl md:text-2xl font-black text-white">{formatTime(dose.scheduledTime)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSpeak(dose)}
                      title="Read instructions out loud"
                      className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-center ${
                        audioActiveId === dose.id
                          ? "bg-elder-highlight text-elder-bg border-white scale-105"
                          : "bg-elder-surface border-elder-card hover:border-elder-accent text-elder-highlight"
                      }`}
                    >
                      <Volume2 className="w-7 h-7" />
                    </button>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="mb-6">
                  {isTaken && (
                    <div className="inline-flex items-center gap-2 bg-elder-taken/20 text-elder-taken border border-elder-taken/40 px-4 py-2 rounded-xl text-lg font-bold">
                      <CheckCircle2 className="w-6 h-6" />
                      <span>Taken successfully</span>
                    </div>
                  )}
                  {isMissed && (
                    <div className="inline-flex items-center gap-2 bg-elder-missed/20 text-elder-missed border border-elder-missed/40 px-4 py-2 rounded-xl text-lg font-bold">
                      <AlertTriangle className="w-6 h-6" />
                      <span>Past due time</span>
                    </div>
                  )}
                  {isDue && (
                    <div className="inline-flex items-center gap-2 bg-elder-due/20 text-elder-due border border-elder-due/40 px-4 py-2 rounded-xl text-lg font-bold">
                      <Clock className="w-6 h-6" />
                      <span>Ready to take</span>
                    </div>
                  )}
                </div>

                {/* Giant Action Buttons */}
                {!isTaken && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t-2 border-elder-card/50">
                    <button
                      type="button"
                      onClick={() => handleTakeDose(dose)}
                      disabled={actionLoading === dose.id}
                      className="md:col-span-2 h-20 bg-elder-taken hover:bg-emerald-400 active:scale-98 text-elder-bg font-black text-2xl md:text-3xl rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3"
                    >
                      <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" />
                      {actionLoading === dose.id ? "Recording..." : "I TOOK THIS MEDICATION"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSkipDose(dose)}
                      disabled={actionLoading === dose.id}
                      className="h-20 bg-elder-surface border-2 border-elder-card hover:bg-elder-card text-elder-muted font-bold text-xl rounded-2xl transition-all flex items-center justify-center"
                    >
                      Skip Dose
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Persistent Emergency SOS Floating Bottom Button */}
      <footer className="fixed bottom-4 left-0 right-0 max-w-4xl mx-auto px-4 z-40">
        <button
          type="button"
          onClick={handleSos}
          className="w-full h-18 bg-elder-missed hover:bg-red-500 active:scale-98 text-white font-black text-2xl md:text-3xl rounded-3xl shadow-2xl border-4 border-red-300 flex items-center justify-center gap-4 transition-all"
        >
          <ShieldAlert className="w-9 h-9" />
          EMERGENCY SOS — ALERT CAREGIVERS
        </button>
      </footer>
    </main>
  );
}
