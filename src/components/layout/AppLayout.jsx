import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import AchievementModal from "@/components/gamification/AchievementModal";
import LeaderModal from "@/components/gamification/LeaderModal";
import PrizeAlertModal from "@/components/gamification/PrizeAlertModal";
import { useAchievementCelebration } from "@/lib/useAchievementCelebration";
import { useLeaderCelebration } from "@/lib/useLeaderCelebration";
import { usePrizeAlertCelebration } from "@/lib/usePrizeAlerts";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { current: currentAchievement, dismiss: dismissAchievement } = useAchievementCelebration();
  const { current: leaderCelebration, dismiss: dismissLeaderCelebration } = useLeaderCelebration();
  const { current: prizeAlert, dismiss: dismissPrizeAlert } = usePrizeAlertCelebration();

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
      <AchievementModal achievement={leaderCelebration || prizeAlert ? null : currentAchievement} onClose={dismissAchievement} />
      <LeaderModal celebration={leaderCelebration} onClose={dismissLeaderCelebration} />
      <PrizeAlertModal alert={leaderCelebration ? null : prizeAlert} onClose={dismissPrizeAlert} />
    </div>
  );
}
