-- =========================================
-- SUPPRESSION DES TABLES
-- =========================================

DROP TABLE IF EXISTS personal_access_tokens CASCADE;
DROP TABLE IF EXISTS visite_clients CASCADE;
DROP TABLE IF EXISTS bon_livraisons CASCADE;
DROP TABLE IF EXISTS factures CASCADE;
DROP TABLE IF EXISTS bon_commandes CASCADE;
DROP TABLE IF EXISTS ligne_proformas CASCADE;
DROP TABLE IF EXISTS proformas CASCADE;
DROP TABLE IF EXISTS dossiers CASCADE;
DROP TABLE IF EXISTS document_fournisseurs CASCADE;
DROP TABLE IF EXISTS fournisseurs CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS cache_locks CASCADE;
DROP TABLE IF EXISTS cache CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =========================================
-- SUPPRESSION DES DOMAINES METIER
-- =========================================

DROP DOMAIN IF EXISTS dom_delai_livraison CASCADE;
DROP DOMAIN IF EXISTS dom_etat_bon_livraison CASCADE;
DROP DOMAIN IF EXISTS dom_etat_facture CASCADE;
DROP DOMAIN IF EXISTS dom_statut_livraison CASCADE;
DROP DOMAIN IF EXISTS dom_etat_dossier CASCADE;
DROP DOMAIN IF EXISTS dom_statut_dossier CASCADE;
DROP DOMAIN IF EXISTS dom_type_document_fournisseur CASCADE;
DROP DOMAIN IF EXISTS dom_etat_client CASCADE;
DROP DOMAIN IF EXISTS dom_role_user CASCADE;

-- =========================================
-- SUPPRESSION DES DOMAINES GENERIQUES
-- =========================================

DROP DOMAIN IF EXISTS dom_token CASCADE;
DROP DOMAIN IF EXISTS dom_ip CASCADE;
DROP DOMAIN IF EXISTS dom_text CASCADE;
DROP DOMAIN IF EXISTS dom_decimal CASCADE;
DROP DOMAIN IF EXISTS dom_bigint CASCADE;
DROP DOMAIN IF EXISTS dom_integer CASCADE;
DROP DOMAIN IF EXISTS dom_bool CASCADE;
DROP DOMAIN IF EXISTS dom_timestamp CASCADE;
DROP DOMAIN IF EXISTS dom_password CASCADE;
DROP DOMAIN IF EXISTS dom_email CASCADE;
DROP DOMAIN IF EXISTS dom_string CASCADE;

-- L'extension uuid-ossp n'est généralement pas supprimée car elle est globale à la DB.