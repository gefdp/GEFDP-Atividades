import { useEffect, useRef, useState } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useUserPoints } from "@/lib/useUserPoints";

const STORAGE_PREFIX = "gefdp_leader_celebration_";

function loadLeaderState(userEmail) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userEmail);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLeaderState(userEmail, state) {
  try {
    localStorage.setItem(STORAGE_PREFIX + userEmail, JSON.stringify(state));
  } catch {
    // Segue sem persistencia se o navegador bloquear localStorage.
  }
}

export function useLeaderCelebration() {
  const { user } = useCurrentUser();
  const { myPoints, isLeader, leaderEmail } = useUserPoints(user?.email);
  const [current, setCurrent] = useState(null);
  const lastCelebratedRef = useRef(null);

  useEffect(() => {
    if (!user?.email || !leaderEmail) return;

    const state = loadLeaderState(user.email);
    const celebrationToken = `${user.email}:${leaderEmail}`;

    if (isLeader && myPoints > 0) {
      const alreadyCelebrated = state.celebratedLeaderEmail === user.email;
      const alreadyCelebratedThisSession = lastCelebratedRef.current === celebrationToken;

      if (!alreadyCelebrated && !alreadyCelebratedThisSession) {
        lastCelebratedRef.current = celebrationToken;
        saveLeaderState(user.email, {
          lastLeaderEmail: leaderEmail,
          celebratedLeaderEmail: user.email,
        });
        setCurrent({
          id: `leader-${user.email}-${Date.now()}`,
          user,
          points: myPoints,
        });
      }
      return;
    }

    if (state.celebratedLeaderEmail === user.email || state.lastLeaderEmail !== leaderEmail) {
      saveLeaderState(user.email, {
        lastLeaderEmail: leaderEmail,
        celebratedLeaderEmail: state.celebratedLeaderEmail === user.email ? null : state.celebratedLeaderEmail,
      });
    }
  }, [user, myPoints, isLeader, leaderEmail]);

  const dismiss = () => setCurrent(null);

  return { current, dismiss };
}
