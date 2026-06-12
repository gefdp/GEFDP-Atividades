import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/services/dataService";

// Returns { myPoints, isLeader, leaderEmail, leaderPoints, leaderUser, rankingTop3 }
export function useUserPoints(userEmail) {
  const { data: allActivities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: () => db.entities.Activity.list("-created_date", 500),
    enabled: !!userEmail,
    staleTime: 1000 * 30,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => db.entities.User.list(),
    enabled: !!userEmail,
    staleTime: 1000 * 60,
  });

  const completed = useMemo(() => allActivities.filter((a) => a.status === "concluida"), [allActivities]);

  // Compute points per user
  const pointsMap = useMemo(() => {
    const map = {};
    completed.forEach((a) => {
      const email = a.assigned_to || a.created_by;
      if (email) map[email] = (map[email] || 0) + (a.points || 10);
    });
    return map;
  }, [completed]);

  const myPoints = pointsMap[userEmail] || 0;

  const rankingTop3 = useMemo(
    () =>
      Object.entries(pointsMap)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([email, points], index) => {
          const profile = users.find((item) => item.email === email);
          return {
            position: index + 1,
            points,
            user: profile || { email, full_name: email.split("@")[0] },
          };
        }),
    [pointsMap, users]
  );

  // Leader = user with most points
  const leaderEntry = rankingTop3[0] || null;
  const leaderEmail = leaderEntry?.user?.email || null;
  const leaderPoints = leaderEntry?.points || 0;
  const leaderUser = leaderEntry?.user || null;
  const isLeader = !!leaderEmail && leaderEmail === userEmail && myPoints > 0;

  return { myPoints, isLeader, leaderEmail, leaderPoints, leaderUser, rankingTop3 };
}
