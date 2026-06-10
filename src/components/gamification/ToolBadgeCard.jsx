import React, { useState } from "react";
import { Award } from "lucide-react";
import { motion } from "framer-motion";
import { getToolBadgeUrl } from "@/lib/toolsCatalog";
import { XP_PER_LEVEL } from "@/lib/gamification";

const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

export default function ToolBadgeCard({ tool }) {
  const { name, level, progressPercent, xp, xpInLevel, tier } = tool;
  const [imgError, setImgError] = useState(false);
  const started = xp > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-card border border-border rounded-2xl p-4 flex flex-col items-center text-center transition-opacity ${
        started ? "" : "opacity-50"
      }`}
    >
      <div className="relative w-24 h-24 flex items-center justify-center">
        {!imgError ? (
          <img
            src={getToolBadgeUrl(tool)}
            alt={name}
            className={`w-full h-full object-contain ${started ? "" : "grayscale opacity-60"}`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`w-20 h-20 flex items-center justify-center bg-muted ring-2 ${
              started ? tier.ring : "ring-border"
            }`}
            style={{ clipPath: HEX_CLIP }}
          >
            <Award className={`w-8 h-8 ${started ? tier.color : "text-muted-foreground"}`} />
          </div>
        )}
      </div>

      <p className="mt-3 text-xs font-bold uppercase tracking-wide truncate max-w-full">{name}</p>
      <div className="flex items-center gap-1.5">
        <p className={`text-sm font-extrabold ${started ? tier.color : "text-muted-foreground"}`}>
          Nível {level}
        </p>
        <span className="text-[10px] text-muted-foreground font-semibold">• {xp} pts</span>
      </div>

      <div className="w-full mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${started ? tier.bar : "bg-muted-foreground/30"}`}
        />
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">{xpInLevel}/{XP_PER_LEVEL} XP</p>
    </motion.div>
  );
}
