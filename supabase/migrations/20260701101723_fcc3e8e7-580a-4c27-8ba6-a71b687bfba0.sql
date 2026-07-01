
-- ============================================================
-- RESET COMPLETO
-- ============================================================
DROP TABLE IF EXISTS public.admin_actions CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.exam_files CASCADE;
DROP TABLE IF EXISTS public.vaccines CASCADE;
DROP TABLE IF EXISTS public.vaccine_types CASCADE;
DROP TABLE IF EXISTS public.prescriptions CASCADE;
DROP TABLE IF EXISTS public.medical_records CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.pets CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.clinics CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_clinic_role(uuid, uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_clinic_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_clinic_ids(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.tg_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.cascade_clinic_status() CASCADE;
DROP FUNCTION IF EXISTS public.is_account_active(uuid) CASCADE;

DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.clinic_status CASCADE;
DROP TYPE IF EXISTS public.appointment_status CASCADE;
DROP TYPE IF EXISTS public.pet_species CASCADE;
DROP TYPE IF EXISTS public.pet_sex CASCADE;

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('super_admin','clinic_admin','veterinarian','receptionist','tutor');
CREATE TYPE public.clinic_status AS ENUM ('active','paused','canceled');
CREATE TYPE public.appointment_status AS ENUM ('scheduled','confirmed','in_progress','completed','canceled','no_show');
CREATE TYPE public.pet_species AS ENUM ('dog','cat','bird','rodent','reptile','other');
CREATE TYPE public.pet_sex AS ENUM ('male','female','unknown');

-- ============================================================
-- HELPER: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============================================================
-- TABLE: clinics
-- ============================================================
CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text UNIQUE,
  email text,
  phone text,
  address text,
  city text,
  state text,
  logo_url text,
  status public.clinic_status NOT NULL DEFAULT 'active',
  paused_at timestamptz,
  paused_by uuid REFERENCES auth.users(id),
  paused_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinics TO authenticated;
GRANT ALL ON public.clinics TO service_role;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_clinics_updated BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  cpf text,
  primary_clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- TABLE: user_roles
-- ============================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, clinic_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECURITY DEFINER helpers
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role AND active);
$$;

CREATE OR REPLACE FUNCTION public.has_clinic_role(_user_id uuid, _clinic_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND clinic_id = _clinic_id AND role = _role AND active);
$$;

CREATE OR REPLACE FUNCTION public.is_clinic_member(_user_id uuid, _clinic_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND clinic_id = _clinic_id
      AND role IN ('clinic_admin','veterinarian','receptionist') AND active);
$$;

CREATE OR REPLACE FUNCTION public.user_clinic_ids(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT clinic_id FROM public.user_roles
  WHERE user_id = _user_id AND clinic_id IS NOT NULL AND active;
$$;

CREATE OR REPLACE FUNCTION public.is_account_active(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND active);
$$;

-- ============================================================
-- RLS: clinics
-- ============================================================
CREATE POLICY "super_admin all clinics" ON public.clinics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "members read own clinic" ON public.clinics FOR SELECT TO authenticated
  USING (public.is_clinic_member(auth.uid(), id) OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND clinic_id = clinics.id AND role='tutor' AND active
  ));
CREATE POLICY "clinic_admin updates own clinic" ON public.clinics FOR UPDATE TO authenticated
  USING (public.has_clinic_role(auth.uid(), id, 'clinic_admin'));

-- ============================================================
-- RLS: profiles
-- ============================================================
CREATE POLICY "self read profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'super_admin')
    OR (primary_clinic_id IS NOT NULL AND public.is_clinic_member(auth.uid(), primary_clinic_id)));
CREATE POLICY "self update profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "self insert profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================================
-- RLS: user_roles
-- ============================================================
CREATE POLICY "self read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin')
    OR (clinic_id IS NOT NULL AND public.has_clinic_role(auth.uid(), clinic_id, 'clinic_admin')));
