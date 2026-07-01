## JVet — Sistema de Gestão para Clínicas Veterinárias

Projeto grande e multi-tenant. Vou entregar em fases para garantir qualidade. Antes de começar, algumas decisões importantes:

### Decisões que preciso confirmar

1. **Backend**: você pediu Supabase + Netlify, mas este template roda em **TanStack Start (Cloudflare Workers)** com **Lovable Cloud** (Supabase gerenciado). Posso:
   - **(A) Usar Lovable Cloud** — zero setup, publica direto pelo botão Publish (recomendado, muito mais rápido)
   - **(B) Preparar SQL para você rodar num Supabase próprio + configurar deploy no Netlify** — exige refatorar o template inteiro (perde SSR do TanStack, retrabalho grande)

2. **Escopo da primeira entrega**: dado o tamanho (3 painéis, ~25 telas, 14 tabelas), sugiro fasear:
   - **Fase 1 (agora)**: Design system Material 3 + Auth + estrutura das 3 áreas + Portal do Tutor (dashboard, pets, carteirinha, vacinas, histórico, agendamento) + banco completo com RLS
   - **Fase 2**: Painel da Clínica (dashboard, agenda, prontuários, clientes, vacinas, alertas)
   - **Fase 3**: Financeiro, Relatórios, Configurações, Super Admin, exportações PDF, QR público

### Fase 1 — Plano detalhado

**Design System (Material 3)**
- Tokens em `src/styles.css`: paleta (#1565C0, #42A5F5, #00BFA5, etc.), tipografia Inter + Roboto Mono, radius 12/8/24, elevations Material 1/2
- Fontes via `<link>` no `__root.tsx` (Inter, Roboto Mono, Material Symbols Rounded)
- Variantes shadcn customizadas (Button primary com radius 24, Card com elevation)

**Banco de dados (Lovable Cloud/Supabase)** — 14 tabelas com RLS multi-tenant:
- `clinics`, `profiles`, `user_roles` (enum: super_admin, clinic_admin, veterinarian, receptionist, tutor)
- `pets`, `appointments`, `medical_records`, `prescriptions`
- `vaccine_types`, `vaccines`, `services`, `payments`
- `alerts`, `notifications`, `exam_files`
- Storage buckets: `pet-photos`, `clinic-logos`, `exam-files`
- Função `has_role()` security-definer + policies scopeadas por `clinic_id`

**Auth**
- Email/senha + Google
- Rota `/auth` pública, `_authenticated/` com gate gerenciado
- Após login: redireciona tutor → `/tutor`, equipe → `/clinica`, super admin → `/admin`

**Portal do Tutor** (`/tutor/*`)
- Login com ilustração
- Dashboard com saudação, cards de pets, próximo agendamento, alertas de vacina
- Lista/perfil de pets com abas (carteirinha, vacinas, consultas, exames)
- Carteirinha virtual (design gradiente azul/verde, QR code)
- Fluxo de agendamento em 5 passos
- Painel de notificações no sino

**Estados**: skeletons, empty states com ilustração, toasts (sonner), confirmações de delete.

### Detalhes técnicos

- Roteamento: TanStack Router (file-based em `src/routes/`) — não React Router
- Data: TanStack Query com `ensureQueryData` + `useSuspenseQuery`
- Server functions: `createServerFn` com `requireSupabaseAuth`
- Storage: Supabase Storage via tools
- Idioma: pt-BR em toda a interface

### Perguntas antes de começar

1. **Decisão A ou B** acima? (recomendo A — Lovable Cloud)
2. **Fasear como proposto** ou tentar tudo de uma vez? (fasear evita bugs e permite você validar cada parte)
3. **Login Google**: incluir na Fase 1 ou só email/senha por enquanto?

Me responde e eu inicio a Fase 1.