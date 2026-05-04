ALTER TABLE public.donors 
ADD COLUMN IF NOT EXISTS eligibility_override text,
ADD COLUMN IF NOT EXISTS ineligibility_reason text;