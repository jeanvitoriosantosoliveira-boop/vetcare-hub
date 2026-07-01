import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/clinica")({
  component: () => (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/tutor" className="text-sm text-muted-foreground">← Voltar</Link>
        <h1 className="text-4xl font-black mt-4">Painel da Clínica</h1>
        <p className="text-muted-foreground mt-2">Área para veterinários, recepcionistas e admins.</p>
        <Card className="mt-6 p-8 border-dashed text-center elevation-1">
          <span className="material-symbols-rounded text-primary" style={{fontSize:56}}>construction</span>
          <h2 className="text-xl font-bold mt-3">Fase 2 em construção</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Dashboard, agenda semanal, prontuários, clientes, vacinas e alertas serão liberados na próxima fase do projeto.</p>
          <Button asChild className="mt-6 rounded-full"><Link to="/tutor">Ir para o Portal do Tutor</Link></Button>
        </Card>
      </div>
    </div>
  ),
});