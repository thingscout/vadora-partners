"use client";

import { useState, useEffect, useRef } from "react";
import { signOut } from "@/lib/auth";
import { getPartnerProfile, getPartnerOrders, getPartnerCustomers, getLeaderboard, getMonthlyEarnings, getPayoutHistory, getTiers, getNotifications, getUnreadCount, markAllNotificationsRead } from "@/lib/data";
import { timeAgo } from "@/lib/utils";
import BottomNav from "@/components/ui/BottomNav";
import HomeTab from "@/components/tabs/HomeTab";
import OrdersTab from "@/components/tabs/OrdersTab";
import CustomersTab from "@/components/tabs/CustomersTab";
import EarningsTab from "@/components/tabs/EarningsTab";
import ShareTab from "@/components/tabs/ShareTab";
import RanksTab from "@/components/tabs/RanksTab";
import ProfileTab from "@/components/tabs/ProfileTab";
import type { TabId } from "@/types";

interface DashboardLayoutProps {
  onLogout: () => void;
}

const TAB_TITLES: Record<TabId, string> = {
  home: "Vadora Beauty Partners",
  orders: "Orders",
  customers: "My Customers",
  earnings: "Earnings",
  share: "Share & Earn",
  ranks: "Leaderboard",
  profile: "Profile",
};

export default function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  const [tab, setTab] = useState<TabId>("home");
  const [partner, setPartner] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!showNotifPanel) return;
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifPanel]);

  async function loadData() {
    try {
      const [profileData, tiersData, leaderboardData] = await Promise.all([
        getPartnerProfile(),
        getTiers(),
        getLeaderboard(),
      ]);

      setPartner(profileData);
      setTiers(tiersData);
      setLeaderboard(leaderboardData);

      if (profileData?.partner_id) {
        const [o, c, e, p, n, uc] = await Promise.all([
          getPartnerOrders(profileData.partner_id),
          getPartnerCustomers(profileData.partner_id),
          getMonthlyEarnings(profileData.partner_id),
          getPayoutHistory(profileData.partner_id),
          getNotifications(profileData.partner_id),
          getUnreadCount(profileData.partner_id),
        ]);
        setOrders(o); setCustomers(c); setEarnings(e);
        setPayouts(p); setNotifications(n); setUnreadCount(uc);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await signOut();
    onLogout();
  }

  async function handleFilterOrders(status: string) {
    if (!partner?.partner_id) return;
    const data = await getPartnerOrders(partner.partner_id, status);
    setOrders(data);
  }

  async function handleBellClick() {
    const opening = !showNotifPanel;
    setShowNotifPanel(opening);

    if (opening && unreadCount > 0 && partner?.partner_id) {
      try {
        await markAllNotificationsRead(partner.partner_id);
        // 'account_setup' notifications (e.g. bank details pending) are excluded
        // from the bulk mark-read — they only clear once actually resolved.
        const remainingUnread = notifications.filter((n) => n.type === "account_setup" && !n.is_read).length;
        setNotifications((prev) => prev.map((n) => (n.type === "account_setup" ? n : { ...n, is_read: true })));
        setUnreadCount(remainingUnread);
      } catch (err) {
        console.error("Failed to mark notifications read:", err);
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-brand" />
          </div>
          <p className="text-v-muted text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-v-error/10 flex items-center justify-center mx-auto mb-4 text-v-error text-2xl">!</div>
          <h2 className="text-lg font-bold text-v-text mb-2">Account Not Found</h2>
          <p className="text-sm text-v-muted mb-6">Your email is not linked to a partner account. Please contact your admin.</p>
          <button onClick={handleLogout} className="px-6 py-3 bg-brand text-white rounded-btn text-sm font-semibold">Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-brand-bg relative">
      <div className="sticky top-0 z-50 bg-brand-bg px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex flex-col items-center">
          {logoError ? (
            <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-base font-bold">
              V
            </div>
          ) : (
            // Crops the logo PNG down to just the "VADORA™" wordmark, hiding the
            // "CARES" tagline baked into the bottom of the image (no source image edit).
            <div className="h-8 w-[126px] overflow-hidden flex justify-center">
              <img src="/vadora-logo.png" alt="Vadora" className="h-[46px] w-auto" onError={() => setLogoError(true)} />
            </div>
          )}
          <p className="text-xs text-v-muted mt-1">Beauty Partners App</p>
        </div>
        {tab === "home" && (
          <div className="relative" ref={notifRef}>
            <button onClick={handleBellClick} aria-label="Notifications"
              className="relative w-6 h-6 flex items-center justify-center active:scale-[0.92]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="text-v-text">
                <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-v-error flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white leading-none">{unreadCount > 9 ? "9+" : unreadCount}</span>
                </div>
              )}
            </button>

            {showNotifPanel && (
              <div className="absolute right-0 top-8 w-72 max-h-80 overflow-y-auto bg-brand-surface rounded-card shadow-card border border-v-border z-50">
                <p className="text-[13px] font-semibold text-v-text px-4 pt-3 pb-2">Notifications</p>
                {notifications.length === 0 ? (
                  <p className="text-xs text-v-muted text-center py-6 px-4">There are no new notifications as of now.</p>
                ) : (
                  notifications.slice(0, 10).map((n: any) => (
                    <div key={n.id} className="px-4 py-2.5 border-b border-v-border last:border-0">
                      <p className="text-[13px] font-medium text-v-text">{n.title}</p>
                      {n.message && <p className="text-[11px] text-v-muted mt-0.5">{n.message}</p>}
                      <p className="text-[10px] text-v-muted mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pb-24">
        {tab === "home" && <HomeTab partner={partner} orders={orders} earnings={earnings} tiers={tiers} notifications={notifications} onGoToProfile={() => setTab("profile")} />}
        {tab === "orders" && <OrdersTab orders={orders} onFilter={handleFilterOrders} />}
        {tab === "customers" && <CustomersTab customers={customers} partner={partner} />}
        {tab === "earnings" && <EarningsTab partner={partner} earnings={earnings} payouts={payouts} />}
        {tab === "share" && <ShareTab partner={partner} />}
        {tab === "ranks" && <RanksTab leaderboard={leaderboard} currentPartnerId={partner.partner_id} />}
        {tab === "profile" && <ProfileTab partner={partner} tiers={tiers} onLogout={handleLogout} onBankDetailsUpdated={loadData} onProfileUpdated={loadData} />}
      </div>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
