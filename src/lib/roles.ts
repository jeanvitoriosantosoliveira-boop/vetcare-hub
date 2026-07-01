import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "clinic_admin" | "veterinarian" | "receptionist" | "tutor";

export interface UserRoleRow {
  role: AppRole;
  clinic_id: string | null;
}

export async function fetchMyRoles(userId: string): Promise<UserRoleRow[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role, clinic_id")
    .eq("user_id", userId)
    .eq("active", true);
  if (error) throw error;
  return (data ?? []) as UserRoleRow[];
}

export function primaryDestination(roles: UserRoleRow[]): string {
  if (roles.some((r) => r.role === "super_admin")) return "/admin";
  if (roles.some((r) => ["clinic_admin", "veterinarian", "receptionist"].includes(r.role))) return "/clinica";
  return "/tutor";
}