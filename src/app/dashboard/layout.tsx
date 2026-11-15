"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HeartHandshake, Pill, Calendar, Activity, LogOut, ExternalLink, ShieldCheck } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [elderName, setElderName] = useState("Eleanor Vance");
  const [inviteCode, setInviteCode] = useState("CARE-8291");
  const [userName, setUserName] = useState("Sarah Vance");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated) {
          if (data.user?.name) setUserName(data.user.name);
          if (data.circle?.elderName) setElderName(data.circle.elderName);
          if (data.circle?.inviteCode) setInviteCode(data.circle.inviteCode);
        }
      } catch {
        // fallback
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const navLinks = [
    { href: "/dashboard", label: "Adherence Overview", icon: Activity },
    { href: "/dashboard/medications", label: "Medication Schedules", icon: Pill },
    { href: "/dashboard/appointments", label: "Doctor Appointments", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-elder-bg text-white flex flex-col">
      {/* Top Navbar */}
      <header className="bg-elder-surface border-b border-elder-card px-4 md:px-8 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Logo & Circle Badge */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-xl font-black text-white">
              <HeartHandshake className="w-7 h-7 text-elder-highlight" />
              <span>Care<span className="text-elder-accent">Circle</span></span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 bg-elder-card/80 border border-elder-accent/30 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-elder-muted">Care Circle:</span>
              <span className="text-white font-bold">{elderName}</span>
              <span className="bg-elder-bg px-2 py-0.5 rounded font-mono font-bold text-elder-highlight">
                {inviteCode}
              </span>
            </div>
          </div>

          {/* User profile & Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/elder"
              className="bg-elder-accent/20 hover:bg-elder-accent text-elder-highlight hover:text-elder-bg border border-elder-accent/40 px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>Senior Kiosk</span>
              <ExternalLink className="w-4 h-4" />
            </Link>

            <span className="hidden md:inline text-sm text-elder-muted font-medium">
              {userName}
            </span>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="bg-elder-card hover:bg-elder-card/80 p-2 rounded-xl text-elder-muted hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="max-w-6xl mx-auto flex gap-2 overflow-x-auto pt-3 border-t border-elder-card/40 mt-3">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-elder-accent text-elder-bg shadow-md"
                    : "text-elder-muted hover:text-white hover:bg-elder-card/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
