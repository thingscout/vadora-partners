"use client";

import { useState, useEffect } from "react";
import { formatINR, formatDate, getInitials } from "@/lib/utils";
import { getBankDetails, updateBankDetails, updatePersonalDetails, uploadProfilePhoto } from "@/lib/data";

interface ProfileTabProps {
  partner: any;
  tiers: any[];
  onLogout: () => void;
  onBankDetailsUpdated?: () => void;
  onProfileUpdated?: () => void;
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

export default function ProfileTab({ partner, tiers, onLogout, onBankDetailsUpdated, onProfileUpdated }: ProfileTabProps) {
  const [openLegal, setOpenLegal] = useState<string | null>(null);
  const [bankSectionOpen, setBankSectionOpen] = useState(false);

  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    // Once the server URL catches up (after onProfileUpdated refreshes partner),
    // drop the local blob preview and revoke it to avoid leaking memory.
    if (photoPreview && partner.profile_photo_url) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  }, [partner.profile_photo_url]);

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setPhotoError("Image must be under 1MB.");
      return;
    }

    setPhotoError("");
    setPhotoUploading(true);
    setPhotoPreview(URL.createObjectURL(file));
    try {
      await uploadProfilePhoto(partner.partner_id, file);
      onProfileUpdated?.();
    } catch (err: any) {
      setPhotoError(err.message || "Failed to upload photo. Please try again.");
      setPhotoPreview(null);
    } finally {
      setPhotoUploading(false);
    }
  }

  const [personalEditing, setPersonalEditing] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalError, setPersonalError] = useState("");

  function startEditingPersonal() {
    setEditPhone(partner.phone || "");
    setEditWhatsapp(partner.whatsapp || "");
    setEditCity(partner.city || "");
    setEditInstagram(partner.instagram_id || "");
    setPersonalError("");
    setPersonalEditing(true);
  }

  async function handleSavePersonalDetails() {
    setPersonalSaving(true);
    setPersonalError("");
    try {
      await updatePersonalDetails(partner.partner_id, {
        phone: editPhone || undefined,
        whatsapp: editWhatsapp || undefined,
        city: editCity || undefined,
        instagram_id: editInstagram || undefined,
      });
      setPersonalEditing(false);
      onProfileUpdated?.();
    } catch (err: any) {
      setPersonalError(err.message || "Failed to save. Please try again.");
    } finally {
      setPersonalSaving(false);
    }
  }

  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankLoading, setBankLoading] = useState(true);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [bankError, setBankError] = useState("");

  useEffect(() => {
    if (!partner?.partner_id || !partner.bank_details_pending) return;
    let cancelled = false;
    getBankDetails(partner.partner_id)
      .then((data) => {
        if (cancelled || !data) return;
        setBankName(data.bank_account_name || "");
        setBankAccount(data.bank_account_number || "");
        setBankIfsc(data.bank_ifsc || "");
        setUpiId(data.upi_id || "");
      })
      .catch((err) => console.error("Failed to load bank details:", err))
      .finally(() => { if (!cancelled) setBankLoading(false); });
    return () => { cancelled = true; };
  }, [partner?.partner_id, partner?.bank_details_pending]);

  async function handleSaveBankDetails() {
    setBankSaving(true);
    setBankError("");
    setBankSaved(false);
    try {
      await updateBankDetails(partner.partner_id, {
        bank_account_name: bankName || undefined,
        bank_account_number: bankAccount || undefined,
        bank_ifsc: bankIfsc || undefined,
        upi_id: upiId || undefined,
      });
      setBankSaved(true);
      onBankDetailsUpdated?.();
    } catch (err: any) {
      setBankError(err.message || "Failed to save bank details. Please try again.");
    } finally {
      setBankSaving(false);
    }
  }

  return (
    <div className="px-4">
      {/* Profile Header */}
      <div className="bg-brand-surface rounded-card p-5 shadow-card mb-3 flex items-center gap-4">
        <label className="relative w-14 h-14 flex-shrink-0 cursor-pointer">
          {photoPreview || partner.profile_photo_url ? (
            <img src={photoPreview || partner.profile_photo_url} alt={partner.name}
              className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-brand flex items-center justify-center text-white text-xl font-bold">
              {getInitials(partner.name || "")}
            </div>
          )}
          <div className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/40 transition-opacity ${photoUploading ? "opacity-100" : "opacity-0 active:opacity-100"}`}>
            {photoUploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelected} disabled={photoUploading} />
        </label>
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold text-v-text truncate">{partner.name}</p>
          <p className="text-xs text-v-muted mt-0.5">{partner.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-v-text"
              style={{ background: (partner.tier_color || "#C9A84C") + "40" }}>
              {partner.tier_name} · {partner.tier_rate}%
            </span>
            <span className="text-[10px] text-v-muted">Code: {partner.referral_code}</span>
          </div>
        </div>
      </div>
      {photoError && <p className="text-[11px] text-v-error mb-3 -mt-2">{photoError}</p>}

      {/* Personal Info */}
      <Section title="Personal Details"
        action={!personalEditing && <button onClick={startEditingPersonal} className="text-[11px] text-brand font-semibold">Edit</button>}>
        <InfoRow label="Name" value={partner.name} />
        <InfoRow label="Email" value={partner.email} />

        {personalEditing ? (
          <div className="pt-2">
            <ProfileField label="Phone" placeholder="10-digit mobile number" value={editPhone} onChange={setEditPhone} inputMode="numeric" />
            <ProfileField label="WhatsApp" placeholder="WhatsApp number" value={editWhatsapp} onChange={setEditWhatsapp} inputMode="numeric" />
            <ProfileField label="City" placeholder="Your city" value={editCity} onChange={setEditCity} />
            <ProfileField label="Instagram" placeholder="Instagram handle (without @)" value={editInstagram} onChange={setEditInstagram} />

            {personalError && <p className="text-[11px] text-v-error mb-2">{personalError}</p>}

            <div className="flex gap-2">
              <button onClick={handleSavePersonalDetails} disabled={personalSaving}
                className="flex-1 py-2.5 rounded-btn text-sm font-semibold bg-brand text-white active:scale-[0.98] disabled:opacity-60">
                {personalSaving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setPersonalEditing(false)} disabled={personalSaving}
                className="py-2.5 px-4 rounded-btn text-sm font-semibold text-v-muted bg-v-border/50">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <InfoRow label="Phone" value={partner.phone} />
            <InfoRow label="WhatsApp" value={partner.whatsapp} />
            <InfoRow label="City" value={partner.city} />
            <InfoRow label="Instagram" value={partner.instagram_id ? `@${partner.instagram_id}` : "—"} />
            <InfoRow label="Joined" value={partner.joined_at ? formatDate(partner.joined_at) : "—"} last />
          </>
        )}
      </Section>

      {/* Bank Details — only shown until the partner has provided them once */}
      {partner.bank_details_pending && (
        <div className="bg-brand-surface rounded-card shadow-card mb-3 overflow-hidden">
          <button onClick={() => setBankSectionOpen(!bankSectionOpen)}
            className="w-full flex items-center justify-between p-4 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-v-text">Bank Details</span>
              <span className="w-1.5 h-1.5 rounded-full bg-v-error" />
            </div>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8A7F83" strokeWidth="2"
              className={`transition-transform ${bankSectionOpen ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {bankSectionOpen && (
            <div className="px-4 pb-4">
              <p className="text-[11px] text-v-error font-medium mb-3">Your bank account details are yet to be updated.</p>
              {bankLoading ? (
                <p className="text-xs text-v-muted py-2">Loading...</p>
              ) : (
                <>
                  <ProfileField label="Account Holder Name" placeholder="Name as on bank account" value={bankName} onChange={setBankName} />
                  <ProfileField label="Bank Account Number" placeholder="Account number" value={bankAccount} onChange={setBankAccount} inputMode="numeric" />
                  <ProfileField label="IFSC Code" placeholder="e.g. SBIN0001234" value={bankIfsc} onChange={setBankIfsc} />
                  <ProfileField label="UPI ID" placeholder="e.g. name@upi" value={upiId} onChange={setUpiId} />

                  {bankError && <p className="text-[11px] text-v-error mb-2">{bankError}</p>}
                  {bankSaved && !bankError && <p className="text-[11px] text-v-success mb-2">Bank details saved.</p>}

                  <button onClick={handleSaveBankDetails} disabled={bankSaving}
                    className="w-full py-3 rounded-btn text-sm font-semibold bg-brand text-white active:scale-[0.98] disabled:opacity-60">
                    {bankSaving ? "Saving..." : "Save Bank Details"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

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
        <p className="text-[10px] text-v-muted mt-2.5 italic">
          Your tier is finalized once all orders in a cycle clear their return window — usually by the 10th of the following month.
        </p>
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
        <a href="https://wa.me/917055566307" target="_blank" rel="noopener"
          className="flex items-center gap-3 py-3 border-b border-v-border">
          <div className="w-8 h-8 rounded-full bg-[#25D366]/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-v-text">WhatsApp Support</p>
            <p className="text-[11px] text-v-muted">Chat with us anytime</p>
          </div>
        </a>
        <a href="mailto:support@vadoracares.com"
          className="flex items-center gap-3 py-3 border-b border-v-border">
          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#8B5E83" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4l-10 8L2 4"/></svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-v-text">Email Support</p>
            <p className="text-[11px] text-v-muted">support@vadoracares.com</p>
          </div>
        </a>
        <a href="tel:+917055566307"
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

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-brand-surface rounded-card p-4 shadow-card mb-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-semibold text-v-text">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function ProfileField({ label, placeholder, value, onChange, inputMode }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; inputMode?: string;
}) {
  return (
    <>
      <label className="text-xs font-semibold text-v-muted block mb-1.5">{label}</label>
      <input type="text" inputMode={inputMode as any} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-btn border border-v-border text-sm text-v-text outline-none focus:border-brand transition-colors bg-transparent mb-3" />
    </>
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