CREATE POLICY "super_admin manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "clinic_admin manage clinic roles" ON public.user_roles FOR ALL TO authenticated
  USING (clinic_id IS NOT NULL AND public.has_clinic_role(auth.uid(), clinic_id, 'clinic_admin'))
  WITH CHECK (clinic_id IS NOT NULL AND public.has_clinic_role(auth.uid(), clinic_id, 'clinic_admin'));

-- ============================================================
-- TABLE: pets
-- ============================================================
CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  species public.pet_species NOT NULL DEFAULT 'dog',
  breed text,
  sex public.pet_sex NOT NULL DEFAULT 'unknown',
  birth_date date,
  weight_kg numeric(5,2),
  color text,
  microchip text,
  neutered boolean DEFAULT false,
  notes text,
  photo_url text,
  public_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT SELECT ON public.pets TO anon;
GRANT ALL ON public.pets TO service_role;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_pets_updated BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "tutor own pets" ON public.pets FOR ALL TO authenticated
  USING (tutor_id = auth.uid()) WITH CHECK (tutor_id = auth.uid());
CREATE POLICY "clinic staff read pets" ON public.pets FOR SELECT TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "clinic staff manage pets" ON public.pets FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "super_admin pets" ON public.pets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
-- página pública via token (leitura restrita)
CREATE POLICY "public token pets" ON public.pets FOR SELECT TO anon USING (true);

-- ============================================================
-- TABLE: services
-- ============================================================
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_min integer NOT NULL DEFAULT 30,
  price numeric(10,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "services clinic read all" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "services clinic manage" ON public.services FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));

-- ============================================================
-- TABLE: appointments
-- ============================================================
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vet_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 30,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_appts_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "tutor own appts" ON public.appointments FOR SELECT TO authenticated USING (tutor_id = auth.uid());
CREATE POLICY "tutor create appts" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (tutor_id = auth.uid());
CREATE POLICY "tutor cancel own" ON public.appointments FOR UPDATE TO authenticated
  USING (tutor_id = auth.uid()) WITH CHECK (tutor_id = auth.uid());
CREATE POLICY "clinic staff appts" ON public.appointments FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "super_admin appts" ON public.appointments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- ============================================================
-- TABLE: medical_records
-- ============================================================
CREATE TABLE public.medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vet_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visit_date timestamptz NOT NULL DEFAULT now(),
  anamnesis text,
  physical_exam text,
  temperature numeric(4,1),
  weight_kg numeric(5,2),
  heart_rate integer,
  respiratory_rate integer,
  diagnosis text,
  treatment text,
  observations text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_records TO authenticated;
GRANT ALL ON public.medical_records TO service_role;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_mr_updated BEFORE UPDATE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "clinic staff mr" ON public.medical_records FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "tutor read own pet mr" ON public.medical_records FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = medical_records.pet_id AND p.tutor_id = auth.uid()));

-- ============================================================
-- TABLE: prescriptions
-- ============================================================
CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  medication text NOT NULL,
  dosage text,
  frequency text,
  duration text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT ALL ON public.prescriptions TO service_role;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prescriptions via mr" ON public.prescriptions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.medical_records m WHERE m.id = medical_record_id
    AND (public.is_clinic_member(auth.uid(), m.clinic_id)
      OR EXISTS (SELECT 1 FROM public.pets p WHERE p.id = m.pet_id AND p.tutor_id = auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.medical_records m
    WHERE m.id = medical_record_id AND public.is_clinic_member(auth.uid(), m.clinic_id)));

-- ============================================================
-- TABLE: vaccine_types
-- ============================================================
CREATE TABLE public.vaccine_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  species public.pet_species NOT NULL,
  description text,
  interval_days integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vaccine_types TO authenticated, anon;
GRANT ALL ON public.vaccine_types TO service_role;
ALTER TABLE public.vaccine_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vaccine_types public read" ON public.vaccine_types FOR SELECT USING (true);
CREATE POLICY "vaccine_types admin manage" ON public.vaccine_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- ============================================================
-- TABLE: vaccines
-- ============================================================
CREATE TABLE public.vaccines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  vaccine_type_id uuid REFERENCES public.vaccine_types(id) ON DELETE SET NULL,
  vaccine_name text NOT NULL,
  batch text,
  applied_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  applied_at date NOT NULL DEFAULT current_date,
  next_dose_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaccines TO authenticated;
