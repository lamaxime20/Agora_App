ALTER TABLE entreprises
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS telephone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS site_web TEXT,
  ADD COLUMN IF NOT EXISTS pays VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ville VARCHAR(100),
  ADD COLUMN IF NOT EXISTS adresse TEXT,
  ADD COLUMN IF NOT EXISTS secteur_activite VARCHAR(150),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS politique_entreprise TEXT;

UPDATE entreprises
SET
  email = COALESCE(
    email,
    lower(regexp_replace(nom, '[^a-zA-Z0-9]+', '.', 'g')) || '+' || substr(id::text, 1, 8) || '@agora.local'
  ),
  telephone = COALESCE(telephone, '+0000000000'),
  pays = COALESCE(pays, 'À renseigner'),
  ville = COALESCE(ville, 'À renseigner'),
  adresse = COALESCE(adresse, 'À renseigner'),
  secteur_activite = COALESCE(secteur_activite, 'À renseigner'),
  politique_entreprise = COALESCE(politique_entreprise, 'À renseigner')
WHERE
  email IS NULL
  OR telephone IS NULL
  OR pays IS NULL
  OR ville IS NULL
  OR adresse IS NULL
  OR secteur_activite IS NULL
  OR politique_entreprise IS NULL;

ALTER TABLE entreprises
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN telephone SET NOT NULL,
  ALTER COLUMN pays SET NOT NULL,
  ALTER COLUMN ville SET NOT NULL,
  ALTER COLUMN adresse SET NOT NULL,
  ALTER COLUMN secteur_activite SET NOT NULL,
  ALTER COLUMN politique_entreprise SET NOT NULL;

ALTER TABLE entreprises
  ALTER COLUMN argent_virtuel SET DEFAULT 0,
  ALTER COLUMN statut SET DEFAULT 'actif';
