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

export const Route = createFileRoute("/_authenticated/clinica/financeiro")({
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { data: ctx } = useClinicContext();
  const clinicId = ctx?.clinic.id;
  const qc = useQueryClient();

  const { data: payments } = useQuery({
    enabled: !!clinicId,
    queryKey: ["payments", clinicId],
    queryFn: async () => {
      const { data } = await supabase.from("payments")
        .select("id, amount, status, method, notes, paid_at, created_at, tutor_id")
        .eq("clinic_id", clinicId!).order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    },
  });

  const paid = (payments ?? []).filter(p=>p.status==="pago");
  const pending = (payments ?? []).filter(p=>p.status==="pendente");
  const revenue = paid.reduce((a,p)=>a+Number(p.amount||0),0);
  const openAmount = pending.reduce((a,p)=>a+Number(p.amount||0),0);

  async function markPaid(id: string) {
    await supabase.from("payments").update({ status:"pago", paid_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["payments", clinicId] });
    toast.success("Marcado como pago");
  }

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Receitas e contas a receber</p>
        </div>
        {clinicId && <NewPaymentDialog clinicId={clinicId} />}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-5"><div className="text-xs text-muted-foreground">Recebido</div><div className="text-2xl font-black text-success">R$ {revenue.toFixed(2)}</div></Card>
        <Card className="p-5"><div className="text-xs text-muted-foreground">A receber</div><div className="text-2xl font-black text-warning">R$ {openAmount.toFixed(2)}</div></Card>
        <Card className="p-5"><div className="text-xs text-muted-foreground">Transações</div><div className="text-2xl font-black">{payments?.length ?? 0}</div></Card>
      </div>

      <Card className="p-5">
        <h2 className="font-bold text-lg mb-3">Lançamentos</h2>
        {(payments?.length ?? 0)===0 && <div className="py-6 text-sm text-muted-foreground text-center">Nenhum lançamento.</div>}
        <div className="divide-y">
          {payments?.map((p:any) => (
            <div key={p.id} className="py-3 flex flex-wrap items-center gap-3">
              <div className="flex-1">
                <div className="font-semibold">R$ {Number(p.amount).toFixed(2)} {p.method && `· ${p.method}`}</div>
                <div className="text-xs text-muted-foreground">
                  {p.paid_at ? `Pago em ${new Date(p.paid_at).toLocaleDateString("pt-BR")}` : `Criado em ${new Date(p.created_at).toLocaleDateString("pt-BR")}`}
                  {p.notes && ` · ${p.notes}`}
                </div>
              </div>
              <Badge variant={p.status==="pago"?"default":"outline"} className="capitalize">{p.status}</Badge>
              {p.status!=="pago" && <Button size="sm" variant="outline" className="rounded-full" onClick={()=>markPaid(p.id)}>Marcar pago</Button>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NewPaymentDialog({ clinicId }: { clinicId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ amount:"", method:"pix", status:"pago", notes:"" });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("payments").insert({
      clinic_id: clinicId,
      amount: Number(f.amount),
      method: f.method,
      status: f.status,
      paid_at: f.status==="pago" ? new Date().toISOString() : null,
      notes: f.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Lançamento salvo");
    setOpen(false);
    setF({ amount:"", method:"pix", status:"pago", notes:"" });
    qc.invalidateQueries({ queryKey: ["payments", clinicId] });
    qc.invalidateQueries({ queryKey: ["clinica","dash"] });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="rounded-full">+ Novo lançamento</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar pagamento</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div><Label>Valor (R$)</Label><Input required type="number" step="0.01" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/></div>
          <div>
            <Label>Método</Label>
            <Select value={f.method} onValueChange={v=>setF({...f,method:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao_debito">Débito</SelectItem>
                <SelectItem value="cartao_credito">Crédito</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Status</Label>
            <Select value={f.status} onValueChange={v=>setF({...f,status:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Descrição</Label><Input value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/></div>
          <div className="col-span-2 flex justify-end"><Button className="rounded-full">Salvar</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}