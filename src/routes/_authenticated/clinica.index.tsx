import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useClinicContext } from "@/hooks/useClinicContext";

export const Route = createFileRoute("/_authenticated/clinica/")({
  component: DashboardPage,
});

function KPI({ icon, label, value, tint }: { icon: string; label: string; value: string | number; tint: string }) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-2xl grid place-items-center ${tint}`}>
        <span className="material-symbols-rounded" style={{fontSize:24}}>{icon}</span>
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-black">{value}</div>
      </div>
    </Card>
  );
}

function DashboardPage() {
  const { data: ctx } = useClinicContext();
  const clinicId = ctx?.clinic.id;

  const { data: stats } = useQuery({
    enabled: !!clinicId,
    queryKey: ["clinica","dash",clinicId],
    queryFn: async () => {
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(); end.setHours(23,59,59,999);
      const startMonth = new Date(); startMonth.setDate(1); startMonth.setHours(0,0,0,0);

      const [today, month, pets, tutors, alertsOpen, upcoming, revenueMonth] = await Promise.all([
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("clinic_id", clinicId!).gte("scheduled_at", start.toISOString()).lte("scheduled_at", end.toISOString()),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .eq("clinic_id", clinicId!).gte("scheduled_at", startMonth.toISOString()),
        supabase.from("pets").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId!),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("clinic_id", clinicId!).eq("role","tutor"),
        supabase.from("alerts").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId!).eq("resolved", false),
        supabase.from("appointments")
          .select("id, scheduled_at, status, pets:pet_id(name), services:service_id(name)")
          .eq("clinic_id", clinicId!).gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true }).limit(5),
        supabase.from("payments").select("amount, status")
          .eq("clinic_id", clinicId!).eq("status","pago").gte("paid_at", startMonth.toISOString()),
      ]);
      const revenue = (revenueMonth.data ?? []).reduce((a,p) => a + Number(p.amount||0), 0);
      return {
        todayCount: today.count ?? 0,
        monthCount: month.count ?? 0,
        petsCount: pets.count ?? 0,
        tutorsCount: tutors.count ?? 0,
        alertsCount: alertsOpen.count ?? 0,
        upcoming: upcoming.data ?? [],
        revenue,
      };
    },
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black">Bem-vindo ao painel da clínica</h1>
        <p className="text-sm text-muted-foreground">Visão geral do dia · {new Date().toLocaleDateString("pt-BR", { weekday:"long", day:"numeric", month:"long" })}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI icon="event_available" label="Atendimentos hoje" value={stats?.todayCount ?? "…"} tint="bg-primary/10 text-primary" />
        <KPI icon="calendar_month" label="Atendimentos mês" value={stats?.monthCount ?? "…"} tint="bg-accent/10 text-accent" />
        <KPI icon="pets" label="Pets cadastrados" value={stats?.petsCount ?? "…"} tint="bg-warning/10 text-warning" />
        <KPI icon="groups" label="Tutores" value={stats?.tutorsCount ?? "…"} tint="bg-primary-light/10 text-primary-light" />
        <KPI icon="warning" label="Alertas ativos" value={stats?.alertsCount ?? "…"} tint="bg-destructive/10 text-destructive" />
        <KPI icon="payments" label="Receita mês" value={`R$ ${(stats?.revenue ?? 0).toFixed(2)}`} tint="bg-success/10 text-success" />
      </div>

      <Card className="p-6">
        <h2 className="font-bold text-lg mb-3">Próximos atendimentos</h2>
        {(stats?.upcoming.length ?? 0) === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Nenhum atendimento agendado.</p>}
        <div className="divide-y">
          {stats?.upcoming.map((a: any) => (
            <div key={a.id} className="py-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <span className="material-symbols-rounded" style={{fontSize:20}}>pets</span>
              </div>
              <div className="flex-1">
                <div className="font-semibold">{a.pets?.name || "Pet"} · {a.services?.name || "Consulta"}</div>
                <div className="text-xs text-muted-foreground">{new Date(a.scheduled_at).toLocaleString("pt-BR")}</div>
              </div>
              <span className="text-xs capitalize px-2 py-1 rounded-full bg-muted">{a.status}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-primary mb-2"><span className="material-symbols-rounded">tips_and_updates</span><h3 className="font-bold">Dica do dia</h3></div>
          <p className="text-sm text-muted-foreground">Envie lembretes de vacina 15 dias antes — reduz até 40% de faltas.</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-accent mb-2"><span className="material-symbols-rounded">insights</span><h3 className="font-bold">Fidelize tutores</h3></div>
          <p className="text-sm text-muted-foreground">Tutores com carteirinha digital voltam 2x mais para consultas de rotina.</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-success mb-2"><span className="material-symbols-rounded">verified</span><h3 className="font-bold">Segurança</h3></div>
          <p className="text-sm text-muted-foreground">Todos os dados são criptografados e cumprem a LGPD.</p>
        </Card>
      </div>
    </div>
  );
}