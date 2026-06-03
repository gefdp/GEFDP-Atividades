import { supabase } from "@/lib/supabaseClient";

export const roleLabels = {
  developer: "Desenvolvedor",
  admin: "Administrador",
  user: "Usuário",
};

export const managedRoles = ["developer", "admin", "user"];

async function invokeTeamAccess(action, payload) {
  const { data, error } = await supabase.functions.invoke("manage-team-access", {
    body: { action, ...payload },
  });

  if (error) {
    let message = error.message || "Não foi possível processar o acesso.";
    if (error.context && typeof error.context.json === "function") {
      try {
        const body = await error.context.json();
        if (body?.error) message = body.error;
      } catch {
        // body não é JSON, mantém a mensagem original
      }
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function listTeamPasswords() {
  const { data, error } = await supabase
    .from("access_credentials")
    .select("email,password")
    .order("email", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createTeamAccess({ fullName, email, password, role }) {
  const normalizedEmail = email.trim().toLowerCase();
  const data = await invokeTeamAccess("create", {
    fullName,
    email: normalizedEmail,
    password,
    role,
  });

  return data.user;
}

export async function updateTeamProfile(id, data) {
  const { data: updated, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

export async function updateTeamAccess({ id, email, fullName, role, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const data = await invokeTeamAccess("update", {
    id,
    email: normalizedEmail,
    fullName,
    role,
    password: password?.trim() || undefined,
  });

  return data.profile;
}

export async function deleteTeamAccess({ id }) {
  await invokeTeamAccess("delete", { id });
}
