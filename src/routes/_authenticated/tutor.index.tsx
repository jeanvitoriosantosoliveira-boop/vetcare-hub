import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { differenceInDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/tutor/")({
  component: TutorHome,
});

function TutorHome() {
  const { data } = useQuery({
    queryKey: ["tutor-home"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no user");
      const [profile, pets, appts, vaccines] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("pets").select("id, name, species, photo_url, breed").eq("tutor_id", user.id),
        supabase.from("appointments").select("id, scheduled_at, status, pet_id, clinic_id, services(name)").eq("tutor_id", user.id).gte("scheduled_at", new Date().toISOString()).order("scheduled_at").limit(3),
        supabase.from("vaccines").select("id, vaccine_name, next_dose_at, pet_id").not("next_dose_at", "is", null),
      ]);
      return { profile: profile.data, pets: pets.data ?? [], appts: appts.data ?? [], vaccines: vaccines.data ?? [] };
    },
  });

  const firstName = data?.profile?.full_name?.split(" ")[0] ?? "";
  const overdueVaccines = (data?.vaccines ?? []).filter((v) => v.next_dose_at && differenceInDays(parseISO(v.next_dose_at), new Date()) < 15);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black">Olá, {firstName || "tutor"}! <span aria-hidden>🐾</span></h1>
        <p className="text-muted-foreground mt-1">Aqui está o resumo dos seus pets.</p>
      </div>

      {overdueVaccines.length > 0 && (
        <Card className="p-4 border-warning/30 bg-warning/5 flex items-start gap-3">
          <span className="material-symbols-rounded text-warning" style={{fontSize:28}}>vaccines</span>
          <div className="flex-1">
            <div className="font-semibold">Atenção às vacinas</div>
            <div className="text-sm text-muted-foreground">Você tem {overdueVaccines.length} vacina(s) vencendo ou vencida(s). Consulte a carteirinha dos seus pets.</div>
          </div>
        </Card>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Meus pets</h2>
          <Button asChild variant="ghost" size="sm"><Link to="/tutor/pets">Ver todos</Link></Button>
        </div>
        {data && data.pets.length === 0 ? (
          <EmptyState title="Nenhum pet cadastrado" description="Cadastre seu primeiro pet para começar." action={<Button asChild className="rounded-full"><Link to="/tutor/pets/novo">Cadastrar pet</Link></Button>} icon="pets" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data?.pets.slice(0, 4).map((p) => (
              <Link key={p.id} to="/tutor/pets/$petId" params={{ petId: p.id }}>
                <Card className="p-4 card-hover elevation-1 flex flex-col items-center text-center">
                  <div className="h-20 w-20 rounded-full bg-gradient-jvet grid place-items-center text-white text-2xl mb-3 overflow-hidden">
                    {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-rounded" style={{fontSize:36}}>pets</span>}
                  </div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.breed || p.species}</div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Próximos agendamentos</h2>
          <Button asChild size="sm" className="rounded-full"><Link to="/tutor/agendar">Agendar</Link></Button>
        </div>
        {data && data.appts.length === 0 ? (
          <EmptyState title="Nenhum agendamento" description="Marque uma consulta para o seu pet." icon="event_available" action={<Button asChild className="rounded-full"><Link to="/tutor/agendar">Agendar consulta</Link></Button>} />
        ) : (
          <div className="space-y-2">
            {data?.appts.map((a) => {
              const svc = Array.isArray(a.services) ? a.services[0]?.name : (a.services as { name?: string } | null)?.name;
              return (
              <Card key={a.id} className="p-4 flex items-center gap-4 card-hover">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <span className="material-symbols-rounded">event</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold capitalize">{svc || "Consulta"}</div>
                  <div className="text-sm text-muted-foreground mono">{format(parseISO(a.scheduled_at), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}</div>
                </div>
                <StatusBadge status={a.status} />
              </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: "bg-warning/10 text-warning",
    confirmed: "bg-primary/10 text-primary",
    in_progress: "bg-accent/10 text-accent-foreground",
    completed: "bg-success/10 text-success",
    canceled: "bg-destructive/10 text-destructive",
    no_show: "bg-muted",
  };
  const label: Record<string, string> = { scheduled: "agendada", confirmed: "confirmada", in_progress: "em atendimento", completed: "concluída", canceled: "cancelada", no_show: "faltou" };
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status] || "bg-muted"}`}>{label[status] || status}</span>;
}

function EmptyState({ title, description, action, icon }: { title: string; description: string; action?: React.ReactNode; icon: string }) {
  return (
    <Card className="p-10 text-center border-dashed">
      <div className="h-16 w-16 rounded-2xl bg-muted grid place-items-center mx-auto mb-4">
        <span className="material-symbols-rounded text-muted-foreground" style={{fontSize:36}}>{icon}</span>
      </div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1 mb-4">{description}</div>
      {action}
    </Card>
  );
}