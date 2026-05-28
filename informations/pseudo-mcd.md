utilisateurs
id
email
password_hash
name
prename
statut
modified_at
created_at


entreprises
id
nom
logo
code_couleur
argent_virtuel
statut

appartenir_entreprise (association)
date_enregistrement
statut


invitations
id
email_invite
date_invitation
statut
date_expiration
actif

notifications
id
titre
message
date_arrivee
statut
type_notification
actif

roles_utilisateur
id
role
description


categories_produit
id
categorie
description


produits
id
nom
date_creation
date_modification
image
prix_unitaire
type_produit (physique/service)
stock_actuel
unite_mesure
description
statut


ravitaillements
id
date_creation
statut
quantite
montant_a_depenser
date_validation
date_execution
actif

pertes_produits
id
quantite_perdu
motif_perte
date_perte


commandes
id
date_commande
statut
etat_payement
montant_commande
date_validation
date_annulation
raison_annulation
actif

contenir_produit (association)
quantité,
prix unitaire,
réduction,
montant.

clients
id
email
nom
prenom
telephone

livraisons
id
date_creation
date_livraison_effective
statut
motif_echec
motif_retour
date_lancement
actif

payements
id
montant
date_payement
mode_payement
reference_transaction
actif

depenses
id
montant
date_depense
raison
actif

entrees_argent
id
montant
raison
date_entree
actif

salaires
id
montant
date_debut
date_fin
date_paiement
actif
statut


frais_mensuel
id
service_paye
fournisseur
montant_mensuel
depense_active (booleen)
date_abonnement
actif

pertes_argent
id
cause
montant
date_constat
actif

remboursements
id
cause
montant
date_remboursement
actif

taches
id
nom
description
date_demande
date_limite
statut
pourcentage_avancement
raison_annulation
raison_report
date_fin
actif

evenements
id
nom
description
date_evenement
lieu
statut
actif

participer_evenement (association)
date_participation
statut_presence


historiques
id
module
action
details_action
date_action