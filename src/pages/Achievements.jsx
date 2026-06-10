import React, { useMemo } from "react";
import { db } from "@/services/dataService";
import { useQuery } from "@tanstack/react-query";
import { Award, Star, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useCurrentUser } from "@/lib/useCurrentUser";
import ToolBadgeCard from "../components/gamification/ToolBadgeCard";
import { TOOLS, TOOL_CATEGORIES, getToolsByCategory } from "@/lib/toolsCatalog";
import { computeToolXp, getToolLevelInfo } from "@/lib/gamification";

export default function Achievements() {
  const { user, isLoading: loadingUser } = useCurrentUser();

  const { data: allActivities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => db.entities.Activity.list("-created_date", 200),
    enabled: !!user,
  });

  const xpMap = useMemo(() => computeToolXp(allActivities, user?.email), [allActivities, user]);
  const totalXp = useMemo(() => Object.values(xpMap).reduce((sum, xp) => sum + xp, 0), [xpMap]);
  const startedCount = Object.keys(xpMap).length;

  if (isLoading || loadingUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Award className="w-6 h-6 text-primary" /> Conquistas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Suba de nível em cada ferramenta concluindo atividades vinculadas a ela
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
            <Award className="w-10 h-10" />
          </div>
          <div className="text-center sm:text-left flex-1">
            <p className="text-sm font-medium opacity-80">Seu XP Total</p>
            <p className="text-4xl font-bold mt-1">{totalXp}</p>
            <p className="text-sm opacity-70 mt-1">
              {startedCount} de {TOOLS.length} ferramentas em progresso
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-center bg-white/10 rounded-xl p-3 min-w-[80px]">
              <Star className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{startedCount}</p>
              <p className="text-xs opacity-70">Badges</p>
            </div>
            <div className="text-center bg-white/10 rounded-xl p-3 min-w-[80px]">
              <Trophy className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{TOOLS.length}</p>
              <p className="text-xs opacity-70">Total</p>
            </div>
          </div>
        </div>
      </motion.div>

      {TOOL_CATEGORIES.map((category) => {
        const tools = getToolsByCategory(category.id).map((tool) => ({
          ...tool,
          ...getToolLevelInfo(xpMap[tool.id] || 0),
        }));

        return (
          <div key={category.id}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {category.label}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tools.map((tool) => (
                <ToolBadgeCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
