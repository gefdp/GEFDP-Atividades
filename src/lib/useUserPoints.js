import { useQuery } from "@tanstack/react-query";
import { db } from "@/services/dataService";

// Returns { myPoints, isLeader, leaderEmail }
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

  const completed = allActivities.filter((a) => a.status === "concluida");

  // Compute points per user
  const pointsMap = {};
  completed.forEach((a) => {
    const email = a.assigned_to || a.created_by;
    if (email) pointsMap[email] = (pointsMap[email] || 0) + (a.points || 10);
  });

  const myPoints = pointsMap[userEmail] || 0;

  // Leader = user with most points
  const leaderEmail = Object.entries(pointsMap).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const isLeader = !!leaderEmail && leaderEmail === userEmail && myPoints > 0;

  return { myPoints, isLeader, leaderEmail };
}
