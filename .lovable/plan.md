## Escopo desta entrega

Antes de executar, quero confirmar o plano — é uma mudança grande com implicações de segurança (remover cadastro público) e reset de banco.

### 1. Homepage com neuromarketing (`src/routes/index.tsx`)

Landing page longa de venda, não mais uma seção só. Estrutura:

- **Hero** com headline de dor + promessa ("Sua clínica veterinária perdendo tempo com papel, WhatsApp e agenda bagunçada?"), sub-headline com resultado, prova social (ex.: "+X clínicas gerenciando pets com o JVet"), dois CTAs: **"Quero adquirir o sistema"** (WhatsApp) e **"Já sou cliente"** (login).
- **Bloco de dor / agitação** — 3 cards com problemas reais (agenda perdida, prontuário em papel, tutor desassistido).
- **Bloco de solução** — 3 pilares (Clínica / Tutor / Admin) com ícones e ganhos concretos.
- **Bloco de features** — grid com 8–10 features (agenda, prontuário, vacinas, carteirinha QR, portal do tutor, financeiro, alertas, multi-clínica).
- **Como funciona** — 3 passos (Aquisição → Onboarding → Operação).
- **Prova / diferenciais** — cards de segurança (RLS, LGPD), suporte, cloud.
- **Modelo comercial** — card único explicando: pagamento único do software + mensalidade só de banco e suporte. Sem "grátis".
- **FAQ** — 5–6 perguntas (quem é dono dos dados, como funciona a mensalidade, treinamento, etc.).
- **CTA final** — grande, WhatsApp.
- **Rodapé** com contato.

Aplicando gatilhos: escassez suave ("vagas limitadas para onboarding no mês"), autoridade (segurança/LGPD), reciprocidade (demonstração), prova (contadores), aversão à perda (o custo de não organizar), clareza (3 passos), ancoragem (pagamento único vs SaaS caro).

**Todos os CTAs de aquisição** abrem:
`https://wa.me/5546991163405?text=Ol%C3%A1%21%20Tenho%20interesse%20em%20fazer%20a%20aquisi%C3%A7%C3%A3o%20do%20sistema%20JVet%20para%20minha%20cl%C3%ADnica%20veterin%C3%A1ria.`

### 2. Remover cadastro público

- `src/routes/auth.tsx`: remover toggle Sign-up e botão Google (Google permite auto-cadastro). Fica **só login por e-mail/senha**. Link "Não tem conta? Fale com o comercial" → WhatsApp.
- `configure_auth`: `disable_signup: true`, `external_anonymous_users_enabled: false`.
- Trigger `handle_new_user` mantém criação de profile, mas **não** atribui role automática — role é sempre criada pelo admin ou pela clínica.

### 3. Três perfis e hierarquia

Roles finais: `super_admin`, `clinic_admin`, `veterinarian`, `receptionist`, `tutor`.

Regras:
- **Super admin** cria clínicas e o primeiro `clinic_admin` de cada clínica (via server function que usa Auth Admin API, gera senha temporária, envia por e-mail/WhatsApp — nesta fase mostra a senha na tela para o admin repassar).
- **Clínica** (clinic_admin/receptionist) cria contas de tutores e vincula pets. Novos tutores nascem com role `tutor` + `clinic_id` da clínica que criou.
- **Status da clínica**: `active | paused | canceled` em `clinics.status`.
- **Cascata de pausa**: quando `clinics.status` muda para `paused`/`canceled`, trigger seta `user_roles.active = false` para todos os tutores ligados àquela clínica **e** para a equipe. RLS já usa `active` → efetivamente bloqueia login/uso.
- Middleware de rota (`_authenticated/route.tsx`) verifica se o usuário tem alguma role ativa; se não, faz signOut e mostra "Sua conta está pausada, entre em contato com a clínica/comercial".

### 4. Slugs / rotas

- `/` — homepage pública (vendas)
- `/auth` — login
- `/tutor/*` — portal do tutor (mantém)
- `/clinica/*` — painel da clínica (Fase 2)
- `/admin/*` — painel super admin (novo)
- `/p/:token` — página pública do pet

### 5. Reset do banco + SQL completo

