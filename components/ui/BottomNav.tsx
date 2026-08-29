"use client";

import type { TabId } from "@/types";

const tabs: { id: TabId; label: string; icon: (c: string) => JSX.Element }[] = [
  { id: "home", label: "Home", icon: (c) => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="2"><path d="M3 12l9-8 9 8"/><path d="M5 10v9a1 1 0 001 1h3v-5h6v5h3a1 1 0 001-1v-9"/></svg> },
  { id: "orders", label: "Orders", icon: (c) => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M10 4v6"/></svg> },
  { id: "customers", label: "Customers", icon: (c) => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
  { id: "earnings", label: "Earnings", icon: (c) => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20M6 16h.01M10 16h4"/></svg> },
  { id: "share", label: "Share", icon: (c) => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg> },
  { id: "ranks", label: "Ranks", icon: (c) => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="2"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM7 7H4a1 1 0 00-1 1v1a3 3 0 003 3M17 7h3a1 1 0 011 1v1a3 3 0 01-3 3"/></svg> },
  { id: "profile", label: "Profile", icon: (c) => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg> },
];

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-v-border flex shadow-[0_-2px_16px_rgba(0,0,0,0.04)] z-[100]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 6px)" }}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 border-none bg-none transition-colors ${isActive ? "text-brand" : "text-v-muted"}`}>
            {t.icon(isActive ? "#8B5E83" : "#8A7F83")}
            <span className={`text-[9px] ${isActive ? "font-bold" : "font-medium"}`}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
