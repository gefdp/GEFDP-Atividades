import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Crown, Sparkles, Trophy, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { playWinnerSound } from "@/lib/useSounds";

const CONFETTI_COLORS = ["#f59e0b", "#facc15", "#22c55e", "#38bdf8"];
const AUTO_CLOSE_MS = 9500;

function getInitials(name) {
  return name
    ? name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()
    : "?";
}

export default function LeaderModal({ celebration, onClose }) {
  const [frameError, setFrameError] = useState(false);

  useEffect(() => {
    if (!celebration) return undefined;
    setFrameError(false);

    const audioUrl = celebration.user?.leader_music_url;
    let audio;
    if (audioUrl) {
      audio = new Audio(audioUrl);
      audio.volume = 0.85;
      audio.play().catch(() => playWinnerSound());
    } else {
      playWinnerSound();
    }

    confetti({
      particleCount: 95,
      spread: 110,
      startVelocity: 48,
      origin: { y: 0.25 },
      colors: CONFETTI_COLORS,
    });

    const end = Date.now() + 1300;
    (function frame() {
      confetti({ particleCount: 4, angle: 70, spread: 60, startVelocity: 38, origin: { x: 0, y: 0.25 }, colors: CONFETTI_COLORS });
      confetti({ particleCount: 4, angle: 110, spread: 60, startVelocity: 38, origin: { x: 1, y: 0.25 }, colors: CONFETTI_COLORS });
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
  }, [celebration, onClose]);

  const { user, points, message } = celebration || {};
  const displayName = user?.full_name || user?.email || "Novo líder";
  const initials = getInitials(displayName);
  const alertMessage = message?.trim() || "Cheguei no topo do ranking!";

  return (
    <AnimatePresence>
      {celebration ? (
        <motion.div
          key={celebration.id}
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
            className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-xl border border-amber-300/70 bg-card/95 text-card-foreground shadow-2xl backdrop-blur"
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400" />

            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-4 p-4 pr-10 sm:p-5 sm:pr-11">
              <motion.div
                className="relative h-20 w-20 shrink-0"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Avatar className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 shadow-lg ring-4 ring-amber-300">
                  <AvatarImage src={user?.avatar_url} className="object-cover" />
                  <AvatarFallback className="bg-amber-100 text-base font-bold text-amber-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {!frameError ? (
                  <img
                    src={`${import.meta.env.BASE_URL}frames/lider.png`}
                    alt=""
                    onError={() => setFrameError(true)}
                    className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-auto w-28 max-w-none -translate-x-1/2 -translate-y-[58%]"
                  />
                ) : (
                  <div className="absolute -right-1 top-0 z-10 rounded-full bg-amber-400 p-1.5 text-white shadow-lg">
                    <Crown className="h-4 w-4" />
                  </div>
                )}
              </motion.div>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-500">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  Novo líder
                </p>
                <h2 className="mt-1 text-xl font-extrabold leading-tight text-foreground">
                  {displayName} assumiu o 1º lugar
                </h2>
                <p className="mt-2 line-clamp-2 break-words text-sm font-medium text-muted-foreground">
                  "{alertMessage}"
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-extrabold">{points}</span>
                  <span className="text-xs font-semibold">pts</span>
                </div>
              </div>
            </div>

            <motion.div
              className="h-1 bg-amber-400"
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
