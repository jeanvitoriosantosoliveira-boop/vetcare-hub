import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clinica")({
  component: ClinicaPage,
});

function ClinicaPage() {
  const { data: ctx } = useQuery({
    queryKey: ["clinica","ctx"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no session");
      const { data: roles } = await supabase.from("user_roles")
        .select("role, clinic_id, clinics:clinic_id(id, name, status)")
        .eq("user_id", user.id).eq("active", true);
      const staffRoles = (roles ?? []).filter(r => r.role !== "tutor" && r.clinic_id);
      const clinic = staffRoles[0]?.clinics as { id: string; name: string; status: string } | undefined;
      return { user, role: staffRoles[0]?.role, clinic };
    },
  });

  if (!ctx) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  if (!ctx.clinic) return (
    <div className="p-8 max-w-md mx-auto">
      <Card className="p-8 text-center border-dashed">
        <span className="material-symbols-rounded text-warning" style={{fontSize:48}}>lock</span>
        <h2 className="text-lg font-bold mt-2">Sem acesso a clínica</h2>
        <p className="text-sm text-muted-foreground mt-1">Você não está vinculado a nenhuma clínica ativa.</p>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-jvet grid place-items-center text-white font-black">J</div>
            <div>
              <div className="text-xs text-muted-foreground -mb-0.5">JVet · Clínica</div>
              <div className="font-bold">{ctx.clinic.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{ctx.role}</Badge>
            <Button variant="ghost" onClick={() => supabase.auth.signOut().then(() => location.assign("/auth"))}>Sair</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="agenda">
          <TabsList>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="tutores">Tutores &amp; Pets</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
          </TabsList>

          <TabsContent value="agenda"><AgendaTab clinicId={ctx.clinic.id} /></TabsContent>
          <TabsContent value="tutores"><TutoresTab clinicId={ctx.clinic.id} role={ctx.role!} /></TabsContent>
          <TabsContent value="servicos"><ServicosTab clinicId={ctx.clinic.id} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// -------- Agenda --------
function AgendaTab({ clinicId }: { clinicId: string }) {
  const qc = useQueryClient();
  const { data: appts } = useQuery({
    queryKey: ["clinica","appts",clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("appointments")
        .select("id, scheduled_at, status, notes, pets:pet_id(name), services:service_id(name), tutor_id")
        .eq("clinic_id", clinicId)
        .order("scheduled_at", { ascending: true });
      return data ?? [];
    },
  });
  async function setStatus(id: string, status: "confirmed"|"completed"|"canceled"|"in_progress") {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    qc.invalidateQueries({ queryKey: ["clinica","appts",clinicId] });
  }
  return (
    <Card className="p-6 elevation-1 mt-4">
      <h2 className="font-bold text-lg mb-3">Próximos atendimentos</h2>
      <div className="divide-y">
        {appts?.length === 0 && <div className="py-6 text-sm text-muted-foreground">Sem agendamentos.</div>}
        {appts?.map((a: any) => (
          <div key={a.id} className="py-3 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="font-semibold">{a.pets?.name || "Pet"} · {a.services?.name || "Consulta"}</div>
              <div className="text-xs text-muted-foreground">{new Date(a.scheduled_at).toLocaleString("pt-BR")}</div>
              {a.notes && <div className="text-xs mt-1 text-muted-foreground">"{a.notes}"</div>}
            </div>
            <Badge variant="outline">{a.status}</Badge>
            <div className="flex gap-1">
              {a.status === "scheduled" && <Button size="sm" variant="outline" className="rounded-full" onClick={() => setStatus(a.id,"confirmed")}>Confirmar</Button>}
              {a.status !== "completed" && a.status !== "canceled" && <Button size="sm" variant="outline" className="rounded-full" onClick={() => setStatus(a.id,"completed")}>Concluir</Button>}
              {a.status !== "canceled" && <Button size="sm" variant="ghost" className="rounded-full text-destructive" onClick={() => setStatus(a.id,"canceled")}>Cancelar</Button>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// -------- Tutores --------
function TutoresTab({ clinicId, role }: { clinicId: string; role: string }) {
  const qc = useQueryClient();
  const canCreate = role === "clinic_admin" || role === "receptionist";
  const { data: tutors } = useQuery({
    queryKey: ["clinica","tutors",clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles")
        .select("user_id, active, profiles:user_id(full_name, email, phone)")
        .eq("clinic_id", clinicId).eq("role","tutor");
      return data ?? [];
    },
  });

  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ full_name:"", email:"", password:"", phone:"" });
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.functions.invoke("admin-create-user", {
      body: { ...f, role: "tutor", clinic_id: clinicId },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tutor cadastrado! Envie a senha ao cliente.");
    setF({ full_name:"", email:"", password:"", phone:"" });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["clinica","tutors",clinicId] });
  }

  return (
    <Card className="p-6 elevation-1 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-lg">Tutores da clínica</h2>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="rounded-full">+ Novo tutor</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cadastrar novo tutor</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Nome</Label><Input required value={f.full_name} onChange={e=>setF({...f,full_name:e.target.value})}/></div>
                <div><Label>E-mail</Label><Input type="email" required value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div>
                <div><Label>Telefone</Label><Input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></div>
                <div className="col-span-2"><Label>Senha inicial</Label><Input type="text" minLength={6} required value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></div>
                <div className="col-span-2 flex justify-end"><Button className="rounded-full" disabled={saving}>{saving?"Criando…":"Criar tutor"}</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="divide-y">
        {tutors?.length === 0 && <div className="py-6 text-sm text-muted-foreground">Nenhum tutor vinculado ainda.</div>}
        {tutors?.map((t: any) => (
          <div key={t.user_id} className="py-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="font-semibold">{t.profiles?.full_name || "—"}</div>
              <div className="text-xs text-muted-foreground">{t.profiles?.email} · {t.profiles?.phone || "sem telefone"}</div>
            </div>
            <Badge variant="outline">{t.active ? "ativo" : "pausado"}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

// -------- Serviços --------
function ServicosTab({ clinicId }: { clinicId: string }) {
  const qc = useQueryClient();
  const { data: services } = useQuery({
    queryKey: ["clinica","services",clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*").eq("clinic_id", clinicId).order("name");
      return data ?? [];
    },
  });
  const [f, setF] = useState({ name:"", price:"0", duration_min:"30" });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("services").insert({
      clinic_id: clinicId, name: f.name, price: Number(f.price), duration_min: Number(f.duration_min), active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Serviço criado");
    setF({ name:"", price:"0", duration_min:"30" });
    qc.invalidateQueries({ queryKey: ["clinica","services",clinicId] });
  }
  async function toggle(id: string, active: boolean) {
    await supabase.from("services").update({ active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["clinica","services",clinicId] });
  }
  return (
    <Card className="p-6 elevation-1 mt-4">
      <h2 className="font-bold text-lg mb-3">Catálogo de serviços</h2>
      <form onSubmit={add} className="grid grid-cols-4 gap-3 mb-4">
        <div className="col-span-2"><Label>Nome</Label><Input required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>
        <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={f.price} onChange={e=>setF({...f,price:e.target.value})}/></div>
        <div><Label>Duração (min)</Label><Input type="number" value={f.duration_min} onChange={e=>setF({...f,duration_min:e.target.value})}/></div>
        <div className="col-span-4 flex justify-end"><Button className="rounded-full">+ Adicionar serviço</Button></div>
      </form>
      <div className="divide-y">
        {services?.length === 0 && <div className="py-6 text-sm text-muted-foreground">Nenhum serviço cadastrado.</div>}
        {services?.map((s) => (
          <div key={s.id} className="py-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="font-semibold">{s.name}</div>
              <div className="text-xs text-muted-foreground">R$ {Number(s.price).toFixed(2)} · {s.duration_min} min</div>
            </div>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => toggle(s.id, s.active)}>{s.active ? "Desativar" : "Ativar"}</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}