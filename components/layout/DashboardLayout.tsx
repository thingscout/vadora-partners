"use client";

import { useState, useEffect } from "react";
import { signOut } from "@/lib/auth";
import { getPartnerProfile, getPartnerOrders, getPartnerCustomers, getLeaderboard, getMonthlyEarnings, getPayoutHistory, getTiers, getNotifications, getUnreadCount } from "@/lib/data";
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
  home: "Dashboard",
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

  useEffect(() => { loadData(); }, []);

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
        <h1 className="text-xl font-bold text-v-text">{TAB_TITLES[tab]}</h1>
        {unreadCount > 0 && tab === "home" && (
          <div className="w-6 h-6 rounded-full bg-v-error flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>
          </div>
        )}
      </div>

      <div className="pb-24">
        {tab === "home" && <HomeTab partner={partner} earnings={earnings} tiers={tiers} notifications={notifications} />}
        {tab === "orders" && <OrdersTab orders={orders} onFilter={handleFilterOrders} />}
        {tab === "customers" && <CustomersTab customers={customers} partner={partner} />}
        {tab === "earnings" && <EarningsTab partner={partner} earnings={earnings} payouts={payouts} />}
        {tab === "share" && <ShareTab partner={partner} />}
        {tab === "ranks" && <RanksTab leaderboard={leaderboard} currentPartnerId={partner.partner_id} />}
        {tab === "profile" && <ProfileTab partner={partner} tiers={tiers} onLogout={handleLogout} />}
      </div>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
