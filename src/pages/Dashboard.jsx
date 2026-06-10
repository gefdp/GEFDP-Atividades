import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { db } from "@/services/dataService";
import { useQuery } from "@tanstack/react-query";
import { ListTodo, CheckCircle2, Trophy, Flame, Award, ChevronRight } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import ActivityChart from "../components/dashboard/ActivityChart";
import RecentActivityList from "../components/dashboard/RecentActivityList";
import ToolBadgeCard from "../components/gamification/ToolBadgeCard";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { computeToolXp, getRankedTools } from "@/lib/gamification";

export default function Dashboard() {
  const { user, isAdmin, isLoading: loadingUser } = useCurrentUser();
  const [memberFilter, setMemberFilter] = useState("all");

  const { data: allActivities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => db.entities.Activity.list("-created_date", 200),
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => db.entities.User.list(),
    enabled: isAdmin,
  });

  // Para não-admins, extrai membros únicos das atividades visíveis
  const usersFromActivities = useMemo(() => {
    if (isAdmin) return [];
    const map = {};
    if (user) map[user.email] = { email: user.email, full_name: user.full_name, avatar_url: user.avatar_url };
    allActivities.forEach((a) => {
      if (a.assigned_to && !map[a.assigned_to]) {
        map[a.assigned_to] = { email: a.assigned_to, full_name: a.assigned_to_name || a.assigned_to };
      }
    });
    return Object.values(map);
  }, [allActivities, isAdmin, user]);

  const filterUsers = isAdmin ? users : usersFromActivities;

  // Filtra por membro selecionado
  const activities = memberFilter !== "all"
    ? allActivities.filter((a) => a.assigned_to === memberFilter || a.created_by === memberFilter)
    : isAdmin
      ? allActivities
      : allActivities.filter((a) => a.assigned_to === user?.email || a.created_by === user?.email);

  const totalActivities = activities.length;
  const completed = activities.filter((a) => a.status === "concluida").length;
  const totalPoints = activities
    .filter((a) => a.status === "concluida")
    .reduce((sum, a) => sum + (a.points || 10), 0);

  const toolXpMap = useMemo(() => computeToolXp(allActivities, user?.email), [allActivities, user]);
  const startedToolsCount = Object.keys(toolXpMap).length;
  const topTools = useMemo(() => getRankedTools(toolXpMap).slice(0, 3), [toolXpMap]);

  const streakDays = (() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const hasCompleted = activities.some(
        (a) =>
          a.status === "concluida" &&
          a.completed_date &&
          a.completed_date.startsWith(dateStr)
      );
      if (hasCompleted) streak++;
      else break;
    }
    return streak;
  })();

  if (isLoading || loadingUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {user?.full_name?.split(" ")[0] || "bem-vindo"} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin
              ? "Visão geral de toda a equipe"
              : "Suas atividades e produtividade"}
          </p>
        </div>
        {filterUsers.length > 0 && (
          <Select value={memberFilter} onValueChange={setMemberFilter}>
            <SelectTrigger className="w-52 rounded-xl">
              <SelectValue placeholder="Filtrar por membro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda a equipe</SelectItem>
              {filterUsers.map((u) => {
                const initials = u.full_name
                  ? u.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                  : u.email[0].toUpperCase();
                return (
                  <SelectItem key={u.email} value={u.email}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5 shrink-0">
                        <AvatarImage src={u.avatar_url} />
                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                      </Avatar>
                      {u.full_name || u.email}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Atividades"
          value={totalActivities}
          subtitle={`${completed} concluídas`}
          icon={ListTodo}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          title="Taxa de Conclusão"
          value={totalActivities > 0 ? `${Math.round((completed / totalActivities) * 100)}%` : "0%"}
          subtitle="das atividades"
          icon={CheckCircle2}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Pontos Totais"
          value={totalPoints}
          subtitle={`${startedToolsCount} insígnias em progresso`}
          icon={Trophy}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="Sequência"
          value={`${streakDays} dias`}
          subtitle="dias consecutivos"
          icon={Flame}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ActivityChart activities={activities} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivityList activities={activities} />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" /> Suas Insígnias
          </h3>
          <Link to="/conquistas" className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
            Ver todas <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {topTools.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl">
            {topTools.map((tool) => (
              <ToolBadgeCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Vincule ferramentas às suas atividades para começar a evoluir suas insígnias!
          </p>
        )}
      </div>
    </div>
  );
}