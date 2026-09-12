"use client";

import { signOut } from "@/lib/auth";

interface PendingPageProps {
  onLogout: () => void;
}

export default function PendingPage({ onLogout }: PendingPageProps) {
  async function handleLogout() {
    await signOut();
    onLogout();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-brand-bg">
      <div className="bg-brand-surface rounded-[20px] p-8 w-full max-w-[380px] shadow-card-lg text-center">
        {/* Clock icon */}
        <div className="w-20 h-20 rounded-full bg-brand-light flex items-center justify-center mx-auto mb-5">
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#8B5E83" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-v-text mb-2">Profile Under Review</h2>
        <p className="text-sm text-v-muted leading-relaxed mb-6">
          Thank you for registering as a Vadora Beauty Partner! Your profile is being reviewed by our team.
          You will receive a confirmation email within <strong className="text-v-text">2 business days</strong>.
        </p>

        <div className="bg-brand-light rounded-card p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-brand mb-2">What happens next?</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-brand text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <p className="text-xs text-v-text">Our team reviews your application</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-brand/40 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <p className="text-xs text-v-muted">You receive approval email</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-brand/20 text-brand text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <p className="text-xs text-v-muted">Login and start sharing your referral code!</p>
            </div>
          </div>
        </div>

        <button onClick={handleLogout}
          className="w-full py-3 rounded-btn border border-v-border text-sm font-semibold text-v-muted hover:text-brand transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}
