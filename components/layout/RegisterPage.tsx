"use client";

import { useState } from "react";
import { signUpWithEmail, getSession } from "@/lib/auth";
import { submitRegistration } from "@/lib/data";
import { isValidEmail, isValidPhone } from "@/lib/utils";
import type { RegistrationData, SellingMethod } from "@/types";

interface RegisterPageProps {
  onSuccess: () => void;
  onBack: () => void;
  onLogin: () => void;
}

const SELLING_METHODS: { id: SellingMethod; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "personal_contacts", label: "Personal Contacts" },
  { id: "offline", label: "Offline" },
  { id: "other", label: "Other" },
];

export default function RegisterPage({ onSuccess, onBack, onLogin }: RegisterPageProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");

  // Step 2
  const [instagramId, setInstagramId] = useState("");
  const [sellingMethod, setSellingMethod] = useState<SellingMethod | "">("");

  // Step 3
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [upiId, setUpiId] = useState("");

  // Step 4
  const [agreeTC, setAgreeTC] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeEarnings, setAgreeEarnings] = useState(false);

  const step1Valid = fullName.length >= 2 && isValidPhone(mobile) && isValidEmail(email) && password.length >= 6 && city.length >= 2;
  const step4Valid = agreeTC && agreePrivacy && agreeAge && agreeEarnings;

  function sameAsWhatsapp() {
    setWhatsapp(mobile);
  }

  async function handleRegister() {
    setLoading(true);
    setError("");

    try {
      // First check if already logged in (user may have come from login page)
      let session = await getSession();

      if (!session) {
        // Create auth account
        await signUpWithEmail(email, password);
        session = await getSession();
      }

      if (!session) {
        setError("Account created. Please check your email to verify, then come back and login.");
        setLoading(false);
        return;
      }

      // Submit partner registration
      const regData: RegistrationData = {
        full_name: fullName,
        mobile,
        whatsapp: whatsapp || mobile,
        email,
        city,
        instagram_id: instagramId || undefined,
        selling_method: sellingMethod || undefined,
        bank_account_name: bankName || undefined,
        bank_account_number: bankAccount || undefined,
        bank_ifsc: bankIfsc || undefined,
        upi_id: upiId || undefined,
      };

      await submitRegistration(regData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <div className="sticky top-0 z-50 px-4 pt-4 pb-3 bg-brand-bg">
        <div className="flex items-center gap-3">
          <button onClick={step > 1 ? () => setStep(step - 1) : onBack}
            className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center text-v-muted">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-v-text">Create Account</h1>
            <p className="text-xs text-v-muted">Step {step} of 4</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mt-3">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? "bg-brand" : "bg-v-border"}`} />
          ))}
        </div>
      </div>

      <div className="px-4 pb-10">
        {/* ── Step 1: Basic Details ── */}
        {step === 1 && (
          <div className="bg-white rounded-card p-5 shadow-card mt-2">
            <p className="text-[15px] font-semibold text-v-text mb-4">Personal Details</p>

            <Field label="Full Name *" placeholder="Enter your full name" value={fullName} onChange={setFullName} />
            <Field label="Mobile Number *" placeholder="10-digit mobile number" value={mobile} onChange={setMobile} type="tel" inputMode="numeric" />
            
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-v-muted">WhatsApp Number</label>
              <button onClick={sameAsWhatsapp} className="text-[11px] text-brand font-semibold">Same as mobile</button>
            </div>
            <input placeholder="WhatsApp number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-4 py-3 rounded-btn border border-v-border text-sm text-v-text outline-none focus:border-brand transition-colors bg-transparent mb-3" />

            <Field label="Email Address *" placeholder="you@example.com" value={email} onChange={setEmail} type="email" />
            <Field label="Password *" placeholder="Min 6 characters" value={password} onChange={setPassword} type="password" />
            <Field label="City *" placeholder="Your city" value={city} onChange={setCity} />

            <button onClick={() => setStep(2)} disabled={!step1Valid}
              className="w-full mt-2 py-3.5 rounded-btn text-[15px] font-semibold transition-all disabled:bg-v-border disabled:text-v-muted bg-brand text-white active:scale-[0.98]">
              Next →
            </button>

            <p className="text-center text-sm text-v-muted mt-4">
              Already have an account? <span onClick={onLogin} className="text-brand font-semibold cursor-pointer">Login</span>
            </p>
          </div>
        )}

        {/* ── Step 2: Profile ── */}
        {step === 2 && (
          <div className="bg-white rounded-card p-5 shadow-card mt-2">
            <p className="text-[15px] font-semibold text-v-text mb-1">Profile Setup</p>
            <p className="text-xs text-v-muted mb-4">Optional — you can add these later</p>

            <Field label="Instagram ID" placeholder="@yourhandle" value={instagramId} onChange={setInstagramId} />

            <label className="text-xs font-semibold text-v-muted block mb-2">Preferred Selling Method</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {SELLING_METHODS.map((m) => (
                <button key={m.id} onClick={() => setSellingMethod(m.id)}
                  className={`px-3.5 py-2 rounded-full text-[13px] font-medium transition-all ${
                    sellingMethod === m.id ? "bg-brand text-white" : "bg-brand-light text-brand"
                  }`}>
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              <button onClick={() => setStep(3)}
                className="flex-1 py-3.5 rounded-btn text-[15px] font-semibold bg-brand text-white active:scale-[0.98]">
                Next →
              </button>
              <button onClick={() => setStep(3)}
                className="py-3.5 px-5 rounded-btn text-[13px] font-semibold text-v-muted bg-v-border/50">
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Payment ── */}
        {step === 3 && (
          <div className="bg-white rounded-card p-5 shadow-card mt-2">
            <p className="text-[15px] font-semibold text-v-text mb-1">Payment Details</p>
            <p className="text-xs text-v-muted mb-4">For commission payouts — you can add later</p>

            <Field label="Account Holder Name" placeholder="Name as on bank account" value={bankName} onChange={setBankName} />
            <Field label="Bank Account Number" placeholder="Account number" value={bankAccount} onChange={setBankAccount} inputMode="numeric" />
            <Field label="IFSC Code" placeholder="e.g. SBIN0001234" value={bankIfsc} onChange={setBankIfsc} />
            <Field label="UPI ID" placeholder="e.g. name@upi" value={upiId} onChange={setUpiId} />

            <div className="flex gap-2 mt-2">
              <button onClick={() => setStep(4)}
                className="flex-1 py-3.5 rounded-btn text-[15px] font-semibold bg-brand text-white active:scale-[0.98]">
                Next →
              </button>
              <button onClick={() => setStep(4)}
                className="py-3.5 px-5 rounded-btn text-[13px] font-semibold text-v-muted bg-v-border/50">
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Agreement ── */}
        {step === 4 && (
          <div className="bg-white rounded-card p-5 shadow-card mt-2">
            <p className="text-[15px] font-semibold text-v-text mb-4">Terms & Agreement</p>

            <Checkbox checked={agreeTC} onChange={setAgreeTC}
              label="I have read and agree to the VBP Terms & Conditions" />
            <Checkbox checked={agreePrivacy} onChange={setAgreePrivacy}
              label="I agree to the Vadora Privacy Policy" />
            <Checkbox checked={agreeAge} onChange={setAgreeAge}
              label="I confirm that I am 18 years or older" />
            <Checkbox checked={agreeEarnings} onChange={setAgreeEarnings}
              label="I understand that VBP earnings are based only on eligible product sales and are not guaranteed" />

            {error && <p className="text-v-error text-xs mt-3">{error}</p>}

            <button onClick={handleRegister} disabled={!step4Valid || loading}
              className="w-full mt-5 py-4 rounded-btn text-[15px] font-bold transition-all disabled:bg-v-border disabled:text-v-muted bg-brand text-white active:scale-[0.98]">
              {loading ? "Submitting..." : "Accept & Become a Vadora Beauty Partner"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable Field ──
function Field({ label, placeholder, value, onChange, type = "text", inputMode }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string; inputMode?: string;
}) {
  return (
    <>
      <label className="text-xs font-semibold text-v-muted block mb-1.5">{label}</label>
      <input type={type} inputMode={inputMode as any} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-btn border border-v-border text-sm text-v-text outline-none focus:border-brand transition-colors bg-transparent mb-3" />
    </>
  );
}

// ── Reusable Checkbox ──
function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-3 mb-3.5 cursor-pointer">
      <div onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded-[5px] border-[1.5px] flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
          checked ? "bg-brand border-brand" : "border-v-border"
        }`}>
        {checked && <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>}
      </div>
      <span className="text-[13px] text-v-text leading-[1.4]">{label}</span>
    </label>
  );
}
