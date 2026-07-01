
-- Fix search_path on helper functions
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;

-- Storage policies (buckets: pet-photos, clinic-logos, exam-files)
-- Authenticated users can read all pet-photos and clinic-logos (needed for display; not PII)
CREATE POLICY "pet-photos read auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pet-photos');
CREATE POLICY "pet-photos insert auth" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pet-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "pet-photos update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'pet-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "pet-photos delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'pet-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "clinic-logos read auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'clinic-logos');
CREATE POLICY "clinic-logos insert auth" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clinic-logos');
CREATE POLICY "clinic-logos update auth" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'clinic-logos');

CREATE POLICY "exam-files read auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'exam-files');
CREATE POLICY "exam-files insert auth" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'exam-files');
