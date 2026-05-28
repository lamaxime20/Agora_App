-- =========================================================
-- AGORA - Base de données PostgreSQL
-- Application de gestion commerciale pour les PME
-- =========================================================

-- =========================================================
-- EXTENSIONS
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- DOMAINES
-- =========================================================

CREATE DOMAIN Name
AS VARCHAR(100);

CREATE DOMAIN Email
AS VARCHAR(255)
CHECK (
  VALUE ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

CREATE DOMAIN Telephone
AS VARCHAR(30);

CREATE DOMAIN MoneyAmount
AS DECIMAL(15,2)
CHECK (VALUE >= 0);

CREATE DOMAIN PercentageValue
AS INTEGER
CHECK (VALUE >= 0 AND VALUE <= 100);

-- =========================================================
-- ENUMS
-- =========================================================

CREATE TYPE statut_invitation AS ENUM (
  'en_attente',
  'acceptee',
  'refusee',
  'expiree',
  'annulee'
);

CREATE TYPE statut_notification AS ENUM (
  'non_lue',
  'lue',
  'archivee'
);

CREATE TYPE type_notification AS ENUM (
  'invitation',
  'tache',
  'perte',
  'paiement',
  'stock',
  'livraison',
  'autre'
);

CREATE TYPE type_produit AS ENUM (
  'physique',
  'service'
);

CREATE TYPE statut_ravitaillement AS ENUM (
  'en_attente',
  'valide',
  'refuse',
  'en_cours',
  'termine'
);

CREATE TYPE statut_commande AS ENUM (
  'brouillon',
  'validee',
  'annulee'
);

CREATE TYPE etat_payement AS ENUM (
  'non_paye',
  'partiellement_paye',
  'paye'
);

CREATE TYPE statut_livraison AS ENUM (
  'en_cours',
  'livree',
  'echec',
  'retour'
);

CREATE TYPE mode_payement AS ENUM (
  'cash',
  'mobile_money',
  'carte_bancaire',
  'virement',
  'cheque',
  'autre'
);

CREATE TYPE statut_tache AS ENUM (
  'en_attente',
  'en_cours',
  'terminee',
  'annulee',
  'reportee'
);

CREATE TYPE statut_evenement AS ENUM (
  'planifie',
  'en_cours',
  'termine',
  'annule'
);

CREATE TYPE statut_presence AS ENUM (
  'present',
  'absent',
  'retard'
);

CREATE TYPE statut_general AS ENUM (
  'actif',
  'archive'
);

-- =========================================================
-- TABLE utilisateurs
-- =========================================================

CREATE TABLE IF NOT EXISTS utilisateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email Email NOT NULL,
  password_hash TEXT NOT NULL,

  name Name NOT NULL,
  prename Name NOT NULL,

  statut statut_general DEFAULT 'actif',

  modified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()

  CONSTRAINT utilisateurs_cc0 PRIMARY KEY(id),
  CONSTRAINT utilisateur_cc1 UNIQUE(email)
);

-- =========================================================
-- TABLE roles_utilisateur
-- =========================================================

CREATE TABLE IF NOT EXISTS roles_utilisateur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  role VARCHAR(100) NOT NULL,
  description TEXT

  CONSTRAINT roles_utilisateur_cc0 PRIMARY KEY(id),
  CONSTRAINT roles_utilisateur_cc1 UNIQUE(role)
);

-- =========================================================
-- TABLE entreprises
-- =========================================================

