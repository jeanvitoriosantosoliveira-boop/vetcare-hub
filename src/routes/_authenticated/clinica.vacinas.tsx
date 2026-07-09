import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useClinicContext } from "@/hooks/useClinicContext";

export const Route = createFileRoute("/_authenticated/clinica/vacinas")({
  component: VacinasPage,
});

function VacinasPage() {
  const { data: ctx } = useClinicContext();
  const clinicId = ctx?.clinic.id;

  const { data: vaccines } = useQuery({
    enabled: !!clinicId,
    queryKey: ["vaccines", clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("vaccines")
        .select("id, vaccine_name, applied_at, next_dose_at, batch, pets:pet_id(id,name)")
        .eq("clinic_id", clinicId!).order("next_dose_at", { ascending: true, nullsFirst: false });
      return data ?? [];
    },
  });

  const now = new Date();
  const in30 = new Date(); in30.setDate(now.getDate()+30);
  const overdue = (vaccines ?? []).filter((v:any) => v.next_dose_at && new Date(v.next_dose_at) < now);
  const upcoming = (vaccines ?? []).filter((v:any) => v.next_dose_at && new Date(v.next_dose_at) >= now && new Date(v.next_dose_at) <= in30);
  const applied = (vaccines ?? []).filter((v:any) => !v.next_dose_at || new Date(v.next_dose_at) > in30);

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">Vacinas & Lembretes</h1>
          <p className="text-sm text-muted-foreground">Acompanhe reforços vencidos e próximos</p>
        </div>
        {clinicId && <NewVaccineDialog clinicId={clinicId} />}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Stat label="Vencidas" value={overdue.length} tint="bg-destructive/10 text-destructive" icon="warning" />
        <Stat label="Próximos 30 dias" value={upcoming.length} tint="bg-warning/10 text-warning" icon="schedule" />
        <Stat label="Em dia" value={applied.length} tint="bg-success/10 text-success" icon="check_circle" />
      </div>

      <Section title="⚠️ Vacinas vencidas" items={overdue} emptyText="Nada vencido — parabéns!" highlight />
      <Section title="Próximos reforços" items={upcoming} emptyText="Nenhum reforço nos próximos 30 dias." />
      <Section title="Aplicadas" items={applied.slice(0,20)} emptyText="Nenhuma vacina registrada ainda." />
    </div>
  );
}

function Stat({label,value,tint,icon}:{label:string;value:number;tint:string;icon:string}) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-2xl grid place-items-center ${tint}`}>
        <span className="material-symbols-rounded">{icon}</span>
      </div>
      <div><div className="text-xs text-muted-foreground">{label}</div><div className="text-2xl font-black">{value}</div></div>
    </Card>
  );
}

function Section({title,items,emptyText,highlight}:{title:string;items:any[];emptyText:string;highlight?:boolean}) {
  return (
    <Card className={`p-5 ${highlight?"border-destructive/40":""}`}>
      <h2 className="font-bold text-lg mb-3">{title}</h2>
      {items.length===0 && <div className="py-4 text-sm text-muted-foreground">{emptyText}</div>}
      <div className="divide-y">
        {items.map((v:any) => (
          <div key={v.id} className="py-3 flex flex-wrap items-center gap-3">
            <div className="flex-1">
              <div className="font-semibold">{v.pets?.name} — {v.vaccine_name}</div>
              <div className="text-xs text-muted-foreground">
                Aplicada: {new Date(v.applied_at).toLocaleDateString("pt-BR")}
                {v.next_dose_at && ` · Reforço: ${new Date(v.next_dose_at).toLocaleDateString("pt-BR")}`}
                {v.batch && ` · Lote ${v.batch}`}
              </div>
            </div>
            {v.next_dose_at && <Badge variant="outline">{new Date(v.next_dose_at).toLocaleDateString("pt-BR")}</Badge>}
          </div>
        ))}
      </div>
    </Card>
  );
}

function NewVaccineDialog({ clinicId }: { clinicId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ pet_id:"", vaccine_name:"", applied_at:"", next_dose_at:"", batch:"" });

  const { data: pets } = useQuery({
    enabled: open,
    queryKey: ["vac-pets", clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("id, name").eq("clinic_id", clinicId).order("name");
      return data ?? [];
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("vaccines").insert({
      clinic_id: clinicId,
      pet_id: f.pet_id,
      vaccine_name: f.vaccine_name,
      applied_at: f.applied_at ? new Date(f.applied_at).toISOString() : new Date().toISOString(),
      next_dose_at: f.next_dose_at ? new Date(f.next_dose_at).toISOString() : null,
      batch: f.batch || null,
    });
    if (error) return toast.error(error.message);
    if (f.next_dose_at) {
      await supabase.from("alerts").insert({
        clinic_id: clinicId, pet_id: f.pet_id, kind: "vacina",
        message: `Reforço de ${f.vaccine_name}`, due_date: new Date(f.next_dose_at).toISOString(),
      });
    }
    toast.success("Vacina registrada");
    setF({ pet_id:"", vaccine_name:"", applied_at:"", next_dose_at:"", batch:"" });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["vaccines", clinicId] });
    qc.invalidateQueries({ queryKey: ["alerts", clinicId] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="rounded-full">+ Registrar vacina</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar vacina</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Pet</Label>
            <Select value={f.pet_id} onValueChange={v=>setF({...f,pet_id:v})}>
              <SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger>
              <SelectContent>{pets?.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Vacina</Label><Input required value={f.vaccine_name} onChange={e=>setF({...f,vaccine_name:e.target.value})} placeholder="V10, Antirrábica..." /></div>
          <div><Label>Aplicada em</Label><Input type="date" value={f.applied_at} onChange={e=>setF({...f,applied_at:e.target.value})}/></div>
          <div><Label>Próximo reforço</Label><Input type="date" value={f.next_dose_at} onChange={e=>setF({...f,next_dose_at:e.target.value})}/></div>
          <div className="col-span-2"><Label>Lote</Label><Input value={f.batch} onChange={e=>setF({...f,batch:e.target.value})}/></div>
          <div className="col-span-2 flex justify-end"><Button className="rounded-full">Salvar vacina</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}