import React from "react";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function FlowNode({ label, name, avatarUrl, initials, isLast, isCurrent }) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className={`flex flex-col items-center gap-1 ${isCurrent ? "opacity-100" : "opacity-70"}`}>
        <Avatar className={`w-8 h-8 ring-2 ${isCurrent ? "ring-primary" : "ring-border"}`}>
          {avatarUrl && <img src={avatarUrl} className="w-full h-full object-cover rounded-full" alt="" />}
          <AvatarFallback className={`text-[10px] font-bold ${isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="text-[10px] font-semibold max-w-[60px] truncate">{name}</p>
          <p className={`text-[9px] ${isCurrent ? "text-primary font-bold" : "text-muted-foreground"}`}>{label}</p>
        </div>
      </div>
      {!isLast && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-[-12px]" />}
    </div>
  );
}

function getInitials(name, email) {
  return name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : (email?.[0] || "?").toUpperCase();
}

export default function ActivityFlowPanel({ activities, users }) {
  // Only show activities that were assigned to someone other than creator, or have verification flow
  const flowActivities = activities.filter(
    (a) => (a.assigned_to && a.created_by && a.assigned_to !== a.created_by) ||
            a.verification_requested_from
  );

  if (flowActivities.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5 text-center text-muted-foreground">
        <p className="text-sm">Nenhum fluxo entre pessoas ainda.</p>
        <p className="text-xs mt-1">Atividades atribuídas a outras pessoas aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Fluxo de Atividades
      </h3>
      <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
        {flowActivities.map((a) => {
          const creatorUser = users?.find((u) => u.email === a.created_by);
          const assignedUser = users?.find((u) => u.email === a.assigned_to);
          const verifierUser = users?.find((u) => u.email === a.verification_requested_from);

          const nodes = [];

          // Creator
          if (a.created_by) {
            nodes.push({
              key: "creator",
              label: "Criou",
              name: creatorUser?.full_name || a.created_by?.split("@")[0] || "?",
              avatarUrl: creatorUser?.avatar_url,
              initials: getInitials(creatorUser?.full_name, a.created_by),
              isCurrent: a.status === "pendente",
            });
          }

          // Assigned
          if (a.assigned_to && a.assigned_to !== a.created_by) {
            nodes.push({
              key: "assigned",
              label: "Responsável",
              name: assignedUser?.full_name || a.assigned_to_name || a.assigned_to?.split("@")[0] || "?",
              avatarUrl: assignedUser?.avatar_url,
              initials: getInitials(assignedUser?.full_name || a.assigned_to_name, a.assigned_to),
              isCurrent: a.status === "em_progresso",
            });
          }

          // Verifier
          if (a.verification_requested_from) {
            nodes.push({
              key: "verifier",
              label: "Verifica",
              name: verifierUser?.full_name || a.verification_requested_from_name || a.verification_requested_from?.split("@")[0] || "?",
              avatarUrl: verifierUser?.avatar_url,
              initials: getInitials(verifierUser?.full_name || a.verification_requested_from_name, a.verification_requested_from),
              isCurrent: a.status === "concluida" && !(a.verified_by_owner && a.verified_by_requester),
            });
          }

          const statusColor = {
            pendente: "text-amber-600 bg-amber-50",
            em_progresso: "text-primary bg-primary/10",
            concluida: "text-green-600 bg-green-50",
            cancelada: "text-muted-foreground bg-muted",
          }[a.status] || "text-muted-foreground bg-muted";

          return (
            <div key={a.id} className="border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold leading-tight flex-1 truncate">{a.title}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${statusColor}`}>
                  {a.status === "pendente" ? "Pendente" : a.status === "em_progresso" ? "Em progresso" : a.status === "concluida" ? "Concluída" : "Cancelada"}
                </span>
              </div>
              <div className="flex items-start gap-1 flex-wrap">
                {nodes.map((node, i) => (
                  <FlowNode
                    key={node.key}
                    {...node}
                    isLast={i === nodes.length - 1}
                  />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {nodes.length} pessoa{nodes.length !== 1 ? "s" : ""} no fluxo
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}