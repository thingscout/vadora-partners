"use client";

import { useState } from "react";
import { formatINR, formatDate } from "@/lib/utils";

interface ProfileTabProps {
  partner: any;
  tiers: any[];
  onLogout: () => void;
}

// T&C / Legal content — add full text here later
const LEGAL_PAGES: { title: string; key: string; summary: string }[] = [
  { title: "VBP Terms & Conditions", key: "tc", summary: "Terms governing your membership as a Vadora Beauty Partner, including code of conduct, commission rules, and termination conditions." },
  { title: "Privacy Policy", key: "privacy", summary: "How Vadora Beauty collects, uses, and protects your personal information and data." },
  { title: "Commission Policy", key: "commission", summary: "Details about commission tiers, calculation methodology, payout schedules, and eligibility criteria." },
  { title: "Return & Refund Policy", key: "refund", summary: "How customer returns affect your commissions and the refund process." },
  { title: "Brand & Marketing Guidelines", key: "marketing", summary: "Rules for using Vadora Beauty branding, product images, and marketing materials." },
  { title: "Partner Code of Conduct", key: "conduct", summary: "Expected behaviour, ethical practices, and prohibited activities for all Vadora Beauty Partners." },
  { title: "Grievance & Support", key: "grievance", summary: "How to raise complaints, dispute resolution process, and support contact details." },
];

export default function ProfileTab({ partner, tiers, onLogout }: ProfileTabProps) {
  const [openLegal, setOpenLegal] = useState<string | null>(null);

  return (
    <div className="px-4">
      {/* Profile Header */}
      <div className="bg-brand-surface rounded-card p-5 shadow-card mb-3 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-brand flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {partner.avatar_initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold text-v-text truncate">{partner.name}</p>
          <p className="text-xs text-v-muted mt-0.5">{partner.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-v-text"
              style={{ background: (partner.tier_color || "#C9A84C") + "40" }}>
              {partner.tier_name} · {partner.tier_rate}%
            </span>
            <span className="text-[10px] text-v-muted">Code: {partner.partner_code}</span>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <Section title="Personal Details">
        <InfoRow label="Name" value={partner.name} />
        <InfoRow label="Email" value={partner.email} />
        <InfoRow label="Phone" value={partner.phone} />
        <InfoRow label="WhatsApp" value={partner.whatsapp} />
        <InfoRow label="City" value={partner.city} />
        <InfoRow label="Instagram" value={partner.instagram_id ? `@${partner.instagram_id}` : "—"} />
        <InfoRow label="Joined" value={partner.joined_at ? formatDate(partner.joined_at) : "—"} last />
      </Section>

      {/* Referral Code */}
      <Section title="Referral Code">
        <div className="bg-brand-light rounded-btn px-4 py-3 text-center">
          <p className="text-2xl font-extrabold text-brand tracking-[2px]">{partner.referral_code}</p>
          <p className="text-[10px] text-v-muted mt-1">Discount code for your customers</p>
        </div>
      </Section>

      {/* Commission Tier Info */}
      <Section title="Commission Tiers">
        {tiers.map((t: any) => (
          <div key={t.id} className={`flex items-center justify-between py-2.5 border-b border-v-border last:border-0 ${
            t.name === partner.tier_name ? "bg-brand-light/50 -mx-3 px-3 rounded" : ""
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
              <div>
                <p className="text-sm font-medium text-v-text">{t.name}</p>
                <p className="text-[10px] text-v-muted">
                  {formatINR(t.min_sales)}
                  {t.max_sales ? ` — ${formatINR(t.max_sales)}` : "+"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-brand">{t.rate_percent}%</p>
              {t.name === partner.tier_name && (
                <span className="text-[9px] font-bold text-white bg-brand px-1.5 py-0.5 rounded-full">YOU</span>
              )}
            </div>
          </div>
        ))}
      </Section>

      {/* Legal & Policies */}
      <Section title="Legal & Policies">
        {LEGAL_PAGES.map((page) => (
          <div key={page.key}>
            <button onClick={() => setOpenLegal(openLegal === page.key ? null : page.key)}
              className="w-full flex items-center justify-between py-3 border-b border-v-border text-left">
              <span className="text-[13px] font-medium text-v-text">{page.title}</span>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8A7F83" strokeWidth="2"
                className={`transition-transform ${openLegal === page.key ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {openLegal === page.key && (
              <div className="py-3 px-1 bg-brand-light/30 rounded-btn mb-1 mt-1">
                <p className="text-xs text-v-text leading-relaxed">{page.summary}</p>
                <p className="text-[11px] text-brand font-semibold mt-2">Full document coming soon</p>
              </div>
            )}
          </div>
        ))}
      </Section>

      {/* Support */}
      <Section title="Support">
        <a href="https://wa.me/919999999999" target="_blank" rel="noopener"
          className="flex items-center gap-3 py-3 border-b border-v-border">
          <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-v-text">WhatsApp Support</p>
            <p className="text-[11px] text-v-muted">Chat with us anytime</p>
          </div>
        </a>
        <a href="mailto:support@vadorabeauty.com"
          className="flex items-center gap-3 py-3 border-b border-v-border">
          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8B5E83" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4l-10 8L2 4"/></svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-v-text">Email Support</p>
            <p className="text-[11px] text-v-muted">support@vadorabeauty.com</p>
          </div>
        </a>
        <a href="tel:+919999999999"
          className="flex items-center gap-3 py-3">
          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8B5E83" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-v-text">Call Us</p>
            <p className="text-[11px] text-v-muted">Mon-Sat, 10 AM – 6 PM</p>
          </div>
        </a>
      </Section>

      {/* Dev Mode Indicator */}
      {process.env.NEXT_PUBLIC_ENV === "development" && (
        <div className="bg-yellow-50 rounded-card p-3 mb-3 text-center border border-yellow-200">
          <p className="text-[11px] text-yellow-700 font-semibold">🛠 Development Mode</p>
          <p className="text-[10px] text-yellow-600">Connected to dev database</p>
        </div>
      )}

      {/* Logout */}
      <button onClick={onLogout}
        className="w-full py-3.5 rounded-btn border border-v-error/30 text-v-error text-[14px] font-semibold mb-6 active:scale-[0.98]">
        Sign Out
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-surface rounded-card p-4 shadow-card mb-3">
      <p className="text-[13px] font-semibold text-v-text mb-3">{title}</p>
      {children}
    </div>
  );
}

function InfoRow({ label, value, last }: { label: string; value?: string; last?: boolean }) {
  return (
    <div className={`flex justify-between py-2 ${!last ? "border-b border-v-border" : ""}`}>
      <span className="text-xs text-v-muted">{label}</span>
      <span className="text-xs font-medium text-v-text text-right">{value || "—"}</span>
    </div>
  );
}