CREATE TABLE IF NOT EXISTS entreprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nom VARCHAR(255) NOT NULL,
  logo TEXT,
  code_couleur VARCHAR(20),

  argent_virtuel MoneyAmount DEFAULT 0,

  statut statut_general DEFAULT 'actif',

  directeur UUID NOT NULL,

  CONSTRAINT entreprises_cc0 PRIMARY KEY(id),
  CONSTRAINT entreprises_cr0
    FOREIGN KEY (directeur)
    REFERENCES utilisateurs(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS codes_couleurs (
  id UUID DEFAULT gen_random_uuid(),

  couleur_primaire VARCHAR(20) DEFAULT '#FFF',
  couleur_secondaire VARCHAR(20) DEFAULT '#000',
  couleur_tertiaire VARCHAR(20) DEFAULT '#F0F0F0',

  entreprise UUID NOT NULL,

  CONSTRAINT codes_couleurs_cc0 PRIMARY KEY(id),
  CONSTRAINT codes_couleurs_cr0
    FOREIGN KEY(entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)

-- =========================================================
-- TABLE appartenir_entreprise
-- =========================================================

CREATE TABLE IF NOT EXISTS appartenir_entreprise (
  utilisateur_id UUID NOT NULL,
  entreprise_id UUID NOT NULL,
  role_utilisateur_id UUID NOT NULL,

  date_enregistrement TIMESTAMP DEFAULT NOW(),

  statut statut_general DEFAULT 'actif',

  CONSTRAINT appartenir_entreprise_cc0
    PRIMARY KEY (
      utilisateur_id,
      entreprise_id,
      role_utilisateur_id
    ),

  CONSTRAINT appartenir_entreprise_cr0
    FOREIGN KEY (utilisateur_id)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT appartenir_entreprise_cr1
    FOREIGN KEY (entreprise_id)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT appartenir_entreprise_cr2
    FOREIGN KEY (role_utilisateur_id)
    REFERENCES roles_utilisateur(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE invitations
-- =========================================================

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email_invite Email NOT NULL,

  date_invitation TIMESTAMP DEFAULT NOW(),

  statut statut_invitation DEFAULT 'en_attente',

  date_expiration TIMESTAMP,

  actif BOOLEAN DEFAULT TRUE,

  role UUID NOT NULL,
  entreprise UUID NOT NULL,

  CONSTRAINT invitations_cc0 PRIMARY KEY(id),

  CONSTRAINT invitations_cr0
    FOREIGN KEY (role)
    REFERENCES roles_utilisateur(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT invitations_cr1
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE notifications
-- =========================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  titre VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  date_arrivee TIMESTAMP DEFAULT NOW(),

  statut statut_notification DEFAULT 'non_lue',

  type_notification type_notification NOT NULL,

  actif BOOLEAN DEFAULT TRUE,

  utilisateur UUID NOT NULL,
  entreprise UUID NOT NULL,
  role UUID NOT NULL,

  CONSTRAINT notifications_cc0 PRIMARY KEY(id),

  CONSTRAINT notifications_cr0
    FOREIGN KEY (utilisateur)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT notifications_cr1
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT notifications_cr2
    FOREIGN KEY (role)
    REFERENCES roles_utilisateur(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE categories_produit
-- =========================================================

CREATE TABLE IF NOT EXISTS categories_produit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  categorie VARCHAR(150) NOT NULL,
  description TEXT,

  entreprise UUID NOT NULL,
  utilisateur UUID NOT NULL,

  CONSTRAINT categories_produit_cc0 PRIMARY KEY(id),

  CONSTRAINT categories_produit_cc1
    UNIQUE(categorie, entreprise),

  CONSTRAINT categories_produit_cr0
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT categories_produit_cr1
    FOREIGN KEY (utilisateur)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE produits
-- =========================================================

CREATE TABLE IF NOT EXISTS produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nom VARCHAR(255) NOT NULL,

  date_creation TIMESTAMP DEFAULT NOW(),
  date_modification TIMESTAMP,

  image TEXT,

  prix_unitaire MoneyAmount NOT NULL,

  type_produit type_produit NOT NULL,

  stock_actuel DECIMAL(15,2) DEFAULT 0,

  unite_mesure VARCHAR(50),

  description TEXT,

  statut statut_general DEFAULT 'actif',

  utilisateur UUID NOT NULL,
  entreprise UUID NOT NULL,
  categorie UUID NOT NULL,

  CONSTRAINT produits_cc0 PRIMARY KEY(id),

  CONSTRAINT produits_cr0
    FOREIGN KEY (utilisateur)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT produits_cr1
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT produits_cr2
    FOREIGN KEY (categorie)
    REFERENCES categories_produit(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE ravitaillements
-- =========================================================

CREATE TABLE IF NOT EXISTS ravitaillements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  date_creation TIMESTAMP DEFAULT NOW(),

  statut statut_ravitaillement DEFAULT 'en_attente',

  quantite DECIMAL(15,2) NOT NULL,
  montant_a_depenser MoneyAmount NOT NULL,

  date_validation TIMESTAMP,
  date_execution TIMESTAMP,

  actif BOOLEAN DEFAULT TRUE,

  utilisateur_demande UUID NOT NULL,
  user_confirmation UUID,

  produit UUID NOT NULL,

  CONSTRAINT ravitaillements_cc0 PRIMARY KEY(id),

  CONSTRAINT ravitaillements_cr0
    FOREIGN KEY (utilisateur_demande)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT ravitaillements_cr1
    FOREIGN KEY (user_confirmation)
    REFERENCES utilisateurs(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT ravitaillements_cr2
    FOREIGN KEY (produit)
    REFERENCES produits(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE pertes_produits
-- =========================================================

CREATE TABLE IF NOT EXISTS pertes_produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  quantite_perdu DECIMAL(15,2) NOT NULL,

  motif_perte TEXT NOT NULL,

  date_perte TIMESTAMP DEFAULT NOW(),

  user_signale UUID NOT NULL,
  produit UUID NOT NULL,

  CONSTRAINT pertes_produits_cc0 PRIMARY KEY(id),

  CONSTRAINT pertes_produits_cr0
    FOREIGN KEY (user_signale)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT pertes_produits_cr1
    FOREIGN KEY (produit)
    REFERENCES produits(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE clients
-- =========================================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  email Email,

  nom Name NOT NULL,
  prenom Name,

  telephone Telephone,

  entreprise UUID NOT NULL,

  CONSTRAINT clients_cc0 PRIMARY KEY(id),

  CONSTRAINT clients_cr0
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE commandes
-- =========================================================

CREATE TABLE IF NOT EXISTS commandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  date_commande TIMESTAMP DEFAULT NOW(),

  statut statut_commande DEFAULT 'brouillon',

  etat_payement etat_payement DEFAULT 'non_paye',

  montant_commande MoneyAmount DEFAULT 0,

  date_validation TIMESTAMP,
  date_annulation TIMESTAMP,

  raison_annulation TEXT,

  actif BOOLEAN DEFAULT TRUE,

  entreprise UUID NOT NULL,

  utilisateur_enregistre UUID NOT NULL,
  client UUID NOT NULL,
  utilisateur_valide UUID,

  CONSTRAINT commandes_cc0 PRIMARY KEY(id),

  CONSTRAINT commandes_cr0
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT commandes_cr1
    FOREIGN KEY (utilisateur_enregistre)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT commandes_cr2
    FOREIGN KEY (client)
    REFERENCES clients(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT commandes_cr3
    FOREIGN KEY (utilisateur_valide)
    REFERENCES utilisateurs(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE contenir_produit
-- =========================================================

CREATE TABLE IF NOT EXISTS contenir_produit (
  commande_id UUID NOT NULL,
  produit_id UUID NOT NULL,

  quantite DECIMAL(15,2) NOT NULL,

  prix_unitaire MoneyAmount NOT NULL,

  reduction MoneyAmount DEFAULT 0,

  montant MoneyAmount NOT NULL,

  CONSTRAINT contenir_produit_cc0
    PRIMARY KEY (commande_id, produit_id),

  CONSTRAINT contenir_produit_cr0
    FOREIGN KEY (commande_id)
    REFERENCES commandes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT contenir_produit_cr1
    FOREIGN KEY (produit_id)
    REFERENCES produits(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE livraisons
-- =========================================================

CREATE TABLE IF NOT EXISTS livraisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  date_creation TIMESTAMP DEFAULT NOW(),

  date_livraison_effective TIMESTAMP,

  statut statut_livraison DEFAULT 'en_cours',

  motif_echec TEXT,
  motif_retour TEXT,

  date_lancement TIMESTAMP,

  actif BOOLEAN DEFAULT TRUE,

  commande UUID NOT NULL,
  livreur UUID NOT NULL,

  CONSTRAINT livraisons_cc0 PRIMARY KEY(id),

  CONSTRAINT livraisons_cr0
    FOREIGN KEY (commande)
    REFERENCES commandes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT livraisons_cr1
    FOREIGN KEY (livreur)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE payements
-- =========================================================

CREATE TABLE IF NOT EXISTS payements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  montant MoneyAmount NOT NULL,

  date_payement TIMESTAMP DEFAULT NOW(),

  mode_payement mode_payement,

  reference_transaction VARCHAR(255),

  actif BOOLEAN DEFAULT TRUE,

  commande UUID NOT NULL,
  user_enregistre UUID NOT NULL,
  entreprise UUID NOT NULL,

  CONSTRAINT payements_cc0 PRIMARY KEY(id),

  CONSTRAINT payements_cr0
    FOREIGN KEY (commande)
    REFERENCES commandes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT payements_cr1
    FOREIGN KEY (user_enregistre)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT payements_cr2
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE depenses
-- =========================================================

CREATE TABLE IF NOT EXISTS depenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  montant MoneyAmount NOT NULL,

  date_depense TIMESTAMP DEFAULT NOW(),

  raison TEXT NOT NULL,

  actif BOOLEAN DEFAULT TRUE,

  entreprise UUID NOT NULL,
  utilisateur_marque UUID NOT NULL,

  CONSTRAINT depenses_cc0 PRIMARY KEY(id),

  CONSTRAINT depenses_cr0
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT depenses_cr1
    FOREIGN KEY (utilisateur_marque)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE entrees_argent
-- =========================================================

CREATE TABLE IF NOT EXISTS entrees_argent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  montant MoneyAmount NOT NULL,

  raison TEXT NOT NULL,

  date_entree TIMESTAMP DEFAULT NOW(),

  actif BOOLEAN DEFAULT TRUE,

  entreprise UUID NOT NULL,
  utilisateur_marque UUID NOT NULL,

  CONSTRAINT entrees_argent_cc0 PRIMARY KEY(id),

  CONSTRAINT entrees_argent_cr0
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT entrees_argent_cr1
    FOREIGN KEY (utilisateur_marque)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE salaires
-- =========================================================

CREATE TABLE IF NOT EXISTS salaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  montant MoneyAmount NOT NULL,

  date_debut DATE,
  date_fin DATE,

  date_paiement TIMESTAMP,

  actif BOOLEAN DEFAULT TRUE,

  statut statut_general DEFAULT 'actif',

  utilisateur UUID NOT NULL,
  entreprise UUID NOT NULL,

  CONSTRAINT salaires_cc0 PRIMARY KEY(id),

  CONSTRAINT salaires_cr0
    FOREIGN KEY (utilisateur)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT salaires_cr1
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE frais_mensuel
-- =========================================================

CREATE TABLE IF NOT EXISTS frais_mensuel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  service_paye VARCHAR(255) NOT NULL,

  fournisseur VARCHAR(255),

  montant_mensuel MoneyAmount NOT NULL,

  depense_active BOOLEAN DEFAULT TRUE,

  date_abonnement DATE,

  actif BOOLEAN DEFAULT TRUE,

  entreprise UUID NOT NULL,

  CONSTRAINT frais_mensuel_cc0 PRIMARY KEY(id),

  CONSTRAINT frais_mensuel_cr0
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE pertes_argent
-- =========================================================

CREATE TABLE IF NOT EXISTS pertes_argent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  cause TEXT NOT NULL,

  montant MoneyAmount NOT NULL,

  date_constat TIMESTAMP DEFAULT NOW(),

  actif BOOLEAN DEFAULT TRUE,

  entreprise UUID NOT NULL,
  utilisateur_signale UUID NOT NULL,

  CONSTRAINT pertes_argent_cc0 PRIMARY KEY(id),

  CONSTRAINT pertes_argent_cr0
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT pertes_argent_cr1
    FOREIGN KEY (utilisateur_signale)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE remboursements
-- =========================================================

CREATE TABLE IF NOT EXISTS remboursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  cause TEXT NOT NULL,

  montant MoneyAmount NOT NULL,

  date_remboursement TIMESTAMP DEFAULT NOW(),

  actif BOOLEAN DEFAULT TRUE,

  commande UUID NOT NULL,
  utilisateur_engage UUID NOT NULL,
  entreprise UUID NOT NULL,

  CONSTRAINT remboursements_cc0 PRIMARY KEY(id),

  CONSTRAINT remboursements_cr0
    FOREIGN KEY (commande)
    REFERENCES commandes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT remboursements_cr1
    FOREIGN KEY (utilisateur_engage)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT remboursements_cr2
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE taches
-- =========================================================

CREATE TABLE IF NOT EXISTS taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nom VARCHAR(255) NOT NULL,

  description TEXT,

  date_demande TIMESTAMP DEFAULT NOW(),

  date_limite TIMESTAMP,

  statut statut_tache DEFAULT 'en_attente',

  pourcentage_avancement PercentageValue DEFAULT 0,

  raison_annulation TEXT,
  raison_report TEXT,

  date_fin TIMESTAMP,

  actif BOOLEAN DEFAULT TRUE,

  utilisateur_defini UUID NOT NULL,
  utilisateur_assigne UUID NOT NULL,
  role_associe UUID NOT NULL,
  entreprise UUID NOT NULL,

  CONSTRAINT taches_cc0 PRIMARY KEY(id),

  CONSTRAINT taches_cr0
    FOREIGN KEY (utilisateur_defini)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT taches_cr1
    FOREIGN KEY (utilisateur_assigne)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT taches_cr2
    FOREIGN KEY (role_associe)
    REFERENCES roles_utilisateur(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT taches_cr3
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE evenements
-- =========================================================

CREATE TABLE IF NOT EXISTS evenements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nom VARCHAR(255) NOT NULL,

  description TEXT,

  date_evenement TIMESTAMP NOT NULL,

  lieu VARCHAR(255),

  statut statut_evenement DEFAULT 'planifie',

  actif BOOLEAN DEFAULT TRUE,

  creation UUID NOT NULL,
  entreprise UUID NOT NULL,

  CONSTRAINT evenements_cc0 PRIMARY KEY(id),

  CONSTRAINT evenements_cr0
    FOREIGN KEY (creation)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT evenements_cr1
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE participer_evenement
-- =========================================================

CREATE TABLE IF NOT EXISTS participer_evenement (
  utilisateur_id UUID NOT NULL,
  evenement_id UUID NOT NULL,

  date_participation TIMESTAMP DEFAULT NOW(),

  statut_presence statut_presence,

  CONSTRAINT participer_evenement_cc0
    PRIMARY KEY (utilisateur_id, evenement_id),

  CONSTRAINT participer_evenement_cr0
    FOREIGN KEY (utilisateur_id)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT participer_evenement_cr1
    FOREIGN KEY (evenement_id)
    REFERENCES evenements(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE historiques
-- =========================================================

CREATE TABLE IF NOT EXISTS historiques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  module VARCHAR(100) NOT NULL,

  table_concernee VARCHAR(100) NOT NULL,

  id_element UUID NOT NULL,

  action VARCHAR(255) NOT NULL,

  details_action TEXT,

  ancienne_valeur TEXT,
  nouvelle_valeur TEXT,

  ip VARCHAR(100),

  user_agent TEXT,

  date_action TIMESTAMP DEFAULT NOW(),

  utilisateur UUID NOT NULL,
  entreprise UUID NOT NULL,

  CONSTRAINT historiques_cc0 PRIMARY KEY(id),

  CONSTRAINT historiques_cr0
    FOREIGN KEY (utilisateur)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT historiques_cr1
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE sessions
-- =========================================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  token VARCHAR NOT NULL UNIQUE,

  date_creation TIMESTAMP NOT NULL,

  date_expiration TIMESTAMP NOT NULL,

  validite BOOLEAN DEFAULT FALSE,

  role UUID NOT NULL,
  entreprise UUID NOT NULL,
  utilisateur UUID NOT NULL,

  CONSTRAINT sessions_cc0 PRIMARY KEY(id),

  CONSTRAINT sessions_cc1 UNIQUE(token),

  CONSTRAINT sessions_cr0
    FOREIGN KEY (role)
    REFERENCES roles_utilisateur(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT sessions_cr1
    FOREIGN KEY (entreprise)
    REFERENCES entreprises(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT sessions_cr2
    FOREIGN KEY (utilisateur)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE token_choix_role
-- =========================================================

CREATE TABLE IF NOT EXISTS token_choix_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  token VARCHAR NOT NULL UNIQUE,

  date_creation TIMESTAMP NOT NULL,

  date_expiration TIMESTAMP NOT NULL,

  validite BOOLEAN DEFAULT FALSE,

  utilisateur UUID NOT NULL,

  CONSTRAINT token_choix_role_cc0 PRIMARY KEY(id),

  CONSTRAINT token_choix_role_cc1 UNIQUE(token),

  CONSTRAINT token_choix_role_cr0
    FOREIGN KEY (utilisateur)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- TABLE codes_otp
-- Codes de vérification envoyés par e-mail lors de l'inscription
-- =========================================================

CREATE TABLE IF NOT EXISTS codes_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  code VARCHAR(10) NOT NULL,

  email Email NOT NULL,

  date_creation TIMESTAMP DEFAULT NOW(),

  date_expiration TIMESTAMP NOT NULL,

  utilise BOOLEAN DEFAULT FALSE,

  actif BOOLEAN DEFAULT TRUE,

  CONSTRAINT codes_otp_cc0 PRIMARY KEY(id)
);

-- =========================================================
-- TABLE codes_reinitialisation
-- Codes de réinitialisation de mot de passe (valables 1 heure)
-- =========================================================

CREATE TABLE IF NOT EXISTS codes_reinitialisation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  code VARCHAR(10) NOT NULL,

  date_creation TIMESTAMP DEFAULT NOW(),

  date_expiration TIMESTAMP NOT NULL,

  utilise BOOLEAN DEFAULT FALSE,

  actif BOOLEAN DEFAULT TRUE,

  utilisateur UUID NOT NULL,

  CONSTRAINT codes_reinitialisation_cc0 PRIMARY KEY(id),

  CONSTRAINT codes_reinitialisation_cr0
    FOREIGN KEY (utilisateur)
    REFERENCES utilisateurs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================================
-- INDEX
-- =========================================================

CREATE INDEX utilisateurs_email_index
ON utilisateurs(email);

CREATE INDEX entreprises_directeur_index
ON entreprises(directeur);

CREATE INDEX notifications_utilisateur_index
ON notifications(utilisateur);

CREATE INDEX notifications_entreprise_index
ON notifications(entreprise);

CREATE INDEX produits_entreprise_index
ON produits(entreprise);

CREATE INDEX produits_categorie_index
ON produits(categorie);

CREATE INDEX commandes_entreprise_index
ON commandes(entreprise);

CREATE INDEX commandes_client_index
ON commandes(client);

CREATE INDEX payements_commande_index
ON payements(commande);

CREATE INDEX livraisons_commande_index
ON livraisons(commande);

CREATE INDEX taches_utilisateur_assigne_index
ON taches(utilisateur_assigne);

CREATE INDEX historiques_entreprise_index
ON historiques(entreprise);

CREATE INDEX historiques_date_action_index
ON historiques(date_action);

CREATE INDEX sessions_token_index
ON sessions(token);

CREATE INDEX token_choix_role_token_index
ON token_choix_role(token);

CREATE INDEX codes_otp_email_index
ON codes_otp(email);

CREATE INDEX codes_otp_expiration_index
ON codes_otp(date_expiration);

CREATE INDEX codes_reinitialisation_utilisateur_index
ON codes_reinitialisation(utilisateur);

CREATE INDEX codes_reinitialisation_expiration_index
ON codes_reinitialisation(date_expiration);