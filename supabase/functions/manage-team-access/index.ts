import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const managedRoles = new Set(["developer", "admin", "user"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function assertString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Campo obrigatório: ${field}.`);
  }
  return value.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Variáveis de ambiente do Supabase não configuradas." }, 500);
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^bearer /i, "").trim();

    if (!token) {
      return json({ error: "Usuário não autenticado." }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: requesterData, error: requesterError } = await adminClient.auth.getUser(token);
    if (requesterError || !requesterData.user) {
      return json({ error: "Usuário não autenticado." }, 401);
    }

    const { data: requesterProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", requesterData.user.id)
      .single();

    if (profileError) throw profileError;

    const requesterRole = requesterProfile?.role;
    const isStaff = requesterRole === "developer" || requesterRole === "admin";
    const isDeveloper = requesterRole === "developer";

    if (!isStaff) {
      return json({ error: "Apenas administradores e desenvolvedores podem gerenciar acessos." }, 403);
    }

    const body = await req.json();
    const action = body?.action;

    if (action === "create") {
      const email = assertString(body.email, "email").toLowerCase();
      const password = assertString(body.password, "password");
      const fullName = assertString(body.fullName, "fullName");
      const role = managedRoles.has(body.role) ? body.role : "user";

      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (createError) throw createError;
      const user = created.user;
      if (!user?.id) throw new Error("Usuário criado sem ID retornado pelo Supabase.");

      const { data: profile, error: upsertProfileError } = await adminClient
        .from("profiles")
        .upsert({
          id: user.id,
          email,
          full_name: fullName,
          role,
        })
        .select()
        .single();

      if (upsertProfileError) throw upsertProfileError;

      const { error: credentialError } = await adminClient
        .from("access_credentials")
        .upsert({
          user_id: user.id,
          email,
          password,
        });

      if (credentialError) throw credentialError;

      return json({ user, profile });
    }

    if (action === "update") {
      const id = assertString(body.id, "id");
      const email = assertString(body.email, "email").toLowerCase();
      const role = managedRoles.has(body.role) ? body.role : "user";
      const password = typeof body.password === "string" ? body.password.trim() : "";
      const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";

      const authUpdate: Record<string, unknown> = {};
      if (password) authUpdate.password = password;
      if (fullName) authUpdate.user_metadata = { full_name: fullName };

      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(id, authUpdate);
      if (authUpdateError) throw authUpdateError;

      const profileUpdate: Record<string, unknown> = { role };
      if (fullName) profileUpdate.full_name = fullName;

      const { data: profile, error: profileUpdateError } = await adminClient
        .from("profiles")
        .update(profileUpdate)
        .eq("id", id)
        .select()
        .single();

      if (profileUpdateError) throw profileUpdateError;

      if (password) {
        const { error: credentialError } = await adminClient
          .from("access_credentials")
          .upsert({
            user_id: id,
            email,
            password,
          });
        if (credentialError) throw credentialError;
      }

      return json({ profile });
    }

    if (action === "delete") {
      if (!isDeveloper) {
        return json({ error: "Apenas desenvolvedores podem apagar acessos." }, 403);
      }

      const id = assertString(body.id, "id");
      if (id === requesterData.user.id) {
        return json({ error: "Você não pode apagar o próprio acesso." }, 400);
      }

      const { error: deleteError } = await adminClient.auth.admin.deleteUser(id);
      if (deleteError) throw deleteError;

      return json({ ok: true });
    }

    return json({ error: "Ação inválida." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro inesperado." }, 400);
  }
});
