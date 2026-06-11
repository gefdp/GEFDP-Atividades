import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Award, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getToolBadgeUrl } from "@/lib/toolsCatalog";
import { playAchievementSound } from "@/lib/useSounds";

const CONFETTI_COLORS = ["#a855f7", "#facc15", "#22d3ee", "#f472b6"];

export default function AchievementModal({ achievement, onClose }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!achievement) return;
    setImgError(false);
    playAchievementSound();

    confetti({ particleCount: 90, spread: 100, origin: { y: 0.45 }, colors: CONFETTI_COLORS });

    const end = Date.now() + 1200;
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 70, startVelocity: 45, origin: { x: 0, y: 0.6 }, colors: CONFETTI_COLORS });
      confetti({ particleCount: 4, angle: 120, spread: 70, startVelocity: 45, origin: { x: 1, y: 0.6 }, colors: CONFETTI_COLORS });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [achievement]);

  if (!achievement) return null;

  const { name, level, tier, isNewBadge } = achievement;

  return (
    <AnimatePresence>
      <motion.div
        key={`${achievement.id}-${level}`}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0, x: [0, -12, 12, -10, 10, -6, 6, -2, 2, 0] }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative bg-card border border-border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl overflow-hidden"
        >
          <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-30 ${tier.bar}`} />
          <div className={`absolute -bottom-20 -left-20 w-48 h-48 rounded-full blur-3xl opacity-20 ${tier.bar}`} />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-primary flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {isNewBadge ? "Nova insígnia desbloqueada" : "Subiu de nível"}
            <Sparkles className="w-3.5 h-3.5" />
          </p>

          <motion.h2
            className="relative text-3xl font-extrabold tracking-tight mt-1 bg-gradient-to-r from-primary via-fuchsia-500 to-amber-400 bg-clip-text text-transparent"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            Parabéns! 🎉
          </motion.h2>

          <motion.div
            className="relative w-28 h-28 mx-auto my-5"
            animate={{ rotate: [0, -6, 6, -6, 0], y: [0, -4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            {!imgError ? (
              <img
                src={getToolBadgeUrl(achievement)}
                alt={name}
                className="w-full h-full object-contain drop-shadow-lg"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className={`w-full h-full rounded-full flex items-center justify-center bg-muted ring-4 ${tier.ring}`}>
                <Award className={`w-12 h-12 ${tier.color}`} />
              </div>
            )}
          </motion.div>

          <p className="relative font-bold text-lg">{name}</p>
          <p className={`relative text-2xl font-extrabold ${tier.color}`}>Nível {level}</p>

          <Button onClick={onClose} className="relative mt-6 w-full h-11 font-medium">
            Continuar
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
