import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Clock, MoreVertical, Pencil, Play, Trash2 } from "lucide-react";
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
import { getToolById, getToolBadgeUrl } from "@/lib/toolsCatalog";
import { getDifficultyOption, getPriorityOption } from "@/lib/activityScoring";

const categoryLabels = {
  trabalho: "Trabalho",
  estudo: "Estudo",
  exercicio: "Exercício",
  pessoal: "Pessoal",
  projeto: "Projeto",
  outro: "Outro",
};

const STATUS_ORDER = ["pendente", "em_progresso", "concluida"];

export default function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onStatusChange,
  isDeveloper,
  onComplete,
  currentUser,
  users,
  onUpdate,
  onSelect,
  isSelected,
  collaborators = [],
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isDone = activity.status === "concluida";
  const currentIdx = STATUS_ORDER.indexOf(activity.status);
  const canAdvance = currentIdx < STATUS_ORDER.length - 1;
  const canGoBack = currentIdx > 0;
  const isFullyVerified = activity.verified_by_owner && activity.verified_by_requester;
  const priority = getPriorityOption(activity.priority);
  const difficulty = activity.difficulty ? getDifficultyOption(activity.difficulty) : null;

  const isOwnActivity =
    currentUser?.email === activity.assigned_to ||
    currentUser?.email === activity.created_by;
  const canManage = isDeveloper || isOwnActivity;

  // Build collaborators list for display
  const displayCollaborators = collaborators.length > 0
    ? collaborators
    : [
        activity.assigned_to
          ? {
              email: activity.assigned_to,
              name: activity.assigned_to_name || activity.assigned_to,
              avatar_url: users?.find((u) => u.email === activity.assigned_to)?.avatar_url,
              primary: true,
            }
          : null,
        activity.created_by && activity.created_by !== activity.assigned_to
          ? {
              email: activity.created_by,
              name:
                users?.find((u) => u.email === activity.created_by)?.full_name ||
                activity.created_by.split("@")[0],
              avatar_url: users?.find((u) => u.email === activity.created_by)?.avatar_url,
              primary: false,
            }
          : null,
      ].filter(Boolean);

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
            <Badge variant="secondary" className={`text-xs ${priority.className}`}>
              {priority.label}
            </Badge>
            {difficulty && (
              <Badge variant="secondary" className={`text-xs ${difficulty.className}`}>
                {difficulty.label}
              </Badge>
            )}
            {activity.due_date && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(activity.due_date + "T00:00:00"), "dd MMM", { locale: ptBR })}
              </span>
            )}
            <span className="text-xs font-bold text-primary">+{activity.points || 10}pts</span>
            {(activity.tools || []).map((toolId) => {
              const tool = getToolById(toolId);
              if (!tool) return null;
              return (
                <img
                  key={toolId}
                  src={getToolBadgeUrl(tool)}
                  alt={tool.name}
                  title={tool.name}
                  className="w-4 h-4 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              );
            })}
            {activity.mood_emoji && <span className="text-base" title="Humor ao concluir">{activity.mood_emoji}</span>}
            {isFullyVerified && <span className="text-xs text-green-600 font-semibold">Verificada</span>}
            <button
              onClick={(e) => { e.stopPropagation(); setDetailsOpen((o) => !o); }}
              className="ml-auto p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
              title={detailsOpen ? "Recolher detalhes" : "Expandir detalhes"}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${detailsOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {displayCollaborators.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {displayCollaborators.map((c) => {
                const initials = c.name
                  ? c.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                  : "?";
                return (
                  <div key={c.email} className="flex items-center gap-1" title={c.name}>
                    <Avatar className={`w-6 h-6 ring-1 ${c.primary ? "ring-primary/50" : "ring-border"}`}>
                      <AvatarImage src={c.avatar_url} className="object-cover" />
                      <AvatarFallback className={`text-[9px] font-bold ${c.primary ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] text-muted-foreground">{c.name?.split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
          )}

          {detailsOpen && onUpdate && (
            <ActivityAttachments
              activity={activity}
              currentUser={currentUser}
              users={users}
              onUpdate={(data) => onUpdate(activity.id, data)}
            />
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
            {canManage && activity.status !== "concluida" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(activity)}>
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
              </>
            )}
            {canManage && (
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
