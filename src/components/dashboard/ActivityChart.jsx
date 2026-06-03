import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ActivityChart({ activities }) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    const completed = activities.filter(
      (a) => a.status === "concluida" && a.completed_date && format(new Date(a.completed_date), "yyyy-MM-dd") === dateStr
    ).length;
    const created = activities.filter(
      (a) => format(new Date(a.created_date), "yyyy-MM-dd") === dateStr
    ).length;
    return {
      name: format(date, "EEE", { locale: ptBR }),
      concluidas: completed,
      criadas: created,
    };
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">
        Atividades — Últimos 7 dias
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={last7Days}>
            <defs>
              <linearGradient id="colorConcluidas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCriadas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 13%, 90%)",
                borderRadius: "12px",
                fontSize: "13px",
              }}
            />
            <Area
              type="monotone"
              dataKey="concluidas"
              stroke="hsl(243, 75%, 59%)"
              strokeWidth={2.5}
              fill="url(#colorConcluidas)"
              name="Concluídas"
            />
            <Area
              type="monotone"
              dataKey="criadas"
              stroke="hsl(38, 92%, 50%)"
              strokeWidth={2.5}
              fill="url(#colorCriadas)"
              name="Criadas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}