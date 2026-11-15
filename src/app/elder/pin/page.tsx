"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, ArrowRight, Delete } from "lucide-react";
import Link from "next/link";

export default function ElderPinPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("CARE-8291");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNumClick = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin("");
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inviteCode || pin.length < 4) {
      setError("Please enter your 4-digit PIN");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/circle/pin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase(), pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect PIN");
        setLoading(false);
        return;
      }

      router.push("/elder");
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-elder-bg">
      <div className="w-full max-w-md bg-elder-surface border-2 border-elder-card rounded-3xl p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-elder-card rounded-2xl flex items-center justify-center mx-auto mb-3 text-elder-highlight">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Senior Sign-In</h1>
          <p className="text-elder-muted text-base mt-1">Enter your Care Circle PIN</p>
        </div>

        {/* Demo Fast Hint */}
        <div className="bg-elder-card/60 border border-elder-accent/30 rounded-xl p-3 mb-5 text-sm text-center">
          <span className="text-elder-muted">Demo Circle: </span>
          <span className="text-elder-highlight font-mono font-bold">CARE-8291</span>
          <span className="text-elder-muted"> | PIN: </span>
          <span className="text-elder-taken font-mono font-bold">1234</span>
        </div>

        {/* Invite Code Input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-elder-muted mb-1">Care Circle Code</label>
          <input
            type="text"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value.toUpperCase())}
            className="w-full bg-elder-bg border-2 border-elder-card rounded-xl px-4 py-3 text-white text-lg font-mono font-bold text-center tracking-widest focus:border-elder-accent outline-none"
            placeholder="CARE-8291"
          />
        </div>

        {/* PIN Display Dots */}
        <div className="mb-6 text-center">
          <div className="flex justify-center gap-3 my-2">
            {[0, 1, 2, 3].map(idx => (
              <div
                key={idx}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  pin.length > idx
                    ? "bg-elder-highlight border-elder-highlight scale-110"
                    : "bg-elder-bg border-elder-card"
                }`}
              />
            ))}
          </div>
          {error && <p className="text-elder-missed text-sm font-semibold mt-2">{error}</p>}
        </div>

        {/* Large Accessible Numpad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(digit => (
            <button
              key={digit}
              type="button"
              onClick={() => handleNumClick(digit)}
              className="h-16 bg-elder-card hover:bg-elder-card/80 active:bg-elder-accent active:text-elder-bg text-white text-2xl font-bold rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-16 bg-elder-bg border border-elder-card hover:bg-elder-card text-elder-muted font-bold text-sm rounded-2xl transition-all"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleNumClick("0")}
            className="h-16 bg-elder-card hover:bg-elder-card/80 active:bg-elder-accent active:text-elder-bg text-white text-2xl font-bold rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Backspace"
            className="h-16 bg-elder-bg border border-elder-card hover:bg-elder-card text-elder-muted text-xl font-bold rounded-2xl transition-all flex items-center justify-center"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={loading || pin.length < 4}
          className="w-full h-16 bg-elder-accent hover:bg-elder-highlight disabled:opacity-50 text-elder-bg font-extrabold text-xl rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? "Verifying..." : "Enter Kiosk Mode"}
          <ArrowRight className="w-6 h-6" />
        </button>

        {/* Switch Link */}
        <div className="mt-6 text-center">
          <Link href="/login" className="text-elder-muted hover:text-elder-highlight text-sm underline">
            Are you a family caregiver? Sign in here
          </Link>
        </div>
      </div>
    </main>
  );
}
