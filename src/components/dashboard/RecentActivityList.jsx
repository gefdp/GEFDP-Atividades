import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, Play, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPriorityOption } from "@/lib/activityScoring";

const statusConfig = {
  pendente: { icon: Clock, label: "Pendente", class: "bg-muted text-muted-foreground" },
  em_progresso: { icon: Play, label: "Em Progresso", class: "bg-primary/10 text-primary" },
  concluida: { icon: CheckCircle2, label: "Concluída", class: "bg-green-100 text-green-700" },
  cancelada: { icon: XCircle, label: "Cancelada", class: "bg-destructive/10 text-destructive" },
};

const categoryLabels = {
  trabalho: "Trabalho",
  estudo: "Estudo",
  exercicio: "Exercício",
  pessoal: "Pessoal",
  projeto: "Projeto",
  outro: "Outro",
};

export default function RecentActivityList({ activities }) {
  const recent = activities.slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Atividades Recentes
        </h3>
        <p className="text-muted-foreground text-sm text-center py-8">Nenhuma atividade ainda.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Atividades Recentes
      </h3>
      <div className="space-y-3">
        {recent.map((activity) => {
          const status = statusConfig[activity.status] || statusConfig.pendente;
          const StatusIcon = status.icon;
          const priority = getPriorityOption(activity.priority);
          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
            >
              <div className={`p-2 rounded-lg ${status.class}`}>
                <StatusIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground">
                  {categoryLabels[activity.category] || activity.category} • {format(new Date(activity.created_date), "dd MMM", { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`text-xs ${priority.className}`}>
                  {priority.label}
                </Badge>
                <span className="text-xs font-semibold text-primary">+{activity.points || 10}pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
