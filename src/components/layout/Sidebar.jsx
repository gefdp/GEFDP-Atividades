import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  KeyRound,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatePresence, motion } from "framer-motion";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useUserPoints } from "@/lib/useUserPoints";
import { db } from "@/services/dataService";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";

const userNavItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Atividades", path: "/atividades", icon: ListTodo },
  { label: "Produtividade", path: "/produtividade", icon: TrendingUp },
  { label: "Recompensas", path: "/recompensas", icon: Trophy },
  { label: "Eventos", path: "/eventos", icon: CalendarDays },
];

const adminNavItems = [
  ...userNavItems,
  { label: "Relatório da Equipe", path: "/relatorio", icon: BarChart3 },
];

const roleLabels = {
  developer: "Desenvolvedor",
  admin: "Administrador",
  user: "Usuário",
};

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const { user, isAdmin, isAccessManager } = useCurrentUser();
  const { logout } = useAuth();
  const { myPoints, isLeader } = useUserPoints(user?.email);
  const navItems = isAccessManager
    ? [...adminNavItems, { label: "Acessos", path: "/acessos", icon: KeyRound }]
    : isAdmin
      ? adminNavItems
      : userNavItems;

  const { data: rewards = [] } = useQuery({
    queryKey: ["rewards"],
    queryFn: () => db.entities.Reward.list("points_required", 20),
    staleTime: 1000 * 60,
    enabled: !!user,
  });

  const topRewards = rewards
    .map((reward) => ({
      ...reward,
      pct: reward.points_required ? Math.min(100, Math.round((myPoints / reward.points_required) * 100)) : 0,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((name) => name[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const nav = (
    <nav className="flex h-full min-h-0 flex-col p-3">
      <div className="flex items-center gap-3 px-2 py-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight truncate">Atividades</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 border-t border-border pt-3 space-y-3 shrink-0">
        <Link to="/perfil" onClick={() => setMobileOpen(false)} className="block group">
          <div className="flex flex-col items-center gap-2 rounded-lg px-2 py-2 hover:bg-secondary/60 transition-colors">
            <div className="relative">
              {isLeader && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl drop-shadow z-10" aria-label="Líder">
                  👑
                </span>
              )}
              <Avatar className="w-20 h-20 ring-2 ring-border group-hover:ring-primary transition-all duration-200 shadow-lg">
                <AvatarImage src={user?.avatar_url} className="object-cover" />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="text-center min-w-0">
              <p className="text-sm font-bold truncate max-w-[150px]">{user?.full_name || "Usuário"}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                {user?.job_title || roleLabels[user?.role] || "Usuário"}
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5">
              <span className={`text-2xl font-extrabold leading-none ${isLeader ? "text-amber-500" : "text-primary"}`}>
                {myPoints}
              </span>
              <span className="text-xs text-muted-foreground font-medium">pts</span>
              {isLeader && (
                <span className="text-[10px] font-semibold text-amber-700 uppercase bg-amber-100 px-1.5 py-0.5 rounded-full">
                  Líder
                </span>
              )}
            </div>
          </div>
        </Link>

        {topRewards.length > 0 && (
          <div className="px-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
              Conquistas
            </p>
            <div className="grid grid-cols-3 gap-2">
              {topRewards.map((reward) => {
                const unlocked = reward.pct >= 100;
                const near = reward.pct >= 60;
                return (
                  <div key={reward.id} className="min-w-0">
                    <div
                      className={`h-10 rounded-lg flex items-center justify-center text-lg ${
                        unlocked
                          ? "bg-amber-100 ring-2 ring-amber-400"
                          : near
                            ? "bg-primary/10 ring-1 ring-primary/30"
                            : "bg-muted ring-1 ring-border"
                      }`}
                    >
                      {reward.icon || "🏆"}
                    </div>
                    <p
                      title={reward.title}
                      className={`mt-1 text-[9px] text-center leading-tight font-medium truncate ${
                        unlocked ? "text-amber-600" : near ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {reward.title}
                    </p>
                    <div className="mt-1 h-1 rounded-full bg-border overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          unlocked ? "bg-amber-400" : near ? "bg-primary" : "bg-muted-foreground/40"
                        }`}
                        style={{ width: `${reward.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 h-screen bg-card border-r border-border fixed left-0 top-0 z-30">
        {nav}
      </aside>

      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl shadow-lg bg-card"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 w-60 h-full bg-card border-r border-border z-50 lg:hidden flex flex-col"
            >
              <div className="absolute top-4 right-4 z-10">
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {nav}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
