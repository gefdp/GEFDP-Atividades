import React from "react";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence } from "framer-motion";
import ActivityCard from "./ActivityCard";

function groupByDate(activities) {
  const groups = {};
  const withDate = activities.filter((a) => a.due_date);
  const withoutDate = activities.filter((a) => !a.due_date);

  withDate.forEach((a) => {
    const key = a.due_date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });

  // Sort keys ascending
  const sorted = Object.keys(groups).sort((a, b) => (a < b ? -1 : 1));
  return { sorted, groups, withoutDate };
}

function dateLabel(dateStr) {
  const d = parseISO(dateStr + "T00:00:00");
  if (isToday(d)) return "Hoje";
  if (isTomorrow(d)) return "Amanhã";
  const past = isPast(d) && !isToday(d);
  return (past ? "⚠ " : "") + format(d, "dd 'de' MMMM", { locale: ptBR });
}

function dateLabelClass(dateStr) {
  const d = parseISO(dateStr + "T00:00:00");
  if (isToday(d)) return "text-primary font-bold";
  if (isPast(d)) return "text-destructive font-semibold";
  return "text-muted-foreground font-semibold";
}

export default function ActivityTimeline({ activities, isAdmin, onEdit, onDelete, onStatusChange, onComplete, currentUser, users, onUpdate, onSelect, selectedActivityId }) {
  const { sorted, groups, withoutDate } = groupByDate(activities);

  if (activities.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">Nenhuma atividade encontrada</p>
        <p className="text-sm mt-1">
          {isAdmin ? "Crie e atribua atividades para sua equipe!" : "Você ainda não tem atividades atribuídas."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {sorted.map((dateKey) => (
          <div key={dateKey}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs uppercase tracking-wider ${dateLabelClass(dateKey)}`}>
                {dateLabel(dateKey)}
              </span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">{groups[dateKey].length} atividade{groups[dateKey].length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2 pl-2 border-l-2 border-border">
              {groups[dateKey].map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isAdmin={isAdmin}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                  onComplete={onComplete}
                  currentUser={currentUser}
                  users={users}
                  onUpdate={onUpdate}
                  onSelect={onSelect}
                  isSelected={selectedActivityId === activity.id}
                  />
                  ))}
                  </div>
                  </div>
                  ))}
                  {withoutDate.length > 0 && (
                  <div>
                  <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Sem data</span>
                  <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="space-y-2 pl-2 border-l-2 border-border">
                  {withoutDate.map((activity) => (
                  <ActivityCard
                   key={activity.id}
                   activity={activity}
                   isAdmin={isAdmin}
                   onEdit={onEdit}
                   onDelete={onDelete}
                   onStatusChange={onStatusChange}
                   onComplete={onComplete}
                   currentUser={currentUser}
                   users={users}
                   onUpdate={onUpdate}
                   onSelect={onSelect}
                   isSelected={selectedActivityId === activity.id}
                  />
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
