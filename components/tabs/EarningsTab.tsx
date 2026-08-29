"use client";

import { formatINR, formatDate } from "@/lib/utils";

interface EarningsTabProps {
  partner: any;
  earnings: any[];
  payouts: any[];
}

const PAYOUT_STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "Pending",    color: "#D4A843", bg: "#D4A84315" },
  processing: { label: "Processing", color: "#6B7FD7", bg: "#6B7FD715" },
  completed:  { label: "Paid",       color: "#5A8F6B", bg: "#5A8F6B15" },
  failed:     { label: "Failed",     color: "#C0616B", bg: "#C0616B15" },
};

export default function EarningsTab({ partner, earnings, payouts }: EarningsTabProps) {
  const maxEarning = Math.max(...earnings.map((e: any) => Number(e.earnings) || 0), 1);

  return (
    <div className="px-4">
      {/* Commission Wallet */}
      <div className="rounded-card p-5 text-white mb-3"
        style={{ background: "linear-gradient(135deg, #2B4C6F, #1A3550)" }}>
        <p className="text-xs opacity-80 mb-1">Available Balance</p>
        <p className="text-3xl font-bold">{formatINR(partner.available_commission || 0)}</p>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <p className="text-[10px] opacity-70">Pending</p>
            <p className="text-[15px] font-bold">{formatINR(partner.pending_commission || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] opacity-70">Processing</p>
            <p className="text-[15px] font-bold">{formatINR(partner.processing_commission || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] opacity-70">Total Paid</p>
            <p className="text-[15px] font-bold">{formatINR(partner.paid_commission || 0)}</p>
          </div>
        </div>
      </div>

      {/* Current Rate + Next Payout */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-white rounded-card p-3.5 shadow-card">
          <p className="text-[10px] text-v-muted font-medium">Commission Rate</p>
          <p className="text-xl font-bold text-brand mt-1">{partner.tier_rate}%</p>
          <p className="text-[10px] text-v-muted mt-0.5">{partner.tier_name} Tier</p>
        </div>
        <div className="bg-white rounded-card p-3.5 shadow-card">
          <p className="text-[10px] text-v-muted font-medium">Next Payout</p>
          <p className="text-[15px] font-bold text-v-text mt-1">1st of month</p>
          <p className="text-[10px] text-v-muted mt-0.5">Min ₹500 balance</p>
        </div>
      </div>

      {/* Monthly Earnings Chart */}
      {earnings.length > 0 && (
        <div className="bg-white rounded-card p-4 shadow-card mb-3">
          <p className="text-[13px] font-semibold text-v-text mb-3">Monthly Earnings</p>
          <div className="flex items-end gap-2 h-[90px]">
            {earnings.map((e: any, i: number) => {
              const h = (Number(e.earnings) / maxEarning) * 72;
              return (
                <div key={i} className="flex-1 text-center">
                  <p className="text-[8px] text-v-muted mb-1">{formatINR(Number(e.earnings))}</p>
                  <div className={`rounded-t-md min-h-[4px] transition-all duration-500 ${i === earnings.length - 1 ? "bg-brand" : "bg-brand-light"}`}
                    style={{ height: `${h}px` }} />
                  <p className="text-[9px] text-v-muted mt-1">{e.month_label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payout History */}
      <div className="bg-white rounded-card p-4 shadow-card mb-3">
        <p className="text-[13px] font-semibold text-v-text mb-3">Payout History</p>
        {payouts.length === 0 ? (
          <p className="text-xs text-v-muted text-center py-4">No payouts yet</p>
        ) : (
          payouts.map((p: any) => {
            const st = PAYOUT_STATUS_STYLE[p.status] || PAYOUT_STATUS_STYLE.pending;
            return (
              <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-v-border last:border-0">
                <div>
                  <p className="text-sm font-semibold text-v-text">{formatINR(p.amount)}</p>
                  <p className="text-[11px] text-v-muted mt-0.5">{formatDate(p.paid_at || p.created_at)}</p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>
                  {st.label}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* How Commissions Work */}
      <div className="bg-brand-light rounded-card p-4 mb-3">
        <p className="text-[13px] font-semibold text-brand mb-2">How Commissions Work</p>
        <div className="space-y-1.5">
          <p className="text-xs text-v-text">• Customer buys using your referral code</p>
          <p className="text-xs text-v-text">• Commission is added as <strong>Pending</strong> on order</p>
          <p className="text-xs text-v-text">• Moves to <strong>Available</strong> after 7-day return window</p>
          <p className="text-xs text-v-text">• Paid out on the <strong>1st of each month</strong> (min ₹500)</p>
        </div>
      </div>
    </div>
  );
}
