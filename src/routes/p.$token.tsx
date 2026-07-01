import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/p/$token")({
  ssr: false,
  component: PublicPet,
});

function PublicPet() {
  const { token } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["public-pet", token],
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("name, species, breed, sex, birth_date, photo_url").eq("qr_token", token).maybeSingle();
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-gradient-jvet p-6 grid place-items-center">
      <Card className="p-8 max-w-md w-full text-center elevation-2">
        {isLoading ? (
          <div className="h-48 animate-pulse" />
        ) : !data ? (
          <div>
            <span className="material-symbols-rounded text-muted-foreground" style={{fontSize:56}}>pets</span>
            <div className="font-semibold mt-3">Pet não encontrado</div>
          </div>
        ) : (
          <>
            <div className="h-24 w-24 rounded-full bg-gradient-jvet grid place-items-center text-white mx-auto overflow-hidden">
              {data.photo_url ? <img src={data.photo_url} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-rounded" style={{fontSize:44}}>pets</span>}
            </div>
            <h1 className="text-2xl font-black mt-4">{data.name}</h1>
            <p className="text-muted-foreground capitalize">{data.breed || data.species} {data.sex && `• ${data.sex}`}</p>
            <div className="mt-6 text-xs uppercase tracking-widest text-primary">Carteirinha JVet</div>
          </>
        )}
      </Card>
    </div>
  );
}