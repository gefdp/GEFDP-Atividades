import React from "react";
import { db } from "@/services/dataService";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, ShieldAlert } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

function getInitials(name, email) {
  return name
    ? name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()
    : (email?.[0] || "?").toUpperCase();
}

export default function TeamReport() {
  const { isAdmin, isLoading: loadingUser } = useCurrentUser();

  const { data: allActivities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => db.entities.Activity.list("-created_date", 500),
    enabled: isAdmin,
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => db.entities.User.list("full_name", 500),
    staleTime: 60 * 1000,
    enabled: isAdmin,
  });

  if (loadingUser || isLoading || loadingUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <ShieldAlert className="w-12 h-12 text-destructive opacity-60" />
        <p className="text-lg font-semibold">Acesso restrito</p>
        <p className="text-muted-foreground text-sm">Somente administradores podem ver o relatório da equipe.</p>
      </div>
    );
  }

  const memberStats = users.map((member) => {
    const memberActivities = allActivities.filter(
      (activity) => activity.assigned_to === member.email || activity.created_by === member.email
    );
    const completed = memberActivities.filter((activity) => activity.status === "concluida");
    const inProgress = memberActivities.filter((activity) => activity.status === "em_progresso");
    const pending = memberActivities.filter((activity) => activity.status === "pendente");
    const points = completed.reduce((sum, activity) => sum + (activity.points || 10), 0);
    const rate = memberActivities.length > 0
      ? Math.round((completed.length / memberActivities.length) * 100)
      : 0;

    return {
      ...member,
      total: memberActivities.length,
      completed: completed.length,
      inProgress: inProgress.length,
      pending: pending.length,
      points,
      rate,
    };
  }).sort((a, b) => b.points - a.points);

  const chartData = memberStats.map((member) => ({
    name: member.full_name?.split(" ")[0] || member.email.split("@")[0],
    pontos: member.points,
    concluidas: member.completed,
  }));

  const totalTeamPoints = memberStats.reduce((sum, member) => sum + member.points, 0);
  const totalCompleted = memberStats.reduce((sum, member) => sum + member.completed, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatório da Equipe</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão completa do desempenho de todos os membros</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Membros</p>
          <p className="text-3xl font-bold mt-2">{users.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Atividades concluídas</p>
          <p className="text-3xl font-bold mt-2">{totalCompleted}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pontos da equipe</p>
          <p className="text-3xl font-bold mt-2">{totalTeamPoints}</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">Pontos por membro</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,90%)", borderRadius: "12px", fontSize: "13px" }} />
                <Bar dataKey="pontos" fill="hsl(243, 75%, 59%)" radius={[8, 8, 0, 0]} name="Pontos" />
                <Bar dataKey="concluidas" fill="hsl(38, 92%, 50%)" radius={[8, 8, 0, 0]} name="Concluídas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Membros da equipe</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Membro</th>
                <th className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Pontos</th>
                <th className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Concluídas</th>
                <th className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Em progresso</th>
                <th className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Pendentes</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {memberStats.map((member, index) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.04 }}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                            {getInitials(member.full_name, member.email)}
                          </AvatarFallback>
                        </Avatar>
                        {index === 0 && member.points > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                            <Trophy className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{member.full_name || member.email}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {member.job_title || member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-bold text-primary text-sm">{member.points}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                      {member.completed}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {member.inProgress}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-bold text-sm">
                      {member.pending}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${member.rate}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground w-8">{member.rate}%</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {memberStats.length === 0 && (
            <p className="text-center py-12 text-muted-foreground text-sm">Nenhum membro encontrado</p>
          )}
        </div>
      </div>
    </div>
  );
}
