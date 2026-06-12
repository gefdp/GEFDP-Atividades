import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Crown, Medal, Sparkles, Trophy, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { playWinnerSound } from "@/lib/useSounds";

const CONFETTI_COLORS = ["#f59e0b", "#facc15", "#22c55e", "#38bdf8"];
const AUTO_CLOSE_MS = 16000;

const PODIUM_CONFIG = {
  1: {
    medal: "Ouro",
    ring: "ring-amber-300",
    text: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-500/15",
    bar: "bg-gradient-to-t from-amber-500 to-yellow-300",
    height: "h-24",
  },
  2: {
    medal: "Prata",
    ring: "ring-slate-300",
    text: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-500/15",
    bar: "bg-gradient-to-t from-slate-500 to-slate-200",
    height: "h-16",
  },
  3: {
    medal: "Bronze",
    ring: "ring-orange-300",
    text: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-100 dark:bg-orange-500/15",
    bar: "bg-gradient-to-t from-orange-700 to-orange-300",
    height: "h-12",
  },
};

function getInitials(name) {
  return name
    ? name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()
    : "?";
}

function getDisplayName(user) {
  return user?.full_name || user?.email || "Participante";
}

function PodiumCard({ item }) {
  const [frameError, setFrameError] = useState(false);

  if (!item) return null;

  const config = PODIUM_CONFIG[item.position] || PODIUM_CONFIG[3];
  const isFirst = item.position === 1;
  const displayName = getDisplayName(item.user);
  const initials = getInitials(displayName);

  return (
    <div className={`flex min-w-0 flex-1 flex-col items-center ${isFirst ? "order-1 sm:order-2" : item.position === 2 ? "order-2 sm:order-1" : "order-3"}`}>
      <motion.div
        className={`relative rounded-2xl border bg-card px-3 pb-3 pt-4 shadow-lg ${isFirst ? "w-full border-amber-300" : "w-full border-border"}`}
        animate={isFirst ? { y: [0, -5, 0] } : { y: [0, -2, 0] }}
        transition={{ duration: isFirst ? 1.6 : 1.9, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className={`mx-auto mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${config.bg} ${config.text}`}>
          {isFirst ? <Crown className="h-3.5 w-3.5" /> : <Medal className="h-3.5 w-3.5" />}
          {config.medal}
        </div>

        <div className={`relative mx-auto ${isFirst ? "h-28 w-28" : "h-20 w-20"}`}>
          <Avatar className={`absolute left-1/2 top-1/2 ${isFirst ? "h-24 w-24" : "h-16 w-16"} -translate-x-1/2 -translate-y-1/2 shadow-xl ring-4 ${config.ring}`}>
            <AvatarImage src={item.user?.avatar_url} className="object-cover" />
            <AvatarFallback className={`font-bold ${isFirst ? "text-xl" : "text-base"} ${config.bg} ${config.text}`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          {isFirst && !frameError && (
            <img
              src={`${import.meta.env.BASE_URL}frames/lider.png`}
              alt=""
              onError={() => setFrameError(true)}
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-auto w-44 max-w-none -translate-x-1/2 -translate-y-[58%]"
            />
          )}
          {isFirst && frameError && (
            <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-full bg-amber-400 p-2 text-white shadow-lg">
              <Crown className="h-5 w-5" />
            </div>
          )}
        </div>

        <p className="mt-2 truncate text-sm font-extrabold text-foreground">{displayName}</p>
        <div className={`mt-1 flex items-center justify-center gap-1 ${config.text}`}>
          <Trophy className="h-4 w-4" />
          <span className="text-lg font-extrabold">{item.points}</span>
          <span className="text-xs font-semibold text-muted-foreground">pts</span>
        </div>
      </motion.div>

      <div className={`mt-2 flex w-full max-w-[150px] items-center justify-center rounded-t-xl ${config.bar} ${config.height} shadow-inner`}>
        <span className="text-2xl font-black text-white drop-shadow">{item.position}º</span>
      </div>
    </div>
  );
}

export default function LeaderModal({ celebration, onClose }) {
  useEffect(() => {
    if (!celebration) return undefined;

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
      particleCount: 170,
      spread: 125,
      startVelocity: 52,
      origin: { y: 0.42 },
      colors: CONFETTI_COLORS,
    });

    const end = Date.now() + 1800;
    (function frame() {
      confetti({ particleCount: 5, angle: 62, spread: 70, startVelocity: 42, origin: { x: 0, y: 0.65 }, colors: CONFETTI_COLORS });
      confetti({ particleCount: 5, angle: 118, spread: 70, startVelocity: 42, origin: { x: 1, y: 0.65 }, colors: CONFETTI_COLORS });
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

  const { user, points, message, mode } = celebration || {};
  const displayName = getDisplayName(user);
  const alertMessage = message?.trim() || "Cheguei no topo do ranking!";
  const eyebrow = mode === "entry" ? "Ranking atual" : "Novo ranking";
  const podium = celebration?.podium?.length
    ? celebration.podium
    : [{ position: 1, points: points || 0, user }];
  const orderedPodium = [2, 1, 3].map((position) => podium.find((item) => item.position === position));

  return (
    <AnimatePresence>
      {celebration ? (
        <motion.div
          key={celebration.id}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.76, opacity: 0, y: 28 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-amber-300/70 bg-card text-center text-card-foreground shadow-2xl"
          >
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-slate-300 via-amber-300 to-orange-400" />
            <div className="absolute -left-24 -top-24 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />

            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-20 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative px-5 pb-7 pt-9 sm:px-8">
              <p className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-[0.22em] text-amber-500">
                <Sparkles className="h-4 w-4" />
                {eyebrow}
                <Sparkles className="h-4 w-4" />
              </p>

              <motion.h2
                className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }}
              >
                Pódio da equipe
              </motion.h2>

              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {displayName} lidera com {points} pts
              </p>

              <div className="mx-auto mt-5 max-w-xl rounded-xl border border-amber-200/70 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                <p className="break-words text-base font-semibold leading-relaxed">
                  "{alertMessage}"
                </p>
              </div>

              <div className="mt-7 flex flex-col items-end justify-center gap-3 sm:flex-row sm:gap-4">
                {orderedPodium.map((item, index) => (
                  <PodiumCard key={item?.user?.email || `empty-${index}`} item={item} />
                ))}
              </div>

              <Button onClick={onClose} className="mt-7 h-11 w-full font-medium sm:w-auto sm:min-w-44">
                Continuar
              </Button>
            </div>

            <motion.div
              className="h-1.5 bg-amber-400"
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
