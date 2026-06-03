import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, MoreVertical, Pencil, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import ActivityAttachments from "./ActivityAttachments";

const categoryLabels = {
  trabalho: "Trabalho",
  estudo: "Estudo",
  exercicio: "Exercício",
  pessoal: "Pessoal",
  projeto: "Projeto",
  outro: "Outro",
};

const priorityConfig = {
  baixa: "bg-green-100 text-green-700",
  media: "bg-amber-100 text-amber-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};

const STATUS_ORDER = ["pendente", "em_progresso", "concluida"];

export default function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onStatusChange,
  isAdmin,
  onComplete,
  currentUser,
  users,
  onUpdate,
  onSelect,
  isSelected,
}) {
  const isDone = activity.status === "concluida";
  const currentIdx = STATUS_ORDER.indexOf(activity.status);
  const canAdvance = currentIdx < STATUS_ORDER.length - 1;
  const canGoBack = currentIdx > 0;
  const isFullyVerified = activity.verified_by_owner && activity.verified_by_requester;

  const assignedUser = users?.find((u) => u.email === activity.assigned_to);
  const assignedInitials = activity.assigned_to_name
    ? activity.assigned_to_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : activity.assigned_to?.[0]?.toUpperCase() || "?";

  const creatorUser = users?.find((u) => u.email === activity.created_by);
  const creatorName = creatorUser?.full_name || activity.created_by?.split("@")[0] || "";
  const creatorInitials = creatorName
    ? creatorName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  const showCreator = activity.created_by && activity.created_by !== activity.assigned_to;

  const advanceStatus = () => {
    if (!canAdvance) return;
    const nextStatus = STATUS_ORDER[currentIdx + 1];
    if (nextStatus === "concluida" && onComplete) onComplete(activity);
    else onStatusChange(activity, nextStatus);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={() => onSelect && onSelect(isSelected ? null : activity)}
      className={`bg-card rounded-2xl border p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${isDone ? "opacity-70" : ""} ${
        isSelected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(event) => {
            event.stopPropagation();
            advanceStatus();
          }}
          className="mt-0.5 shrink-0"
          disabled={isDone}
          title={canAdvance ? "Avançar status" : "Concluída"}
        >
          {activity.status === "concluida" ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : activity.status === "em_progresso" ? (
            <Play className="w-5 h-5 text-primary" />
          ) : (
            <Clock className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}>
            {activity.title}
          </p>

          {activity.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">{categoryLabels[activity.category] || activity.category}</Badge>
            <Badge variant="secondary" className={`text-xs ${priorityConfig[activity.priority] || ""}`}>
              {activity.priority}
            </Badge>
            {activity.due_date && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(activity.due_date + "T00:00:00"), "dd MMM", { locale: ptBR })}
              </span>
            )}
            <span className="text-xs font-bold text-primary ml-auto">+{activity.points || 10}pts</span>
            {activity.mood_emoji && <span className="text-base" title="Humor ao concluir">{activity.mood_emoji}</span>}
            {isFullyVerified && <span className="text-xs text-green-600 font-semibold">Verificada</span>}
          </div>

          <ActivityAttachments
            activity={activity}
            currentUser={currentUser}
            users={users}
            onUpdate={onUpdate ? (data) => onUpdate(activity.id, data) : undefined}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {showCreator && (
            <div className="flex flex-col items-center gap-1" title={`Criado por: ${creatorName}`}>
              <Avatar className="w-12 h-12 ring-2 ring-border shadow-sm">
                <AvatarImage src={creatorUser?.avatar_url} className="object-cover" />
                <AvatarFallback className="text-sm bg-muted text-muted-foreground font-bold">
                  {creatorInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground max-w-[56px] truncate text-center leading-tight">
                {creatorName.split(" ")[0]}
              </span>
            </div>
          )}

          {activity.assigned_to && (
            <div className="flex flex-col items-center gap-1" title={`Responsável: ${activity.assigned_to_name || activity.assigned_to}`}>
              <Avatar className="w-14 h-14 ring-2 ring-primary/40 shadow-md">
                <AvatarImage src={assignedUser?.avatar_url} className="object-cover" />
                <AvatarFallback className="text-base bg-primary/10 text-primary font-bold">
                  {assignedInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-medium text-muted-foreground max-w-[60px] truncate text-center leading-tight">
                {activity.assigned_to_name?.split(" ")[0] || activity.assigned_to.split("@")[0]}
              </span>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={(event) => event.stopPropagation()}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canAdvance && (
              <DropdownMenuItem onClick={advanceStatus}>
                <ArrowRight className="w-4 h-4 mr-2" /> Avançar Status
              </DropdownMenuItem>
            )}
            {canGoBack && (
              <DropdownMenuItem onClick={() => onStatusChange(activity, STATUS_ORDER[currentIdx - 1])}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Retroceder Status
              </DropdownMenuItem>
            )}
            {isAdmin && activity.status !== "concluida" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(activity)}>
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
              </>
            )}
            {isAdmin && (
              <DropdownMenuItem onClick={() => onDelete(activity)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
