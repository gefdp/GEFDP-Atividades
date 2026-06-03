import React, { useState } from "react";
import { db } from "@/services/dataService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useToast } from "@/components/ui/use-toast";
import EventCard from "../components/events/EventCard";
import EventForm from "../components/events/EventForm";

export default function Events() {
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const { user, isAdmin } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => db.entities.Event.list("-date", 100),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowForm(false);
      toast({ title: "Evento criado!" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setShowForm(false);
      setEditEvent(null);
      toast({ title: "Evento atualizado!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Evento excluído" });
    },
  });

  const handleSubmit = (data) => {
    if (editEvent) updateMutation.mutate({ id: editEvent.id, data });
    else createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground text-sm mt-1">Catálogo de eventos da equipe</p>
        </div>
        <Button
          onClick={() => { setEditEvent(null); setShowForm(true); }}
          className="rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Evento
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-lg font-semibold">Nenhum evento ainda</p>
          <p className="text-muted-foreground text-sm mt-1">Crie o primeiro evento da equipe!</p>
          <Button
            onClick={() => { setEditEvent(null); setShowForm(true); }}
            className="mt-4 rounded-xl gap-2"
            variant="outline"
          >
            <Plus className="w-4 h-4" /> Criar evento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isAdmin={isAdmin}
              onEdit={(e) => { setEditEvent(e); setShowForm(true); }}
              onDelete={(e) => deleteMutation.mutate(e.id)}
            />
          ))}
        </div>
      )}

      <EventForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleSubmit}
        editEvent={editEvent}
      />
    </div>
  );
}