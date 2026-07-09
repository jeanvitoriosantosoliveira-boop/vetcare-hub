import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useClinicContext } from "@/hooks/useClinicContext";

export const Route = createFileRoute("/_authenticated/clinica/servicos")({
  component: ServicosPage,
});

function ServicosPage() {
  const { data: ctx } = useClinicContext();
  const clinicId = ctx?.clinic.id;
  const qc = useQueryClient();

  const { data: services } = useQuery({
    enabled: !!clinicId,
    queryKey: ["services", clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*").eq("clinic_id", clinicId!).order("name");
      return data ?? [];
    },
  });

  const [f, setF] = useState({ name:"", price:"0", duration_min:"30", description:"" });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("services").insert({
      clinic_id: clinicId!, name: f.name, price: Number(f.price),
      duration_min: Number(f.duration_min), description: f.description || null, active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Serviço criado");
    setF({ name:"", price:"0", duration_min:"30", description:"" });
    qc.invalidateQueries({ queryKey: ["services", clinicId] });
  }
  async function toggle(id: string, active: boolean) {
    await supabase.from("services").update({ active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["services", clinicId] });
  }
  async function remove(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    await supabase.from("services").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["services", clinicId] });
  }

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-black">Serviços</h1>
        <p className="text-sm text-muted-foreground">Catálogo, preços e duração</p>
      </div>

      <Card className="p-5">
        <h2 className="font-bold mb-3">Adicionar serviço</h2>
        <form onSubmit={add} className="grid grid-cols-4 gap-3">
          <div className="col-span-4 md:col-span-2"><Label>Nome</Label><Input required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>
          <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={f.price} onChange={e=>setF({...f,price:e.target.value})}/></div>
          <div><Label>Duração (min)</Label><Input type="number" value={f.duration_min} onChange={e=>setF({...f,duration_min:e.target.value})}/></div>
          <div className="col-span-4"><Label>Descrição</Label><Input value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></div>
          <div className="col-span-4 flex justify-end"><Button className="rounded-full">+ Adicionar</Button></div>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="font-bold mb-3">Catálogo ({services?.length ?? 0})</h2>
        <div className="divide-y">
          {(services?.length ?? 0)===0 && <div className="py-6 text-sm text-muted-foreground text-center">Nenhum serviço.</div>}
          {services?.map(s => (
            <div key={s.id} className="py-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="font-semibold">{s.name} {!s.active && <span className="text-xs text-muted-foreground">(inativo)</span>}</div>
                <div className="text-xs text-muted-foreground">R$ {Number(s.price).toFixed(2)} · {s.duration_min} min {s.description && `· ${s.description}`}</div>
              </div>
              <Button size="sm" variant="outline" className="rounded-full" onClick={()=>toggle(s.id, s.active)}>{s.active?"Desativar":"Ativar"}</Button>
              <Button size="sm" variant="ghost" className="rounded-full text-destructive" onClick={()=>remove(s.id)}>×</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}