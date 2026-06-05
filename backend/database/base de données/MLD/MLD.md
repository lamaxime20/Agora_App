Project AGORA {
  database_type: 'PostgreSQL'
  Note: 'Application de gestion commerciale pour les PME'
}

Enum statut_invitation {
  en_attente
  acceptee
  refusee
  expiree
  annulee
}

Enum statut_notification {
  non_lue
  lue
  archivee
}

Enum type_notification {
  invitation
  tache
  perte
  paiement
  stock
  livraison
  autre
}

Enum type_produit {
  physique
  service
}

Enum statut_ravitaillement {
  en_attente
  refuse
  en_cours
  annule
  termine
}

Enum statut_commande {
  brouillon
  validee
  annulee
}

Enum etat_payement {
  non_paye
  partiellement_paye
  paye
}

Enum statut_livraison {
  en_cours
  livree
  echec
  retour
}

Enum mode_payement {
  cash
  mobile_money
  carte_bancaire
  virement
  cheque
  virtuel
  autre
}

Enum statut_tache {
  en_attente
  en_cours
  terminee
  annulee
  reportee
}

Enum statut_evenement {
  planifie
  en_cours
  termine
  annule
}

Enum statut_presence {
  present
  absent
  retard
}

Enum statut_general {
  actif
  archive
}

Table utilisateurs {
  id uuid [pk]
  email varchar(255) [not null, unique]
  password_hash text [not null]
  name varchar(100) [not null]
  prename varchar(100) [not null]
  statut statut_general [default: 'actif']
  modified_at timestamp
  created_at timestamp [default: `now()`]
}

Table entreprises {
  id uuid [pk]
  nom varchar(255) [not null]
  logo text
  code_couleur varchar(20)
  argent_virtuel decimal(15,2) [default: 0]
  statut statut_general [default: 'actif']
  directeur uuid [not null]
}

Ref: entreprises.directeur > utilisateurs.id

Table appartenir_entreprise {
  utilisateur_id uuid
  entreprise_id uuid
  role_utilisateur_id uuid

  date_enregistrement timestamp [default: `now()`]
  statut statut_general [default: 'actif']

  indexes {
    (utilisateur_id, entreprise_id, role_utilisateur_id) [pk]
  }
}

ref: appartenir_entreprise.utilisateur_id > utilisateurs.id
ref: appartenir_entreprise.entreprise_id > entreprises.id
ref: appartenir_entreprise.role_utilisateur_id > roles_utilisateur.id

Table invitations {
  id uuid [pk]
  email_invite varchar(255) [not null]
  date_invitation timestamp [default: `now()`]
  statut statut_invitation [default: 'en_attente']
  date_expiration timestamp
  actif boolean [default: true]
  role uuid [not null]
  entreprise uuid [not null]
}

ref: invitations.role > roles_utilisateur.id
ref: invitations.entreprise > entreprises.id

Table notifications {
  id uuid [pk]
  titre varchar(255) [not null]
  message text [not null]
  date_arrivee timestamp [default: `now()`]
  statut statut_notification [default: 'non_lue']
  type_notification type_notification [not null]
  actif boolean [default: true]
  utilisateur uuid [not null]
  entreprise uuid [not null]
  role uuid [not null]
}

ref: notifications.utilisateur > utilisateurs.id
ref: notifications.entreprise > entreprises.id
ref: notifications.role > roles_utilisateur.id

Table roles_utilisateur {
  id uuid [pk]
  role varchar(100) [not null, unique]
  description text
}

Table categories_produit {
  id uuid [pk]
  categorie varchar(150) [not null, unique]
  description text
  entreprise uuid [not null]
  utilisateur uuid [not null]
}

ref: categories_produit.entreprise > entreprises.id
ref: categories_produit.utilisateur > utilisateurs.id

Table produits {
  id uuid [pk]
  nom varchar(255) [not null]
  date_creation timestamp [default: `now()`]
  date_modification timestamp
  image text
  prix_unitaire decimal(15,2) [not null]
  seuil_alerte decimal(15,2) [default: 0]
  type_produit type_produit [not null]
  stock_actuel decimal(15,2) [default: 0]
  unite_mesure varchar(50)
  description text
  statut statut_general [default: 'actif']
  utilisateur uuid [not null]
  entreprise uuid [not null]
  categorie uuid [not null]
}

ref: produits.utilisateur > utilisateurs.id
ref: produits.entreprise > entreprises.id
ref: produits.categorie > categories_produit.id

Table ravitaillements {
  id uuid [pk]
  date_creation timestamp [default: `now()`]
  statut statut_ravitaillement [default: 'en_attente']
  quantite decimal(15,2) [not null]
  montant_a_depenser decimal(15,2) [not null]
  date_validation timestamp
  date_execution timestamp
  date_annulation timestamp
  raison_annulation text
  actif boolean [default: true]
  utilisateur_demande uuid [not null]
  utilisateur_annulation uuid
  user_confirmation uuid
  produit uuid [not null]
  entreprise uuid [not null]
}

