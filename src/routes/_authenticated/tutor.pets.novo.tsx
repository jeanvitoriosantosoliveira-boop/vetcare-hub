import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/tutor/pets/novo")({
  component: NewPet,
});

function NewPet() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", species: "dog" as "dog"|"cat"|"bird"|"rodent"|"reptile"|"other",
    breed: "", sex: "unknown" as "male"|"female"|"unknown", birth_date: "", weight_kg: "", color: "", microchip: "",
  });

  const { data: primaryClinic } = useQuery({
    queryKey: ["my-primary-clinic"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("primary_clinic_id, clinics:primary_clinic_id(id, name)").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!primaryClinic?.primary_clinic_id) {
      toast.error("Você ainda não está vinculado a uma clínica. Peça à sua clínica para criar seu cadastro.");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");
      const { error } = await supabase.from("pets").insert({
        tutor_id: user.id,
        clinic_id: primaryClinic.primary_clinic_id,
        name: form.name,
        species: form.species,
        breed: form.breed || null,
        sex: form.sex,
        birth_date: form.birth_date || null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        color: form.color || null,
        microchip: form.microchip || null,
      });
      if (error) throw error;
      toast.success("Pet cadastrado!");
      navigate({ to: "/tutor/pets" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-black mb-6">Cadastrar pet</h1>
      {!primaryClinic?.primary_clinic_id && (
        <Card className="p-4 mb-4 border-warning/40 bg-warning/5 text-sm">
          Você ainda não está vinculado a uma clínica. Peça à recepção da clínica para criar seu cadastro — os pets ficam ligados a ela. <Link to="/tutor" className="underline">Voltar</Link>
        </Card>
      )}
      <Card className="p-6 elevation-1">
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Nome *</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Espécie *</Label>
            <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v as typeof form.species })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Cão</SelectItem>
                <SelectItem value="cat">Gato</SelectItem>
                <SelectItem value="bird">Ave</SelectItem>
                <SelectItem value="rodent">Roedor</SelectItem>
                <SelectItem value="reptile">Réptil</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Raça</Label>
            <Input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
          </div>
          <div>
            <Label>Sexo</Label>
            <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v as typeof form.sex })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Macho</SelectItem>
                <SelectItem value="female">Fêmea</SelectItem>
                <SelectItem value="unknown">Não informado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data de nascimento</Label>
            <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
          </div>
          <div>
            <Label>Peso (kg)</Label>
            <Input type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
          </div>
          <div>
            <Label>Cor</Label>
            <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Microchip</Label>
            <Input value={form.microchip} onChange={(e) => setForm({ ...form, microchip: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex gap-2 justify-end mt-2">
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/tutor/pets" })}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="rounded-full">{loading ? "Salvando..." : "Salvar pet"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}