
-- =========================================
-- JVet — Sistema completo (schema base)
-- =========================================

-- Enums
CREATE TYPE public.app_role AS ENUM ('super_admin', 'clinic_admin', 'veterinarian', 'receptionist', 'tutor');
CREATE TYPE public.appointment_status AS ENUM ('pendente', 'confirmado', 'em_atendimento', 'concluido', 'cancelado');
CREATE TYPE public.appointment_type AS ENUM ('consulta', 'retorno', 'banho_tosa', 'vacinacao', 'emergencia');
CREATE TYPE public.pet_species AS ENUM ('cao', 'gato', 'ave', 'roedor', 'reptil', 'outro');
CREATE TYPE public.pet_sex AS ENUM ('macho', 'femea');
CREATE TYPE public.payment_method AS ENUM ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'transferencia');
CREATE TYPE public.payment_status AS ENUM ('pago', 'pendente', 'cancelado');
CREATE TYPE public.alert_level AS ENUM ('critico', 'atencao', 'informativo');
CREATE TYPE public.alert_category AS ENUM ('vacina', 'agendamento', 'prontuario', 'retorno');
CREATE TYPE public.clinic_status AS ENUM ('ativa', 'inativa', 'trial');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================================
-- clinics
-- =========================================
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  website TEXT,
  logo_url TEXT,
  status public.clinic_status NOT NULL DEFAULT 'trial',
  business_hours JSONB DEFAULT '{}'::jsonb,
  vaccine_alert_days INTEGER NOT NULL DEFAULT 15,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinics TO authenticated;
GRANT ALL ON public.clinics TO service_role;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_clinics_updated BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================
-- profiles (todos os usuários)
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  cpf TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================
-- user_roles (cargo por clínica, ou global p/ super_admin/tutor)
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, clinic_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer helpers
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role AND active);
$$;

CREATE OR REPLACE FUNCTION public.has_clinic_role(_user_id UUID, _clinic_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND clinic_id = _clinic_id AND role = _role AND active);
$$;

CREATE OR REPLACE FUNCTION public.is_clinic_member(_user_id UUID, _clinic_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND clinic_id = _clinic_id
      AND role IN ('clinic_admin','veterinarian','receptionist') AND active
  );
$$;

CREATE OR REPLACE FUNCTION public.user_clinic_ids(_user_id UUID)
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT clinic_id FROM public.user_roles
  WHERE user_id = _user_id AND clinic_id IS NOT NULL AND active;
$$;

-- =========================================
-- pets (tutor -> clinic opcional, mesmo pet pode aparecer em várias clínicas via consultas)
-- =========================================
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species public.pet_species NOT NULL,
  breed TEXT,
  sex public.pet_sex,
  birth_date DATE,
  weight_kg NUMERIC(6,2),
  color TEXT,
  microchip TEXT,
  neutered BOOLEAN,
  allergies TEXT,
  conditions TEXT,
  photo_url TEXT,
  qr_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT SELECT ON public.pets TO anon; -- QR público lê via qr_token (policy abaixo)
GRANT ALL ON public.pets TO service_role;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_pets_updated BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_pets_tutor ON public.pets(tutor_id);

-- =========================================
-- services (por clínica)
-- =========================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- =========================================
-- vaccine_types (por clínica)
-- =========================================
CREATE TABLE public.vaccine_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_interval_days INTEGER NOT NULL DEFAULT 365,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaccine_types TO authenticated;
GRANT ALL ON public.vaccine_types TO service_role;
ALTER TABLE public.vaccine_types ENABLE ROW LEVEL SECURITY;

-- =========================================
-- appointments
-- =========================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  veterinarian_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  appointment_type public.appointment_type NOT NULL DEFAULT 'consulta',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status public.appointment_status NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_appt_clinic_date ON public.appointments(clinic_id, scheduled_at);
CREATE INDEX idx_appt_pet ON public.appointments(pet_id);
CREATE INDEX idx_appt_tutor ON public.appointments(tutor_id);

-- =========================================
-- medical_records (prontuários)
-- =========================================
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  veterinarian_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  complaint TEXT,
  anamnesis TEXT,
  weight_kg NUMERIC(6,2),
  temperature NUMERIC(4,1),
  heart_rate INTEGER,
  respiratory_rate INTEGER,
  mucous TEXT,
  hydration TEXT,
  lymph_nodes TEXT,
  exam_notes TEXT,
  diagnosis TEXT,
  treatment TEXT,
  return_recommended BOOLEAN DEFAULT false,
  return_date DATE,
  internal_notes TEXT,
  tutor_summary TEXT,
  closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_records TO authenticated;
GRANT ALL ON public.medical_records TO service_role;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_mr_updated BEFORE UPDATE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================
-- prescriptions
-- =========================================
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  medication TEXT NOT NULL,
  dose TEXT,
  frequency TEXT,
  duration TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT ALL ON public.prescriptions TO service_role;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- =========================================
-- vaccines (aplicadas)
-- =========================================
CREATE TABLE public.vaccines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vaccine_type_id UUID REFERENCES public.vaccine_types(id) ON DELETE SET NULL,
  vaccine_name TEXT NOT NULL,
  lot TEXT,
  manufacturer TEXT,
  applied_at DATE NOT NULL DEFAULT CURRENT_DATE,
  next_dose_at DATE,
  veterinarian_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaccines TO authenticated;
