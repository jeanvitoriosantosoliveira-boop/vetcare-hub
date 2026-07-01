import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: () => (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black">Super Admin</h1>
        <p className="text-muted-foreground mt-2">Gestão global de clínicas do SaaS.</p>
        <Card className="mt-6 p-8 border-dashed text-center elevation-1">
          <span className="material-symbols-rounded text-primary" style={{fontSize:56}}>admin_panel_settings</span>
          <h2 className="text-xl font-bold mt-3">Fase 3 em construção</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Gestão de clínicas, planos e estatísticas serão liberados na fase final.</p>
          <Button asChild className="mt-6 rounded-full"><Link to="/tutor">Voltar</Link></Button>
        </Card>
      </div>
    </div>
  ),
});