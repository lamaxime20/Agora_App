-- =========================================================
-- AGORA - Modifications PostgreSQL
-- Synchronisation incrementale de la base hebergee
-- =========================================================

-- PostgreSQL enum update for the new ravitaillement status
ALTER TYPE statut_ravitaillement ADD VALUE IF NOT EXISTS 'annule';

-- =========================================================
-- TABLE ravitaillements
-- Nouveaux champs de suivi du refus
-- =========================================================

ALTER TABLE IF EXISTS ravitaillements
  ADD COLUMN IF NOT EXISTS date_refus TIMESTAMP,
  ADD COLUMN IF NOT EXISTS raison_refus TEXT;
