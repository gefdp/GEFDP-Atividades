import React from "react";
import { motion } from "framer-motion";

const MOODS = [
  { emoji: "🔥", label: "Incrível" },
  { emoji: "😊", label: "Bem" },
  { emoji: "😐", label: "Ok" },
  { emoji: "😓", label: "Difícil" },
  { emoji: "😩", label: "Exaustivo" },
];

export default function MoodPicker({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Como foi essa atividade?</p>
      <div className="flex gap-2">
        {MOODS.map((m) => (
          <motion.button
            key={m.emoji}
            type="button"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onChange(value === m.emoji ? "" : m.emoji)}
            title={m.label}
            className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all border-2 ${
              value === m.emoji
                ? "border-primary bg-primary/10 shadow-md"
                : "border-transparent bg-muted hover:border-border"
            }`}
          >
            {m.emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );
}