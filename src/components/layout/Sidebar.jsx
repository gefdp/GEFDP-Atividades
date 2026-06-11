import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Award,
  BarChart3,
  CalendarDays,
  KeyRound,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  TrendingUp,
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
import { computeToolXp, getRankedTools } from "@/lib/gamification";
import MiniToolBadge from "@/components/gamification/MiniToolBadge";
import Logo from "@/components/Logo";

const userNavItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Atividades", path: "/atividades", icon: ListTodo },
  { label: "Produtividade", path: "/produtividade", icon: TrendingUp },
  { label: "Conquistas", path: "/conquistas", icon: Award },
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
  const [frameError, setFrameError] = useState(false);
  const navItems = isAccessManager
    ? [...adminNavItems, { label: "Acessos", path: "/acessos", icon: KeyRound }]
    : isAdmin
      ? adminNavItems
      : userNavItems;

  const { data: allActivities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: () => db.entities.Activity.list("-created_date", 200),
    staleTime: 1000 * 30,
    enabled: !!user,
  });

  const topTools = useMemo(() => {
    const xpMap = computeToolXp(allActivities, user?.email);
    return getRankedTools(xpMap).slice(0, 3);
  }, [allActivities, user]);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((name) => name[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const nav = (
    <nav className="flex h-full min-h-0 flex-col p-3 [@media(max-height:700px)]:p-2">
      <div className="flex items-center gap-3 px-2 py-2 mb-5 [@media(max-height:700px)]:mb-2">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 p-1.5">
          <Logo className="w-full h-full text-primary-foreground" fallback={TrendingUp} />
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 [@media(max-height:700px)]:py-2 ${
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

      <div className="mt-3 border-t border-border pt-3 space-y-3 shrink-0 [@media(max-height:700px)]:mt-2 [@media(max-height:700px)]:space-y-2 [@media(max-height:700px)]:pt-2">
        <Link to="/perfil" onClick={() => setMobileOpen(false)} className="block group">
          <div className="flex flex-col items-center gap-2 rounded-lg px-2 py-2 hover:bg-secondary/60 transition-colors [@media(max-height:700px)]:gap-1.5 [@media(max-height:700px)]:py-1.5">
            <div className="relative">
              {isLeader && frameError && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl drop-shadow z-10 [@media(max-height:620px)]:hidden" aria-label="Líder">
                  👑
                </span>
              )}
              <Avatar
                className={`w-40 h-40 transition-all duration-200 shadow-lg [@media(max-height:760px)]:h-24 [@media(max-height:760px)]:w-24 [@media(max-height:620px)]:hidden ${
                  isLeader && !frameError ? "" : "ring-2 ring-border group-hover:ring-primary"
                }`}
              >
                <AvatarImage src={user?.avatar_url} className="object-cover" />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isLeader && !frameError && (
                <img
                  src={`${import.meta.env.BASE_URL}frames/lider.png`}
                  alt="Líder"
                  onError={() => setFrameError(true)}
                  className="pointer-events-none absolute left-1/2 top-1/2 w-[250px] h-auto max-w-none -translate-x-1/2 -translate-y-[58.5%] z-10 [@media(max-height:760px)]:w-[150px] [@media(max-height:620px)]:hidden"
                />
              )}
            </div>

            <div className="text-center min-w-0">
              <p className="text-sm font-bold truncate max-w-[150px] [@media(max-height:700px)]:text-xs">{user?.full_name || "Usuário"}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[150px] [@media(max-height:700px)]:text-[10px]">
                {user?.job_title || roleLabels[user?.role] || "Usuário"}
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5">
              <span className={`text-2xl font-extrabold leading-none [@media(max-height:700px)]:text-xl ${isLeader ? "text-amber-500" : "text-primary"}`}>
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

        {topTools.length > 0 && (
          <div className="px-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
              Conquistas
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {topTools.map((tool) => (
                <MiniToolBadge key={tool.id} tool={tool} />
              ))}
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
