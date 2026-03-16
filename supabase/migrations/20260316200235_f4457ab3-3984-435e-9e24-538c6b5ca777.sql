-- Create exports storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own exports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Public read exports"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'exports');

-- Allow users to overwrite their own exports
CREATE POLICY "Users can update own exports"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);