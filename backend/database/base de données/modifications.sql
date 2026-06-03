-- =========================================================
-- AGORA - Modifications du schéma PostgreSQL
-- Script à exécuter sur une base hébergée déjà existante
-- =========================================================

-- =========================================================
-- TABLE commandes
-- Ajout des champs de livraison et de notes complémentaires
-- =========================================================

ALTER TABLE commandes
  ADD COLUMN IF NOT EXISTS adresse_livraison TEXT;

ALTER TABLE commandes
  ADD COLUMN IF NOT EXISTS date_livraison_prevue TIMESTAMP;

ALTER TABLE commandes
  ADD COLUMN IF NOT EXISTS notes_supplementaires TEXT;

-- =========================================================
-- TABLE livraisons
-- Ajout des champs d'annulation
-- =========================================================

ALTER TABLE livraisons
  ADD COLUMN IF NOT EXISTS date_annulation TIMESTAMP;

ALTER TABLE livraisons
  ADD COLUMN IF NOT EXISTS raison_annulation TEXT;

ALTER TABLE livraisons
  ADD COLUMN IF NOT EXISTS utilisateur_annulation UUID;
