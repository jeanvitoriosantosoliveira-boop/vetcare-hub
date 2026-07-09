import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useClinicContext } from "@/hooks/useClinicContext";

export const Route = createFileRoute("/_authenticated/clinica/configuracoes")({
  component: ConfigPage,
});

function ConfigPage() {
  const { data: ctx } = useClinicContext();
  const qc = useQueryClient();
  const canEdit = ctx?.role === "clinic_admin";
  const [f, setF] = useState({ name:"", email:"", phone:"", address:"", city:"", state:"", cnpj:"" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ctx?.clinic.id || loaded) return;
    supabase.from("clinics").select("*").eq("id", ctx.clinic.id).maybeSingle().then(({data}) => {
      if (data) {
        setF({
          name: data.name ?? "", email: data.email ?? "", phone: data.phone ?? "",
          address: data.address ?? "", city: data.city ?? "", state: data.state ?? "", cnpj: data.cnpj ?? "",
        });
        setLoaded(true);
      }
    });
  }, [ctx?.clinic.id, loaded]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!ctx) return;
    const { error } = await supabase.from("clinics").update(f).eq("id", ctx.clinic.id);
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    qc.invalidateQueries({ queryKey: ["clinic-context"] });
  }

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-black">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados institucionais da clínica</p>
      </div>

      <Card className="p-6">
        <form onSubmit={save} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Nome da clínica</Label><Input value={f.name} onChange={e=>setF({...f,name:e.target.value})} disabled={!canEdit}/></div>
          <div><Label>CNPJ</Label><Input value={f.cnpj} onChange={e=>setF({...f,cnpj:e.target.value})} disabled={!canEdit}/></div>
          <div><Label>Telefone</Label><Input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} disabled={!canEdit}/></div>
          <div className="col-span-2"><Label>E-mail</Label><Input value={f.email} onChange={e=>setF({...f,email:e.target.value})} disabled={!canEdit}/></div>
          <div className="col-span-2"><Label>Endereço</Label><Input value={f.address} onChange={e=>setF({...f,address:e.target.value})} disabled={!canEdit}/></div>
          <div><Label>Cidade</Label><Input value={f.city} onChange={e=>setF({...f,city:e.target.value})} disabled={!canEdit}/></div>
          <div><Label>Estado</Label><Input value={f.state} onChange={e=>setF({...f,state:e.target.value})} disabled={!canEdit}/></div>
          {canEdit && <div className="col-span-2 flex justify-end"><Button className="rounded-full">Salvar alterações</Button></div>}
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold text-lg mb-2">Assinatura</h2>
        <p className="text-sm text-muted-foreground">
          Status: <span className="font-semibold capitalize">{ctx?.clinic.status}</span>.
          Para alterar plano, contate o comercial pelo WhatsApp <a className="text-primary underline" href="https://wa.me/5546991163405" target="_blank">46 99116-3405</a>.
        </p>
      </Card>
    </div>
  );
}