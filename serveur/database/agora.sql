-- =========================================
-- EXTENSION UUID
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- DOMAINES GENERIQUES
-- =========================================

CREATE DOMAIN dom_string AS VARCHAR(255)
CHECK (LENGTH(TRIM(VALUE)) > 0);

CREATE DOMAIN dom_email AS VARCHAR(255)
CHECK (POSITION('@' IN VALUE) > 1);

CREATE DOMAIN dom_password AS TEXT
CHECK (LENGTH(VALUE) >= 8);

CREATE DOMAIN dom_timestamp AS TIMESTAMP;

CREATE DOMAIN dom_bool AS BOOLEAN;

CREATE DOMAIN dom_integer AS INTEGER;

CREATE DOMAIN dom_bigint AS BIGINT;

CREATE DOMAIN dom_decimal AS NUMERIC(12,2);

CREATE DOMAIN dom_text AS TEXT;

CREATE DOMAIN dom_ip AS VARCHAR(45);

CREATE DOMAIN dom_token AS VARCHAR(64)
CHECK (LENGTH(TRIM(VALUE)) > 0);

-- =========================================
-- DOMAINES METIER
-- =========================================

CREATE DOMAIN dom_role_user AS VARCHAR(50)
CHECK (VALUE IN ('Commercial', 'Manager'));

CREATE DOMAIN dom_etat_client AS VARCHAR(50)
CHECK (VALUE IN ('Prospect', 'Client'));

CREATE DOMAIN dom_type_document_fournisseur AS VARCHAR(50)
CHECK (VALUE IN ('Proforma', 'Facture'));

CREATE DOMAIN dom_statut_dossier AS VARCHAR(50)
CHECK (VALUE IN ('Nouveau', 'Encours', 'Cloture'));

CREATE DOMAIN dom_etat_dossier AS VARCHAR(100)
CHECK (VALUE IN ('Demande', 'Proforma', 'Bon de commande', 'Facturation', 'Bon de livraison', 'Termine'));

CREATE DOMAIN dom_statut_livraison AS VARCHAR(100)
CHECK (VALUE IN ('En attente de livraison', 'Livraison dans les délais', 'Livraison hors délais'));

CREATE DOMAIN dom_etat_facture AS VARCHAR(50)
CHECK (VALUE IN ('En attente de validation', 'Non payee', 'Payee'));

CREATE DOMAIN dom_etat_bon_livraison AS VARCHAR(50)
CHECK (VALUE IN ('En attente', 'Livre'));

CREATE DOMAIN dom_delai_livraison AS VARCHAR(50)
CHECK (VALUE IN ('Dans les délais', 'Hors délai'));

-- =========================================
-- TABLE users
-- =========================================

CREATE TABLE IF NOT EXISTS users (
  id bigserial PRIMARY KEY,
  name dom_string NOT NULL,
  email dom_email NOT NULL,
  password dom_password NOT NULL,
  role dom_role_user NOT NULL,
  created_at dom_timestamp NULL,
  updated_at dom_timestamp NULL,
  email_verified_at dom_timestamp NULL,
  remember_token VARCHAR(100) NULL,
  CONSTRAINT users_email_unique UNIQUE (email)
);

-- =========================================
-- TABLE password_reset_tokens
-- =========================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id bigserial PRIMARY KEY,
  email dom_email NOT NULL,
  token dom_string NOT NULL,
  created_at dom_timestamp NULL,
  updated_at dom_timestamp NULL,
  CONSTRAINT password_reset_tokens_email_index UNIQUE (email)
);

-- =========================================
-- TABLE sessions
-- =========================================

