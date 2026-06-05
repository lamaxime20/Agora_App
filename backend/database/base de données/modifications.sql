-- =========================================================
-- MODIFICATIONS DU SCHÉMA
-- =========================================================

ALTER TYPE mode_payement ADD VALUE IF NOT EXISTS 'virtuel';

ALTER TABLE commandes
  ADD COLUMN IF NOT EXISTS montant_minimum_validation MoneyAmount;

-- =========================================================
-- TABLE paiements_salaires
-- =========================================================

CREATE TABLE IF NOT EXISTS paiements_salaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salaire UUID NOT NULL,
  montant MoneyAmount NOT NULL,
  date_paiement TIMESTAMP DEFAULT NOW(),
  mode_payement mode_payement,
  reference_transaction VARCHAR(255),
  user_enregistre UUID NOT NULL,
  entreprise UUID NOT NULL,

  CONSTRAINT paiements_salaires_cr0
    FOREIGN KEY (salaire)
    REFERENCES salaires(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT paiements_salaires_cr1
    FOREIGN KEY (user_enregistre)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT paiements_salaires_cr2
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE paiements_abonnements
-- =========================================================

CREATE TABLE IF NOT EXISTS paiements_abonnements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abonnement UUID NOT NULL,
  montant MoneyAmount NOT NULL,
  date_paiement TIMESTAMP DEFAULT NOW(),
  reference_transaction VARCHAR(255),
  user_enregistre UUID NOT NULL,
  entreprise UUID NOT NULL,

  CONSTRAINT paiements_abonnements_cr0
    FOREIGN KEY (abonnement)
    REFERENCES frais_mensuel(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT paiements_abonnements_cr1
    FOREIGN KEY (user_enregistre)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT paiements_abonnements_cr2
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
