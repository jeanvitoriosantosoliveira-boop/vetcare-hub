import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useClinicContext } from "@/hooks/useClinicContext";

export const Route = createFileRoute("/_authenticated/clinica/agenda")({
  component: AgendaPage,
});

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-muted text-foreground",
  confirmed: "bg-primary/15 text-primary",
  in_progress: "bg-warning/20 text-warning",
  completed: "bg-success/15 text-success",
  canceled: "bg-destructive/15 text-destructive",
  no_show: "bg-destructive/10 text-destructive",
};

function AgendaPage() {
  const { data: ctx } = useClinicContext();
  const clinicId = ctx?.clinic.id;
  const qc = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [filter, setFilter] = useState<string>("all");

  const monday = new Date(); monday.setHours(0,0,0,0);
  monday.setDate(monday.getDate() - ((monday.getDay()+6)%7) + weekOffset*7);
  const sunday = new Date(monday); sunday.setDate(monday.getDate()+6); sunday.setHours(23,59,59,999);

  const { data: appts } = useQuery({
    enabled: !!clinicId,
    queryKey: ["agenda", clinicId, monday.toISOString(), filter],
    queryFn: async () => {
      let q = supabase.from("appointments")
        .select("id, scheduled_at, duration_min, status, notes, pets:pet_id(id,name), services:service_id(name), tutor_id")
        .eq("clinic_id", clinicId!)
        .gte("scheduled_at", monday.toISOString())
        .lte("scheduled_at", sunday.toISOString())
        .order("scheduled_at");
      if (filter !== "all") q = q.eq("status", filter as any);
      const { data } = await q;
      return data ?? [];
    },
  });

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("appointments").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["agenda"] });
    qc.invalidateQueries({ queryKey: ["clinica","dash"] });
  }

  const days = Array.from({length:7}, (_,i) => { const d = new Date(monday); d.setDate(monday.getDate()+i); return d; });
  const byDay = (d: Date) => (appts ?? []).filter((a:any) => {
    const x = new Date(a.scheduled_at); return x.toDateString() === d.toDateString();
  });

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">Agenda semanal</h1>
          <p className="text-sm text-muted-foreground">
            {monday.toLocaleDateString("pt-BR")} → {sunday.toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={()=>setWeekOffset(w=>w-1)}>← Anterior</Button>
          <Button variant="outline" size="sm" onClick={()=>setWeekOffset(0)}>Hoje</Button>
          <Button variant="outline" size="sm" onClick={()=>setWeekOffset(w=>w+1)}>Próxima →</Button>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="in_progress">Em atendimento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          {clinicId && <NewAppointmentDialog clinicId={clinicId} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((d) => {
          const isToday = d.toDateString() === new Date().toDateString();
          const items = byDay(d);
          return (
            <Card key={d.toISOString()} className={`p-3 min-h-[200px] ${isToday ? "border-primary" : ""}`}>
              <div className="text-xs uppercase text-muted-foreground">{d.toLocaleDateString("pt-BR",{weekday:"short"})}</div>
              <div className={`text-lg font-black ${isToday?"text-primary":""}`}>{d.getDate()}</div>
              <div className="space-y-1.5 mt-2">
                {items.length===0 && <div className="text-[11px] text-muted-foreground">—</div>}
                {items.map((a:any) => (
                  <div key={a.id} className={`text-xs p-2 rounded-lg ${STATUS_COLORS[a.status] ?? "bg-muted"}`}>
                    <div className="font-semibold">{new Date(a.scheduled_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</div>
                    <div className="truncate">{a.pets?.name} · {a.services?.name ?? "Consulta"}</div>
                    <div className="flex gap-1 mt-1">
                      {a.status==="scheduled" && <button className="underline" onClick={()=>setStatus(a.id,"confirmed")}>confirmar</button>}
                      {a.status!=="completed" && a.status!=="canceled" && <button className="underline" onClick={()=>setStatus(a.id,"in_progress")}>iniciar</button>}
                      {a.status==="in_progress" && <button className="underline" onClick={()=>setStatus(a.id,"completed")}>concluir</button>}
                      {a.status!=="canceled" && <button className="underline" onClick={()=>setStatus(a.id,"canceled")}>×</button>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h2 className="font-bold text-lg mb-3">Lista da semana</h2>
        <div className="divide-y">
          {(appts?.length ?? 0)===0 && <div className="py-6 text-sm text-muted-foreground">Sem agendamentos nesta semana.</div>}
          {appts?.map((a:any) => (
            <div key={a.id} className="py-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[220px]">
                <div className="font-semibold">{a.pets?.name} · {a.services?.name ?? "Consulta"}</div>
                <div className="text-xs text-muted-foreground">{new Date(a.scheduled_at).toLocaleString("pt-BR")} · {a.duration_min}min</div>
                {a.notes && <div className="text-xs mt-1 text-muted-foreground">"{a.notes}"</div>}
              </div>
              <Badge variant="outline" className="capitalize">{a.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NewAppointmentDialog({ clinicId }: { clinicId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ pet_id:"", service_id:"", scheduled_at:"", duration_min:"30", notes:"" });

  const { data: pets } = useQuery({
    enabled: open,
    queryKey: ["agenda-pets", clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("id, name, tutor_id").eq("clinic_id", clinicId).order("name");
      return data ?? [];
    },
  });
  const { data: services } = useQuery({
    enabled: open,
    queryKey: ["agenda-services", clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("id, name, duration_min").eq("clinic_id", clinicId).eq("active", true);
      return data ?? [];
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const pet = pets?.find(p=>p.id===f.pet_id);
    if (!pet) return toast.error("Selecione um pet");
    const { error } = await supabase.from("appointments").insert({
      clinic_id: clinicId,
      pet_id: pet.id,
      tutor_id: pet.tutor_id,
      service_id: f.service_id || null,
      scheduled_at: new Date(f.scheduled_at).toISOString(),
      duration_min: Number(f.duration_min),
      notes: f.notes || null,
      status: "scheduled",
    });
    if (error) return toast.error(error.message);
    toast.success("Agendamento criado");
    setOpen(false);
    setF({ pet_id:"", service_id:"", scheduled_at:"", duration_min:"30", notes:"" });
    qc.invalidateQueries({ queryKey: ["agenda"] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="rounded-full">+ Agendar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo agendamento</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Pet</Label>
            <Select value={f.pet_id} onValueChange={v=>setF({...f,pet_id:v})}>
              <SelectTrigger><SelectValue placeholder="Selecione um pet" /></SelectTrigger>
              <SelectContent>{pets?.map(p=><SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Serviço</Label>
            <Select value={f.service_id} onValueChange={v=>{
              const s = services?.find(x=>x.id===v);
              setF({...f, service_id:v, duration_min: String(s?.duration_min ?? 30)});
            }}>
              <SelectTrigger><SelectValue placeholder="Selecione um serviço" /></SelectTrigger>
              <SelectContent>{services?.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Data e hora</Label><Input type="datetime-local" required value={f.scheduled_at} onChange={e=>setF({...f,scheduled_at:e.target.value})}/></div>
          <div><Label>Duração (min)</Label><Input type="number" value={f.duration_min} onChange={e=>setF({...f,duration_min:e.target.value})}/></div>
          <div className="col-span-2"><Label>Observações</Label><Textarea rows={2} value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/></div>
          <div className="col-span-2 flex justify-end"><Button className="rounded-full">Confirmar agendamento</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}