Nova migration que:
1. Faz `DROP` de todas as 14 tabelas atuais e do enum `app_role` em ordem correta.
2. Recria tudo do zero com as inclusões:
   - `clinics.status` (`active|paused|canceled`), `clinics.paused_at`, `clinics.paused_by`.
   - `pets.clinic_id NOT NULL` (todo tutor está ligado a uma clínica-mãe).
   - `profiles.status` e `profiles.primary_clinic_id`.
   - Trigger `cascade_clinic_status()` que atualiza `user_roles.active` de toda a equipe e de todos os tutores cujo `pets.clinic_id` (ou `profiles.primary_clinic_id`) aponta pra clínica pausada.
   - Função `is_account_active(uid)` usada em RLS de leitura sensível.
   - Grants + RLS completos (multi-tenant por `clinic_id`).
   - Buckets recriados idempotente.
3. Cria **um super_admin inicial** — pergunta abaixo.

Ao final, entrego o SQL completo num bloco só, pronto pra rodar num Supabase limpo (equivalente ao que a migration aplica no Lovable Cloud).

### 6. Fase 2 — Painel da Clínica

Sob `/clinica`:
- Layout `ClinicShell` com sidebar (Dashboard, Agenda, Clientes, Pets, Prontuários, Vacinas, Serviços, Equipe, Configurações).
- **Dashboard**: KPIs do dia (consultas hoje, faturamento do dia, novos clientes, alertas de vacina).
- **Agenda**: visão semanal com slots, criar/editar/cancelar consulta, filtrar por vet.
- **Clientes**: lista de tutores da clínica, criar tutor (cria auth user + role tutor + profile), ver pets.
- **Pets**: lista, criar/editar, foto.
- **Prontuário**: por consulta — anamnese, exame, diagnóstico, prescrição, exames anexados.
- **Vacinas**: aplicar vacina, agenda de reforços, alertas automáticos.
- **Serviços**: CRUD de serviços e preços.
- **Equipe**: clinic_admin convida vets/recepcionistas (cria auth user + role).
- **Configurações**: dados da clínica, logo, horários.

Server functions com `requireSupabaseAuth` + verificação de `clinic_id` via `is_clinic_member` / `has_clinic_role`.

### 7. Painel Super Admin (`/admin`)

- Lista de clínicas com status, botões **Pausar / Reativar / Cancelar**.
- Criar nova clínica + primeiro clinic_admin (form: nome clínica, CNPJ, nome admin, e-mail admin → gera senha temp).
- Estatísticas globais (total clínicas ativas, pets, consultas do mês).
- Log de ações administrativas.

---

### Detalhes técnicos

- Servidor: `createServerFn` + `requireSupabaseAuth`; funções privilegiadas (criar clínica, criar tutor, pausar) chamam `supabaseAdmin` **dentro do handler** após checar `has_role('super_admin')` ou `is_clinic_member`.
- Cascata via trigger PL/pgSQL em `AFTER UPDATE OF status ON clinics`.
- Redirect pós-login continua via `primaryDestination`, mas primeiro checa se alguma role está ativa — senão signOut + toast.
- Homepage totalmente estática, sem loader — pura conversão.

---

### Perguntas antes de executar

1. **Reset do banco**: você confirma que quero **apagar tudo** (inclusive as 14 tabelas atuais e qualquer dado)? Não há como "voltar" depois.
2. **Super admin inicial**: me passa o **e-mail** que deve ser criado como super_admin no seed da migration (ex.: `voce@exemplo.com`) e uma **senha temporária** — ou prefere que eu deixe só um `INSERT` de role e você cria o usuário depois no `/auth`?
3. **Escopo desta rodada**: entrego (a) homepage + auth restrita + reset de banco + admin básico (criar/pausar clínica) **agora**, e (b) painel completo da clínica + prontuário/agenda na **próxima rodada**? Ou você quer tudo em uma única entrega gigante (mais demorada, maior risco de bug)?
4. **Google login**: removo de vez (recomendo, porque permite auto-cadastro que fura seu modelo), ou mantenho e restrinjo por whitelist de e-mails?

Me responde essas 4 e eu executo.