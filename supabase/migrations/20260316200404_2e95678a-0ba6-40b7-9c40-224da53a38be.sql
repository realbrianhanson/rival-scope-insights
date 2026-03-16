ALTER TABLE public.competitors ADD COLUMN threat_score integer, ADD COLUMN threat_level text;

ALTER TABLE public.competitor_snapshots ADD COLUMN threat_score integer, ADD COLUMN threat_level text, ADD COLUMN threat_reason text, ADD COLUMN threat_trend text;