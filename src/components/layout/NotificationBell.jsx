import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { db } from "@/services/dataService";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { AnimatePresence, motion } from "framer-motion";
import { format, parseISO } from "date-fns";

const STORAGE_KEY = "produtivo_seen_notifications";

function getSeenIds() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function markSeen(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function buildNotifications(activities, userEmail) {
  const myActivities = activities.filter(
    (a) => a.assigned_to === userEmail || a.created_by === userEmail
  );

  const notifs = [];
  const now = Date.now();

  myActivities.forEach((a) => {
    if (!a.due_date || a.status === "concluida" || a.status === "cancelada") {
      // Nova (criada nas últimas 24h) — sem prazo não bloqueia esse check
      const created = new Date(a.created_date);
      const diffH = (now - created.getTime()) / 3600000;
      if (diffH <= 24) {
        notifs.push({
          id: `new_${a.id}`,
          type: "new",
          title: "Nova atividade atribuída",
          body: a.title,
          date: a.created_date,
          activityId: a.id,
        });
      }
      return;
    }

    const dueMs = parseISO(a.due_date + "T23:59:59").getTime();
    const diffDays = (dueMs - now) / 86400000;

    // Atrasada
    if (diffDays < 0) {
      notifs.push({
        id: `late_${a.id}`,
        type: "late",
        title: "Atividade atrasada",
        body: a.title,
        date: a.due_date,
        activityId: a.id,
      });
    }
    // Vence hoje
    else if (diffDays < 1) {
      notifs.push({
        id: `due_today_${a.id}`,
        type: "due_today",
        title: "Vence hoje!",
        body: a.title,
        date: a.due_date,
        activityId: a.id,
      });
    }
    // Vence em até 3 dias
    else if (diffDays <= 3) {
      const days = Math.ceil(diffDays);
      notifs.push({
        id: `due_soon_${a.id}`,
        type: "due_soon",
        title: `Prazo em ${days} dia${days > 1 ? "s" : ""}`,
        body: a.title,
        date: a.due_date,
        activityId: a.id,
        daysLeft: days,
      });
    }

    // Nova (criada nas últimas 24h)
    const created = new Date(a.created_date);
    const diffH = (now - created.getTime()) / 3600000;
    if (diffH <= 24) {
      notifs.push({
        id: `new_${a.id}`,
        type: "new",
        title: "Nova atividade atribuída",
        body: a.title,
        date: a.created_date,
        activityId: a.id,
      });
    }
  });

  // Most recent first
  return notifs.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default function NotificationBell() {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState(getSeenIds);
  const panelRef = useRef(null);

  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: () => db.entities.Activity.list("-created_date", 200),
    enabled: !!user,
    refetchInterval: 60000, // refresh every minute
  });

  const notifications = buildNotifications(activities, user?.email);
  const unread = notifications.filter((n) => !seenIds.includes(n.id));


  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) {
      const allIds = notifications.map((n) => n.id);
      setSeenIds(allIds);
      markSeen(allIds);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-secondary transition-colors shadow-sm"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-semibold text-sm">Notificações</span>
              {notifications.length > 0 && (
                <span className="text-xs text-muted-foreground">{notifications.length} total</span>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 flex gap-3 items-start ${!seenIds.includes(n.id) ? "bg-primary/5" : ""}`}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base
                      ${n.type === "late" ? "bg-destructive/10 text-destructive"
                        : n.type === "due_today" ? "bg-orange-100 text-orange-600"
                        : n.type === "due_soon" ? "bg-amber-100 text-amber-600"
                        : "bg-primary/10 text-primary"}`}>
                      {n.type === "late" ? "⚠️" : n.type === "due_today" ? "🔔" : n.type === "due_soon" ? "⏰" : "🆕"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{n.body}</p>
                      {n.date && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {n.type === "late"
                            ? `Prazo vencido: ${format(parseISO(n.date + "T00:00:00"), "dd/MM/yyyy")}`
                            : n.type === "due_today"
                            ? `Vence hoje: ${format(parseISO(n.date + "T00:00:00"), "dd/MM/yyyy")}`
                            : n.type === "due_soon"
                            ? `Prazo: ${format(parseISO(n.date + "T00:00:00"), "dd/MM/yyyy")}`
                            : `Criada ${format(new Date(n.date), "dd/MM/yyyy HH:mm")}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