CREATE TABLE IF NOT EXISTS sessions (
  id dom_string PRIMARY KEY,
  user_id dom_bigint NULL,
  ip_address dom_ip NULL,
  user_agent dom_text NULL,
  payload dom_text NOT NULL,
  last_activity dom_integer NOT NULL,
  created_at dom_timestamp NULL,
  updated_at dom_timestamp NULL,
  CONSTRAINT sessions_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS sessions_last_activity_index ON sessions(last_activity);

-- =========================================
-- TABLE cache
-- =========================================

CREATE TABLE IF NOT EXISTS cache (
  key dom_string PRIMARY KEY,
  value dom_text NOT NULL,
  expiration dom_integer NOT NULL
);

-- =========================================
-- TABLE cache_locks
-- =========================================

CREATE TABLE IF NOT EXISTS cache_locks (
  key dom_string PRIMARY KEY,
  owner dom_string NOT NULL,
  expiration dom_integer NOT NULL
);

-- =========================================
-- TABLE clients
-- =========================================

CREATE TABLE IF NOT EXISTS clients (
  id bigserial PRIMARY KEY,
  nom_entreprise VARCHAR(150) NOT NULL,
  contact VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  adresse dom_text NOT NULL,
  etat dom_etat_client NOT NULL,
  commercial_id dom_bigint NOT NULL,
  created_at dom_timestamp NULL,
  updated_at dom_timestamp NULL,
  CONSTRAINT clients_email_unique UNIQUE (email),
  CONSTRAINT clients_commercial_id_fk FOREIGN KEY (commercial_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- TABLE fournisseurs
-- =========================================

CREATE TABLE IF NOT EXISTS fournisseurs (
  id bigserial PRIMARY KEY,
  nom_entreprise VARCHAR(150) NOT NULL,
  contact VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  adresse dom_text NOT NULL,
  created_at dom_timestamp NULL,
  updated_at dom_timestamp NULL,
  CONSTRAINT fournisseurs_email_unique UNIQUE (email)
);

-- =========================================
-- TABLE document_fournisseurs
-- =========================================

CREATE TABLE IF NOT EXISTS document_fournisseurs (
  id bigserial PRIMARY KEY,
  fournisseur_id dom_bigint NOT NULL,
  type dom_type_document_fournisseur NOT NULL,
  fichier_pdf dom_text NOT NULL,
  created_at dom_timestamp NULL,
  updated_at dom_timestamp NULL,
  CONSTRAINT document_fournisseurs_fournisseur_id_fk FOREIGN KEY (fournisseur_id) REFERENCES fournisseurs(id) ON DELETE CASCADE
);

-- =========================================
-- TABLE dossiers
-- =========================================

CREATE TABLE IF NOT EXISTS dossiers (
  id bigserial PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  client_id dom_bigint NOT NULL,
  statut dom_statut_dossier NOT NULL,
  etat dom_etat_dossier NOT NULL,
  documents JSON NULL,
  created_at dom_timestamp NULL,
  updated_at dom_timestamp NULL,
  CONSTRAINT dossiers_client_id_fk FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- =========================================
-- TABLE proformas
-- =========================================

CREATE TABLE IF NOT EXISTS proformas (
  id bigserial PRIMARY KEY,
  dossier_id dom_bigint NOT NULL UNIQUE,
  total_ttc dom_decimal NOT NULL,
  created_at dom_timestamp NULL,
  updated_at dom_timestamp NULL,
  CONSTRAINT proformas_dossier_id_fk FOREIGN KEY (dossier_id) REFERENCES dossiers(id) ON DELETE CASCADE
);

-- =========================================
-- TABLE ligne_proformas
-- =========================================

CREATE TABLE IF NOT EXISTS ligne_proformas (
  id bigserial PRIMARY KEY,
  proforma_id dom_bigint NOT NULL,
  designation VARCHAR(255) NOT NULL,
  quantite dom_integer NOT NULL,
  prix_unitaire NUMERIC(10,2) NOT NULL,
  created_at dom_timestamp NULL,
  updated_at dom_timestamp NULL,
  CONSTRAINT ligne_proformas_proforma_id_fk FOREIGN KEY (proforma_id) REFERENCES proformas(id) ON DELETE CASCADE
);

-- =========================================
-- TABLE bon_commandes
-- =========================================

CREATE TABLE IF NOT EXISTS bon_commandes (
  id bigserial PRIMARY KEY,
  proforma_id dom_bigint NOT NULL,
  date_livraison_prevue DATE NOT NULL,
  fichier_scan dom_text NULL,
  statut_livraison dom_statut_livraison NOT NULL,
  created_at dom_timestamp NULL,
  updated_at dom_timestamp NULL,
  CONSTRAINT bon_commandes_proforma_id_fk FOREIGN KEY (proforma_id) REFERENCES proformas(id) ON DELETE CASCADE
);

-- =========================================
-- TABLE factures
-- =========================================

CREATE TABLE IF NOT EXISTS factures (
  id bigserial PRIMARY KEY,
  bon_commande_id dom_bigint NOT NULL,
  etat dom_etat_facture NOT NULL,
  recu_paiement_pdf dom_text NULL,
  validee_par dom_bigint NULL,
  created_at dom_timestamp NULL,
  updated_at dom_timestamp NULL,
  CONSTRAINT factures_bon_commande_id_fk FOREIGN KEY (bon_commande_id) REFERENCES bon_commandes(id) ON DELETE CASCADE,
  CONSTRAINT factures_validee_par_fk FOREIGN KEY (validee_par) REFERENCES users(id) ON DELETE SET NULL
);

-- =========================================
-- TABLE bon_livraisons
-- =========================================

CREATE TABLE IF NOT EXISTS bon_livraisons (
  id bigserial PRIMARY KEY,
  bon_commande_id dom_bigint NOT NULL,
  etat dom_etat_bon_livraison NOT NULL,
  delai_livraison dom_delai_livraison NULL,
  bon_livraison_scan_pdf dom_text NOT NULL,
  created_at dom_timestamp NULL,
  updated_at dom_timestamp NULL,
  CONSTRAINT bon_livraisons_bon_commande_id_fk FOREIGN KEY (bon_commande_id) REFERENCES bon_commandes(id) ON DELETE CASCADE
);

-- =========================================
-- TABLE visite_clients
-- =========================================

CREATE TABLE IF NOT EXISTS visite_clients (
  id bigserial PRIMARY KEY,
  client_id dom_bigint NOT NULL,
  utilisateur_id dom_bigint NOT NULL,
  date_visite DATE NOT NULL,
  objet VARCHAR(255) NOT NULL,
  rapport dom_text NOT NULL,
  created_at dom_timestamp NULL,
  updated_at dom_timestamp NULL,
  CONSTRAINT visite_clients_client_id_fk FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT visite_clients_utilisateur_id_fk FOREIGN KEY (utilisateur_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- TABLE personal_access_tokens
-- =========================================

CREATE TABLE IF NOT EXISTS personal_access_tokens (
  id bigserial PRIMARY KEY,
  tokenable_type VARCHAR(255) NOT NULL,
  tokenable_id dom_bigint NOT NULL,
  name VARCHAR(255) NOT NULL,
  token dom_token NOT NULL,
  abilities dom_text NULL,
  last_used_at dom_timestamp NULL,
  expires_at dom_timestamp NULL,
  created_at dom_timestamp NULL,
  updated_at dom_timestamp NULL,
  CONSTRAINT personal_access_tokens_token_unique UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS personal_access_tokens_tokenable_type_tokenable_id_index ON personal_access_tokens(tokenable_type, tokenable_id);

-- =========================================
-- FIN DU SCHEMA
-- =========================================
