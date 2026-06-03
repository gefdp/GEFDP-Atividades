import React from "react";
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function getInitials(name, email) {
  return name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : (email?.[0] || "?").toUpperCase();
}

const STATUS_LABEL = {
  pendente: "Pendente",
  em_progresso: "Em progresso",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const STATUS_COLOR = {
  pendente: "text-amber-600 bg-amber-50",
  em_progresso: "text-primary bg-primary/10",
  concluida: "text-green-600 bg-green-50",
  cancelada: "text-muted-foreground bg-muted",
};

export default function ActivityFlowDetail({ activity, users, onClose }) {
  const open = !!activity;

  const creatorUser = users?.find((u) => u.email === activity?.created_by);
  const assignedUser = users?.find((u) => u.email === activity?.assigned_to);
  const verifierUser = users?.find((u) => u.email === activity?.verification_requested_from);

  const nodes = [];

  if (activity?.created_by) {
    nodes.push({
      key: "creator",
      label: "Criou",
      name: creatorUser?.full_name || activity.created_by?.split("@")[0] || "?",
      avatarUrl: creatorUser?.avatar_url,
      initials: getInitials(creatorUser?.full_name, activity.created_by),
      isCurrent: activity.status === "pendente",
    });
  }

  if (activity?.assigned_to && activity.assigned_to !== activity.created_by) {
    nodes.push({
      key: "assigned",
      label: "Responsável",
      name: assignedUser?.full_name || activity.assigned_to_name || activity.assigned_to?.split("@")[0] || "?",
      avatarUrl: assignedUser?.avatar_url,
      initials: getInitials(assignedUser?.full_name || activity.assigned_to_name, activity.assigned_to),
      isCurrent: activity.status === "em_progresso",
    });
  }

  if (activity?.verification_requested_from) {
    nodes.push({
      key: "verifier",
      label: "Verifica",
      name: verifierUser?.full_name || activity.verification_requested_from_name || activity.verification_requested_from?.split("@")[0] || "?",
      avatarUrl: verifierUser?.avatar_url,
      initials: getInitials(verifierUser?.full_name || activity.verification_requested_from_name, activity.verification_requested_from),
      isCurrent: activity.status === "concluida" && !(activity.verified_by_owner && activity.verified_by_requester),
    });
  }

  const statusColor = STATUS_COLOR[activity?.status] || "text-muted-foreground bg-muted";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Fluxo da Atividade</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-tight flex-1">{activity?.title}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>
              {STATUS_LABEL[activity?.status] || activity?.status}
            </span>
          </div>

          {nodes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Atividade sem fluxo entre pessoas.</p>
          ) : (
            <div className="flex items-start gap-2 flex-wrap pt-1">
              {nodes.map((node, i) => (
                <div key={node.key} className="flex items-center gap-2 flex-shrink-0">
                  <div className={`flex flex-col items-center gap-1 ${node.isCurrent ? "opacity-100" : "opacity-60"}`}>
                    <Avatar className={`w-12 h-12 ring-2 ${node.isCurrent ? "ring-primary" : "ring-border"}`}>
                      {node.avatarUrl && <img src={node.avatarUrl} className="w-full h-full object-cover rounded-full" alt="" />}
                      <AvatarFallback className={`text-sm font-bold ${node.isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {node.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="text-[11px] font-semibold max-w-[70px] truncate">{node.name}</p>
                      <p className={`text-[10px] ${node.isCurrent ? "text-primary font-bold" : "text-muted-foreground"}`}>{node.label}</p>
                    </div>
                  </div>
                  {i < nodes.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mb-4" />}
                </div>
              ))}
            </div>
          )}

          {activity?.verified_by_owner && activity?.verified_by_requester && (
            <p className="text-xs text-green-600 font-semibold">✅ Atividade totalmente verificada</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}