ref: ravitaillements.utilisateur_demande > utilisateurs.id
ref: ravitaillements.utilisateur_annulation > utilisateurs.id
ref: ravitaillements.user_confirmation > utilisateurs.id
ref: ravitaillements.produit > produits.id
ref: ravitaillements.entreprise > entreprises.id

Table pertes_produits {
  id uuid [pk]
  quantite_perdu decimal(15,2) [not null]
  motif_perte text [not null]
  date_perte timestamp [default: `now()`]
  user_signale uuid [not null]
  produit uuid [not null]
  entreprise uuid [not null]
}

ref: pertes_produits.user_signale > utilisateurs.id
ref: pertes_produits.produit > produits.id
ref: pertes_produits.entreprise > entreprises.id


Table commandes {
  id uuid [pk]
  date_commande timestamp [default: `now()`]
  statut statut_commande [default: 'brouillon']
  etat_payement etat_payement [default: 'non_paye']
  montant_commande decimal(15,2) [default: 0]
  montant_minimum_validation decimal(15,2)
  adresse_livraison text
  date_livraison_prevue timestamp
  notes_supplementaires text
  date_validation timestamp
  date_annulation timestamp
  raison_annulation text
  actif boolean [default: true]
  entreprise uuid [not null]
  utilisateur_enregistre uuid [not null]
  client uuid [not null]
  utilisateur_valide uuid
}

ref: commandes.entreprise > entreprises.id
ref: commandes.utilisateur_enregistre > utilisateurs.id
ref: commandes.client > clients.id
ref: commandes.utilisateur_valide > utilisateurs.id

Table paiements_salaires {
  id uuid [pk]
  salaire uuid [not null]
  montant decimal(15,2) [not null]
  date_paiement timestamp [default: `now()`]
  mode_payement mode_payement
  reference_transaction varchar(255)
  user_enregistre uuid [not null]
  entreprise uuid [not null]
}

ref: paiements_salaires.salaire > salaires.id
ref: paiements_salaires.user_enregistre > utilisateurs.id
ref: paiements_salaires.entreprise > entreprises.id

Table contenir_produit {
  commande_id uuid
  produit_id uuid

  quantite decimal(15,2) [not null]
  prix_unitaire decimal(15,2) [not null]
  reduction decimal(15,2) [default: 0]
  montant decimal(15,2) [not null]

  indexes {
    (commande_id, produit_id) [pk]
  }
}

ref: contenir_produit.commande_id > commandes.id
ref: contenir_produit.produit_id > produits.id

Table clients {
  id uuid [pk]
  email varchar(255)
  nom varchar(100) [not null]
  prenom varchar(100)
  telephone varchar(30)
  entreprise uuid [not null]
}

ref: clients.entreprise > entreprises.id

Table livraisons {
  id uuid [pk]
  date_creation timestamp [default: `now()`]
  date_livraison_effective timestamp
  statut statut_livraison [default: 'en_cours']
  motif_echec text
  motif_retour text
  date_lancement timestamp
  date_annulation timestamp
  raison_annulation text
  utilisateur_annulation uuid
  actif boolean [default: true]
  commande uuid [not null]
  livreur uuid [not null]
}

ref: livraisons.commande > commandes.id
ref: livraisons.livreur > utilisateurs.id
ref: livraisons.utilisateur_annulation > utilisateurs.id

Table payements {
  id uuid [pk]
  montant decimal(15,2) [not null]
  date_payement timestamp [default: `now()`]
  mode_payement mode_payement
  reference_transaction varchar(255)
  actif boolean [default: true]
  commande uuid [not null]
  user_enregistre uuid [not null]
  entreprise uuid [not null]
}

ref: payements.commande > commandes.id
ref: payements.user_enregistre > utilisateurs.id
ref: payements.entreprise > entreprises.id

Table depenses {
  id uuid [pk]
  montant decimal(15,2) [not null]
  date_depense timestamp [default: `now()`]
  raison text [not null]
  actif boolean [default: true]
  entreprise uuid [not null]
  utilisateur_marque uuid [not null]
}

ref: depenses.entreprise > entreprises.id
ref: depenses.utilisateur_marque > utilisateurs.id

Table entrees_argent {
  id uuid [pk]
  montant decimal(15,2) [not null]
  raison text [not null]
  date_entree timestamp [default: `now()`]
  actif boolean [default: true]
  entreprise uuid [not null]
  utilisateur_marque uuid [not null]
}

ref: entrees_argent.entreprise > entreprises.id
ref: entrees_argent.utilisateur_marque > utilisateurs.id

