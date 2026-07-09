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

export const Route = createFileRoute("/_authenticated/clinica/equipe")({
  component: EquipePage,
});

function EquipePage() {
  const { data: ctx } = useClinicContext();
  const clinicId = ctx?.clinic.id;
  const canManage = ctx?.role === "clinic_admin";

  const { data: staff } = useQuery({
    enabled: !!clinicId,
    queryKey: ["staff", clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles")
        .select("user_id, role, active, profiles:user_id(full_name, email, phone)")
        .eq("clinic_id", clinicId!).in("role", ["clinic_admin","veterinarian","receptionist"]);
      return data ?? [];
    },
  });

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">Equipe</h1>
          <p className="text-sm text-muted-foreground">Veterinários, recepcionistas e administradores</p>
        </div>
        {canManage && clinicId && <NewStaffDialog clinicId={clinicId} />}
      </div>

      <Card className="p-5">
        <div className="divide-y">
          {(staff?.length ?? 0)===0 && <div className="py-6 text-sm text-muted-foreground text-center">Nenhum membro.</div>}
          {staff?.map((s:any) => (
            <div key={s.user_id+s.role} className="py-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center font-bold">
                {(s.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{s.profiles?.full_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{s.profiles?.email}</div>
              </div>
              <Badge variant="outline" className="capitalize">{s.role.replace("_"," ")}</Badge>
              <Badge variant={s.active?"default":"outline"}>{s.active?"ativo":"pausado"}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NewStaffDialog({ clinicId }: { clinicId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ full_name:"", email:"", password:"", phone:"", role:"veterinarian" });
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.functions.invoke("admin-create-user", {
      body: { ...f, clinic_id: clinicId },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Membro adicionado! Envie a senha.");
    setF({ full_name:"", email:"", password:"", phone:"", role:"veterinarian" });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["staff", clinicId] });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="rounded-full">+ Novo membro</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar membro da equipe</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Nome</Label><Input required value={f.full_name} onChange={e=>setF({...f,full_name:e.target.value})}/></div>
          <div><Label>E-mail</Label><Input type="email" required value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></div>
          <div><Label>Telefone</Label><Input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></div>
          <div>
            <Label>Função</Label>
            <Select value={f.role} onValueChange={v=>setF({...f,role:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="veterinarian">Veterinário</SelectItem>
                <SelectItem value="receptionist">Recepcionista</SelectItem>
                <SelectItem value="clinic_admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Senha inicial</Label><Input required minLength={6} value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></div>
          <div className="col-span-2 flex justify-end"><Button disabled={saving} className="rounded-full">{saving?"Criando…":"Adicionar"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}