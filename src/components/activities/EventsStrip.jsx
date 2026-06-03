import React, { useState } from "react";
import { format, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, MapPin, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EventsStrip({ events, currentMonth }) {
  const [idx, setIdx] = useState(0);

  const monthEvents = events.filter(
    (e) => e.date && isSameMonth(new Date(e.date + "T00:00:00"), currentMonth)
  );

  if (monthEvents.length === 0) return null;

  const event = monthEvents[idx];
  const total = monthEvents.length;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
      {/* Photo full-width */}
      <div className="relative h-36 bg-gradient-to-br from-primary/20 to-accent/20">
        {event.photo_url ? (
          <img
            src={event.photo_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🎉</div>
        )}
        {/* Navigation arrows */}
        {total > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + total) % total)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % total)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
        {/* Counter badge */}
        {total > 1 && (
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {idx + 1}/{total}
          </div>
        )}
        {/* Label */}
        <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
          <CalendarDays className="w-3 h-3" />
          Eventos do Mês
        </div>
      </div>

      {/* Info below */}
      <AnimatePresence mode="wait">
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="px-4 py-3"
        >
          <p className="font-semibold text-sm leading-tight">{event.title}</p>
          {event.location_name && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{event.location_name}</span>
            </div>
          )}
          <p className="text-xs text-primary font-medium mt-1">
            {format(new Date(event.date + "T00:00:00"), "dd 'de' MMM", { locale: ptBR })}
          </p>
          {/* Dots indicator */}
          {total > 1 && (
            <div className="flex gap-1 mt-2">
              {monthEvents.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-primary w-4" : "bg-muted w-1.5"}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}