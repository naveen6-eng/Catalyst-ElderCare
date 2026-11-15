"use client";

import { useState, useEffect } from "react";
import { Pill, Plus, Trash2, Clock, AlertCircle, CheckCircle2, X } from "lucide-react";

interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  instructions?: string | null;
  timesOfDay: string[];
  currentSupply: number;
  refillThreshold: number;
  active: boolean;
}

export default function MedicationsPage() {
  const [meds, setMeds] = useState<MedicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [timeSlots, setTimeSlots] = useState(["08:00"]);
  const [currentSupply, setCurrentSupply] = useState(30);
  const [refillThreshold, setRefillThreshold] = useState(5);

  const fetchMeds = async () => {
    try {
      const res = await fetch("/api/medications");
      const data = await res.json();
      if (data.medications) setMeds(data.medications);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeds();
  }, []);

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, "12:00"]);
  };

  const handleRemoveTimeSlot = (idx: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== idx));
    }
  };

  const handleTimeChange = (idx: number, val: string) => {
    const updated = [...timeSlots];
    updated[idx] = val;
    setTimeSlots(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          dosage,
          instructions: instructions || null,
          timesOfDay: timeSlots,
          currentSupply: Number(currentSupply),
          refillThreshold: Number(refillThreshold),
          active: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add medication");
        setSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      // Reset form
      setName("");
      setDosage("");
      setInstructions("");
      setTimeSlots(["08:00"]);
      setCurrentSupply(30);
      setRefillThreshold(5);
      await fetchMeds();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, medName: string) => {
    if (!confirm(`Are you sure you want to delete ${medName}?`)) return;

    try {
      const res = await fetch(`/api/medications/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchMeds();
      }
    } catch {
      alert("Failed to delete medication");
    }
  };

  const handleRefill = async (med: MedicationItem) => {
    try {
      const res = await fetch(`/api/medications/${med.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentSupply: med.currentSupply + 30 }),
      });
      if (res.ok) {
        await fetchMeds();
      }
    } catch {
      alert("Failed to record refill");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Pill className="w-8 h-8 text-elder-accent" />
            Medication Schedules
          </h1>
          <p className="text-elder-muted text-base mt-1">
            Manage prescriptions, daily dosages, and refill thresholds for Eleanor Vance.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-elder-accent hover:bg-elder-highlight text-elder-bg font-extrabold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Prescription</span>
        </button>
      </div>

      {/* Medications Grid */}
      {loading ? (
        <div className="text-center py-12 text-elder-muted">Loading medications...</div>
      ) : meds.length === 0 ? (
        <div className="bg-elder-surface border border-elder-card rounded-2xl p-10 text-center">
          <Pill className="w-12 h-12 text-elder-muted mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">No Medications Registered</h2>
          <p className="text-elder-muted text-sm mt-1 mb-4">Click below to add Eleanor&apos;s first prescription.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-elder-accent text-elder-bg font-bold text-sm px-4 py-2 rounded-xl"
          >
            Add Medication
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meds.map(med => {
            const isLow = med.currentSupply <= med.refillThreshold;
            return (
              <div
                key={med.id}
                className="bg-elder-surface border border-elder-card hover:border-elder-accent/60 rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h2 className="text-xl font-bold text-white">{med.name}</h2>
                      <span className="text-elder-highlight font-extrabold text-sm bg-elder-card px-2.5 py-0.5 rounded-lg inline-block mt-1">
                        {med.dosage}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(med.id, med.name)}
                      title="Delete prescription"
                      className="p-1.5 text-elder-muted hover:text-elder-missed rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {med.instructions && (
                    <p className="text-elder-muted text-xs mt-2 leading-relaxed bg-elder-bg p-2.5 rounded-xl border border-elder-card/50">
                      {med.instructions}
                    </p>
                  )}

                  {/* Scheduled Times */}
                  <div className="mt-4">
                    <span className="text-xs text-elder-muted font-semibold block mb-1.5">Scheduled Daily Times:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {med.timesOfDay.map((time, idx) => (
                        <span
                          key={idx}
                          className="bg-elder-card text-white font-mono text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 border border-elder-muted/20"
                        >
                          <Clock className="w-3 h-3 text-elder-accent" />
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Inventory & Refill Box */}
                <div className="mt-6 pt-4 border-t border-elder-card/50">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-elder-muted">Remaining Supply:</span>
                    <span className={`font-bold ${isLow ? "text-amber-400 font-extrabold" : "text-white"}`}>
                      {med.currentSupply} doses
                    </span>
                  </div>

                  {isLow && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-[11px] text-amber-200 flex items-center gap-1.5 mb-3">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Below refill threshold ({med.refillThreshold})</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleRefill(med)}
                    className="w-full bg-elder-card hover:bg-elder-card/80 border border-elder-accent/30 text-white font-bold text-xs py-2 rounded-xl transition-all"
                  >
                    + Log Refill (+30 doses)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Prescription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-elder-surface border-2 border-elder-card rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-elder-muted hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-1">Add Prescription</h2>
            <p className="text-elder-muted text-xs mb-5">Configure medication dosage and scheduled reminder times.</p>

            {error && (
              <div className="bg-elder-missed/20 border border-elder-missed/40 text-elder-missed text-xs font-semibold rounded-xl p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-elder-muted mb-1">Medication Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Metformin"
                    className="w-full bg-elder-bg border border-elder-card rounded-xl px-3 py-2 text-white text-sm focus:border-elder-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-elder-muted mb-1">Dosage</label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={e => setDosage(e.target.value)}
                    placeholder="e.g. 500 mg"
                    className="w-full bg-elder-bg border border-elder-card rounded-xl px-3 py-2 text-white text-sm focus:border-elder-accent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-elder-muted mb-1">Instructions for Senior</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="e.g. Take with breakfast and full glass of water"
                  className="w-full bg-elder-bg border border-elder-card rounded-xl px-3 py-2 text-white text-sm focus:border-elder-accent outline-none"
                />
              </div>

              {/* Times of Day */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-elder-muted">Daily Time Slots (24h format)</label>
                  <button
                    type="button"
                    onClick={handleAddTimeSlot}
                    className="text-elder-accent hover:text-elder-highlight text-xs font-bold"
                  >
                    + Add Time
                  </button>
                </div>
                <div className="space-y-2">
                  {timeSlots.map((time, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="time"
                        required
                        value={time}
                        onChange={e => handleTimeChange(idx, e.target.value)}
                        className="bg-elder-bg border border-elder-card rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-elder-accent outline-none flex-1"
                      />
                      {timeSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTimeSlot(idx)}
                          className="p-2 text-elder-muted hover:text-elder-missed"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-elder-muted mb-1">Pill Supply Count</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={currentSupply}
                    onChange={e => setCurrentSupply(Number(e.target.value))}
                    className="w-full bg-elder-bg border border-elder-card rounded-xl px-3 py-2 text-white text-sm focus:border-elder-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-elder-muted mb-1">Refill Alert Threshold</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={refillThreshold}
                    onChange={e => setRefillThreshold(Number(e.target.value))}
                    className="w-full bg-elder-bg border border-elder-card rounded-xl px-3 py-2 text-white text-sm focus:border-elder-accent outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-elder-card/50 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-elder-card text-elder-muted font-bold text-sm hover:bg-elder-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-elder-accent hover:bg-elder-highlight text-elder-bg font-extrabold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md"
                >
                  {submitting ? "Saving..." : "Save Prescription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
