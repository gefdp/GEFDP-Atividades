import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Eye, EyeOff, KeyRound, Loader2, Pencil, Plus, Shield, Trash2, UserPlus, X } from "lucide-react";
import { db } from "@/services/dataService";
import { createTeamAccess, deleteTeamAccess, listTeamPasswords, managedRoles, roleLabels, updateTeamAccess, updateTeamProfile } from "@/services/accessService";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  role: "user",
};

export default function AccessManagement() {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [temporaryPasswords, setTemporaryPasswords] = useState({});
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: "", role: "user", password: "" });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isDeveloper } = useCurrentUser();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => db.entities.User.list("full_name", 500),
    staleTime: 30 * 1000,
  });

  const { data: credentials = [] } = useQuery({
    queryKey: ["access-credentials"],
    queryFn: listTeamPasswords,
    staleTime: 30 * 1000,
    enabled: isDeveloper,
  });

  const passwordByEmail = credentials.reduce((acc, credential) => {
    acc[credential.email?.toLowerCase()] = credential.password;
    return acc;
  }, {});

  const createMutation = useMutation({
    mutationFn: createTeamAccess,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["access-credentials"] });
      setTemporaryPasswords((current) => ({
        ...current,
        [variables.email.trim().toLowerCase()]: variables.password,
      }));
      setForm(initialForm);
      toast({
        title: "Acesso criado",
        description: "O usuário já pode entrar com o e-mail e a senha definidos.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar acesso",
        description: error.message || "Confira e-mail, senha e permissões.",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => updateTeamProfile(id, { role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Perfil atualizado" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAccessMutation = useMutation({
    mutationFn: updateTeamAccess,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["access-credentials"] });
      setEditingMemberId(null);
      setEditForm({ fullName: "", role: "user", password: "" });
      toast({ title: "Acesso atualizado" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar acesso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAccessMutation = useMutation({
    mutationFn: deleteTeamAccess,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["access-credentials"] });
      toast({ title: "Acesso removido" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover acesso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  const copyPassword = async (password) => {
    await navigator.clipboard.writeText(password);
    toast({ title: "Senha copiada" });
  };

  const startEditing = (member, savedPassword) => {
    setEditingMemberId(member.id);
    setEditForm({
      fullName: member.full_name || "",
      role: managedRoles.includes(member.role) ? member.role : "user",
      password: savedPassword || "",
    });
  };

  const saveEditing = (member) => {
    updateAccessMutation.mutate({
      id: member.id,
      email: member.email,
      fullName: editForm.fullName,
      role: editForm.role,
      password: editForm.password,
    });
  };

  const confirmDelete = (member) => {
    const confirmed = window.confirm(`Remover ${member.full_name || member.email} da equipe cadastrada?`);
    if (!confirmed) return;
    deleteAccessMutation.mutate({ id: member.id, email: member.email });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-primary" />
          Gerenciamento de Acessos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Área restrita ao administrador e desenvolvedor para criar logins e ajustar permissões da equipe.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Novo acesso</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail de login</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha inicial</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Visualizar senha"}
                  title={showPassword ? "Ocultar senha" : "Visualizar senha"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={form.role} onValueChange={(role) => setForm({ ...form, role })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {managedRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full gap-2" disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Criar login
          </Button>
        </form>

        <div className="xl:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Equipe cadastrada
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  {isDeveloper && <TableHead className="text-right">Senha</TableHead>}
                  {isDeveloper && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((member) => {
                  const memberEmail = member.email?.toLowerCase();
                  const savedPassword = passwordByEmail[memberEmail] || temporaryPasswords[memberEmail];
                  const isEditing = editingMemberId === member.id;

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <Input
                            value={editForm.fullName}
                            onChange={(event) => setEditForm({ ...editForm, fullName: event.target.value })}
                            className="min-w-36"
                          />
                        ) : (
                          member.full_name || "Sem nome"
                        )}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select value={editForm.role} onValueChange={(role) => setEditForm({ ...editForm, role })}>
                            <SelectTrigger className="w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {managedRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {roleLabels[role]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Select
                            value={managedRoles.includes(member.role) ? member.role : "user"}
                            onValueChange={(role) => updateRoleMutation.mutate({ id: member.id, role })}
                          >
                            <SelectTrigger className="w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {managedRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {roleLabels[role]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      {isDeveloper && (
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="text"
                              value={editForm.password}
                              onChange={(event) => setEditForm({ ...editForm, password: event.target.value })}
                              placeholder="Senha"
                              className="ml-auto min-w-36 max-w-44 font-mono text-xs"
                            />
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <span className="min-w-[120px] max-w-[160px] truncate rounded-md bg-muted px-2 py-1 text-left font-mono text-xs">
                                {savedPassword ? (visiblePasswords[memberEmail] ? savedPassword : "********") : "Sem senha"}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                title={visiblePasswords[memberEmail] ? "Ocultar senha" : "Visualizar senha"}
                                aria-label={visiblePasswords[memberEmail] ? "Ocultar senha" : "Visualizar senha"}
                                disabled={!savedPassword}
                                onClick={() => setVisiblePasswords((current) => ({
                                  ...current,
                                  [memberEmail]: !current[memberEmail],
                                }))}
                              >
                                {visiblePasswords[memberEmail] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                title="Copiar senha"
                                aria-label="Copiar senha"
                                disabled={!savedPassword}
                                onClick={() => copyPassword(savedPassword)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                      {isDeveloper && (
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                title="Salvar"
                                aria-label="Salvar"
                                onClick={() => saveEditing(member)}
                                disabled={updateAccessMutation.isPending}
                              >
                                {updateAccessMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                title="Cancelar"
                                aria-label="Cancelar"
                                onClick={() => setEditingMemberId(null)}
                                disabled={updateAccessMutation.isPending}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                title="Editar acesso"
                                aria-label="Editar acesso"
                                onClick={() => startEditing(member, savedPassword)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                title="Apagar acesso"
                                aria-label="Apagar acesso"
                                onClick={() => confirmDelete(member)}
                                disabled={deleteAccessMutation.isPending}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
