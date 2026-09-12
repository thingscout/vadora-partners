"use client";

import { signOut } from "@/lib/auth";

interface RejectedPageProps {
  onLogout: () => void;
}

export default function RejectedPage({ onLogout }: RejectedPageProps) {
  async function handleLogout() {
    await signOut();
    onLogout();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-brand-bg">
      <div className="bg-brand-surface rounded-[20px] p-8 w-full max-w-[380px] shadow-card-lg text-center">
        <div className="w-20 h-20 rounded-full bg-[#FDF5F5] flex items-center justify-center mx-auto mb-5">
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#C6483B" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-v-text mb-2">Application Not Approved</h2>
        <p className="text-sm text-v-muted leading-relaxed mb-6">
          Unfortunately, your Vadora Beauty Partner application was not approved at this time.
          If you believe this is an error, please contact our support team.
        </p>

        <a href="mailto:support@vadorabeauty.com"
          className="block w-full py-3 rounded-btn bg-brand text-white text-sm font-semibold mb-3 text-center">
          Contact Support
        </a>

        <button onClick={handleLogout}
          className="w-full py-3 rounded-btn border border-v-border text-sm font-semibold text-v-muted hover:text-brand transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}
