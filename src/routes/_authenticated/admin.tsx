import { createFileRoute, Link } from "@tanstack/react-router";
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

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();

  const { data: clinics, isLoading } = useQuery({
    queryKey: ["admin", "clinics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function togglePause(id: string, status: string) {
    const next = status === "active" ? "paused" : "active";
    const patch = next === "paused"
      ? { status: next as "paused", paused_at: new Date().toISOString(), paused_reason: "Suspensa pelo admin" }
      : { status: next as "active", paused_at: null, paused_reason: null };
    const { error } = await supabase.from("clinics").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(next === "paused" ? "Clínica pausada" : "Clínica reativada");
    qc.invalidateQueries({ queryKey: ["admin", "clinics"] });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-jvet grid place-items-center text-white font-black">J</div>
            <div>
              <div className="text-xs text-muted-foreground -mb-0.5">JVet · Super Admin</div>
              <div className="font-bold">Gestão do SaaS</div>
            </div>
          </div>
          <Button variant="ghost" onClick={() => supabase.auth.signOut().then(() => location.assign("/auth"))}>Sair</Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Stat label="Clínicas ativas" value={clinics?.filter(c => c.status === "active").length ?? 0} icon="storefront" />
          <Stat label="Clínicas pausadas" value={clinics?.filter(c => c.status === "paused").length ?? 0} icon="pause_circle" />
          <Stat label="Total no sistema" value={clinics?.length ?? 0} icon="apartment" />
        </div>

        <Card className="p-6 elevation-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Clínicas veterinárias</h2>
              <p className="text-sm text-muted-foreground">Crie, suspenda ou reative acessos. Pausar uma clínica bloqueia automaticamente toda a equipe e os tutores vinculados.</p>
            </div>
            <NewClinicDialog onCreated={() => qc.invalidateQueries({ queryKey: ["admin", "clinics"] })} />
          </div>

          <div className="divide-y">
            {isLoading && <div className="py-6 text-sm text-muted-foreground">Carregando…</div>}
            {clinics?.length === 0 && <div className="py-8 text-sm text-muted-foreground text-center">Nenhuma clínica cadastrada ainda.</div>}
            {clinics?.map((c) => (
              <div key={c.id} className="py-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[220px]">
                  <div className="font-semibold flex items-center gap-2">
                    {c.name}
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">{c.email || "—"} · {c.city || "—"}/{c.state || "—"}</div>
                </div>
                <ClinicUsersDialog clinicId={c.id} clinicName={c.name} />
                <Button size="sm" variant={c.status === "active" ? "outline" : "default"} className="rounded-full" onClick={() => togglePause(c.id, c.status)}>
                  {c.status === "active" ? "Pausar" : "Reativar"}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Link to="/tutor" className="text-xs text-muted-foreground">Ir para portal do tutor →</Link>
      </main>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <Card className="p-5 elevation-1">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary grid place-items-center">
          <span className="material-symbols-rounded">{icon}</span>
        </div>
        <div>
          <div className="text-2xl font-black">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Ativa", cls: "bg-success/15 text-success border-success/30" },
    paused: { label: "Pausada", cls: "bg-warning/15 text-warning border-warning/30" },
    canceled: { label: "Cancelada", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  };
  const m = map[status] ?? { label: status, cls: "" };
  return <Badge variant="outline" className={`text-[10px] ${m.cls}`}>{m.label}</Badge>;
}

function NewClinicDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", city: "", state: "", cnpj: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("clinics").insert({
      name: f.name, email: f.email || null, phone: f.phone || null,
      city: f.city || null, state: f.state || null, cnpj: f.cnpj || null,
      status: "active",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Clínica criada");
    setOpen(false);
    setF({ name: "", email: "", phone: "", city: "", state: "", cnpj: "" });
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="rounded-full">+ Nova clínica</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova clínica</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Nome *</Label><Input required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>
          <div><Label>CNPJ</Label><Input value={f.cnpj} onChange={e=>setF({...f,cnpj:e.target.value})}/></div>
          <div><Label>Telefone</Label><Input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></div>
          <div className="col-span-2"><Label>E-mail</Label><Input type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div>
          <div><Label>Cidade</Label><Input value={f.city} onChange={e=>setF({...f,city:e.target.value})}/></div>
          <div><Label>UF</Label><Input maxLength={2} value={f.state} onChange={e=>setF({...f,state:e.target.value.toUpperCase()})}/></div>
          <div className="col-span-2 flex justify-end pt-2"><Button className="rounded-full" disabled={saving}>{saving?"Salvando…":"Criar clínica"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ClinicUsersDialog({ clinicId, clinicName }: { clinicId: string; clinicName: string }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const [f, setF] = useState({ email: "", password: "", full_name: "", role: "clinic_admin" as "clinic_admin"|"veterinarian"|"receptionist" });
  const [saving, setSaving] = useState(false);

  const { data: staff } = useQuery({
    queryKey: ["admin","clinic-staff",clinicId],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles")
        .select("id, role, active, user_id, profiles:user_id(full_name, email)")
        .eq("clinic_id", clinicId)
        .neq("role", "tutor");
      return data ?? [];
    },
  });

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.functions.invoke("admin-create-user", {
      body: { ...f, clinic_id: clinicId },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Usuário criado");
    setF({ email:"",password:"",full_name:"",role:"clinic_admin" });
    qc.invalidateQueries({ queryKey: ["admin","clinic-staff",clinicId] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="ghost" className="rounded-full">Equipe</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Equipe de {clinicName}</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-56 overflow-auto">
          {staff?.length === 0 && <div className="text-sm text-muted-foreground">Sem usuários ainda.</div>}
          {staff?.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{s.profiles?.full_name || s.profiles?.email || s.user_id.slice(0,8)}</div>
                <div className="text-xs text-muted-foreground">{s.role}</div>
              </div>
              <Badge variant="outline" className="text-[10px]">{s.active ? "ativo" : "pausado"}</Badge>
            </div>
          ))}
        </div>
        <form onSubmit={createUser} className="grid grid-cols-2 gap-3 border-t pt-4">
          <div className="col-span-2 text-sm font-semibold">Adicionar novo usuário</div>
          <div className="col-span-2"><Label>Nome</Label><Input required value={f.full_name} onChange={e=>setF({...f,full_name:e.target.value})}/></div>
          <div><Label>E-mail</Label><Input type="email" required value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div>
          <div><Label>Senha inicial</Label><Input type="text" minLength={6} required value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></div>
          <div className="col-span-2">
            <Label>Perfil</Label>
            <Select value={f.role} onValueChange={(v)=>setF({...f,role:v as typeof f.role})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="clinic_admin">Admin da clínica</SelectItem>
                <SelectItem value="veterinarian">Veterinário(a)</SelectItem>
                <SelectItem value="receptionist">Recepção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 flex justify-end"><Button className="rounded-full" disabled={saving}>{saving?"Criando…":"Criar acesso"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}