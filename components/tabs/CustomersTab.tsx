"use client";

import { useState } from "react";
import { formatINR, formatDate, getInitials } from "@/lib/utils";

interface CustomersTabProps {
  customers: any[];
  partner: any;
}

export default function CustomersTab({ customers, partner }: CustomersTabProps) {
  const [search, setSearch] = useState("");

  const total = partner.total_customers || customers.length;
  const newThisMonth = partner.new_customers_this_month || 0;
  const repeat = partner.repeat_customers || customers.filter((c: any) => c.is_repeat).length;

  const filtered = search
    ? customers.filter((c: any) => c.customer_name?.toLowerCase().includes(search.toLowerCase()))
    : customers;

  return (
    <div className="px-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <MiniStat label="Total" value={total} />
        <MiniStat label="New (Month)" value={newThisMonth} color="text-v-success" />
        <MiniStat label="Repeat" value={repeat} color="text-brand" />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-v-muted" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-3 rounded-card bg-brand-surface border border-v-border text-sm text-v-text outline-none focus:border-brand shadow-card" />
      </div>

      {/* Customer List */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-v-muted">
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-40">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
          </svg>
          <p className="text-sm">{search ? "No matching customers" : "No customers yet"}</p>
          <p className="text-xs mt-1">Share your referral code to get started!</p>
        </div>
      ) : (
        filtered.map((c: any, i: number) => (
          <div key={i} className="bg-brand-surface rounded-card p-4 shadow-card mb-2.5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-sm font-bold text-brand flex-shrink-0">
              {getInitials(c.customer_name || "?")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-v-text truncate">{c.customer_name}</p>
                {c.is_repeat && (
                  <span className="text-[9px] font-bold text-brand bg-brand-light px-1.5 py-0.5 rounded-full flex-shrink-0">REPEAT</span>
                )}
              </div>
              <p className="text-xs text-v-muted mt-0.5">
                {c.total_orders} order{c.total_orders > 1 ? "s" : ""} · Last: {formatDate(c.last_order_date)}
              </p>
            </div>
            <p className="text-sm font-bold text-v-text flex-shrink-0">{formatINR(c.total_purchase)}</p>
          </div>
        ))
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-brand-surface rounded-card p-3 shadow-card text-center">
      <p className={`text-xl font-bold ${color || "text-v-text"}`}>{value}</p>
      <p className="text-[10px] text-v-muted font-medium mt-0.5">{label}</p>
    </div>
  );
}
