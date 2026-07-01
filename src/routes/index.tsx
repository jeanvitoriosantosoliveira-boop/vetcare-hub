import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroImg from "@/assets/vet-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JVet — O sistema que devolve o controle da sua clínica veterinária" },
      { name: "description", content: "Aquisição única, sem SaaS caro. Agenda, prontuário, vacinas, portal do tutor e carteirinha digital em um só sistema, feito para clínicas veterinárias no Brasil." },
      { property: "og:title", content: "JVet — Sistema definitivo para clínicas veterinárias" },
      { property: "og:description", content: "Pare de perder consulta, prontuário e cliente. Aquisição única — só paga banco e suporte depois." },
    ],
  }),
  component: Landing,
});

const WHATS = "https://wa.me/5546991163405?text=" + encodeURIComponent(
  "Olá! Tenho interesse em fazer a aquisição do sistema JVet para minha clínica veterinária."
);

function CTAWhats({ children = "Quero adquirir o JVet", className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <a href={WHATS} target="_blank" rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-gradient-jvet text-white font-semibold h-12 px-8 elevation-2 hover:opacity-95 transition ${className}`}>
      <span className="material-symbols-rounded" style={{fontSize:20}}>chat</span>
      {children}
    </a>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* NAV */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-jvet grid place-items-center text-white font-black">J</div>
            <span className="font-bold text-lg">JVet</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#dor" className="hover:text-primary">O problema</a>
            <a href="#solucao" className="hover:text-primary">Como resolvemos</a>
            <a href="#features" className="hover:text-primary">Recursos</a>
            <a href="#modelo" className="hover:text-primary">Investimento</a>
            <a href="#faq" className="hover:text-primary">FAQ</a>
          </nav>
          <div className="flex gap-2">
            <Button asChild variant="ghost"><Link to="/auth">Já sou cliente</Link></Button>
            <a href={WHATS} target="_blank" rel="noreferrer"
              className="hidden sm:inline-flex items-center rounded-full bg-primary text-primary-foreground text-sm font-medium h-10 px-5 hover:opacity-90">
              Falar com o comercial
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-jvet opacity-[0.06] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-20 grid md:grid-cols-2 gap-12 items-center relative">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 text-accent-foreground/90 px-3 py-1 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Vagas de onboarding limitadas este mês
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
              Sua clínica está perdendo dinheiro <span className="bg-gradient-jvet bg-clip-text text-transparent">a cada consulta desorganizada.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Agenda no WhatsApp, prontuário em papel, tutor sem retorno de vacina. Toda semana isso custa clientes que não voltam.
              O <b>JVet</b> resolve isso com <b>um único sistema</b> pago uma vez, sem mensalidade de SaaS.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <CTAWhats>Quero adquirir o sistema</CTAWhats>
              <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-8"><Link to="/auth">Já tenho acesso</Link></Button>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              <Stat n="+40%" label="mais retornos de vacina" />
              <Stat n="0h" label="perdidas em agenda" />
              <Stat n="100%" label="prontuário digital" />
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-jvet opacity-20 blur-3xl rounded-full" />
            <img src={heroImg} alt="Cão e gato ilustrados representando o público da clínica veterinária" width={1024} height={1024} className="relative w-full max-w-md mx-auto" />
          </div>
        </div>
      </section>

      {/* DOR */}
      <section id="dor" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-primary text-sm font-bold tracking-widest uppercase">O que está travando sua clínica</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-black">Se você marca sim ou não em pelo menos 2, precisa do JVet.</h2>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          <PainCard icon="event_busy" title="Agenda vive no WhatsApp"
            text="Cliente marca, recepção esquece, veterinário atende sem saber. Overbooking e horários vazios convivem na mesma semana." />
          <PainCard icon="description" title="Prontuário em papel ou planilha"
            text="O histórico do pet some quando o vet muda. Alergias, cirurgias e medicações são refeitas do zero risco clínico e retrabalho." />
          <PainCard icon="notifications_off" title="Tutor não é lembrado da vacina"
            text="Sem alerta automático, o pet perde reforço, o cliente perde confiança e a clínica perde a receita recorrente." />
        </div>
      </section>

      {/* SOLUÇÃO / 3 PILARES */}
      <section id="solucao" className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-primary text-sm font-bold tracking-widest uppercase">Como o JVet resolve</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-black">Três painéis. Uma só verdade sobre cada pet.</h2>
            <p className="mt-4 text-muted-foreground">Admin controla clínicas. Clínica controla o dia a dia. Tutor acompanha tudo do celular. Ninguém escapa da tela certa.</p>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            <PillarCard color="bg-primary" icon="admin_panel_settings" title="Painel do Admin"
              items={["Criar e pausar clínicas em 1 clique","Assinaturas centralizadas","Gestão de todos os vets do país"]} />
            <PillarCard color="bg-accent" icon="local_hospital" title="Painel da Clínica"
              items={["Agenda semanal + confirmação","Prontuário digital completo","Alertas de vacina automáticos","Financeiro por consulta"]} />
            <PillarCard color="bg-gradient-jvet" icon="pets" title="Portal do Tutor"
              items={["Carteirinha digital com QR code","Ficha de todos os pets","Agendamento em 4 toques","Vacinas em dia sempre"]} />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-primary text-sm font-bold tracking-widest uppercase">Recursos</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-black">Tudo o que uma clínica moderna precisa sem plugin nem gambiarra.</h2>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["calendar_month","Agenda inteligente","Semanal, por vet, com bloqueios"],
            ["stethoscope","Prontuário eletrônico","Anamnese, exame, diagnóstico"],
            ["vaccines","Vacinas com alerta","Reforço avisa tutor e clínica"],
            ["qr_code_2","Carteirinha QR","Compartilhável e imprimível"],
            ["group","Clientes e pets","CRM veterinário simples"],
            ["receipt_long","Financeiro","Recebimentos por consulta"],
            ["cloud_done","Nuvem segura","Backups, RLS, LGPD"],
            ["devices","100% responsivo","Recepção no PC, vet no tablet"],
          ].map(([i,t,d]) => (
            <Card key={t} className="p-5 elevation-1 card-hover">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center mb-3">
                <span className="material-symbols-rounded">{i}</span>
              </div>
              <div className="font-bold">{t}</div>
              <div className="text-sm text-muted-foreground mt-1">{d}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center">
            <div className="text-primary text-sm font-bold tracking-widest uppercase">Como funciona</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-black">Em 3 passos você está operando.</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Step n={1} title="Aquisição" text="Você compra o sistema uma única vez. Sem mensalidade de licença." />
            <Step n={2} title="Onboarding em 7 dias" text="A gente cria sua clínica, treina o time e migra dados iniciais." />
            <Step n={3} title="Operação 24/7" text="Você opera. Cobramos apenas o banco de dados e o suporte técnico mensal." />
          </div>
        </div>
      </section>

      {/* MODELO COMERCIAL */}
      <section id="modelo" className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center">
          <div className="text-primary text-sm font-bold tracking-widest uppercase">Investimento</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-black">Um valor único. Sem armadilha de SaaS.</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">Você não aluga um sistema pra sempre. Você <b>compra o JVet</b>, ele é seu. Depois só paga o custo real do banco de dados e do suporte técnico contínuo.</p>
        </div>
        <Card className="mt-10 p-8 md:p-10 elevation-2 border-2 border-primary/20 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-gradient-jvet opacity-10" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 text-accent-foreground/90 px-3 py-1 text-xs font-semibold">Aquisição única</div>
              <div className="mt-4 text-4xl md:text-5xl font-black">Sob consulta</div>
              <div className="text-muted-foreground mt-2">+ mensalidade apenas de banco e suporte</div>
              <ul className="mt-6 space-y-2 text-sm">
                {["Sistema completo e ilimitado","Todas as atualizações inclusas","Treinamento inicial da equipe","Suporte técnico dedicado","Backup diário automático","Hospedagem em nuvem segura"].map((f) => (
                  <li key={f} className="flex gap-2 items-start"><span className="material-symbols-rounded text-primary" style={{fontSize:18}}>check_circle</span>{f}</li>
                ))}
              </ul>
            </div>
            <div className="text-center">
              <CTAWhats>Solicitar proposta agora</CTAWhats>
              <p className="text-xs text-muted-foreground mt-3">Resposta em até 1 hora útil, direto no WhatsApp comercial.</p>
            </div>
          </div>
        </Card>
      </section>

      {/* PROVA / SEGURANÇA */}
      <section className="bg-muted/30 py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-4 gap-4">
          <SafetyCard icon="lock" title="LGPD" text="Isolamento por clínica no banco (RLS)" />
          <SafetyCard icon="cloud_done" title="Cloud" text="Infra gerenciada, uptime 99.9%" />
          <SafetyCard icon="support_agent" title="Suporte real" text="Humano, no WhatsApp e por chamado" />
          <SafetyCard icon="update" title="Atualizações" text="Novos recursos entram sem custo extra" />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center">
          <div className="text-primary text-sm font-bold tracking-widest uppercase">Perguntas frequentes</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-black">Tira sua dúvida antes de falar comigo.</h2>
        </div>
        <div className="mt-10 space-y-3">
          <Faq q="Como é o pagamento? Tem mensalidade?"
            a="Você paga uma vez pela aquisição do sistema. Depois, só paga a mensalidade do banco de dados e do suporte sem contrato de refém, sem multa." />
          <Faq q="Os dados são meus?"
            a="Sim. Cada clínica opera num ambiente isolado (Row Level Security). Você pode exportar tudo a qualquer momento." />
          <Faq q="Preciso de servidor?"
            a="Não. Rodamos em nuvem gerenciada. Sua clínica só precisa de internet e navegador." />
          <Faq q="Quanto tempo leva pra começar?"
            a="Em 7 dias sua clínica está ativa, com equipe treinada e o portal do tutor liberado." />
          <Faq q="Consigo cadastrar meus clientes atuais?"
            a="Sim. Fazemos importação inicial de tutores e pets no onboarding." />
          <Faq q="E se eu pausar a clínica um mês?"
            a="O admin pausa a clínica com 1 clique todos os acessos ficam suspensos automaticamente e reativam quando você quiser." />
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="p-10 md:p-14 elevation-2 bg-gradient-jvet text-white text-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/5" />
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-black">Enquanto você lê isso, uma agenda está sendo perdida no WhatsApp da recepção.</h2>
              <p className="mt-4 text-white/90 max-w-2xl mx-auto">Fale com o comercial agora e trave sua vaga de onboarding do mês.</p>
              <div className="mt-8">
                <a href={WHATS} target="_blank" rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-primary font-bold h-14 px-10 hover:scale-[1.02] transition">
                  <span className="material-symbols-rounded">chat</span>
                  Quero adquirir o JVet agora
                </a>
              </div>
              <div className="mt-4 text-xs text-white/80 mono">WhatsApp comercial: (46) 99116-3405</div>
            </div>
          </Card>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-jvet grid place-items-center text-white font-black text-xs">J</div>
            <span>© {new Date().getFullYear()} JVet Sistema para clínicas veterinárias</span>
          </div>
          <a href={WHATS} target="_blank" rel="noreferrer" className="hover:text-primary">Comercial: (46) 99116-3405</a>
        </div>
      </footer>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return <div><div className="text-2xl md:text-3xl font-black text-primary">{n}</div><div className="text-xs text-muted-foreground">{label}</div></div>;
}
function PainCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <Card className="p-6 elevation-1">
      <div className="h-11 w-11 rounded-xl bg-destructive/10 text-destructive grid place-items-center mb-3">
        <span className="material-symbols-rounded">{icon}</span>
      </div>
      <div className="font-bold text-lg">{title}</div>
      <div className="text-sm text-muted-foreground mt-2">{text}</div>
    </Card>
  );
}
function PillarCard({ color, icon, title, items }: { color: string; icon: string; title: string; items: string[] }) {
  return (
    <Card className="p-6 elevation-1 card-hover">
      <div className={`h-12 w-12 rounded-xl ${color} grid place-items-center text-white mb-3`}>
        <span className="material-symbols-rounded">{icon}</span>
      </div>
      <div className="font-bold text-lg">{title}</div>
      <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        {items.map((i) => <li key={i} className="flex gap-2"><span className="material-symbols-rounded text-primary" style={{fontSize:16}}>check</span>{i}</li>)}
      </ul>
    </Card>
  );
}
function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <Card className="p-6 elevation-1 text-center">
      <div className="h-12 w-12 mx-auto rounded-full bg-gradient-jvet grid place-items-center text-white font-black">{n}</div>
      <div className="mt-3 font-bold text-lg">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{text}</div>
    </Card>
  );
}
function SafetyCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="text-center p-4">
      <div className="h-11 w-11 mx-auto rounded-xl bg-primary/10 text-primary grid place-items-center mb-2">
        <span className="material-symbols-rounded">{icon}</span>
      </div>
      <div className="font-bold">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{text}</div>
    </div>
  );
}
function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border p-5 bg-card">
      <summary className="flex items-center justify-between cursor-pointer font-semibold list-none">
        {q}
        <span className="material-symbols-rounded group-open:rotate-180 transition" style={{fontSize:20}}>expand_more</span>
      </summary>
      <p className="mt-3 text-sm text-muted-foreground">{a}</p>
    </details>
  );
}