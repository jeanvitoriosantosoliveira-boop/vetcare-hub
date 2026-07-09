import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClinicContext } from "@/hooks/useClinicContext";

export const Route = createFileRoute("/_authenticated/clinica")({
  component: ClinicaLayout,
});

const NAV: { to: string; label: string; icon: string; exact?: boolean }[] = [
  { to: "/clinica", label: "Dashboard", icon: "dashboard", exact: true },
  { to: "/clinica/agenda", label: "Agenda", icon: "event" },
  { to: "/clinica/crm", label: "CRM (Tutores & Pets)", icon: "groups" },
  { to: "/clinica/prontuarios", label: "Prontuários", icon: "medical_information" },
  { to: "/clinica/vacinas", label: "Vacinas & Lembretes", icon: "vaccines" },
  { to: "/clinica/alertas", label: "Alertas", icon: "notifications_active" },
  { to: "/clinica/financeiro", label: "Financeiro", icon: "payments" },
  { to: "/clinica/servicos", label: "Serviços", icon: "medical_services" },
  { to: "/clinica/equipe", label: "Equipe", icon: "badge" },
  { to: "/clinica/configuracoes", label: "Configurações", icon: "settings" },
];

function ClinicaLayout() {
  const { data: ctx, isLoading } = useClinicContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  if (!ctx) return (
    <div className="p-8 max-w-md mx-auto">
      <Card className="p-8 text-center border-dashed">
        <span className="material-symbols-rounded text-warning" style={{fontSize:48}}>lock</span>
        <h2 className="text-lg font-bold mt-2">Sem acesso à clínica</h2>
        <p className="text-sm text-muted-foreground mt-1">Você não está vinculado a nenhuma clínica ativa.</p>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r bg-card">
        <div className="p-5 border-b flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-light grid place-items-center text-primary-foreground font-black">J</div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">JVet · Clínica</div>
            <div className="font-bold truncate">{ctx.clinic.name}</div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as any}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-primary/10 text-primary font-semibold" : "text-foreground/80 hover:bg-muted"}`}
              >
                <span className="material-symbols-rounded" style={{fontSize:20}}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-2">
          <Badge variant="outline" className="w-full justify-center capitalize">{ctx.role.replace("_"," ")}</Badge>
          <Button variant="ghost" size="sm" className="w-full" onClick={() => supabase.auth.signOut().then(() => location.assign("/auth"))}>
            <span className="material-symbols-rounded mr-1" style={{fontSize:18}}>logout</span> Sair
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-card border-b flex items-center gap-2 px-3 py-2 overflow-x-auto">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link key={item.to} to={item.to as any} className={`shrink-0 px-3 py-1.5 rounded-full text-xs ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </div>

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}