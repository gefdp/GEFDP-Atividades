import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useUserPoints } from "@/lib/useUserPoints";

const LOCAL_STORAGE_PREFIX = "gefdp_leader_celebration_";
const VIEWED_STORAGE_PREFIX = "gefdp_leader_alert_viewed_";
const ALERT_FRESHNESS_MS = 2 * 60 * 1000;
const POLL_INTERVAL_MS = 15000;

function loadLeaderState(userEmail) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + userEmail);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLeaderState(userEmail, state) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + userEmail, JSON.stringify(state));
  } catch {
    // Segue sem persistencia se o navegador bloquear localStorage.
  }
}

function getViewedAlertId(userEmail) {
  try {
    return localStorage.getItem(VIEWED_STORAGE_PREFIX + userEmail);
  } catch {
    return null;
  }
}

function saveViewedAlertId(userEmail, alertId) {
  try {
    localStorage.setItem(VIEWED_STORAGE_PREFIX + userEmail, alertId);
  } catch {
    // O alerta ainda pode aparecer; apenas não fica marcado como visto.
  }
}

function isMissingLeaderAlertTable(error) {
  const message = error?.message || "";
  return error?.code === "42P01" || message.includes("leader_alerts") || message.includes("does not exist");
}

function normalizeLeaderAlert(row) {
  if (!row) return null;

  return {
    id: row.id,
    created_at: row.created_at,
    message: row.message || "",
    points: row.points || 0,
    user: {
      id: row.leader_user_id,
      email: row.leader_email,
      full_name: row.leader_name || row.leader_email,
      avatar_url: row.leader_avatar_url || null,
      leader_music_url: row.leader_music_url || null,
    },
  };
}

function isFreshAlert(alert) {
  if (!alert?.created_at) return true;
  const createdAt = new Date(alert.created_at).getTime();
  if (Number.isNaN(createdAt)) return false;
  return Date.now() - createdAt <= ALERT_FRESHNESS_MS;
}

function makeLocalLeaderAlert(user, points) {
  return {
    id: `local-leader-${user.email}-${Date.now()}`,
    created_at: new Date().toISOString(),
    message: user.leader_message || "",
    points,
    user,
  };
}

function makeCurrentLeaderAlert(leaderUser, points, podium = []) {
  return {
    id: `current-leader-${leaderUser.email}-${points}`,
    created_at: new Date().toISOString(),
    message: leaderUser.leader_message || "",
    points,
    user: leaderUser,
    podium,
    mode: "entry",
  };
}

export function useLeaderCelebration() {
  const { user } = useCurrentUser();
  const { myPoints, isLeader, leaderEmail, leaderPoints, leaderUser, rankingTop3 } = useUserPoints(user?.email);
  const [current, setCurrent] = useState(null);
  const [sharedAlertsAvailable, setSharedAlertsAvailable] = useState(true);
  const lastCelebratedRef = useRef(null);
  const shownOnEntryRef = useRef(null);

  const showAlert = useCallback(
    (alert, options = {}) => {
      if (!user?.email || !alert?.id) return;
      if (!options.force && !isFreshAlert(alert)) return;
      if (!options.ignoreViewed && getViewedAlertId(user.email) === alert.id) return;

      const alertWithPodium = alert.podium?.length ? alert : { ...alert, podium: rankingTop3 };
      saveViewedAlertId(user.email, alert.id);
      setCurrent(alertWithPodium);
    },
    [rankingTop3, user?.email]
  );

  useEffect(() => {
    if (!user?.email || !leaderEmail || !leaderUser || leaderPoints <= 0) return;

    const entryToken = `${user.email}:${leaderEmail}`;
    if (shownOnEntryRef.current === entryToken) return;

    shownOnEntryRef.current = entryToken;
    showAlert(makeCurrentLeaderAlert(leaderUser, leaderPoints, rankingTop3), {
      force: true,
      ignoreViewed: true,
    });
  }, [showAlert, user?.email, leaderEmail, leaderUser, leaderPoints, rankingTop3]);

  useEffect(() => {
    if (!user?.email) return undefined;

    let active = true;

    const fetchLatestAlert = async () => {
      const { data, error } = await supabase
        .from("leader_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active) return;

      if (error) {
        if (isMissingLeaderAlertTable(error)) {
          setSharedAlertsAvailable(false);
        }
        return;
      }

      setSharedAlertsAvailable(true);
      showAlert(normalizeLeaderAlert(data));
    };

    fetchLatestAlert();

    const channel = supabase
      .channel("leader-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leader_alerts" },
        (payload) => {
          setSharedAlertsAvailable(true);
          showAlert(normalizeLeaderAlert(payload.new), { force: true });
        }
      )
      .subscribe();

    const intervalId = window.setInterval(fetchLatestAlert, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [showAlert, user?.email]);

  useEffect(() => {
    if (sharedAlertsAvailable || !user?.email || !leaderEmail) return;

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
        showAlert(makeLocalLeaderAlert(user, myPoints), { force: true });
      }
      return;
    }

    if (state.celebratedLeaderEmail === user.email || state.lastLeaderEmail !== leaderEmail) {
      saveLeaderState(user.email, {
        lastLeaderEmail: leaderEmail,
        celebratedLeaderEmail: state.celebratedLeaderEmail === user.email ? null : state.celebratedLeaderEmail,
      });
    }
  }, [sharedAlertsAvailable, showAlert, user, myPoints, isLeader, leaderEmail]);

  const dismiss = useCallback(() => setCurrent(null), []);

  return { current, dismiss };
}
