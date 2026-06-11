import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/services/dataService";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { computeToolXp } from "@/lib/gamification";
import { detectNewAchievements } from "@/lib/achievementTracker";

// Observa as atividades do usuário e enfileira novas insígnias/níveis
// alcançados em ferramentas, para exibição em um popup de celebração.
export function useAchievementCelebration() {
  const { user } = useCurrentUser();
  const [queue, setQueue] = useState([]);

  const { data: allActivities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: () => db.entities.Activity.list("-created_date", 200),
    staleTime: 1000 * 30,
    enabled: !!user,
  });

  useEffect(() => {
    if (!user?.email) return;
    const xpMap = computeToolXp(allActivities, user.email);
    const newAchievements = detectNewAchievements(user.email, xpMap);
    if (newAchievements.length > 0) {
      setQueue((prev) => [...prev, ...newAchievements]);
    }
  }, [allActivities, user]);

  const current = queue[0] || null;
  const dismiss = () => setQueue((prev) => prev.slice(1));

  return { current, dismiss };
}