GRANT ALL ON public.vaccines TO service_role;
ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_vaccines_pet ON public.vaccines(pet_id);

-- =========================================
-- payments
-- =========================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  method public.payment_method,
  status public.payment_status NOT NULL DEFAULT 'pendente',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =========================================
-- alerts
-- =========================================
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
  category public.alert_category NOT NULL,
  level public.alert_level NOT NULL,
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- =========================================
-- notifications (por usuário)
-- =========================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notif_user ON public.notifications(user_id, read);

-- =========================================
-- exam_files
-- =========================================
CREATE TABLE public.exam_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  medical_record_id UUID REFERENCES public.medical_records(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  content_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_files TO authenticated;
GRANT ALL ON public.exam_files TO service_role;
ALTER TABLE public.exam_files ENABLE ROW LEVEL SECURITY;

-- =========================================
-- POLICIES
-- =========================================

-- profiles: usuário lê/edita o próprio; equipe da clínica lê perfis de tutores dos pets/consultas da clínica
CREATE POLICY "profiles self" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles insert self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles update self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- user_roles: usuário lê seus próprios cargos; super_admin lê tudo
CREATE POLICY "user_roles self" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

-- clinics: membros veem sua clínica; super_admin vê todas; tutores veem clínicas em que têm consultas/pets
CREATE POLICY "clinics visible to members" ON public.clinics FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR id IN (SELECT public.user_clinic_ids(auth.uid()))
    OR EXISTS (SELECT 1 FROM public.appointments a WHERE a.clinic_id = clinics.id AND a.tutor_id = auth.uid())
  );
CREATE POLICY "clinics super admin all" ON public.clinics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "clinics admin update" ON public.clinics FOR UPDATE TO authenticated
  USING (public.has_clinic_role(auth.uid(), id, 'clinic_admin'));
CREATE POLICY "clinics anyone insert (onboarding)" ON public.clinics FOR INSERT TO authenticated WITH CHECK (true);

-- pets: tutor dono; equipe da clínica onde o pet tem consulta; leitura pública via qr_token
CREATE POLICY "pets tutor" ON public.pets FOR ALL TO authenticated
  USING (tutor_id = auth.uid()) WITH CHECK (tutor_id = auth.uid());
CREATE POLICY "pets clinic staff read" ON public.pets FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.pet_id = pets.id AND public.is_clinic_member(auth.uid(), a.clinic_id)
  ));
CREATE POLICY "pets clinic staff update" ON public.pets FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.pet_id = pets.id AND public.is_clinic_member(auth.uid(), a.clinic_id)
  ));
-- QR público (leitura mínima já filtrada pela aplicação usando qr_token único)
CREATE POLICY "pets public qr" ON public.pets FOR SELECT TO anon USING (qr_token IS NOT NULL);

-- services / vaccine_types: só a clínica
CREATE POLICY "services clinic" ON public.services FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "vtypes clinic" ON public.vaccine_types FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));

-- appointments: tutor vê os seus; equipe da clínica vê/gerencia
CREATE POLICY "appt tutor read" ON public.appointments FOR SELECT TO authenticated
  USING (tutor_id = auth.uid() OR public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "appt tutor create" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (tutor_id = auth.uid() OR public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "appt tutor update own pending" ON public.appointments FOR UPDATE TO authenticated
  USING (tutor_id = auth.uid() OR public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "appt clinic delete" ON public.appointments FOR DELETE TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id));

-- medical_records: equipe da clínica; tutor lê resumo
CREATE POLICY "mr clinic all" ON public.medical_records FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "mr tutor read" ON public.medical_records FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_id AND p.tutor_id = auth.uid()));

-- prescriptions: seguem prontuário
CREATE POLICY "prescriptions via mr" ON public.prescriptions FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.medical_records m
    WHERE m.id = medical_record_id AND public.is_clinic_member(auth.uid(), m.clinic_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.medical_records m
    WHERE m.id = medical_record_id AND public.is_clinic_member(auth.uid(), m.clinic_id)
  ));
CREATE POLICY "prescriptions tutor read" ON public.prescriptions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.medical_records m
    JOIN public.pets p ON p.id = m.pet_id
    WHERE m.id = medical_record_id AND p.tutor_id = auth.uid()
  ));

-- vaccines: equipe clínica gerencia; tutor lê
CREATE POLICY "vaccines clinic all" ON public.vaccines FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "vaccines tutor read" ON public.vaccines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_id AND p.tutor_id = auth.uid()));

-- payments: clínica; tutor vê os próprios
CREATE POLICY "payments clinic all" ON public.payments FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "payments tutor read" ON public.payments FOR SELECT TO authenticated
  USING (tutor_id = auth.uid());

-- alerts: clínica
CREATE POLICY "alerts clinic" ON public.alerts FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));

-- notifications: dono
CREATE POLICY "notif self" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- exam_files: clínica gerencia; tutor lê
CREATE POLICY "exams clinic all" ON public.exam_files FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "exams tutor read" ON public.exam_files FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_id AND p.tutor_id = auth.uid()));

-- =========================================
-- Trigger: criar profile + role de tutor no signup
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Por padrão todo novo signup é tutor (equipe/clinic_admin é atribuído via onboarding)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'tutor')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
