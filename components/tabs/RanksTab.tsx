"use client";

import { formatINR } from "@/lib/utils";

interface RanksTabProps {
  leaderboard: any[];
  currentPartnerId: string;
}

export default function RanksTab({ leaderboard, currentPartnerId }: RanksTabProps) {
  const myEntry = leaderboard.find((e: any) => e.partner_id === currentPartnerId);

  // Top 3
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="px-4">
      {/* My Rank */}
      {myEntry && (
        <div className="rounded-card p-4 text-white mb-3"
          style={{ background: "linear-gradient(135deg, #E8792B, #C25F1C)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                #{myEntry.rank}
              </div>
              <div>
                <p className="text-[15px] font-bold">Your Rank</p>
                <p className="text-xs opacity-80">{formatINR(myEntry.total_sales)} in sales</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-v-text"
              style={{ background: myEntry.tier_color || "#C9A84C" }}>
              {myEntry.tier_name}
            </span>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-4">
          {/* 2nd */}
          <PodiumSpot entry={top3[1]} rank={2} height="h-[80px]" />
          {/* 1st */}
          <PodiumSpot entry={top3[0]} rank={1} height="h-[100px]" crown />
          {/* 3rd */}
          <PodiumSpot entry={top3[2]} rank={3} height="h-[64px]" />
        </div>
      )}

      {/* Remaining Leaderboard */}
      <div className="bg-brand-surface rounded-card shadow-card overflow-hidden mb-3">
        <div className="px-4 py-3 border-b border-v-border flex justify-between text-[11px] font-semibold text-v-muted">
          <span>RANK</span><span>SALES</span>
        </div>
        {rest.length === 0 && top3.length === 0 && (
          <p className="text-center text-sm text-v-muted py-8">Leaderboard updates with orders</p>
        )}
        {rest.map((e: any) => {
          const isMe = e.partner_id === currentPartnerId;
          return (
            <div key={e.partner_id}
              className={`px-4 py-3 flex items-center justify-between border-b border-v-border last:border-0 ${isMe ? "bg-brand-light" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-v-muted w-6 text-center">{e.rank}</span>
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-xs font-bold text-brand">
                  {e.avatar_initials}
                </div>
                <div>
                  <p className={`text-[13px] font-medium ${isMe ? "text-brand font-bold" : "text-v-text"}`}>
                    {isMe ? "You" : e.name?.split(" ")[0]}
                  </p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: (e.tier_color || "#C9A84C") + "30", color: e.tier_color }}>
                    {e.tier_name}
                  </span>
                </div>
              </div>
              <p className="text-sm font-bold text-v-text">{formatINR(e.total_sales)}</p>
            </div>
          );
        })}
      </div>

      {/* Note */}
      <div className="bg-brand-light rounded-card p-3 mb-3">
        <p className="text-xs text-center text-v-muted">
          Rankings are based on total product sales only. Updated daily.
        </p>
      </div>
    </div>
  );
}

function PodiumSpot({ entry, rank, height, crown }: { entry: any; rank: number; height: string; crown?: boolean }) {
  const bgColors = ["", "#C9A84C", "#9EAAB0", "#B87D5E"];
  return (
    <div className="flex flex-col items-center w-[90px]">
      <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-sm font-bold text-brand mb-1 relative">
        {entry.avatar_initials}
        {crown && <span className="absolute -top-2 text-base">👑</span>}
      </div>
      <p className="text-[11px] font-semibold text-v-text truncate max-w-full">{entry.name?.split(" ")[0]}</p>
      <p className="text-[10px] text-v-muted">{formatINR(entry.total_sales)}</p>
      <div className={`w-full ${height} rounded-t-lg mt-1 flex items-center justify-center`}
        style={{ background: bgColors[rank] + "40" }}>
        <span className="text-xl font-extrabold" style={{ color: bgColors[rank] }}>#{rank}</span>
      </div>
    </div>
  );
}
