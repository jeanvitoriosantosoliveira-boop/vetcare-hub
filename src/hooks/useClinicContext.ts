import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClinicContext {
  userId: string;
  role: "clinic_admin" | "veterinarian" | "receptionist";
  clinic: { id: string; name: string; status: string; logo_url: string | null };
}

export function useClinicContext() {
  return useQuery<ClinicContext | null>({
    queryKey: ["clinic-context"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role, clinic_id, clinics:clinic_id(id, name, status, logo_url)")
        .eq("user_id", user.id)
        .eq("active", true);
      const staff = (roles ?? []).find(
        (r) => r.clinic_id && r.role !== "tutor" && r.role !== "super_admin",
      );
      if (!staff?.clinics) return null;
      return {
        userId: user.id,
        role: staff.role as ClinicContext["role"],
        clinic: staff.clinics as ClinicContext["clinic"],
      };
    },
  });
}