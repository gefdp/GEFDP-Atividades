import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentUser } from "@/lib/useCurrentUser";

export const MAX_PRIZE_ALERT_USES = 3;

const PRIZE_ALERT_EVENT = "gefdp:prize-alert";
const VIEWED_STORAGE_PREFIX = "gefdp_prize_alert_viewed_";
const ALERT_FRESHNESS_MS = 2 * 60 * 1000;
const POLL_INTERVAL_MS = 15000;

function isMissingPrizeFeature(error) {
  const message = error?.message || "";
  return (
    error?.code === "42P01" ||
    error?.code === "42883" ||
    error?.code === "PGRST202" ||
    message.includes("prize_alerts") ||
    message.includes("create_prize_alert") ||
    message.includes("does not exist")
  );
}

function getFriendlyPrizeError(error) {
  if (isMissingPrizeFeature(error)) {
    return "Rode o SQL supabase/add-prize-alerts.sql no Supabase antes de usar o prêmio.";
  }
  return error?.message || "Não foi possível ativar o prêmio.";
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
    // O alerta ainda aparece; apenas não fica marcado como visto.
  }
}

function isFreshAlert(alert) {
  if (!alert?.created_at) return true;
  const createdAt = new Date(alert.created_at).getTime();
  if (Number.isNaN(createdAt)) return false;
  return Date.now() - createdAt <= ALERT_FRESHNESS_MS;
}

function normalizePrizeAlert(row) {
  if (!row) return null;

  return {
    id: row.id,
    created_at: row.created_at,
    message: row.message || "",
    uses_remaining: row.uses_remaining ?? 0,
    user: {
      id: row.sender_user_id,
      email: row.sender_email,
      full_name: row.sender_name || row.sender_email,
      avatar_url: row.sender_avatar_url || null,
      leader_music_url: row.sender_music_url || null,
    },
  };
}

export function usePrizeAlertTrigger() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const usageQuery = useQuery({
    queryKey: ["prize-alert-usage", user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("prize_alerts")
        .select("id", { count: "exact", head: true })
        .eq("sender_user_id", user.id);

      if (error) {
        if (isMissingPrizeFeature(error)) return { used: 0, available: false };
        throw error;
      }

      return { used: count || 0, available: true };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("create_prize_alert");
      if (error) throw new Error(getFriendlyPrizeError(error));

      window.dispatchEvent(new CustomEvent(PRIZE_ALERT_EVENT, { detail: data }));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prize-alert-usage", user?.id] });
    },
  });

  const used = usageQuery.data?.used || 0;
  const isAvailable = usageQuery.data?.available !== false;
  const remaining = isAvailable ? Math.max(0, MAX_PRIZE_ALERT_USES - used) : 0;

  return {
    remaining,
    used,
    isAvailable,
    isLoading: usageQuery.isLoading,
    isSending: createMutation.isPending,
    triggerPrizeAlert: createMutation.mutateAsync,
  };
}

export function usePrizeAlertCelebration() {
  const { user } = useCurrentUser();
  const [current, setCurrent] = useState(null);

  const showAlert = useCallback(
    (alert, options = {}) => {
      if (!user?.email || !alert?.id) return;
      if (!options.force && !isFreshAlert(alert)) return;
      if (getViewedAlertId(user.email) === alert.id) return;

      saveViewedAlertId(user.email, alert.id);
      setCurrent(alert);
    },
    [user?.email]
  );

  useEffect(() => {
    if (!user?.email) return undefined;

    let active = true;

    const fetchLatestAlert = async () => {
      const { data, error } = await supabase
        .from("prize_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!active || error) return;
      showAlert(normalizePrizeAlert(data));
    };

    const handleLocalAlert = (event) => {
      showAlert(normalizePrizeAlert(event.detail), { force: true });
    };

    fetchLatestAlert();
    window.addEventListener(PRIZE_ALERT_EVENT, handleLocalAlert);

    const channel = supabase
      .channel("prize-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "prize_alerts" },
        (payload) => showAlert(normalizePrizeAlert(payload.new), { force: true })
      )
      .subscribe();

    const intervalId = window.setInterval(fetchLatestAlert, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.removeEventListener(PRIZE_ALERT_EVENT, handleLocalAlert);
      window.clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [showAlert, user?.email]);

  const dismiss = useCallback(() => setCurrent(null), []);

  return { current, dismiss };
}
