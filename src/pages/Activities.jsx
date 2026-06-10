import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/services/dataService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import ActivityForm from "../components/activities/ActivityForm";
import ActivityTimeline from "../components/activities/ActivityTimeline";
import ActivityCalendar from "../components/activities/ActivityCalendar";
import MoodCompletionDialog from "../components/activities/MoodCompletionDialog";
import NextEventCard from "../components/activities/NextEventCard";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { playPointsSound } from "@/lib/useSounds";

export default function Activities() {
  const [showForm, setShowForm] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [statusFilter, setStatusFilter] = useState("active");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const assigneeInitialized = useRef(false);
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [completingActivity, setCompletingActivity] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAdmin, isDeveloper } = useCurrentUser();

  useEffect(() => {
    if (!assigneeInitialized.current && user?.email && !isAdmin) {
      assigneeInitialized.current = true;
      setAssigneeFilter(user.email);
    }
  }, [user?.email, isAdmin]);

  const { data: allActivities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => db.entities.Activity.list("-due_date", 200),
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => db.entities.User.list("full_name", 500),
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: () => db.entities.Event.list("-date", 100),
    enabled: !!user,
  });

  const effectiveUsers = useMemo(() => {
    const map = {};
    if (user) map[user.email] = { email: user.email, full_name: user.full_name, avatar_url: user.avatar_url };
    users.forEach((u) => {
      map[u.email] = u;
    });
    if (users.length === 0) {
      allActivities.forEach((a) => {
        if (a.assigned_to && !map[a.assigned_to]) {
          map[a.assigned_to] = { email: a.assigned_to, full_name: a.assigned_to_name || a.assigned_to };
        }
      });
    }
    return Object.values(map);
  }, [users, allActivities, user]);

  const visibleActivities = allActivities;

  const handleMutationError = (error, title = "Erro ao salvar atividade") => {
    toast({
      title,
      description: error?.message || "Verifique os campos e tente novamente.",
      variant: "destructive",
    });
  };

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Activity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      setShowForm(false);
      toast({ title: "Atividade criada!" });
    },
    onError: (error) => handleMutationError(error, "Erro ao criar atividade"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Activity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      setShowForm(false);
      setEditActivity(null);
    },
    onError: handleMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Activity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast({ title: "Atividade excluída" });
    },
    onError: (error) => handleMutationError(error, "Erro ao excluir atividade"),
  });

  const buildActivityPayload = (formData) => {
    const payload = {
      ...formData,
      due_date: formData.due_date || null,
      status: formData.status || "pendente",
      points: Number(formData.points || 10),
    };

    if (!payload.assigned_to) {
      payload.assigned_to = user?.email;
      payload.assigned_to_name = user?.full_name || user?.email;
    }

    return payload;
  };

  const handleSubmit = async (formData, collaborators = []) => {
    const data = buildActivityPayload(formData);

    try {
      if (editActivity) {
        await updateMutation.mutateAsync({ id: editActivity.id, data });

        if (collaborators.length > 0) {
          const extras = collaborators.map((c) => ({
            ...data,
            assigned_to: c.email,
            assigned_to_name: c.full_name || c.email,
          }));
          await db.entities.Activity.bulkCreate(extras);
          await queryClient.invalidateQueries({ queryKey: ["activities"] });
          toast({ title: `+${extras.length} colaborador(es) adicionado(s)!` });
        }
        return;
      }

      if (collaborators.length > 0) {
        const all = [
          data,
          ...collaborators.map((c) => ({
            ...data,
            assigned_to: c.email,
            assigned_to_name: c.full_name || c.email,
          })),
        ];
        await db.entities.Activity.bulkCreate(all);
        await queryClient.invalidateQueries({ queryKey: ["activities"] });
        setShowForm(false);
        toast({ title: `${all.length} atividades criadas!` });
        return;
      }

      await createMutation.mutateAsync(data);
    } catch (error) {
      handleMutationError(error);
    }
  };

  const handleStatusChange = (activity, newStatus) => {
    const data = { status: newStatus };
    if (newStatus !== "concluida") data.completed_date = null;
    updateMutation.mutate({ id: activity.id, data });
  };

  const handleUpdate = (id, data) => {
    updateMutation.mutate({ id, data });
  };

  const handleMoodConfirm = (mood) => {
    if (!completingActivity) return;
    const pts = completingActivity.points || 10;
    updateMutation.mutate({
      id: completingActivity.id,
      data: {
        status: "concluida",
        completed_date: new Date().toISOString(),
        ...(mood ? { mood_emoji: mood } : {}),
      },
    });
    playPointsSound(pts);
    toast({ title: `Parabéns! ${mood || "🎉"}`, description: `+${pts} pontos ganhos!`, _silent: true });
    setCompletingActivity(null);
  };

  const filtered = visibleActivities
    .filter((a) => {
      if (a.archived) return false;

      if (statusFilter === "active") {
        if (a.status === "concluida") return false;
      } else if (statusFilter !== "all" && a.status !== statusFilter) {
        return false;
      }

      const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase());
      const matchAssignee = assigneeFilter === "all" || a.assigned_to === assigneeFilter;

      let matchVerification = true;
      if (verificationFilter === "verified") {
        matchVerification = !!a.verified_by_owner && !!a.verified_by_requester;
      } else if (verificationFilter === "pending_verification") {
        matchVerification = !!a.verification_requested_from && !(a.verified_by_owner && a.verified_by_requester);
      } else if (verificationFilter === "unverified") {
        matchVerification = !a.verification_requested_from;
      }

      return matchSearch && matchAssignee && matchVerification;
    })
    .sort((a, b) => {
      if (a.due_date && b.due_date) return a.due_date < b.due_date ? -1 : 1;
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });

  // When showing all assignees, group activities with same title+creator+date into one card
  let displayActivities = filtered;
  if (assigneeFilter === "all") {
    const map = new Map();
    filtered.forEach((a) => {
      const key = `${(a.title || "").toLowerCase().trim()}||${a.created_by || ""}||${a.due_date || ""}`;
      if (!map.has(key)) {
        const userInfo = effectiveUsers.find((u) => u.email === a.assigned_to);
        map.set(key, {
          ...a,
          collaborators: [
            {
              email: a.assigned_to,
              name: a.assigned_to_name || a.assigned_to,
              avatar_url: userInfo?.avatar_url,
              primary: true,
            },
          ],
        });
      } else {
        const userInfo = effectiveUsers.find((u) => u.email === a.assigned_to);
        map.get(key).collaborators.push({
          email: a.assigned_to,
          name: a.assigned_to_name || a.assigned_to,
          avatar_url: userInfo?.avatar_url,
          primary: false,
        });
      }
    });
    displayActivities = Array.from(map.values());
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Atividades</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin ? "Gerencie e atribua atividades à equipe" : "Suas atividades e pontos"}
          </p>
        </div>
        <Button onClick={() => { setEditActivity(null); setShowForm(true); }} className="rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Nova Atividade
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atividades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        {effectiveUsers.length > 0 && (
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-48 rounded-xl">
              <User className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {effectiveUsers.map((u) => {
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

        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
          <SelectTrigger className="w-48 rounded-xl">
            <ShieldCheck className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Verificação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as verificações</SelectItem>
            <SelectItem value="verified">Totalmente verificadas</SelectItem>
            <SelectItem value="pending_verification">Verificação pendente</SelectItem>
            <SelectItem value="unverified">Sem verificação</SelectItem>
          </SelectContent>
        </Select>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-muted rounded-xl">
            <TabsTrigger value="active">Abertas</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
            <TabsTrigger value="em_progresso">Em Progresso</TabsTrigger>
            <TabsTrigger value="concluida">Concluídas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div className="xl:col-span-1">
          <ActivityTimeline
            activities={displayActivities}
            isAdmin={isAdmin}
            isDeveloper={isDeveloper}
            onEdit={(a) => { setEditActivity(a); setShowForm(true); }}
            onDelete={(a) => deleteMutation.mutate(a.id)}
            onStatusChange={handleStatusChange}
            onComplete={(activity) => setCompletingActivity(activity)}
            currentUser={user}
            users={effectiveUsers}
            onUpdate={handleUpdate}
            onSelect={(a) => setSelectedActivity(a)}
            selectedActivityId={selectedActivity?.id}
          />
        </div>
        <div className="xl:col-span-1 sticky top-6 space-y-4">
          <NextEventCard events={events} />
          <ActivityCalendar activities={visibleActivities.filter((a) => !a.archived)} events={events} />
        </div>
      </div>

      <ActivityForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleSubmit}
        editActivity={editActivity}
        isAdmin={isAdmin}
        users={effectiveUsers}
        currentUser={user}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      <MoodCompletionDialog
        open={!!completingActivity}
        onOpenChange={(open) => { if (!open) setCompletingActivity(null); }}
        activity={completingActivity}
        onConfirm={handleMoodConfirm}
      />
    </div>
  );
}
