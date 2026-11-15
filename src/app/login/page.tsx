"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Mail, Lock, ArrowRight, ShieldCheck, HeartHandshake } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("sarah.vance@example.com");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("Sarah Vance");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister ? { email, password, name } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail("sarah.vance@example.com");
    setPassword("password123");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "sarah.vance@example.com", password: "password123" }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError("Could not sign in with demo credentials");
        setLoading(false);
      }
    } catch {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-elder-bg">
      <div className="w-full max-w-md bg-elder-surface border-2 border-elder-card rounded-3xl p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-elder-card rounded-2xl flex items-center justify-center mx-auto mb-3 text-elder-highlight">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            {isRegister ? "Create Caregiver Account" : "Caregiver Portal"}
          </h1>
          <p className="text-elder-muted text-base mt-1">
            {isRegister ? "Join your family's Care Circle" : "Sign in to manage medications and adherence"}
          </p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="bg-elder-card/60 border border-elder-accent/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">Demo Caregiver Account</p>
              <p className="text-elder-muted text-xs">Sarah Vance (Daughter of Eleanor)</p>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="bg-elder-accent hover:bg-elder-highlight text-elder-bg font-extrabold text-xs px-3 py-2 rounded-xl transition-all"
            >
              1-Click Demo Sign-In
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-elder-missed/20 border border-elder-missed/40 text-elder-missed text-sm font-semibold rounded-xl p-3 mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-semibold text-elder-muted mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-elder-bg border-2 border-elder-card rounded-xl px-4 py-3 text-white text-base focus:border-elder-accent outline-none"
                placeholder="Sarah Vance"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-elder-muted mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-3.5 text-elder-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-elder-bg border-2 border-elder-card rounded-xl pl-10 pr-4 py-3 text-white text-base focus:border-elder-accent outline-none"
                placeholder="sarah.vance@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-elder-muted mb-1">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-3.5 text-elder-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-elder-bg border-2 border-elder-card rounded-xl pl-10 pr-4 py-3 text-white text-base focus:border-elder-accent outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-elder-accent hover:bg-elder-highlight text-elder-bg font-bold text-lg rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-6"
          >
            {loading ? "Signing in..." : isRegister ? "Create Account" : "Sign In"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-elder-muted hover:text-white text-sm font-semibold"
          >
            {isRegister ? "Already have an account? Sign in" : "Need an account? Register here"}
          </button>

          <div>
            <Link href="/elder/pin" className="text-elder-highlight hover:underline text-sm font-bold">
              Switch to Senior Kiosk (Enter with PIN) →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
