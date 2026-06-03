import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRIORITY_COLOR = {
  urgente: { bg: "bg-red-500", label: "text-white", legend: "bg-red-500", legendLabel: "Urgente" },
  alta:    { bg: "bg-orange-400", label: "text-white", legend: "bg-orange-400", legendLabel: "Alta" },
  media:   { bg: "bg-amber-300", label: "text-foreground", legend: "bg-amber-300", legendLabel: "Média" },
  baixa:   { bg: "bg-green-400", label: "text-white", legend: "bg-green-400", legendLabel: "Baixa" },
};

function getDominantPriority(acts) {
  const order = ["urgente", "alta", "media", "baixa"];
  for (const p of order) {
    if (acts.some((a) => a.priority === p)) return p;
  }
  return null;
}

export default function MonthlyHeatmap({ activities }) {
  const [month, setMonth] = useState(new Date());

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = (getDay(monthStart) + 6) % 7;
  const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const getActsForDay = (day) =>
    activities.filter((a) => a.due_date && isSameDay(new Date(a.due_date + "T00:00:00"), day));

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Calendário por Dificuldade</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonth(subMonths(month, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold capitalize min-w-[110px] text-center">
            {format(month, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7">
        {weekdays.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
        {days.map((day) => {
          const acts = getActsForDay(day);
          const isToday = isSameDay(day, new Date());
          const dominant = getDominantPriority(acts);
          const colorCfg = dominant ? PRIORITY_COLOR[dominant] : null;

          return (
            <div
              key={day.toISOString()}
              title={acts.length > 0 ? `${acts.length} atividade(s) — ${dominant}` : ""}
              className={`relative flex flex-col items-center rounded-xl p-1 min-h-[44px] transition-all
                ${colorCfg ? colorCfg.bg : "hover:bg-muted/50"}
                ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}
              `}
            >
              <span className={`text-xs font-semibold ${colorCfg ? colorCfg.label : "text-foreground"} ${isToday && !colorCfg ? "text-primary" : ""}`}>
                {format(day, "d")}
              </span>
              {acts.length > 0 && (
                <span className={`text-[9px] font-bold mt-0.5 ${colorCfg ? colorCfg.label : "text-muted-foreground"}`}>
                  {acts.length}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
        {Object.values(PRIORITY_COLOR).map(({ legend, legendLabel }) => (
          <div key={legendLabel} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={`w-3 h-3 rounded ${legend}`} />
            {legendLabel}
          </div>
        ))}
      </div>
    </div>
  );
}