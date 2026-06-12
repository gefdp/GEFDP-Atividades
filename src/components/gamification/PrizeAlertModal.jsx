import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Gift, Sparkles, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { playAchievementSound } from "@/lib/useSounds";

const CONFETTI_COLORS = ["#f43f5e", "#f59e0b", "#22c55e", "#38bdf8"];
const AUTO_CLOSE_MS = 9000;

function getInitials(name) {
  return name
    ? name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()
    : "?";
}

export default function PrizeAlertModal({ alert, onClose }) {
  useEffect(() => {
    if (!alert) return undefined;

    const audioUrl = alert.user?.leader_music_url;
    let audio;
    if (audioUrl) {
      audio = new Audio(audioUrl);
      audio.volume = 0.85;
      audio.play().catch(() => playAchievementSound());
    } else {
      playAchievementSound();
    }

    confetti({
      particleCount: 100,
      spread: 105,
      startVelocity: 45,
      origin: { y: 0.25 },
      colors: CONFETTI_COLORS,
    });

    const end = Date.now() + 1200;
    (function frame() {
      confetti({ particleCount: 4, angle: 70, spread: 65, startVelocity: 38, origin: { x: 0, y: 0.25 }, colors: CONFETTI_COLORS });
      confetti({ particleCount: 4, angle: 110, spread: 65, startVelocity: 38, origin: { x: 1, y: 0.25 }, colors: CONFETTI_COLORS });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    const closeTimer = window.setTimeout(onClose, AUTO_CLOSE_MS);

    return () => {
      window.clearTimeout(closeTimer);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [alert, onClose]);

  const user = alert?.user;
  const displayName = user?.full_name || user?.email || "Alguém";
  const initials = getInitials(displayName);
  const message = alert?.message?.trim() || "ativou um prêmio especial para todos!";
  const usesLabel = alert?.uses_remaining === 1 ? "uso" : "usos";

  return (
    <AnimatePresence>
      {alert ? (
        <motion.div
          key={alert.id}
          className="pointer-events-none fixed inset-x-0 top-5 z-[110] flex justify-center px-4"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-xl border border-rose-300/70 bg-card/95 text-card-foreground shadow-2xl backdrop-blur"
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400" />

            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-4 p-4 pr-10 sm:p-5 sm:pr-11">
              <motion.div
                className="relative flex h-20 w-20 shrink-0 items-center justify-center"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="absolute inset-0 rounded-full bg-rose-500/15" />
                <Avatar className="h-16 w-16 shadow-lg ring-4 ring-rose-300">
                  <AvatarImage src={user?.avatar_url} className="object-cover" />
                  <AvatarFallback className="bg-rose-100 text-base font-bold text-rose-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -right-1 top-0 rounded-full bg-rose-500 p-1.5 text-white shadow-lg">
                  <Gift className="h-4 w-4" />
                </div>
              </motion.div>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-rose-500">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  Prêmio ativado
                </p>
                <h2 className="mt-1 text-xl font-extrabold leading-tight text-foreground">
                  {displayName} mandou um popup
                </h2>
                <p className="mt-2 line-clamp-2 break-words text-sm font-medium text-muted-foreground">
                  "{message}"
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                  <Gift className="h-4 w-4" />
                  <span className="text-xs font-semibold">
                    Restam {alert.uses_remaining} {usesLabel} para essa pessoa
                  </span>
                </div>
              </div>
            </div>

            <motion.div
              className="h-1 bg-rose-500"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: AUTO_CLOSE_MS / 1000, ease: "linear" }}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
