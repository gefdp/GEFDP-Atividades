import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, X, UserPlus } from "lucide-react";

const categories = [
  { value: "trabalho", label: "Trabalho" },
  { value: "estudo", label: "Estudo" },
  { value: "exercicio", label: "Exercício" },
  { value: "pessoal", label: "Pessoal" },
  { value: "projeto", label: "Projeto" },
  { value: "outro", label: "Outro" },
];

const priorities = [
  { value: "baixa", label: "Baixa", points: 5 },
  { value: "media", label: "Média", points: 10 },
  { value: "alta", label: "Alta", points: 20 },
  { value: "urgente", label: "Urgente", points: 30 },
];

export default function ActivityForm({ open, onOpenChange, onSubmit, editActivity, isAdmin, users = [], currentUser, isSaving = false }) {
  const defaultForm = {
    title: "",
    description: "",
    category: "trabalho",
    priority: "media",
    due_date: "",
    points: 10,
    assigned_to: currentUser?.email || "",
    assigned_to_name: currentUser?.full_name || "",
  };

  const [form, setForm] = useState(defaultForm);
  const [collaborators, setCollaborators] = useState([]);

  useEffect(() => {
    if (editActivity) {
      setForm(editActivity);
      setCollaborators([]);
    } else {
      setForm({
        ...defaultForm,
        assigned_to: currentUser?.email || "",
        assigned_to_name: currentUser?.full_name || "",
      });
      setCollaborators([]);
    }
  }, [editActivity, open, currentUser]);

  const handlePriorityChange = (value) => {
    const p = priorities.find((p) => p.value === value);
    setForm({ ...form, priority: value, points: p?.points || 10 });
  };

  const handleAssignChange = (email) => {
    const u = users.find((u) => u.email === email);
    setForm({ ...form, assigned_to: email, assigned_to_name: u?.full_name || email });
  };

  const addCollaborator = (email) => {
    const u = users.find((u) => u.email === email);
    if (!u || collaborators.find((c) => c.email === email) || email === form.assigned_to) return;
    setCollaborators([...collaborators, u]);
  };

  const removeCollaborator = (email) => {
    setCollaborators(collaborators.filter((c) => c.email !== email));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form, collaborators);
  };

  // Todos os usuários sem duplicatas, currentUser primeiro
  const allUsers = (() => {
    const map = {};
    users.forEach((u) => { map[u.email] = u; });
    if (currentUser) map[currentUser.email] = { ...map[currentUser.email], ...currentUser };
    const sorted = Object.values(map).sort((a, b) => {
      if (a.email === currentUser?.email) return -1;
      if (b.email === currentUser?.email) return 1;
      return (a.full_name || a.email).localeCompare(b.full_name || b.email);
    });
    return sorted;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {editActivity ? "Editar Atividade" : "Nova Atividade"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              placeholder="Ex: Estudar React..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Detalhes da atividade..."
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="h-20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={handlePriorityChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label} (+{p.points}pts)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Admin: atribuir para membro da equipe */}
          {isAdmin && allUsers.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={form.assigned_to || ""} onValueChange={handleAssignChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar membro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map((u) => {
                      const initials = u.full_name
                        ? u.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                        : u.email[0].toUpperCase();
                      return (
                        <SelectItem key={u.email} value={u.email}>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={u.avatar_url} />
                              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                            </Avatar>
                            {u.full_name || u.email}
                            {u.email === currentUser?.email && " (você)"}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Colaboradores */}
              {(
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Colaboradores
                  </Label>
                  <Select
                    value=""
                    onValueChange={addCollaborator}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Adicionar colaborador..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers
                        .filter((u) => u.email !== form.assigned_to && !collaborators.find((c) => c.email === u.email))
                        .map((u) => {
                          const initials = u.full_name
                            ? u.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                            : u.email[0].toUpperCase();
                          return (
                            <SelectItem key={u.email} value={u.email}>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
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

                  {collaborators.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {collaborators.map((c) => {
                        const initials = c.full_name
                          ? c.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                          : c.email[0].toUpperCase();
                        return (
                          <div key={c.email} className="flex items-center gap-1.5 bg-muted rounded-full pl-1 pr-2 py-0.5">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={c.avatar_url} />
                              <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{c.full_name || c.email}</span>
                            <button type="button" onClick={() => removeCollaborator(c.email)} className="text-muted-foreground hover:text-foreground ml-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {collaborators.length > 0 && !editActivity && (
                    <p className="text-[11px] text-muted-foreground">
                      Serão criadas {collaborators.length + 1} atividades idênticas (1 por pessoa).
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>Data de entrega</Label>
            <Input
              type="date"
              value={form.due_date || ""}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-muted-foreground">
              Recompensa: <span className="font-bold text-primary">{form.points} pontos</span>
            </span>
            <Button type="submit" className="rounded-xl px-6" disabled={isSaving}>
              {isSaving ? "Salvando..." : editActivity ? "Salvar" : "Criar Atividade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
