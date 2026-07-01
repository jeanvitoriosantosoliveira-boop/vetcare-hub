import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { differenceInDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import QRCode from "react-qr-code";

export const Route = createFileRoute("/_authenticated/tutor/pets/$petId")({
  component: PetProfile,
});

function PetProfile() {
  const { petId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["pet", petId],
    queryFn: async () => {
      const [pet, vaccines, appointments, records] = await Promise.all([
        supabase.from("pets").select("*").eq("id", petId).maybeSingle(),
        supabase.from("vaccines").select("*").eq("pet_id", petId).order("applied_at", { ascending: false }),
        supabase.from("appointments").select("id, scheduled_at, status, clinic_id, services(name)").eq("pet_id", petId).order("scheduled_at", { ascending: false }),
        supabase.from("medical_records").select("id, created_at, diagnosis").eq("pet_id", petId).order("created_at", { ascending: false }),
      ]);
      return { pet: pet.data, vaccines: vaccines.data ?? [], appointments: appointments.data ?? [], records: records.data ?? [] };
    },
  });

  if (isLoading) return <Card className="h-96 animate-pulse" />;
  if (!data?.pet) return <div>Pet não encontrado</div>;
  const pet = data.pet;
  const age = pet.birth_date ? Math.floor(differenceInDays(new Date(), parseISO(pet.birth_date)) / 365) : null;
  const qrUrl = typeof window !== "undefined" ? `${window.location.origin}/p/${pet.public_token}` : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/tutor/pets" className="text-muted-foreground hover:text-foreground">← Meus pets</Link>
      </div>

      <Card className="p-6 elevation-1 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="h-28 w-28 rounded-2xl bg-gradient-jvet grid place-items-center text-white overflow-hidden shrink-0">
          {pet.photo_url ? <img src={pet.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-rounded" style={{fontSize:56}}>pets</span>}
        </div>
        <div className="flex-1 min-w-0 text-center md:text-left">
          <h1 className="text-3xl font-black">{pet.name}</h1>
          <p className="text-muted-foreground capitalize">{pet.breed || pet.species} {pet.sex && `• ${pet.sex}`} {age !== null && `• ${age} ano${age !== 1 ? "s" : ""}`}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            {pet.weight_kg && <span className="mono"><b>{pet.weight_kg}</b> kg</span>}
            {pet.color && <span>Cor: {pet.color}</span>}
            {pet.microchip && <span className="mono text-xs">chip: {pet.microchip}</span>}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="carteirinha">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="carteirinha">Carteirinha</TabsTrigger>
          <TabsTrigger value="vacinas">Vacinas</TabsTrigger>
          <TabsTrigger value="consultas">Consultas</TabsTrigger>
          <TabsTrigger value="exames">Exames</TabsTrigger>
        </TabsList>

        <TabsContent value="carteirinha" className="mt-6">
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-jvet rounded-3xl p-6 text-white elevation-2 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-center gap-2 opacity-90">
                  <span className="material-symbols-rounded" style={{fontSize:20}}>badge</span>
                  <span className="text-xs uppercase tracking-widest">Carteirinha JVet</span>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-white/95 grid place-items-center text-primary overflow-hidden shrink-0">
                    {pet.photo_url ? <img src={pet.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-rounded" style={{fontSize:44}}>pets</span>}
                  </div>
                  <div className="min-w-0">
                    <div className="text-2xl font-black truncate">{pet.name}</div>
                    <div className="text-sm opacity-90 capitalize">{pet.breed || pet.species}</div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
                  <div><div className="opacity-70">Idade</div><div className="font-semibold mono">{age !== null ? `${age}a` : "-"}</div></div>
                  <div><div className="opacity-70">Peso</div><div className="font-semibold mono">{pet.weight_kg ? `${pet.weight_kg}kg` : "-"}</div></div>
                  <div><div className="opacity-70">Sexo</div><div className="font-semibold capitalize">{pet.sex || "-"}</div></div>
                </div>
                <div className="mt-6 bg-white p-3 rounded-xl flex items-center gap-3">
                  <div className="bg-white p-1 rounded"><QRCode value={qrUrl} size={68} /></div>
                  <div className="text-primary text-xs">
                    <div className="font-bold">Escaneie o QR</div>
                    <div className="opacity-80">Acesso rápido à ficha pública deste pet</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-center">
              <Button variant="outline" className="rounded-full" onClick={() => window.print()}><span className="material-symbols-rounded mr-1" style={{fontSize:18}}>print</span>Imprimir</Button>
              <Button variant="outline" className="rounded-full" onClick={() => navigator.share ? navigator.share({ url: qrUrl, title: `Carteirinha ${pet.name}` }) : navigator.clipboard.writeText(qrUrl)}><span className="material-symbols-rounded mr-1" style={{fontSize:18}}>share</span>Compartilhar</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vacinas" className="mt-6">
          {data.vaccines.length === 0 ? (
            <Card className="p-10 text-center border-dashed">Nenhuma vacina registrada ainda.</Card>
          ) : (
            <div className="space-y-2">
              {data.vaccines.map((v) => {
                const days = v.next_dose_at ? differenceInDays(parseISO(v.next_dose_at), new Date()) : null;
                const badge = days === null ? null : days < 0 ? "bg-destructive/10 text-destructive" : days < 15 ? "bg-warning/10 text-warning" : "bg-success/10 text-success";
                const label = days === null ? "-" : days < 0 ? "Vencida" : days < 15 ? `Vence em ${days}d` : "Em dia";
                return (
                  <Card key={v.id} className="p-4 flex items-center gap-4">
                    <span className="material-symbols-rounded text-primary">vaccines</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{v.vaccine_name}</div>
                      <div className="text-xs text-muted-foreground mono">Aplicada em {format(parseISO(v.applied_at), "dd/MM/yyyy")} {v.next_dose_at && `• próxima: ${format(parseISO(v.next_dose_at), "dd/MM/yyyy")}`}</div>
                    </div>
                    {badge && <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge}`}>{label}</span>}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="consultas" className="mt-6">
          {data.appointments.length === 0 ? (
            <Card className="p-10 text-center border-dashed">Nenhuma consulta ainda.</Card>
          ) : (
            <div className="space-y-2">
              {data.appointments.map((a) => {
                const svc = Array.isArray(a.services) ? a.services[0]?.name : (a.services as { name?: string } | null)?.name;
                return (
                <Card key={a.id} className="p-4 flex items-center gap-4">
                  <span className="material-symbols-rounded text-primary">event</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold capitalize">{svc || "Consulta"}</div>
                    <div className="text-xs text-muted-foreground mono">{format(parseISO(a.scheduled_at), "d MMM yyyy 'às' HH:mm", { locale: ptBR })}</div>
                  </div>
                  <span className="text-xs capitalize">{a.status.replace("_"," ")}</span>
                </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exames" className="mt-6">
          <Card className="p-10 text-center border-dashed">Exames anexados aparecerão aqui após consultas.</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}