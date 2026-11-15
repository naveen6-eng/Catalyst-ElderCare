import Link from "next/link";
import { HeartHandshake, ShieldCheck, Clock, Users } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12 max-w-5xl mx-auto">
      {/* Header */}
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-3 bg-elder-surface/80 border border-elder-accent/30 px-5 py-2.5 rounded-full mb-6">
          <HeartHandshake className="w-6 h-6 text-elder-highlight" aria-hidden="true" />
          <span className="text-elder-highlight font-semibold text-lg tracking-wide">
            Catalyst Hackathon
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
          Care<span className="text-elder-accent">Circle</span>
        </h1>
        <p className="text-elder-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Empowering elderly independence with accessible, one-touch medication management and peace of mind for family caregivers.
        </p>
      </header>

      {/* Mode Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-12">
        {/* Senior Kiosk Mode */}
        <div className="bg-elder-surface border-2 border-elder-card hover:border-elder-accent rounded-2xl p-8 flex flex-col justify-between transition-all shadow-xl">
          <div>
            <div className="w-14 h-14 bg-elder-card rounded-xl flex items-center justify-center mb-5 text-elder-highlight">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Senior Kiosk</h2>
            <p className="text-elder-muted text-base mb-6">
              Large tactile buttons, high-contrast text, and spoken voice reminders designed specifically for seniors.
            </p>
          </div>
          <Link
            href="/elder"
            className="w-full text-center bg-elder-accent hover:bg-elder-highlight text-elder-bg font-bold text-xl py-4 rounded-xl transition-colors min-h-[56px] flex items-center justify-center"
          >
            Enter Senior Mode
          </Link>
        </div>

        {/* Family & Caregiver Dashboard */}
        <div className="bg-elder-surface border-2 border-elder-card hover:border-elder-accent rounded-2xl p-8 flex flex-col justify-between transition-all shadow-xl">
          <div>
            <div className="w-14 h-14 bg-elder-card rounded-xl flex items-center justify-center mb-5 text-elder-highlight">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Caregiver Portal</h2>
            <p className="text-elder-muted text-base mb-6">
              Real-time adherence monitoring, prescription scheduling, refill warnings, and appointment tracking.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="w-full text-center bg-elder-card hover:bg-elder-card/80 text-white font-bold text-xl py-4 rounded-xl border border-elder-muted/30 transition-colors min-h-[56px] flex items-center justify-center"
          >
            Caregiver Dashboard
          </Link>
        </div>
      </div>

      {/* Feature Badges */}
      <footer className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm text-elder-muted w-full max-w-2xl border-t border-elder-surface/60 pt-8">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5 text-elder-taken" />
          <span>Salted Passcode Access</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-5 h-5 text-elder-due" />
          <span>Real-Time Dose Tracking</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <HeartHandshake className="w-5 h-5 text-elder-highlight" />
          <span>Automated Care Circle Alerts</span>
        </div>
      </footer>
    </main>
  );
}
