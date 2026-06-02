-- =========================================================
-- AGORA - Modifications PostgreSQL
-- Synchronisation incrementale de la base hebergee
-- =========================================================

-- PostgreSQL enum update for the new ravitaillement status
-- On recrée le type sans la valeur "valide", puis on bascule les données existantes.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'statut_ravitaillement'
      AND e.enumlabel = 'valide'
  ) THEN
    DROP TYPE IF EXISTS statut_ravitaillement_new;

    CREATE TYPE statut_ravitaillement_new AS ENUM (
      'en_attente',
      'refuse',
      'en_cours',
      'annule',
      'termine'
    );

    ALTER TABLE ravitaillements
      ALTER COLUMN statut TYPE statut_ravitaillement_new
      USING CASE
        WHEN statut::text = 'valide' THEN 'en_cours'
        ELSE statut::text
      END::statut_ravitaillement_new;

    DROP TYPE statut_ravitaillement;
    ALTER TYPE statut_ravitaillement_new RENAME TO statut_ravitaillement;
  END IF;
END
$$;

-- =========================================================
-- TABLE ravitaillements
-- Renommage du suivi d'annulation et ajout des champs attendus par le backend
-- =========================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ravitaillements'
      AND column_name = 'date_refus'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ravitaillements'
      AND column_name = 'date_annulation'
  ) THEN
    EXECUTE 'ALTER TABLE ravitaillements RENAME COLUMN date_refus TO date_annulation';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ravitaillements'
      AND column_name = 'raison_refus'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ravitaillements'
      AND column_name = 'raison_annulation'
  ) THEN
    EXECUTE 'ALTER TABLE ravitaillements RENAME COLUMN raison_refus TO raison_annulation';
  END IF;
END
$$;

ALTER TABLE IF EXISTS ravitaillements
  ADD COLUMN IF NOT EXISTS date_annulation TIMESTAMP,
  ADD COLUMN IF NOT EXISTS raison_annulation TEXT;
