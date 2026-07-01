import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tutor/pets/novo")({
  component: NewPet,
});

function NewPet() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", species: "cao", breed: "", sex: "", birth_date: "", weight_kg: "", color: "", microchip: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");
      const { error } = await supabase.from("pets").insert({
        tutor_id: user.id,
        name: form.name,
        species: form.species as "cao" | "gato" | "ave" | "roedor" | "reptil" | "outro",
        breed: form.breed || null,
        sex: (form.sex || null) as "macho" | "femea" | null,
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
      <Card className="p-6 elevation-1">
        <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Nome *</Label>
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Espécie *</Label>
            <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cao">Cão</SelectItem>
                <SelectItem value="gato">Gato</SelectItem>
                <SelectItem value="ave">Ave</SelectItem>
                <SelectItem value="roedor">Roedor</SelectItem>
                <SelectItem value="reptil">Réptil</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Raça</Label>
            <Input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
          </div>
          <div>
            <Label>Sexo</Label>
            <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="macho">Macho</SelectItem>
                <SelectItem value="femea">Fêmea</SelectItem>
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