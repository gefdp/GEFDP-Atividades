import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Crown, Sparkles, Trophy, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { playWinnerSound } from "@/lib/useSounds";

const CONFETTI_COLORS = ["#f59e0b", "#facc15", "#22c55e", "#38bdf8"];

function getInitials(name) {
  return name
    ? name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()
    : "?";
}

export default function LeaderModal({ celebration, onClose }) {
  const [frameError, setFrameError] = useState(false);

  useEffect(() => {
    if (!celebration) return;
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
      particleCount: 130,
      spread: 115,
      startVelocity: 52,
      origin: { y: 0.45 },
      colors: CONFETTI_COLORS,
    });

    const end = Date.now() + 1600;
    (function frame() {
      confetti({ particleCount: 5, angle: 62, spread: 70, startVelocity: 42, origin: { x: 0, y: 0.65 }, colors: CONFETTI_COLORS });
      confetti({ particleCount: 5, angle: 118, spread: 70, startVelocity: 42, origin: { x: 1, y: 0.65 }, colors: CONFETTI_COLORS });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [celebration]);

  if (!celebration) return null;

  const { user, points } = celebration;
  const initials = getInitials(user?.full_name);

  return (
    <AnimatePresence>
      <motion.div
        key={celebration.id}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-amber-300/70 bg-card text-center shadow-2xl"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400" />

          <button
            onClick={onClose}
            className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="px-7 pb-7 pt-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Novo líder
              <Sparkles className="h-3.5 w-3.5" />
            </p>

            <motion.h2
              className="mt-2 text-3xl font-extrabold tracking-tight text-foreground"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
            >
              Você assumiu o topo!
            </motion.h2>

            <motion.div
              className="relative mx-auto mt-6 h-44 w-44"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
            >
              <Avatar className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-[50%] shadow-xl ring-4 ring-amber-300">
                <AvatarImage src={user?.avatar_url} className="object-cover" />
                <AvatarFallback className="bg-amber-100 text-xl font-bold text-amber-700">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {!frameError ? (
                <img
                  src={`${import.meta.env.BASE_URL}frames/lider.png`}
                  alt=""
                  onError={() => setFrameError(true)}
                  className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-auto w-56 max-w-none -translate-x-1/2 -translate-y-[58%]"
                />
              ) : (
                <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full bg-amber-400 p-2 text-white shadow-lg">
                  <Crown className="h-7 w-7" />
                </div>
              )}
            </motion.div>

            <div className="mt-4 flex items-center justify-center gap-2 text-amber-600">
              <Trophy className="h-5 w-5" />
              <span className="text-2xl font-extrabold">{points}</span>
              <span className="text-sm font-semibold text-muted-foreground">pts</span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {user?.full_name || "Você"} está em 1º lugar no ranking.
            </p>

            <Button onClick={onClose} className="mt-6 h-11 w-full font-medium">
              Continuar
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
