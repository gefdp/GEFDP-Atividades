import React from "react";
import { db } from "@/services/dataService";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Star, Coins } from "lucide-react";
import RewardCard from "../components/rewards/RewardCard";
import { motion } from "framer-motion";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function Rewards() {
  const { user, isAdmin } = useCurrentUser();

  const { data: allActivities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: () => db.entities.Activity.list("-created_date", 200),
    enabled: !!user,
  });

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: () => db.entities.Reward.list("points_required", 100),
  });

  // Pontos sempre baseados nas atividades do próprio usuário
  const myActivities = allActivities.filter(
    (a) => a.assigned_to === user?.email || a.created_by === user?.email
  );

  const totalPoints = myActivities
    .filter((a) => a.status === "concluida")
    .reduce((sum, a) => sum + (a.points || 10), 0);

  const completedCount = myActivities.filter((a) => a.status === "concluida").length;

  const unlockedCount = rewards.filter(
    (r) => r.unlocked || totalPoints >= r.points_required
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recompensas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Conquiste badges completando suas atividades
        </p>
      </div>

      {/* Points Summary — sempre pontos do próprio usuário */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
            <Coins className="w-10 h-10" />
          </div>
          <div className="text-center sm:text-left flex-1">
            <p className="text-sm font-medium opacity-80">Seus Pontos Totais</p>
            <p className="text-4xl font-bold mt-1">{totalPoints}</p>
            <p className="text-sm opacity-70 mt-1">
              {completedCount} atividades concluídas • {unlockedCount} recompensas desbloqueadas
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-center bg-white/10 rounded-xl p-3 min-w-[80px]">
              <Star className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{unlockedCount}</p>
              <p className="text-xs opacity-70">Badges</p>
            </div>
            <div className="text-center bg-white/10 rounded-xl p-3 min-w-[80px]">
              <Trophy className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{rewards.length}</p>
              <p className="text-xs opacity-70">Total</p>
            </div>
          </div>
        </div>
      </motion.div>

      {rewards.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhuma recompensa ainda</p>
          <p className="text-sm mt-1">Recompensas serão adicionadas em breve!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rewards.map((reward) => (
            <RewardCard key={reward.id} reward={reward} totalPoints={totalPoints} />
          ))}
        </div>
      )}
    </div>
  );
}