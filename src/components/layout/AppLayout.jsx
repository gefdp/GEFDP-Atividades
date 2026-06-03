import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <main className="lg:ml-60 min-h-screen">
        {/* Notification bell - top right */}
        <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />
        </div>
        <div className="p-4 pt-16 lg:p-8 lg:pt-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
