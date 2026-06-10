import React, { useState } from "react";
import { db } from "@/services/dataService";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, Target, Zap, Calendar } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["hsl(243, 75%, 59%)", "hsl(38, 92%, 50%)", "hsl(160, 60%, 45%)", "hsl(340, 75%, 55%)", "hsl(200, 70%, 50%)", "hsl(280, 65%, 60%)"];

const categoryLabels = {
  trabalho: "Trabalho", estudo: "Estudo", exercicio: "Exercício",
  pessoal: "Pessoal", projeto: "Projeto", outro: "Outro",
};

function getInitials(name, email) {
  return name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : (email?.[0] || "?").toUpperCase();
}

export default function Productivity() {
  const { user, isAdmin } = useCurrentUser();
  const [selectedEmail, setSelectedEmail] = useState(null); // null = todos (admin) ou próprio (user)

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

  // Determina email alvo
  const targetEmail = isAdmin ? selectedEmail : user?.email;
  const selectedUser = isAdmin && selectedEmail
    ? users.find((u) => u.email === selectedEmail)
    : (!isAdmin ? user : null);

  // Filtra atividades conforme seleção
  const activities = (() => {
    if (!isAdmin) {
      return allActivities.filter(
        (a) => a.assigned_to === user?.email || a.created_by === user?.email
      );
    }
    if (!selectedEmail) return allActivities; // admin sem filtro = visão geral
    return allActivities.filter(
      (a) => a.assigned_to === selectedEmail || a.created_by === selectedEmail
    );
  })();

  const completed = activities.filter((a) => a.status === "concluida");
  const thisWeekCompleted = completed.filter((a) => {
    if (!a.completed_date) return false;
    const d = new Date(a.completed_date);
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    return d >= start && d <= end;
  });

  const avgPointsPerDay = (() => {
    if (completed.length === 0) return 0;
    const days = new Set(completed.map((a) => a.completed_date?.split("T")[0]).filter(Boolean));
    const totalPts = completed.reduce((s, a) => s + (a.points || 10), 0);
    return days.size > 0 ? Math.round(totalPts / days.size) : 0;
  })();

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayCompleted = completed.filter(
      (a) => a.completed_date && a.completed_date.startsWith(dateStr)
    );
    return {
      name: format(date, "EEE", { locale: ptBR }),
      pontos: dayCompleted.reduce((s, a) => s + (a.points || 10), 0),
      atividades: dayCompleted.length,
    };
  });

  const categoryData = Object.entries(
    completed.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([key, value]) => ({ name: categoryLabels[key] || key, value }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtividade</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin ? "Métricas detalhadas por membro ou equipe" : "Seu desempenho e evolução"}
          </p>
        </div>

        {/* Seletor de usuário — apenas admin */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Select value={selectedEmail || "__all__"} onValueChange={(v) => setSelectedEmail(v === "__all__" ? null : v)}>
              <SelectTrigger className="w-56 rounded-xl">
                <SelectValue>
                  {selectedEmail ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={selectedUser?.avatar_url} />
                        <AvatarFallback className="text-[9px]">{getInitials(selectedUser?.full_name, selectedEmail)}</AvatarFallback>
                      </Avatar>
                      <span>{selectedUser?.full_name || selectedEmail}</span>
                    </div>
                  ) : (
                    <span>Toda a equipe</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">
                  <span className="font-medium">Toda a equipe</span>
                </SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.email} value={u.email}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={u.avatar_url} />
                        <AvatarFallback className="text-[9px]">{getInitials(u.full_name, u.email)}</AvatarFallback>
                      </Avatar>
                      {u.full_name || u.email}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Banner do usuário selecionado */}
      {isAdmin && selectedUser && (
        <div className="flex items-center gap-4 bg-card rounded-2xl border border-border p-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={selectedUser.avatar_url} />
            <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
              {getInitials(selectedUser.full_name, selectedUser.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-lg">{selectedUser.full_name || selectedUser.email}</p>
            <p className="text-sm text-muted-foreground">
              {selectedUser.job_title || (selectedUser.role === "admin" ? "Administrador" : "Membro da equipe")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Esta Semana" value={thisWeekCompleted.length} subtitle="atividades concluídas" icon={Calendar} color="bg-primary/10 text-primary" />
        <StatCard title="Pontos da Semana" value={thisWeekCompleted.reduce((s, a) => s + (a.points || 10), 0)} subtitle="pontos ganhos" icon={Zap} color="bg-amber-100 text-amber-600" />
        <StatCard title="Média por Dia" value={avgPointsPerDay} subtitle="pontos/dia" icon={TrendingUp} color="bg-green-100 text-green-600" />
        <StatCard title="Melhor Categoria" value={categoryData.length > 0 ? [...categoryData].sort((a, b) => b.value - a.value)[0].name : "—"} subtitle="mais produtiva" icon={Target} color="bg-purple-100 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            Pontos por Dia — últimos 7 dias
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <Tooltip contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,90%)", borderRadius: "12px", fontSize: "13px" }} />
                <Bar dataKey="pontos" fill="hsl(243, 75%, 59%)" radius={[8, 8, 0, 0]} name="Pontos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">Por Categoria</h3>
          {categoryData.length > 0 ? (
            <div className="h-72 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center">
                {categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-16">Nenhuma atividade concluída</p>
          )}
        </div>
      </div>

    </div>
  );
}