import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/vet-hero.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="max-w-6xl mx-auto flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-jvet grid place-items-center text-white font-black">J</div>
          <span className="font-bold text-lg">JVet</span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost"><Link to="/auth">Entrar</Link></Button>
          <Button asChild className="rounded-full"><Link to="/auth" search={{ mode: "signup" }}>Começar agora</Link></Button>
        </div>
      </header>
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 text-accent-foreground/90 px-3 py-1 text-xs font-medium">
            <span className="material-symbols-rounded" style={{fontSize:16}}>pets</span>
            Sistema completo para clínicas veterinárias
          </span>
          <h1 className="mt-4 text-5xl md:text-6xl font-black tracking-tight">
            Cuide dos pets<br/><span className="bg-gradient-jvet bg-clip-text text-transparent">com precisão médica.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-md">
            Agenda, prontuários, vacinas e a carteirinha virtual do pet — tudo num só lugar, com o portal do tutor incluso.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg" className="rounded-full h-12 px-8"><Link to="/auth" search={{ mode: "signup" }}>Criar conta grátis</Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-8"><Link to="/auth">Já tenho conta</Link></Button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-jvet opacity-10 blur-3xl rounded-full" />
          <img src={heroImg} alt="Cão e gato ilustrados" width={1024} height={1024} className="relative w-full max-w-md mx-auto" />
        </div>
      </section>
    </div>
  );
}
