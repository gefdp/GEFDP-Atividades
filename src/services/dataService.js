import { supabase } from "@/lib/supabaseClient";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_UPLOAD_MB = MAX_UPLOAD_BYTES / 1024 / 1024;

const entityTables = {
  Activity: "activities",
  Event: "events",
  User: "profiles",
};

function parseOrder(orderBy) {
  if (!orderBy) return null;
  const descending = orderBy.startsWith("-");
  return {
    column: descending ? orderBy.slice(1) : orderBy,
    ascending: !descending,
  };
}

function normalizePayload(data) {
  const clone = { ...data };
  delete clone.id;
  delete clone.created_at;
  delete clone.updated_at;
  delete clone.created_date;

  ["due_date", "completed_date", "date"].forEach((field) => {
    if (clone[field] === "") clone[field] = null;
  });

  return clone;
}

async function getSessionUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

function makeEntity(entityName) {
  const table = entityTables[entityName];

  return {
    async list(orderBy, limit) {
      const order = parseOrder(orderBy);
      let query = supabase.from(table).select("*");
      if (order) query = query.order(order.column, { ascending: order.ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async filter(filters = {}, orderBy, limit) {
      const order = parseOrder(orderBy);
      let query = supabase.from(table).select("*");
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      if (order) query = query.order(order.column, { ascending: order.ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async create(data) {
      const user = await getSessionUser();
      const payload = normalizePayload(data);
      if (entityName !== "User" && user?.email && !payload.created_by) {
        payload.created_by = user.email;
      }
      const { data: inserted, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return inserted;
    },

    async bulkCreate(rows) {
      const user = await getSessionUser();
      const payload = rows.map((row) => {
        const item = normalizePayload(row);
        if (entityName !== "User" && user?.email && !item.created_by) item.created_by = user.email;
        return item;
      });
      const { data, error } = await supabase.from(table).insert(payload).select();
      if (error) throw error;
      return data || [];
    },

    async update(id, data) {
      const { data: updated, error } = await supabase
        .from(table)
        .update(normalizePayload(data))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return true;
    },
  };
}

export const db = {
  entities: {
    Activity: makeEntity("Activity"),
    Event: makeEntity("Event"),
    User: makeEntity("User"),
  },
};

export async function uploadFile(file, folder = "uploads") {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`O arquivo deve ter no máximo ${MAX_UPLOAD_MB} MB.`);
  }

  const user = await getSessionUser();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${user?.id || "anonymous"}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("gef-dp-assets").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("gef-dp-assets").getPublicUrl(path);
  return { file_url: data.publicUrl, path };
}

