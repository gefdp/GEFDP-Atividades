import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AnimatePresence, motion } from "framer-motion";
const STATUS_DOT = {
  concluida: "bg-green-500",
  em_progresso: "bg-primary",
  pendente: "bg-amber-400",
  cancelada: "bg-muted-foreground",
};

const STATUS_LABEL = {
  concluida: "Concluída",
  em_progresso: "Em progresso",
  pendente: "Pendente",
  cancelada: "Cancelada",
};

const STATUS_BADGE = {
  concluida: "bg-green-100 text-green-700",
  em_progresso: "bg-primary/10 text-primary",
  pendente: "bg-amber-100 text-amber-700",
  cancelada: "bg-muted text-muted-foreground",
};

const categoryLabels = {
  trabalho: "Trabalho", estudo: "Estudo", exercicio: "Exercício",
  pessoal: "Pessoal", projeto: "Projeto", outro: "Outro",
};

export default function ActivityCalendar({ activities, events = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startOffset = (getDay(monthStart) + 6) % 7;

  const getActivitiesForDay = (day) =>
    activities.filter((a) => a.due_date && isSameDay(new Date(a.due_date + "T00:00:00"), day));

  const selectedDayActivities = selectedDay ? getActivitiesForDay(selectedDay) : [];

  const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const handleDayClick = (day) => {
    if (selectedDay && isSameDay(day, selectedDay)) {
      setSelectedDay(null);
    } else {
      setSelectedDay(day);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Calendário</h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold capitalize px-1 min-w-[120px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7">
          {weekdays.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map((day) => {
            const dayActivities = getActivitiesForDay(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const hasCompleted = dayActivities.some((a) => a.status === "concluida");
            const hasInProgress = dayActivities.some((a) => a.status === "em_progresso");
            const hasPending = dayActivities.some((a) => a.status === "pendente");

            const bgClass = isSelected
              ? "bg-primary text-primary-foreground"
              : dayActivities.length === 0
              ? "hover:bg-muted/50"
              : hasCompleted
              ? "bg-green-100 hover:bg-green-200"
              : hasInProgress
              ? "bg-primary/10 hover:bg-primary/20"
              : hasPending
              ? "bg-amber-50 hover:bg-amber-100"
              : "hover:bg-muted/50";

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`relative flex flex-col items-center rounded-xl p-1 min-h-[48px] transition-all cursor-pointer ${bgClass} ${isToday && !isSelected ? "ring-2 ring-primary ring-offset-1" : ""}`}
              >
                <span className={`text-xs font-semibold ${isSelected ? "text-primary-foreground" : isToday ? "text-primary" : "text-foreground"}`}>
                  {format(day, "d")}
                </span>
                {dayActivities.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                    {dayActivities.slice(0, 3).map((a) => (
                      <div
                        key={a.id}
                        className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground/70" : STATUS_DOT[a.status] || "bg-muted"}`}
                      />
                    ))}
                    {dayActivities.length > 3 && (
                      <span className={`text-[9px] leading-none ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        +{dayActivities.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-3 border-t border-border">
          {[
            { status: "concluida", label: "Concluída" },
            { status: "em_progresso", label: "Em progresso" },
            { status: "pendente", label: "Pendente" },
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
              {label}
            </div>
          ))}
        </div>

        {/* Activities for selected day */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {isSameDay(selectedDay, new Date()) ? "Hoje" : format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {selectedDayActivities.length} atividade{selectedDayActivities.length !== 1 ? "s" : ""}
                    </span>
                  </p>
                  <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedDayActivities.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">Nenhuma atividade neste dia</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedDayActivities.map((a) => {
                      const assignedInitials = a.assigned_to_name
                        ? a.assigned_to_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                        : a.assigned_to?.[0]?.toUpperCase() || "?";
                      return (
                        <div key={a.id} className="flex items-start gap-3 bg-muted/40 rounded-xl p-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${STATUS_DOT[a.status]}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{a.title}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[a.status]}`}>
                                {STATUS_LABEL[a.status]}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{categoryLabels[a.category]}</span>
                              <span className="text-[10px] font-bold text-primary">+{a.points || 10}pts</span>
                            </div>
                          </div>
                          {a.assigned_to && (
                            <Avatar className="w-6 h-6 shrink-0">
                              <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                                {assignedInitials}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}