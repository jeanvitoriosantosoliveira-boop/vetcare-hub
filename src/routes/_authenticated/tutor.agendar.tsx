import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tutor/agendar")({
  component: Agendar,
});

function Agendar() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    pet_id: "", clinic_id: "", service_id: "", scheduled_at: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const { data: pets } = useQuery({
    queryKey: ["my-pets-select"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("pets").select("id, name, species, clinic_id").eq("tutor_id", user.id);
      return data ?? [];
    },
  });

  const selectedPet = pets?.find((p) => p.id === form.pet_id);
  const clinicId = selectedPet?.clinic_id || "";

  const { data: clinic } = useQuery({
    queryKey: ["clinic", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase.from("clinics").select("id, name").eq("id", clinicId).maybeSingle();
      return data;
    },
  });

  const { data: services } = useQuery({
    queryKey: ["services", clinicId],
    enabled: !!clinicId,
    queryFn: async () => {
      const { data } = await supabase.from("services").select("id, name, duration_min").eq("clinic_id", clinicId).eq("active", true);
      return data ?? [];
    },
  });

  async function submit() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");
      if (!clinicId) throw new Error("Selecione um pet");
      const { error } = await supabase.from("appointments").insert({
        clinic_id: clinicId,
        pet_id: form.pet_id,
        tutor_id: user.id,
        service_id: form.service_id || null,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        notes: form.notes || null,
        status: "scheduled",
      });
      if (error) throw error;
      toast.success("Agendamento solicitado!");
      navigate({ to: "/tutor" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-black mb-2">Agendar consulta</h1>
      <p className="text-muted-foreground mb-6 text-sm">Passo {step} de 4</p>
      <div className="h-1.5 bg-muted rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-gradient-jvet transition-all" style={{ width: `${(step/4)*100}%` }} />
      </div>

      <Card className="p-6 elevation-1 space-y-4">
        {step === 1 && (
          <div>
            <Label>Selecione o pet</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {pets?.map((p) => (
                <button key={p.id} type="button" onClick={() => setForm({ ...form, pet_id: p.id })}
                  className={`p-4 rounded-2xl border-2 text-left transition ${form.pet_id === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{p.species}</div>
                </button>
              ))}
              {pets && pets.length === 0 && <p className="text-sm text-muted-foreground">Cadastre um pet primeiro.</p>}
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <Label>Tipo de serviço</Label>
            <Select value={form.service_id} onValueChange={(v) => setForm({ ...form, service_id: v })}>
              <SelectTrigger><SelectValue placeholder={services?.length ? "Selecione" : "Nenhum serviço cadastrado"} /></SelectTrigger>
              <SelectContent>
                {services?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.duration_min}min)</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">Clínica: <b>{clinic?.name || "-"}</b></p>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <div>
              <Label>Data e horário</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <Label>Observações (opcional)</Label>
              <Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Sintomas, dúvidas..." />
            </div>
            <Card className="p-4 bg-muted/50">
              <div className="text-sm space-y-1">
                <div><b>Pet:</b> {pets?.find(p => p.id === form.pet_id)?.name}</div>
                <div><b>Serviço:</b> {services?.find(s => s.id === form.service_id)?.name || "-"}</div>
                <div><b>Clínica:</b> {clinic?.name || "-"}</div>
                <div><b>Quando:</b> {form.scheduled_at && new Date(form.scheduled_at).toLocaleString("pt-BR")}</div>
              </div>
            </Card>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>Voltar</Button>
          {step < 4 ? (
            <Button className="rounded-full" onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !form.pet_id) || (step === 3 && !form.scheduled_at)}>
              Próximo
            </Button>
          ) : (
            <Button className="rounded-full" onClick={submit} disabled={saving}>{saving ? "Enviando..." : "Confirmar agendamento"}</Button>
          )}
        </div>
      </Card>
    </div>
  );
}