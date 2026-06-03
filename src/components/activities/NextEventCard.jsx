import React from "react";
import { format, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, CalendarDays } from "lucide-react";

export default function NextEventCard({ events }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = events
    .filter((e) => e.date && !isPast(parseISO(e.date + "T23:59:59")))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const next = upcoming[0];

  if (!next) return null;

  const daysUntil = Math.ceil(
    (parseISO(next.date + "T00:00:00") - today) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20">
        {next.photo_url ? (
          <img src={next.photo_url} alt={next.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🎉</div>
        )}
        <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
          <CalendarDays className="w-3 h-3" />
          Próximo Evento
        </div>
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-full">
          {daysUntil === 0 ? "Hoje!" : daysUntil === 1 ? "Amanhã" : `em ${daysUntil} dias`}
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="font-semibold text-sm">{next.title}</p>
        {next.location_name && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{next.location_name}</span>
          </div>
        )}
        <p className="text-xs text-primary font-medium mt-1">
          {format(parseISO(next.date + "T00:00:00"), "dd 'de' MMMM yyyy", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}