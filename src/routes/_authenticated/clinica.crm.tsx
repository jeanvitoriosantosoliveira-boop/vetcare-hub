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

export const Route = createFileRoute("/_authenticated/clinica/crm")({
  component: CrmPage,
});

function CrmPage() {
  const { data: ctx } = useClinicContext();
  const clinicId = ctx?.clinic.id;
  const [search, setSearch] = useState("");

  const { data: tutors } = useQuery({
    enabled: !!clinicId,
    queryKey: ["crm-tutors", clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles")
        .select("user_id, active, profiles:user_id(full_name, email, phone, cpf, avatar_url)")
        .eq("clinic_id", clinicId!).eq("role","tutor");
      return data ?? [];
    },
  });

  const { data: pets } = useQuery({
    enabled: !!clinicId,
    queryKey: ["crm-pets", clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("pets")
        .select("id, name, species, breed, sex, tutor_id, birth_date, photo_url")
        .eq("clinic_id", clinicId!).order("name");
      return data ?? [];
    },
  });

  const filteredTutors = (tutors ?? []).filter((t: any) =>
    !search || (t.profiles?.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (t.profiles?.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">CRM</h1>
          <p className="text-sm text-muted-foreground">Tutores e pets da sua clínica</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Buscar tutor..." value={search} onChange={e=>setSearch(e.target.value)} className="w-64" />
          {clinicId && <NewTutorDialog clinicId={clinicId} />}
          {clinicId && (tutors?.length ?? 0) > 0 && <NewPetDialog clinicId={clinicId} tutors={tutors!} />}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><span className="material-symbols-rounded text-primary">groups</span>Tutores ({filteredTutors.length})</h2>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {filteredTutors.length === 0 && <div className="py-6 text-sm text-muted-foreground text-center">Nenhum tutor.</div>}
            {filteredTutors.map((t:any) => (
              <div key={t.user_id} className="py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center font-bold">
                  {(t.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{t.profiles?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.profiles?.email} · {t.profiles?.phone || "sem telefone"}</div>
                </div>
                <Badge variant="outline" className={t.active?"":"opacity-50"}>{t.active?"ativo":"pausado"}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><span className="material-symbols-rounded text-accent">pets</span>Pets ({pets?.length ?? 0})</h2>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {(pets?.length ?? 0) === 0 && <div className="py-6 text-sm text-muted-foreground text-center">Nenhum pet.</div>}
            {pets?.map((p:any) => {
              const tutor = tutors?.find((t:any)=>t.user_id===p.tutor_id);
              const age = p.birth_date ? Math.floor((Date.now()-new Date(p.birth_date).getTime())/(365.25*86400000)) : null;
              return (
                <div key={p.id} className="py-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent grid place-items-center">
                    <span className="material-symbols-rounded" style={{fontSize:20}}>pets</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.species} {p.breed?`· ${p.breed}`:""} {age!==null?`· ${age}a`:""} · {(tutor as any)?.profiles?.full_name ?? "—"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function NewTutorDialog({ clinicId }: { clinicId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ full_name:"", email:"", password:"", phone:"" });
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.functions.invoke("admin-create-user", {
      body: { ...f, role:"tutor", clinic_id: clinicId },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tutor cadastrado!");
    setF({ full_name:"", email:"", password:"", phone:"" });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["crm-tutors"] });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="rounded-full">+ Tutor</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo tutor</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Nome</Label><Input required value={f.full_name} onChange={e=>setF({...f,full_name:e.target.value})}/></div>
          <div><Label>E-mail</Label><Input type="email" required value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div>
          <div><Label>Telefone</Label><Input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></div>
          <div className="col-span-2"><Label>Senha inicial</Label><Input required minLength={6} value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></div>
          <div className="col-span-2 flex justify-end"><Button disabled={saving} className="rounded-full">{saving?"Criando…":"Criar tutor"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewPetDialog({ clinicId, tutors }: { clinicId: string; tutors: any[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name:"", species:"dog", breed:"", sex:"unknown", tutor_id:"", birth_date:"" });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("pets").insert({
      clinic_id: clinicId,
      tutor_id: f.tutor_id,
      name: f.name,
      species: f.species as any,
      breed: f.breed || null,
      sex: f.sex as any,
      birth_date: f.birth_date || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Pet cadastrado!");
    setF({ name:"", species:"dog", breed:"", sex:"unknown", tutor_id:"", birth_date:"" });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["crm-pets"] });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="rounded-full">+ Pet</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo pet</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Tutor</Label>
            <Select value={f.tutor_id} onValueChange={v=>setF({...f,tutor_id:v})}>
              <SelectTrigger><SelectValue placeholder="Selecione o tutor" /></SelectTrigger>
              <SelectContent>
                {tutors.map(t=><SelectItem key={t.user_id} value={t.user_id}>{t.profiles?.full_name ?? t.profiles?.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Nome</Label><Input required value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>
          <div>
            <Label>Espécie</Label>
            <Select value={f.species} onValueChange={v=>setF({...f,species:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Cachorro</SelectItem>
                <SelectItem value="cat">Gato</SelectItem>
                <SelectItem value="bird">Ave</SelectItem>
                <SelectItem value="rodent">Roedor</SelectItem>
                <SelectItem value="reptile">Réptil</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Raça</Label><Input value={f.breed} onChange={e=>setF({...f,breed:e.target.value})}/></div>
          <div>
            <Label>Sexo</Label>
            <Select value={f.sex} onValueChange={v=>setF({...f,sex:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Macho</SelectItem>
                <SelectItem value="female">Fêmea</SelectItem>
                <SelectItem value="unknown">Não informado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Nascimento</Label><Input type="date" value={f.birth_date} onChange={e=>setF({...f,birth_date:e.target.value})}/></div>
          <div className="col-span-2 flex justify-end"><Button className="rounded-full">Cadastrar pet</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}