GRANT ALL ON public.vaccines TO service_role;
ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_vac_updated BEFORE UPDATE ON public.vaccines FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "clinic staff vac" ON public.vaccines FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "tutor read own vac" ON public.vaccines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = vaccines.pet_id AND p.tutor_id = auth.uid()));

-- ============================================================
-- TABLE: exam_files
-- ============================================================
CREATE TABLE public.exam_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid REFERENCES public.medical_records(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_files TO authenticated;
GRANT ALL ON public.exam_files TO service_role;
ALTER TABLE public.exam_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinic staff exams" ON public.exam_files FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "tutor read own exams" ON public.exam_files FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = exam_files.pet_id AND p.tutor_id = auth.uid()));

-- ============================================================
-- TABLE: payments
-- ============================================================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  tutor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  method text,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_pay_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "clinic staff pay" ON public.payments FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));
CREATE POLICY "tutor read own pay" ON public.payments FOR SELECT TO authenticated
  USING (tutor_id = auth.uid());

-- ============================================================
-- TABLE: alerts
-- ============================================================
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE,
  kind text NOT NULL,
  message text NOT NULL,
  due_date date,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clinic staff alerts" ON public.alerts FOR ALL TO authenticated
  USING (public.is_clinic_member(auth.uid(), clinic_id))
  WITH CHECK (public.is_clinic_member(auth.uid(), clinic_id));

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  href text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self notifications" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- TABLE: admin_actions
-- ============================================================
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_actions super only" ON public.admin_actions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- ============================================================
-- CASCADE DE PAUSA
-- ============================================================
CREATE OR REPLACE FUNCTION public.cascade_clinic_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  IF NEW.status IN ('paused','canceled') THEN
    -- Pausa equipe da clínica
    UPDATE public.user_roles SET active = false
    WHERE clinic_id = NEW.id AND role IN ('clinic_admin','veterinarian','receptionist');
    -- Pausa tutores cujo primary_clinic_id = clínica
    UPDATE public.user_roles ur SET active = false
    WHERE ur.role = 'tutor' AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = ur.user_id AND p.primary_clinic_id = NEW.id
    );
    -- Marca profiles como pausados
    UPDATE public.profiles SET status = 'paused'
    WHERE primary_clinic_id = NEW.id
       OR id IN (SELECT user_id FROM public.user_roles WHERE clinic_id = NEW.id);
    NEW.paused_at = now();
  ELSIF NEW.status = 'active' THEN
    UPDATE public.user_roles SET active = true
    WHERE clinic_id = NEW.id AND role IN ('clinic_admin','veterinarian','receptionist');
    UPDATE public.user_roles ur SET active = true
    WHERE ur.role = 'tutor' AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = ur.user_id AND p.primary_clinic_id = NEW.id
    );
    UPDATE public.profiles SET status = 'active'
    WHERE primary_clinic_id = NEW.id
       OR id IN (SELECT user_id FROM public.user_roles WHERE clinic_id = NEW.id);
    NEW.paused_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cascade_clinic_status
BEFORE UPDATE OF status ON public.clinics
FOR EACH ROW EXECUTE FUNCTION public.cascade_clinic_status();

-- ============================================================
-- NEW USER: cria profile + auto-promove admin@jvet.com.br
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- Bootstrap: primeiro admin@jvet.com.br vira super_admin
  IF NEW.email = 'admin@jvet.com.br' AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'super_admin'
  ) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Seed: tipos de vacina comuns
-- ============================================================
INSERT INTO public.vaccine_types (name, species, interval_days) VALUES
  ('V8 (Óctupla)','dog',365),
  ('V10 (Décupla)','dog',365),
  ('Antirrábica','dog',365),
  ('Giárdia','dog',365),
  ('Tosse dos canis','dog',365),
  ('V3 (Tríplice felina)','cat',365),
  ('V4 (Quádrupla felina)','cat',365),
  ('V5 (Quíntupla felina)','cat',365),
  ('Antirrábica felina','cat',365),
  ('FeLV','cat',365)
ON CONFLICT DO NOTHING;
