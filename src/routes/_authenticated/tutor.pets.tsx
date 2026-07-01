import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/tutor/pets")({
  component: PetsList,
});

function PetsList() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-pets"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("pets").select("*").eq("tutor_id", user.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Meus pets</h1>
          <p className="text-muted-foreground text-sm">Gerencie os cadastros e carteirinhas.</p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/tutor/pets/novo"><span className="material-symbols-rounded mr-1" style={{fontSize:18}}>add</span>Novo pet</Link>
        </Button>
      </div>
      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <Card key={i} className="h-48 animate-pulse" />)}
        </div>
      ) : data && data.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <span className="material-symbols-rounded text-muted-foreground" style={{fontSize:56}}>pets</span>
          <div className="font-semibold mt-3">Nenhum pet cadastrado</div>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Cadastre seu primeiro pet para acessar carteirinha, vacinas e agendamentos.</p>
          <Button asChild className="rounded-full"><Link to="/tutor/pets/novo">Cadastrar pet</Link></Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data?.map((p) => (
            <Link key={p.id} to="/tutor/pets/$petId" params={{ petId: p.id }}>
              <Card className="p-5 card-hover elevation-1 flex flex-col items-center text-center">
                <div className="h-24 w-24 rounded-full bg-gradient-jvet grid place-items-center text-white overflow-hidden mb-3">
                  {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-rounded" style={{fontSize:44}}>pets</span>}
                </div>
                <div className="font-bold">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.breed || p.species}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}