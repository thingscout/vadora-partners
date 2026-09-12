"use client";

import { useState } from "react";
import { formatINR, formatDate, ORDER_STATUS_CONFIG } from "@/lib/utils";

interface OrdersTabProps {
  orders: any[];
  onFilter: (status: string) => void;
}

const FILTERS = ["all", "confirmed", "shipped", "delivered", "commission_eligible"];

export default function OrdersTab({ orders, onFilter }: OrdersTabProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  function handleFilter(status: string) {
    setActiveFilter(status);
    onFilter(status);
  }

  const STATUS_STEPS = ["confirmed", "packed", "shipped", "delivered", "commission_eligible"];

  return (
    <div className="px-4">
      {/* Filter Pills — scrollable */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => handleFilter(f)}
            className={`px-3.5 py-2 rounded-full text-[12px] font-semibold capitalize whitespace-nowrap transition-all ${
              activeFilter === f ? "bg-brand text-white" : "bg-brand-light text-brand"
            }`}>
            {f === "commission_eligible" ? "Earned" : f}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-10 text-v-muted"><p className="text-sm">No orders found</p></div>
      ) : (
        orders.map((order: any) => {
          const statusConf = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.confirmed;
          const isExpanded = expanded === order.id;
          const currentStep = STATUS_STEPS.indexOf(order.status);

          return (
            <div key={order.id} className="bg-brand-surface rounded-card shadow-card mb-2.5 overflow-hidden"
              onClick={() => setExpanded(isExpanded ? null : order.id)}>
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-v-text">{order.customer_name}</p>
                  <p className="text-xs text-v-muted mt-1">{order.order_ref} · {formatDate(order.order_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-bold text-v-text">{formatINR(order.order_amount)}</p>
                  <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1"
                    style={{ background: statusConf.bg, color: statusConf.color }}>
                    {statusConf.label}
                  </span>
                </div>
              </div>

              {/* Expanded: status tracker */}
              {isExpanded && order.status !== "cancelled" && order.status !== "returned" && (
                <div className="px-4 pb-4 border-t border-v-border pt-3">
                  <div className="flex items-center gap-1">
                    {STATUS_STEPS.map((s, i) => {
                      const done = i <= currentStep;
                      const stepConf = ORDER_STATUS_CONFIG[s];
                      return (
                        <div key={s} className="flex-1 flex flex-col items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            done ? "bg-brand text-white" : "bg-v-border text-v-muted"
                          }`}>
                            {done ? "✓" : i + 1}
                          </div>
                          <p className={`text-[8px] mt-1 text-center leading-tight ${done ? "text-brand font-semibold" : "text-v-muted"}`}>
                            {stepConf?.label.split(" ")[0]}
                          </p>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`absolute h-0.5 w-full ${done ? "bg-brand" : "bg-v-border"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-3 pt-2 border-t border-v-border">
                    <span className="text-xs text-v-muted">Commission ({order.commission_rate}%)</span>
                    <span className="text-xs font-bold text-brand">+{formatINR(order.commission_amount)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
