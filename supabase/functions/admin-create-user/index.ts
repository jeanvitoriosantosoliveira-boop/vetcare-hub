// Edge Function: cria usuários (clínica ou tutor) usando service role.
// Autoriza com base no role do chamador em user_roles.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "super_admin" | "clinic_admin" | "veterinarian" | "receptionist" | "tutor";

interface Payload {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: Role;          // role a ser criado
  clinic_id: string;   // clínica de vínculo (obrigatório exceto super_admin)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "unauthenticated" }, 401);
    const caller = userData.user;

    const body = (await req.json()) as Payload;
    if (!body.email || !body.password || !body.full_name || !body.role) {
      return json({ error: "missing_fields" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: roles } = await admin
      .from("user_roles")
      .select("role, clinic_id, active")
      .eq("user_id", caller.id)
      .eq("active", true);

    const isSuper = roles?.some((r) => r.role === "super_admin");
    const clinicAdminOf = new Set(
      (roles ?? []).filter((r) => r.role === "clinic_admin").map((r) => r.clinic_id),
    );

    // Regras de autorização
    if (body.role === "super_admin" && !isSuper) return json({ error: "forbidden" }, 403);
    if (["clinic_admin", "veterinarian", "receptionist"].includes(body.role)) {
      if (!isSuper) return json({ error: "forbidden" }, 403);
      if (!body.clinic_id) return json({ error: "clinic_required" }, 400);
    }
    if (body.role === "tutor") {
      if (!body.clinic_id) return json({ error: "clinic_required" }, 400);
      if (!isSuper && !clinicAdminOf.has(body.clinic_id)) return json({ error: "forbidden" }, 403);
    }

    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name },
    });
    if (cErr || !created.user) return json({ error: cErr?.message ?? "create_failed" }, 400);

    const newId = created.user.id;

    await admin.from("profiles").upsert({
      id: newId,
      email: body.email,
      full_name: body.full_name,
      phone: body.phone ?? null,
      primary_clinic_id: body.clinic_id ?? null,
    });

    await admin.from("user_roles").insert({
      user_id: newId,
      role: body.role,
      clinic_id: body.role === "super_admin" ? null : body.clinic_id,
      active: true,
    });

    return json({ ok: true, user_id: newId });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}