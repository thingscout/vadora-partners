"use client";

import { formatINR, timeAgo } from "@/lib/utils";

interface HomeTabProps {
  partner: any;
  earnings: any[];
  tiers: any[];
  notifications: any[];
}

export default function HomeTab({ partner, earnings, tiers, notifications }: HomeTabProps) {
  const maxEarning = Math.max(...earnings.map((e: any) => Number(e.earnings) || 0), 1);

  // Tier progress calculation
  const currentTier = tiers.find((t: any) => t.name === partner.tier_name);
  const nextTier = tiers.find((t: any) => t.sort_order === (currentTier?.sort_order || 0) + 1);
  const salesProgress = nextTier
    ? Math.min(100, (partner.total_sales / nextTier.min_sales) * 100)
    : 100;
  const salesToNext = nextTier ? Math.max(0, nextTier.min_sales - partner.total_sales) : 0;

  const recentNotifications = notifications.slice(0, 3);

  return (
    <div className="px-4">
      {/* Greeting Banner */}
      <div className="rounded-card p-5 text-white mb-3"
        style={{ background: "linear-gradient(135deg, #8B5E83, #6B4063)" }}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold flex-shrink-0">
            {partner.avatar_initials}
          </div>
          <div>
            <p className="text-[17px] font-bold">Hi, {partner.name?.split(" ")[0]}!</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-v-text"
                style={{ background: partner.tier_color || "#C9A84C" }}>
                {partner.tier_name}
              </span>
              <span className="text-xs opacity-80">{partner.tier_rate}% commission</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <StatCard label="Total Sales" value={formatINR(partner.total_sales)} />
        <StatCard label="Total Earned" value={formatINR(partner.total_commission)} color="text-v-success" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <StatCard label="Pending Payout" value={formatINR(partner.pending_commission)} />
        <StatCard label="This Month" value={`${partner.this_month_orders} orders`} sub={formatINR(partner.this_month_sales)} />
      </div>

      {/* Tier Progress */}
      <div className="bg-white rounded-card p-4 shadow-card mb-3">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[13px] font-semibold text-v-text">Tier Progress</p>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: (partner.tier_color || "#C9A84C") + "30", color: partner.tier_color }}>
            {partner.tier_name}
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-v-border mb-2">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${salesProgress}%`, background: partner.tier_color || "#8B5E83" }} />
        </div>

        {nextTier ? (
          <p className="text-[11px] text-v-muted">
            <strong className="text-v-text">{formatINR(salesToNext)}</strong> more to reach{" "}
            <strong style={{ color: nextTier.color }}>{nextTier.name}</strong> ({nextTier.rate_percent}%)
          </p>
        ) : (
          <p className="text-[11px] text-v-success font-semibold">🎉 You're at the highest tier!</p>
        )}
      </div>

      {/* Earnings Chart */}
      {earnings.length > 0 && (
        <div className="bg-white rounded-card p-4 shadow-card mb-3">
          <p className="text-[13px] font-semibold text-v-text mb-3">Monthly Earnings</p>
          <div className="flex items-end gap-2 h-[80px]">
            {earnings.map((e: any, i: number) => (
              <div key={i} className="flex-1 text-center">
                <div className={`rounded-t-md min-h-[6px] transition-all duration-500 ${i === earnings.length - 1 ? "bg-brand" : "bg-brand-light"}`}
                  style={{ height: `${(Number(e.earnings) / maxEarning) * 64}px` }} />
                <p className="text-[9px] text-v-muted mt-1">{e.month_label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      {recentNotifications.length > 0 && (
        <div className="bg-white rounded-card p-4 shadow-card mb-3">
          <p className="text-[13px] font-semibold text-v-text mb-3">Recent Updates</p>
          {recentNotifications.map((n: any) => (
            <div key={n.id} className={`flex items-start gap-3 py-2.5 border-b border-v-border last:border-0 ${!n.is_read ? "bg-brand-light/50 -mx-2 px-2 rounded" : ""}`}>
              <NotifIcon type={n.type} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-v-text truncate">{n.title}</p>
                <p className="text-[11px] text-v-muted mt-0.5">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-card p-3.5 shadow-card">
      <p className="text-[11px] text-v-muted font-medium">{label}</p>
      <p className={`text-[20px] font-bold mt-1 ${color || "text-v-text"}`}>{value}</p>
      {sub && <p className="text-[11px] text-v-success mt-0.5">{sub}</p>}
    </div>
  );
}

function NotifIcon({ type }: { type: string }) {
  const icons: Record<string, { bg: string; color: string }> = {
    order:        { bg: "#5A8F6B15", color: "#5A8F6B" },
    commission:   { bg: "#8B5E8315", color: "#8B5E83" },
    payout:       { bg: "#C9A84C15", color: "#C9A84C" },
    tier_upgrade: { bg: "#C9A84C15", color: "#C9A84C" },
    announcement: { bg: "#6B7FD715", color: "#6B7FD7" },
  };
  const s = icons[type] || icons.announcement;
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: s.bg }}>
      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
    </div>
  );
}
