"use client";

import { useState, useRef } from "react";
import { sendEmailOtp, verifyEmailOtp, signInWithPassword } from "@/lib/auth";
import { isValidEmail } from "@/lib/utils";

interface LoginPageProps {
  onSuccess: () => void;
  onBack: () => void;
  onRegister: () => void;
}

type LoginMethod = "otp" | "password";
type Step = "email" | "otp";

export default function LoginPage({ onSuccess, onBack, onRegister }: LoginPageProps) {
  const [method, setMethod] = useState<LoginMethod>("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const otpRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  const canSubmit = isValidEmail(email) && (method === "otp" || password.length >= 6);
  const otpFilled = otp.every((d) => d.length === 1);

  async function handleSubmit() {
    if (!isValidEmail(email)) return;
    setLoading(true);
    setError("");

    try {
      if (method === "password") {
        await signInWithPassword(email, password);
        onSuccess();
      } else {
        await sendEmailOtp(email);
        setStep("otp");
        setTimeout(() => otpRefs[0].current?.focus(), 100);
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otpFilled) return;
    setLoading(true);
    setError("");
    try {
      await verifyEmailOtp(email, otp.join(""));
      onSuccess();
    } catch {
      setError("Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(i: number, value: string) {
    const v = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[i] = v;
    setOtp(newOtp);
    if (v && i < 5) otpRefs[i + 1].current?.focus();
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs[i - 1].current?.focus();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg, #2B4C6F 0%, #1A3550 100%)" }}>

      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-[68px] h-[68px] rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center mx-auto mb-3 overflow-hidden">
          <img src="/logo.png" alt="V" className="w-[44px] h-[44px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.innerHTML='<span style="color:white;font-size:24px;font-weight:800">V</span>'; }} />
        </div>
        <h1 className="text-white text-[22px] font-bold">Welcome Back</h1>
      </div>

      {/* Card */}
      <div className="bg-white rounded-[20px] p-7 w-full max-w-[380px] shadow-card-lg">

        {/* ── OTP Verification Step ── */}
        {step === "otp" ? (
          <>
            <button onClick={() => { setStep("email"); setOtp(["","","","","",""]); setError(""); }}
              className="flex items-center gap-1.5 text-v-muted text-sm font-medium mb-4 hover:text-brand transition-colors">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>

            <p className="text-sm text-v-muted mb-5">
              Enter the 6-digit code sent to <strong className="text-v-text">{email}</strong>
            </p>

            <div className="flex gap-2 justify-center mb-5">
              {otp.map((digit, i) => (
                <input key={i} ref={otpRefs[i]} maxLength={1} inputMode="numeric" value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className={`w-11 h-13 text-center text-xl font-bold rounded-btn border-[1.5px] outline-none transition-colors bg-transparent text-v-text ${digit ? "border-brand" : "border-v-border"}`}
                />
              ))}
            </div>

            {error && <p className="text-v-error text-xs text-center mb-3">{error}</p>}

            <button onClick={handleVerifyOtp} disabled={!otpFilled || loading}
              className="w-full py-3.5 rounded-btn text-[15px] font-semibold transition-all disabled:bg-v-border disabled:text-v-muted bg-brand text-white active:scale-[0.98]">
              {loading ? "Verifying..." : "Verify & Login"}
            </button>

            <p className="text-center mt-4 text-sm text-v-muted">
              Didn't receive it?{" "}
              <span onClick={() => !loading && handleSubmit()} className="text-brand font-semibold cursor-pointer">Resend</span>
            </p>
          </>
        ) : (
          /* ── Email + Method Step ── */
          <>
            {/* Method Toggle */}
            <div className="flex bg-brand-light rounded-btn p-1 mb-6">
              <button onClick={() => { setMethod("otp"); setError(""); }}
                className={`flex-1 py-2 rounded-[8px] text-[13px] font-semibold transition-all ${method === "otp" ? "bg-brand text-white shadow-sm" : "text-v-muted"}`}>
                Login with OTP
              </button>
              <button onClick={() => { setMethod("password"); setError(""); }}
                className={`flex-1 py-2 rounded-[8px] text-[13px] font-semibold transition-all ${method === "password" ? "bg-brand text-white shadow-sm" : "text-v-muted"}`}>
                Login with Password
              </button>
            </div>

            <label className="text-xs font-semibold text-v-muted block mb-1.5">Email Address</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && method === "otp" && handleSubmit()}
              autoFocus
              className="w-full px-4 py-3.5 rounded-btn border border-v-border text-base text-v-text outline-none focus:border-brand transition-colors bg-transparent mb-3"
            />

            {method === "password" && (
              <>
                <label className="text-xs font-semibold text-v-muted block mb-1.5">Password</label>
                <div className="relative mb-3">
                  <input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    className="w-full px-4 py-3.5 rounded-btn border border-v-border text-base text-v-text outline-none focus:border-brand transition-colors bg-transparent pr-12"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-v-muted">
                    {showPassword ? (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </>
            )}

            {error && <p className="text-v-error text-xs mb-3">{error}</p>}

            <button onClick={handleSubmit} disabled={!canSubmit || loading}
              className="w-full py-3.5 rounded-btn text-[15px] font-semibold transition-all disabled:bg-v-border disabled:text-v-muted bg-brand text-white active:scale-[0.98]">
              {loading ? (method === "otp" ? "Sending OTP..." : "Signing in...") : (method === "otp" ? "Get OTP" : "Sign In")}
            </button>

            <div className="mt-5 text-center">
              <p className="text-sm text-v-muted">
                Don't have an account?{" "}
                <span onClick={onRegister} className="text-brand font-semibold cursor-pointer">Create Account</span>
              </p>
            </div>

            <button onClick={onBack}
              className="w-full mt-3 text-center text-sm text-v-muted hover:text-brand transition-colors">
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
