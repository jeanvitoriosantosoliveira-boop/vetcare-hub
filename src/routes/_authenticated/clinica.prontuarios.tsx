import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useClinicContext } from "@/hooks/useClinicContext";

export const Route = createFileRoute("/_authenticated/clinica/prontuarios")({
  component: ProntuariosPage,
});

function ProntuariosPage() {
  const { data: ctx } = useClinicContext();
  const clinicId = ctx?.clinic.id;
  const [selected, setSelected] = useState<string | null>(null);

  const { data: records } = useQuery({
    enabled: !!clinicId,
    queryKey: ["records", clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("medical_records")
        .select("id, visit_date, anamnesis, diagnosis, treatment, weight_kg, temperature, pets:pet_id(id,name,species)")
        .eq("clinic_id", clinicId!).order("visit_date", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const current = records?.find((r:any) => r.id === selected);

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">Prontuários</h1>
          <p className="text-sm text-muted-foreground">Histórico clínico de todos os pets</p>
        </div>
        {clinicId && <NewRecordDialog clinicId={clinicId} />}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 md:col-span-1 max-h-[600px] overflow-y-auto">
          {(records?.length ?? 0)===0 && <div className="py-6 text-sm text-muted-foreground text-center">Nenhum prontuário.</div>}
          <div className="divide-y">
            {records?.map((r:any) => (
              <button key={r.id} onClick={()=>setSelected(r.id)}
                className={`w-full text-left py-3 px-2 rounded-lg ${selected===r.id?"bg-primary/10":""}`}>
                <div className="font-semibold">{r.pets?.name}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.visit_date).toLocaleString("pt-BR")}</div>
                {r.diagnosis && <div className="text-xs mt-1 truncate">Dx: {r.diagnosis}</div>}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6 md:col-span-2">
          {!current && <div className="py-12 text-center text-sm text-muted-foreground">Selecione um prontuário na lista.</div>}
          {current && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black">{(current as any).pets?.name}</h2>
                <div className="text-xs text-muted-foreground">{new Date(current.visit_date).toLocaleString("pt-BR")}</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-muted"><div className="text-xs text-muted-foreground">Peso</div><div className="font-bold">{current.weight_kg ?? "—"} kg</div></div>
                <div className="p-3 rounded-xl bg-muted"><div className="text-xs text-muted-foreground">Temperatura</div><div className="font-bold">{current.temperature ?? "—"} °C</div></div>
                <div className="p-3 rounded-xl bg-muted"><div className="text-xs text-muted-foreground">Dx</div><div className="font-bold text-sm">{current.diagnosis ?? "—"}</div></div>
              </div>
              <Field label="Anamnese" value={current.anamnesis} />
              <Field label="Tratamento" value={current.treatment} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({label, value}:{label:string; value:string|null}) {
  return (
    <div>
      <div className="text-xs font-bold text-muted-foreground uppercase mb-1">{label}</div>
      <div className="p-3 rounded-xl border bg-background text-sm whitespace-pre-wrap min-h-[60px]">{value || "—"}</div>
    </div>
  );
}

function NewRecordDialog({ clinicId }: { clinicId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ pet_id:"", weight_kg:"", temperature:"", anamnesis:"", diagnosis:"", treatment:"", observations:"" });

  const { data: pets } = useQuery({
    enabled: open,
    queryKey: ["rec-pets", clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("id, name, tutor_id").eq("clinic_id", clinicId).order("name");
      return data ?? [];
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("medical_records").insert({
      clinic_id: clinicId,
      pet_id: f.pet_id,
      weight_kg: f.weight_kg ? Number(f.weight_kg) : null,
      temperature: f.temperature ? Number(f.temperature) : null,
      anamnesis: f.anamnesis || null,
      diagnosis: f.diagnosis || null,
      treatment: f.treatment || null,
      observations: f.observations || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Prontuário criado");
    setOpen(false);
    setF({ pet_id:"", weight_kg:"", temperature:"", anamnesis:"", diagnosis:"", treatment:"", observations:"" });
    qc.invalidateQueries({ queryKey: ["records"] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="rounded-full">+ Novo prontuário</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Novo prontuário</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Pet</Label>
            <Select value={f.pet_id} onValueChange={v=>setF({...f,pet_id:v})}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{pets?.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Peso (kg)</Label><Input type="number" step="0.01" value={f.weight_kg} onChange={e=>setF({...f,weight_kg:e.target.value})}/></div>
          <div><Label>Temp (°C)</Label><Input type="number" step="0.1" value={f.temperature} onChange={e=>setF({...f,temperature:e.target.value})}/></div>
          <div className="col-span-2"><Label>Anamnese</Label><Textarea rows={2} value={f.anamnesis} onChange={e=>setF({...f,anamnesis:e.target.value})}/></div>
          <div className="col-span-2"><Label>Diagnóstico</Label><Textarea rows={2} value={f.diagnosis} onChange={e=>setF({...f,diagnosis:e.target.value})}/></div>
          <div className="col-span-2"><Label>Tratamento</Label><Textarea rows={2} value={f.treatment} onChange={e=>setF({...f,treatment:e.target.value})}/></div>
          <div className="col-span-2 flex justify-end"><Button className="rounded-full">Salvar</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}