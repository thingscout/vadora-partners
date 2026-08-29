"use client";

import { useState } from "react";
import { formatINR } from "@/lib/utils";

interface ShareTabProps {
  partner: any;
}

const CAPTIONS = [
  {
    title: "General Invite",
    text: "Hey! 💜 Use my code {CODE} on Vadora Beauty and get a special discount on all products! Shop here: {LINK}",
  },
  {
    title: "Skincare Focus",
    text: "Looking for premium skincare? ✨ Try Vadora Beauty products — use my code {CODE} for a discount! {LINK}",
  },
  {
    title: "First Order",
    text: "Try Vadora Beauty for the first time! Use code {CODE} at checkout and save on your order 🌸 {LINK}",
  },
];

export default function ShareTab({ partner }: ShareTabProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const code = partner.referral_code || "CODE";
  const shopLink = "https://vadorabeauty.com"; // Will be updated once Shopify store is live

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function shareWhatsApp(text: string) {
    const msg = text.replace("{CODE}", code).replace("{LINK}", shopLink);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function shareGeneric(text: string) {
    const msg = text.replace("{CODE}", code).replace("{LINK}", shopLink);
    if (navigator.share) {
      navigator.share({ text: msg }).catch(() => {});
    } else {
      copyToClipboard(msg, "caption");
    }
  }

  return (
    <div className="px-4">
      {/* Referral Code Card */}
      <div className="rounded-card p-5 text-white mb-3 text-center"
        style={{ background: "linear-gradient(135deg, #2B4C6F, #1A3550)" }}>
        <p className="text-xs opacity-80 mb-1">Your Referral / Discount Code</p>
        <div className="bg-white/15 backdrop-blur-md rounded-btn px-4 py-3 inline-block mb-3">
          <p className="text-[28px] font-extrabold tracking-[3px]">{code}</p>
        </div>
        <p className="text-[11px] opacity-70">
          Customers use this code at checkout for a discount
        </p>

        <div className="flex gap-2 mt-4">
          <button onClick={() => copyToClipboard(code, "code")}
            className="flex-1 py-3 rounded-btn bg-white text-brand text-sm font-bold active:scale-[0.98]">
            {copied === "code" ? "✓ Copied!" : "Copy Code"}
          </button>
          <button onClick={() => shareWhatsApp(`Use my code ${code} on Vadora Beauty to get a discount! ${shopLink}`)}
            className="flex-1 py-3 rounded-btn bg-[#25D366] text-white text-sm font-bold active:scale-[0.98] flex items-center justify-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.106 1.516 5.832L0 24l6.322-1.66A11.928 11.928 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.863 0-3.64-.502-5.186-1.444l-.372-.22-3.858 1.012 1.03-3.761-.242-.384A9.78 9.78 0 012.18 12c0-5.422 4.398-9.82 9.82-9.82 5.422 0 9.82 4.398 9.82 9.82 0 5.422-4.398 9.82-9.82 9.82z"/>
            </svg>
            WhatsApp
          </button>
        </div>
      </div>

      {/* Share Stats */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-white rounded-card p-3.5 shadow-card text-center">
          <p className="text-[10px] text-v-muted">Total Orders</p>
          <p className="text-xl font-bold text-v-text mt-1">{partner.total_orders || 0}</p>
        </div>
        <div className="bg-white rounded-card p-3.5 shadow-card text-center">
          <p className="text-[10px] text-v-muted">Total Earned</p>
          <p className="text-xl font-bold text-v-success mt-1">{formatINR(partner.total_commission || 0)}</p>
        </div>
      </div>

      {/* Ready-Made Captions */}
      <div className="bg-white rounded-card p-4 shadow-card mb-3">
        <p className="text-[13px] font-semibold text-v-text mb-3">Ready-Made Captions</p>
        <p className="text-xs text-v-muted mb-3">Tap to share — your code is auto-inserted</p>

        {CAPTIONS.map((cap, i) => (
          <div key={i} className="bg-brand-light/50 rounded-btn p-3.5 mb-2.5 last:mb-0">
            <p className="text-[11px] font-bold text-brand mb-1">{cap.title}</p>
            <p className="text-xs text-v-text leading-relaxed mb-2.5">
              {cap.text.replace("{CODE}", code).replace("{LINK}", shopLink)}
            </p>
            <div className="flex gap-2">
              <button onClick={() => shareWhatsApp(cap.text)}
                className="flex-1 py-2 rounded-btn bg-[#25D366] text-white text-[11px] font-semibold active:scale-[0.98]">
                WhatsApp
              </button>
              <button onClick={() => shareGeneric(cap.text)}
                className="flex-1 py-2 rounded-btn bg-white border border-v-border text-v-text text-[11px] font-semibold active:scale-[0.98]">
                {copied === "caption" ? "✓ Copied" : "Share / Copy"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-brand-light rounded-card p-4 mb-3">
        <p className="text-[13px] font-semibold text-brand mb-2">Sharing Tips 💡</p>
        <div className="space-y-1.5">
          <p className="text-xs text-v-text">• Share your code on Instagram stories & reels</p>
          <p className="text-xs text-v-text">• Add the code to your bio or highlights</p>
          <p className="text-xs text-v-text">• Send personally to friends who love beauty</p>
          <p className="text-xs text-v-text">• Post product reviews with your code</p>
        </div>
      </div>
    </div>
  );
}
