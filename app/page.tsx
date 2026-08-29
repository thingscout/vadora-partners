"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";
import { getPartnerStatus } from "@/lib/data";
import LandingPage from "@/components/layout/LandingPage";
import LoginPage from "@/components/layout/LoginPage";
import RegisterPage from "@/components/layout/RegisterPage";
import PendingPage from "@/components/layout/PendingPage";
import RejectedPage from "@/components/layout/RejectedPage";
import DashboardLayout from "@/components/layout/DashboardLayout";

type AppView = "loading" | "landing" | "login" | "register" | "pending" | "rejected" | "dashboard";

export default function Home() {
  const [view, setView] = useState<AppView>("loading");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const session = await getSession();
      console.log("DEBUG: session =", session ? "YES (user: " + session.user?.email + ")" : "NO");
      if (!session) {
        setView("landing");
        return;
      }

      // User is logged in — check partner status
      const status = await getPartnerStatus();
      console.log("DEBUG: partner status =", JSON.stringify(status));

      if (!status) {
        // Logged in but no partner record — needs to register
        console.log("DEBUG: No partner found → showing register");
        setView("register");
      } else if (status.status === "pending") {
        setView("pending");
      } else if (status.status === "rejected") {
        setView("rejected");
      } else if (status.status === "approved" && status.is_active) {
        console.log("DEBUG: Approved → showing dashboard");
        setView("dashboard");
      } else {
        setView("pending");
      }
    } catch (err) {
      console.error("DEBUG: checkAuth error:", err);
      setView("landing");
    }
  }

  if (view === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 animate-pulse">V</div>
          <p className="text-v-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "landing")   return <LandingPage onLogin={() => setView("login")} onRegister={() => setView("register")} />;
  if (view === "login")     return <LoginPage onSuccess={checkAuth} onBack={() => setView("landing")} onRegister={() => setView("register")} />;
  if (view === "register")  return <RegisterPage onSuccess={() => setView("pending")} onBack={() => setView("landing")} onLogin={() => setView("login")} />;
  if (view === "pending")   return <PendingPage onLogout={() => setView("landing")} />;
  if (view === "rejected")  return <RejectedPage onLogout={() => setView("landing")} />;
  if (view === "dashboard") return <DashboardLayout onLogout={() => setView("landing")} />;

  return null;
}