Table salaires {
  id uuid [pk]
  montant decimal(15,2) [not null]
  date_debut date
  date_fin date
  date_paiement timestamp
  actif boolean [default: true]
  statut statut_general [default: 'actif']
  utilisateur uuid [not null]
  entreprise uuid [not null]
}

ref: salaires.utilisateur > utilisateurs.id
ref: salaires.entreprise > entreprises.id

Table paiements_abonnements {
  id uuid [pk]
  abonnement uuid [not null]
  montant decimal(15,2) [not null]
  date_paiement timestamp [default: `now()`]
  reference_transaction varchar(255)
  user_enregistre uuid [not null]
  entreprise uuid [not null]
}

ref: paiements_abonnements.abonnement > frais_mensuel.id
ref: paiements_abonnements.user_enregistre > utilisateurs.id
ref: paiements_abonnements.entreprise > entreprises.id

Table frais_mensuel {
  id uuid [pk]
  service_paye varchar(255) [not null]
  fournisseur varchar(255)
  montant_mensuel decimal(15,2) [not null]
  depense_active boolean [default: true]
  date_abonnement date
  actif boolean [default: true]
  entreprise uuid [not null]
}

ref: frais_mensuel.entreprise > entreprises.id

Table pertes_argent {
  id uuid [pk]
  cause text [not null]
  montant decimal(15,2) [not null]
  date_constat timestamp [default: `now()`]
  actif boolean [default: true]
  entreprise uuid [not null]
  utilisateur_signale uuid [not null]
}

ref: pertes_argent.entreprise > entreprises.id
ref: pertes_argent.utilisateur_signale > utilisateurs.id

Table remboursements {
  id uuid [pk]
  cause text [not null]
  montant decimal(15,2) [not null]
  date_remboursement timestamp [default: `now()`]
  actif boolean [default: true]
  commande uuid [not null]
  utilisateur_engage uuid [not null]
  entreprise uuid [not null]
}

ref: remboursements.commande > commandes.id
ref: remboursements.utilisateur_engage > utilisateurs.id
ref: remboursements.entreprise > entreprises.id 

Table taches {
  id uuid [pk]
  nom varchar(255) [not null]
  description text
  date_demande timestamp [default: `now()`]
  date_limite timestamp
  statut statut_tache [default: 'en_attente']
  pourcentage_avancement integer [default: 0]
  raison_annulation text
  raison_report text
  date_fin timestamp
  actif boolean [default: true]
  utilisateur_defini uuid [not null]
  utilisateur_assigne uuid [not null]
  role_associe uuid [not null]
  entreprise uuid [not null]

  checks {
    `pourcentage_avancement >= 0 AND pourcentage_avancement <= 100`
  }
}

ref: taches.utilisateur_defini > utilisateurs.id
ref: taches.utilisateur_assigne > utilisateurs.id
ref: taches.role_associe > roles_utilisateur.id
ref: taches.entreprise > entreprises.id

Table evenements {
  id uuid [pk]
  nom varchar(255) [not null]
  description text
  date_evenement timestamp [not null]
  lieu varchar(255)
  statut statut_evenement [default: 'planifie']
  actif boolean [default: true]
  creation uuid [not null]
  entreprise uuid [not null]
}

ref: evenements.creation > utilisateurs.id
ref: evenements.entreprise > entreprises.id

Table participer_evenement {
  utilisateur_id uuid
  evenement_id uuid

  date_participation timestamp [default: `now()`]
  statut_presence statut_presence

  indexes {
    (utilisateur_id, evenement_id) [pk]
  }
}

ref: participer_evenement.utilisateur_id > utilisateurs.id
ref: participer_evenement.evenement_id > evenements.id

Table historiques {
  id uuid [pk]

  module varchar(100) [not null]
  table_concernee varchar(100) [not null]
  id_element uuid [not null]

  action varchar(255) [not null]
  details_action text

  ancienne_valeur text
  nouvelle_valeur text

  ip varchar(100)
  user_agent text

  date_action timestamp [default: `now()`]

  utilisateur uuid [not null]
  entreprise uuid [not null]
}

ref: historiques.utilisateur > utilisateurs.id
ref: historiques.entreprise > entreprises.id

Table sessions {
  id uuid [pk]
  token varchar [unique, not null]
  date_creation timestamp [not null]
  date_expiration timestamp [not null]
  validite bool [default: false]
  role uuid [not null]
  entreprise uuid [not null]
  utilisateur uuid [not null]
}

ref: sessions.role > roles_utilisateur.id
ref: sessions.entreprise > entreprises.id
ref: sessions.utilisateur > utilisateurs.id

Table token_choix_role {
  id uuid [pk]
  token varchar [unique, not null]
  date_creation timestamp [not null]
  date_expiration timestamp [not null]
  validite bool [default: false]
  utilisateur uuid [not null]
}

ref: token_choix_role.utilisateur > utilisateurs.id
