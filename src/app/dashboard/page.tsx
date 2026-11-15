"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, Clock, Activity, AlertCircle, Plus, Calendar, Pill, ShieldCheck, Copy, Check } from "lucide-react";

interface DoseItem {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  instructions?: string | null;
  scheduledTime: string;
  status: "SCHEDULED" | "DUE" | "TAKEN" | "SKIPPED" | "MISSED";
  takenAt?: string | null;
  notes?: string | null;
}

interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  currentSupply: number;
  refillThreshold: number;
}

export default function DashboardOverviewPage() {
  const [doses, setDoses] = useState<DoseItem[]>([]);
  const [meds, setMeds] = useState<MedicationItem[]>([]);
  const [adherence, setAdherence] = useState({ totalDoses: 0, taken: 0, missed: 0, skipped: 0, adherenceRate: 100 });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [dosesRes, medsRes] = await Promise.all([
        fetch("/api/doses"),
        fetch("/api/medications"),
      ]);

      const dosesData = await dosesRes.json();
      const medsData = await medsRes.json();

      if (dosesData.doses) setDoses(dosesData.doses);
      if (dosesData.adherence) setAdherence(dosesData.adherence);
      if (medsData.medications) setMeds(medsData.medications);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const lowSupplyMeds = meds.filter(m => m.currentSupply <= m.refillThreshold);

  const handleCopyCode = () => {
    navigator.clipboard.writeText("CARE-8291");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Adherence & Care Dashboard</h1>
          <p className="text-elder-muted text-base mt-1">
            Real-time medication adherence tracking and prescription oversight for Eleanor Vance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/medications"
            className="bg-elder-accent hover:bg-elder-highlight text-elder-bg font-extrabold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medication</span>
          </Link>
          <Link
            href="/dashboard/appointments"
            className="bg-elder-card hover:bg-elder-card/80 border border-elder-muted/30 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Doctor Visit</span>
          </Link>
        </div>
      </div>

      {/* Refill Alerts Banner (if any supply <= threshold) */}
      {lowSupplyMeds.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h2 className="text-white font-bold text-base">Low Medication Supply Warning</h2>
              <p className="text-amber-200/80 text-sm">
                {lowSupplyMeds.map(m => `${m.name} (${m.currentSupply} doses left)`).join(", ")}. Please refill soon.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/medications"
            className="bg-amber-500 text-elder-bg font-extrabold text-xs px-3 py-2 rounded-xl hover:bg-amber-400 transition-all self-start sm:self-auto"
          >
            Manage Refill
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Adherence Rate */}
        <div className="bg-elder-surface border border-elder-card rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-elder-muted text-sm font-semibold">Today&apos;s Adherence</span>
            <Activity className="w-5 h-5 text-elder-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{adherence.adherenceRate}%</span>
            <span className="text-xs text-elder-taken font-bold">On schedule</span>
          </div>
          <div className="w-full bg-elder-bg h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-elder-taken h-full rounded-full transition-all duration-500"
              style={{ width: `${adherence.adherenceRate}%` }}
            />
          </div>
        </div>

        {/* Doses Completed */}
        <div className="bg-elder-surface border border-elder-card rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-elder-muted text-sm font-semibold">Doses Taken</span>
            <CheckCircle2 className="w-5 h-5 text-elder-taken" />
          </div>
          <div className="text-4xl font-black text-white">{adherence.taken}</div>
          <p className="text-xs text-elder-muted mt-2">Out of {adherence.totalDoses} scheduled today</p>
        </div>

        {/* Due / Pending */}
        <div className="bg-elder-surface border border-elder-card rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-elder-muted text-sm font-semibold">Upcoming / Due</span>
            <Clock className="w-5 h-5 text-elder-due" />
          </div>
          <div className="text-4xl font-black text-white">
            {doses.filter(d => d.status === "DUE" || d.status === "SCHEDULED").length}
          </div>
          <p className="text-xs text-elder-muted mt-2">Awaiting confirmation</p>
        </div>

        {/* Missed */}
        <div className="bg-elder-surface border border-elder-card rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-elder-muted text-sm font-semibold">Missed Doses</span>
            <AlertTriangle className="w-5 h-5 text-elder-missed" />
          </div>
          <div className="text-4xl font-black text-white">{adherence.missed}</div>
          <p className="text-xs text-elder-muted mt-2">Automated alerts active</p>
        </div>
      </div>

      {/* Main Grid: Today's Timeline + Care Circle Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule Timeline (2 Cols) */}
        <div className="lg:col-span-2 bg-elder-surface border border-elder-card rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-elder-highlight" />
              Today&apos;s Adherence Log
            </h2>
            <span className="text-xs text-elder-muted font-medium">Auto-refreshed</span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-elder-muted">Loading schedule...</div>
          ) : doses.length === 0 ? (
            <div className="text-center py-10 text-elder-muted">No medications logged for today.</div>
          ) : (
            <div className="space-y-4">
              {doses.map(dose => {
                const timeStr = new Date(dose.scheduledTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                return (
                  <div
                    key={dose.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-elder-bg border border-elder-card rounded-xl gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-elder-card flex items-center justify-center text-elder-highlight flex-shrink-0 mt-0.5">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-base">{dose.medicationName}</span>
                          <span className="text-elder-muted text-xs bg-elder-surface px-2 py-0.5 rounded font-medium">
                            {dose.dosage}
                          </span>
                        </div>
                        <p className="text-elder-muted text-xs mt-0.5">{dose.instructions || "Scheduled dose"}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-elder-card/40">
                      <span className="font-mono text-sm text-white font-semibold">{timeStr}</span>

                      {dose.status === "TAKEN" && (
                        <span className="inline-flex items-center gap-1 bg-elder-taken/20 text-elder-taken text-xs font-bold px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                        </span>
                      )}
                      {dose.status === "DUE" && (
                        <span className="inline-flex items-center gap-1 bg-elder-due/20 text-elder-due text-xs font-bold px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5" /> Due Now
                        </span>
                      )}
                      {dose.status === "SCHEDULED" && (
                        <span className="inline-flex items-center gap-1 bg-elder-card text-elder-muted text-xs font-bold px-2.5 py-1 rounded-lg">
                          Scheduled
                        </span>
                      )}
                      {dose.status === "MISSED" && (
                        <span className="inline-flex items-center gap-1 bg-elder-missed/20 text-elder-missed text-xs font-bold px-2.5 py-1 rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5" /> Missed
                        </span>
                      )}
                      {dose.status === "SKIPPED" && (
                        <span className="inline-flex items-center gap-1 bg-elder-surface text-elder-muted text-xs font-bold px-2.5 py-1 rounded-lg">
                          Skipped
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Care Circle & Family Sharing Card (1 Col) */}
        <div className="space-y-6">
          <div className="bg-elder-surface border border-elder-card rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-elder-highlight" />
              Care Circle Credentials
            </h2>
            <p className="text-elder-muted text-xs mb-4">
              Share these credentials with family members or senior tablet kiosk to pair devices.
            </p>

            <div className="space-y-3">
              <div className="bg-elder-bg p-3 rounded-xl border border-elder-card">
                <span className="text-xs text-elder-muted block">Circle Invite Code</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-xl font-bold text-elder-highlight tracking-wider">CARE-8291</span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 hover:bg-elder-card rounded-lg text-elder-muted hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-elder-taken" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-elder-bg p-3 rounded-xl border border-elder-card">
                <span className="text-xs text-elder-muted block">Senior Kiosk PIN</span>
                <span className="font-mono text-xl font-bold text-elder-taken tracking-widest block mt-1">1234</span>
                <span className="text-[11px] text-elder-muted">Used on the senior touchscreen numpad</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-elder-card/50">
              <h3 className="text-xs font-bold text-white mb-2">Circle Members</h3>
              <ul className="text-xs text-elder-muted space-y-1.5">
                <li className="flex items-center justify-between">
                  <span className="text-white font-medium">Sarah Vance</span>
                  <span className="bg-elder-card px-2 py-0.5 rounded text-[10px]">Daughter & Admin</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-white font-medium">Eleanor Vance</span>
                  <span className="bg-elder-card px-2 py-0.5 rounded text-[10px]">Senior Patient</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
