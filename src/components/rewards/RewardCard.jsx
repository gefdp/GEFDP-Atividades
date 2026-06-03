import React from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

const TIER_CONFIG = {
  bronze: { bg: "from-orange-50 to-amber-50", border: "border-orange-200", ring: "ring-orange-300", icon: "bg-orange-100", text: "text-orange-900", progress: "bg-orange-400", badge: "bg-orange-100 text-orange-700" },
  prata: { bg: "from-slate-50 to-gray-100", border: "border-slate-300", ring: "ring-slate-400", icon: "bg-slate-100", text: "text-slate-900", progress: "bg-slate-400", badge: "bg-slate-100 text-slate-700" },
  ouro: { bg: "from-amber-50 to-yellow-50", border: "border-amber-300", ring: "ring-amber-400", icon: "bg-amber-100", text: "text-amber-900", progress: "bg-amber-400", badge: "bg-amber-100 text-amber-700" },
  platina: { bg: "from-purple-50 to-indigo-50", border: "border-purple-300", ring: "ring-purple-400", icon: "bg-purple-100", text: "text-purple-900", progress: "bg-purple-500", badge: "bg-purple-100 text-purple-700" },
};

function getTier(pts) {
  if (pts >= 500) return "platina";
  if (pts >= 200) return "ouro";
  if (pts >= 80) return "prata";
  return "bronze";
}

export default function RewardCard({ reward, totalPoints }) {
  const isUnlocked = reward.unlocked || totalPoints >= reward.points_required;
  const progress = Math.min((totalPoints / reward.points_required) * 100, 100);
  const tier = getTier(reward.points_required);
  const cfg = isUnlocked ? TIER_CONFIG[tier] : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
        isUnlocked
          ? `bg-gradient-to-br ${cfg.bg} ${cfg.border} shadow-lg`
          : "bg-card border-border"
      }`}
    >
      {isUnlocked && (
        <>
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-full -translate-y-8 translate-x-8 bg-amber-400" />
          <div className="absolute bottom-0 left-0 w-16 h-16 opacity-5 rounded-full translate-y-6 -translate-x-6 bg-amber-400" />
        </>
      )}

      {/* Tier badge */}
      {isUnlocked && (
        <div className={`absolute top-3 right-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}>
          {tier}
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${isUnlocked ? cfg.icon : "bg-muted"} ${isUnlocked ? `ring-2 ${cfg.ring}` : ""}`}>
          {isUnlocked ? (reward.icon || "🏆") : <Lock className="w-6 h-6 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-sm ${isUnlocked ? cfg.text : "text-foreground"}`}>
            {reward.title}
          </h4>
          {reward.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{reward.description}</p>
          )}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className={`font-semibold ${isUnlocked ? cfg.text : "text-muted-foreground"}`}>
                {isUnlocked ? "✓ Desbloqueado!" : `${Math.round(progress)}%`}
              </span>
              <span className="font-bold text-foreground">{reward.points_required} pts</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${isUnlocked ? (cfg.progress) : "bg-primary/40"}`}
              />
            </div>
            {!isUnlocked && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Faltam {reward.points_required - totalPoints} pts
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}