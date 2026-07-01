import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchMyRoles, primaryDestination } from "@/lib/roles";
import heroImg from "@/assets/vet-hero.jpg";

const WHATS = "https://wa.me/5546991163405?text=" + encodeURIComponent(
  "Olá! Tenho interesse em fazer a aquisição do sistema JVet para minha clínica veterinária."
);

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const roles = await fetchMyRoles(data.user.id).catch(() => []);
        if (roles.length === 0) return;
        navigate({ to: primaryDestination(roles), replace: true });
      }
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        const roles = await fetchMyRoles(data.user.id);
        if (roles.length === 0) {
          await supabase.auth.signOut();
          throw new Error("Sua conta está pausada ou sem acesso. Entre em contato com a clínica ou o comercial.");
        }
        toast.success("Bem-vindo(a)!");
        navigate({ to: primaryDestination(roles), replace: true });
      }
    } catch (err) {
      toast.error((err as Error).message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-xl bg-gradient-jvet grid place-items-center text-white font-black">J</div>
            <span className="font-bold text-lg">JVet</span>
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Acesso ao sistema</h1>
          <p className="text-muted-foreground mt-1 text-sm">Área restrita a clínicas, equipes e tutores cadastrados.</p>

          <Card className="p-6 mt-6 elevation-1">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
              <Button type="submit" className="w-full rounded-full h-11" disabled={loading}>
                {loading ? "Aguarde..." : "Entrar"}
              </Button>
            </form>
          </Card>

          <Card className="p-5 mt-4 border-primary/20 bg-primary/[0.03]">
            <div className="flex items-start gap-3">
              <span className="material-symbols-rounded text-primary" style={{fontSize:24}}>storefront</span>
              <div className="flex-1">
                <div className="font-semibold text-sm">Ainda não tem acesso?</div>
                <p className="text-xs text-muted-foreground mt-1">Clínicas adquirem o JVet com o comercial. Tutores recebem o cadastro pela clínica.</p>
                <a href={WHATS} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground h-9 px-4 text-sm font-medium">
                  <span className="material-symbols-rounded" style={{fontSize:16}}>chat</span>
                  Falar com o comercial
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <div className="hidden md:flex bg-gradient-jvet items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative text-center text-white max-w-md">
          <img src={heroImg} alt="" className="w-72 mx-auto mb-6 rounded-2xl bg-white/90 p-4" />
          <h2 className="text-3xl font-black">A saúde dos pets em um só lugar.</h2>
          <p className="mt-3 text-white/90">Sistema completo para clínicas veterinárias agenda, prontuário, vacinas carteirinha digital e muito mais!</p>
        </div>
      </div>
    </div>
  );
}