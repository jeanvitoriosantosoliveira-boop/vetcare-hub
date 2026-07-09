import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useClinicContext } from "@/hooks/useClinicContext";

export const Route = createFileRoute("/_authenticated/clinica/alertas")({
  component: AlertasPage,
});

function AlertasPage() {
  const { data: ctx } = useClinicContext();
  const clinicId = ctx?.clinic.id;
  const qc = useQueryClient();

  const { data: alerts } = useQuery({
    enabled: !!clinicId,
    queryKey: ["alerts", clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("alerts")
        .select("id, kind, message, due_date, resolved, created_at, pets:pet_id(name)")
        .eq("clinic_id", clinicId!).order("resolved").order("due_date", { ascending: true, nullsFirst: false });
      return data ?? [];
    },
  });

  async function resolve(id: string) {
    const { error } = await supabase.from("alerts").update({ resolved: true }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["alerts"] });
    qc.invalidateQueries({ queryKey: ["clinica","dash"] });
    toast.success("Resolvido");
  }

  const open = (alerts ?? []).filter((a:any) => !a.resolved);
  const done = (alerts ?? []).filter((a:any) => a.resolved);

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-black">Alertas</h1>
        <p className="text-sm text-muted-foreground">Vacinas, retornos e pendências operacionais</p>
      </div>

      <Card className="p-5">
        <h2 className="font-bold text-lg mb-3">Abertos ({open.length})</h2>
        {open.length===0 && <div className="py-4 text-sm text-muted-foreground">Nenhum alerta aberto 🎉</div>}
        <div className="divide-y">
          {open.map((a:any) => {
            const overdue = a.due_date && new Date(a.due_date) < new Date();
            return (
              <div key={a.id} className="py-3 flex flex-wrap items-center gap-3">
                <div className={`h-9 w-9 rounded-xl grid place-items-center ${overdue?"bg-destructive/15 text-destructive":"bg-warning/15 text-warning"}`}>
                  <span className="material-symbols-rounded" style={{fontSize:20}}>{a.kind==="vacina"?"vaccines":"notifications"}</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{a.pets?.name && `${a.pets.name} · `}{a.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.due_date ? `Prazo: ${new Date(a.due_date).toLocaleDateString("pt-BR")}` : "Sem prazo"}
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">{a.kind}</Badge>
                <Button size="sm" variant="outline" className="rounded-full" onClick={()=>resolve(a.id)}>Resolver</Button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 opacity-70">
        <h2 className="font-bold text-lg mb-3">Resolvidos ({done.length})</h2>
        <div className="divide-y max-h-80 overflow-y-auto">
          {done.map((a:any) => (
            <div key={a.id} className="py-2 text-sm flex items-center justify-between">
              <span>{a.pets?.name && `${a.pets.name} · `}{a.message}</span>
              <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}