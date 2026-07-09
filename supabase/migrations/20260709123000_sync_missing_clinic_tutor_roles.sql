-- Migration: sync missing tutor roles for clinic CRM and add helpful indexes
-- This script helps ensure clinic tutors are discoverable by the app.

BEGIN;

-- Add helper indexes to improve clinic queries.
CREATE INDEX IF NOT EXISTS idx_user_roles_clinic_id_role ON public.user_roles (clinic_id, role);
CREATE INDEX IF NOT EXISTS idx_pets_clinic_id ON public.pets (clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id_scheduled_at ON public.appointments (clinic_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_vaccines_clinic_id_next_dose_at ON public.vaccines (clinic_id, next_dose_at);

-- Validate tutor entries that are linked by profile primary clinic but missing a tutor role.
-- Run the SELECT below first to review results before inserting.
--
-- SELECT p.id AS user_id, p.full_name, p.email, p.primary_clinic_id
-- FROM public.profiles p
-- LEFT JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'tutor' AND ur.clinic_id = p.primary_clinic_id
-- WHERE p.primary_clinic_id IS NOT NULL AND ur.id IS NULL;

-- If the selected rows are indeed tutors and the app should treat them as such,
-- uncomment the INSERT below and run it manually.
-- INSERT INTO public.user_roles (user_id, role, clinic_id, active)
-- SELECT p.id, 'tutor', p.primary_clinic_id, true
-- FROM public.profiles p
-- LEFT JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'tutor' AND ur.clinic_id = p.primary_clinic_id
-- WHERE p.primary_clinic_id IS NOT NULL AND ur.id IS NULL;

COMMIT;
