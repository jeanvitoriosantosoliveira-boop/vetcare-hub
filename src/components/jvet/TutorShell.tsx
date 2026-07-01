import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function TutorShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: profile } = useQuery({
    queryKey: ["me-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle();
      return { user, ...data };
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = [
    { to: "/tutor", label: "Início", icon: "home" },
    { to: "/tutor/pets", label: "Meus Pets", icon: "pets" },
    { to: "/tutor/agendar", label: "Agendar", icon: "event_available" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-6 h-16">
          <Link to="/tutor" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-jvet grid place-items-center text-white font-black text-sm">J</div>
            <span className="font-bold">JVet</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const active = pathname === n.to || (n.to !== "/tutor" && pathname.startsWith(n.to));
              return (
                <Link key={n.to} to={n.to} className={`flex items-center gap-2 px-4 h-10 rounded-full text-sm font-medium transition ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  <span className="material-symbols-rounded" style={{fontSize:18}}>{n.icon}</span>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium leading-tight">{profile?.full_name || "Tutor"}</div>
              <div className="text-xs text-muted-foreground">Tutor</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { toast("Sessão encerrada"); signOut(); }}>
              <span className="material-symbols-rounded">logout</span>
            </Button>
          </div>
        </div>
        <nav className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2">
          {nav.map((n) => {
            const active = pathname === n.to || (n.to !== "/tutor" && pathname.startsWith(n.to));
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-1 px-3 h-9 rounded-full text-xs whitespace-nowrap ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <span className="material-symbols-rounded" style={{fontSize:16}}>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">{children}</main>
    </div>
  );
}