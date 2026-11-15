"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, MapPin, User, Clock, FileText, X } from "lucide-react";

interface AppointmentItem {
  id: string;
  title: string;
  doctorName: string;
  location: string;
  appointmentTime: string;
  notes?: string | null;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [location, setLocation] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (data.appointments) setAppointments(data.appointments);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          doctorName,
          location,
          appointmentTime: new Date(appointmentTime).toISOString(),
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to schedule appointment");
        setSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      setTitle("");
      setDoctorName("");
      setLocation("");
      setAppointmentTime("");
      setNotes("");
      await fetchAppointments();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this appointment?")) return;

    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAppointments();
      }
    } catch {
      alert("Failed to delete appointment");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Calendar className="w-8 h-8 text-elder-accent" />
            Doctor Appointments
          </h1>
          <p className="text-elder-muted text-base mt-1">
            Track upcoming consultations, clinic locations, and medical notes for Eleanor Vance.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-elder-accent hover:bg-elder-highlight text-elder-bg font-extrabold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Visit</span>
        </button>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="text-center py-12 text-elder-muted">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="bg-elder-surface border border-elder-card rounded-2xl p-10 text-center">
          <Calendar className="w-12 h-12 text-elder-muted mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">No Upcoming Appointments</h2>
          <p className="text-elder-muted text-sm mt-1 mb-4">Keep your care circle coordinated by logging upcoming clinic visits.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-elder-accent text-elder-bg font-bold text-sm px-4 py-2 rounded-xl"
          >
            Schedule Consultation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map(appt => {
            const date = new Date(appt.appointmentTime);
            return (
              <div
                key={appt.id}
                className="bg-elder-surface border border-elder-card hover:border-elder-accent/60 rounded-2xl p-6 shadow-lg flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="text-xl font-bold text-white">{appt.title}</h2>
                    <button
                      onClick={() => handleDelete(appt.id)}
                      className="p-1.5 text-elder-muted hover:text-elder-missed rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm text-elder-muted mb-4">
                    <div className="flex items-center gap-2 text-elder-highlight font-medium">
                      <User className="w-4 h-4" />
                      <span>{appt.doctorName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-elder-due" />
                      <span className="text-white font-semibold">
                        {date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} at{" "}
                        {date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-elder-accent" />
                      <span>{appt.location}</span>
                    </div>
                  </div>

                  {appt.notes && (
                    <div className="bg-elder-bg border border-elder-card/60 rounded-xl p-3 text-xs text-elder-muted">
                      <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Visit Checklist / Notes:</span>
                      </div>
                      <p className="leading-relaxed">{appt.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-elder-surface border-2 border-elder-card rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-elder-muted hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-1">Schedule Doctor Appointment</h2>
            <p className="text-elder-muted text-xs mb-5">All Care Circle members will be coordinated with reminders.</p>

            {error && (
              <div className="bg-elder-missed/20 border border-elder-missed/40 text-elder-missed text-xs font-semibold rounded-xl p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-elder-muted mb-1">Consultation Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Cardiology Checkup"
                  className="w-full bg-elder-bg border border-elder-card rounded-xl px-3 py-2 text-white text-sm focus:border-elder-accent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-elder-muted mb-1">Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    placeholder="Dr. Evelyn Reed, MD"
                    className="w-full bg-elder-bg border border-elder-card rounded-xl px-3 py-2 text-white text-sm focus:border-elder-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-elder-muted mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={appointmentTime}
                    onChange={e => setAppointmentTime(e.target.value)}
                    className="w-full bg-elder-bg border border-elder-card rounded-xl px-3 py-2 text-white text-sm focus:border-elder-accent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-elder-muted mb-1">Clinic Address / Room</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. St. Jude Heart Clinic, Suite 402"
                  className="w-full bg-elder-bg border border-elder-card rounded-xl px-3 py-2 text-white text-sm focus:border-elder-accent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-elder-muted mb-1">Checklist / Questions for Doctor</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Discuss recent blood pressure fluctuations; request refill for Metformin"
                  className="w-full bg-elder-bg border border-elder-card rounded-xl px-3 py-2 text-white text-sm focus:border-elder-accent outline-none resize-none"
                />
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
                  {submitting ? "Saving..." : "Schedule Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
