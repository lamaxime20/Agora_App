Agora est une solution de gestion d'entreprise qui sera utilisée par de nombreuses entreprises et donc, les employés de ces entreprises.

Donc, ce sera un site web et une personne sera connaissable de manière unique à travers son adresse mail.

Lorsqu'un individu va venir sur le site web pour créer un compte, on va lui demander des informations comme :

son email,
son mot de passe,
son nom et prénom.

Après la création de son compte, il sera dirigé vers une interface où il aura le choix de se connecter à l'interface d'une entreprise en fonction de son rôle dans cette entreprise.

Cette interface de choix sera organisée sous forme de rôles.

Exemple :

Directeur

* Entreprise A
* Entreprise B

Gestionnaire de Stock

* Entreprise C

Vendeur

* Entreprise B
* Entreprise D

Chaque nom d'entreprise sera un bouton cliquable et lorsqu'un utilisateur va cliquer sur une entreprise, le système va automatiquement récupérer :

l'entreprise choisie,
le rôle associé à cette entreprise,

puis créer un token qui permettra à l'utilisateur d'effectuer uniquement les actions autorisées selon :

son rôle,
et l'entreprise sélectionnée.

Lorsqu'un individu va venir se connecter avec son email et son mot de passe, il sera redirigé vers cette même interface de choix.

Dans cette interface, l'utilisateur aura aussi l'opportunité d'enregistrer une nouvelle entreprise.

Après la création de l'entreprise, l'email qui a créé l'entreprise aura automatiquement le rôle de Directeur.

Le directeur de l'entreprise pourra alors ajouter d'autres emails au compte de l'entreprise et définir le rôle associé à chaque email.

Lorsqu'un directeur ajoute un email à l'entreprise :

le système crée une invitation,
associe le rôle choisi à cette invitation,
puis envoie une notification ou un lien d'invitation à l'utilisateur concerné.

Si l'utilisateur possède déjà un compte, il recevra directement une notification dans son espace personnel.

Sinon, il recevra un lien lui permettant de créer son compte avant de rejoindre l'entreprise.

Une invitation pourra avoir plusieurs états :

En attente,
Acceptée,
Refusée,
Expirée,
Annulée.

Lorsqu'un utilisateur accepte l'invitation, il rejoint officiellement l'entreprise avec le rôle qui lui a été attribué.

Une fois la connexion et la sélection de l'entreprise complétées, l'utilisateur sera dirigé vers l'interface où il choisira le module sur lequel il souhaitera travailler.

Il y a plusieurs modules.

Module Gestion de Stock

Ici, l'utilisateur sera capable de :

Ajouter ou retirer des produits,
Ajouter des catégories de produits,
Définir si un élément est un produit physique ou un service,
Enregistrer une livraison ou une fabrication de x nombre de produits,
Enregistrer une perte de x nombre de produits (vol, incendie, casse, expiration, etc...),
Voir les statistiques pour le marketing (produits les plus vendus, produits par saison, etc...).

Chaque produit possèdera :

une catégorie,
une unité de mesure (kg, litre, carton, pièce, etc...),
un type.

Un élément pourra être :

un produit physique,
ou un service.

Lorsqu'un élément est défini comme produit physique :

il possède un stock limité,
un stock réservé,
et un stock disponible.

Le stock disponible sera calculé automatiquement :

stock disponible = stock total - stock réservé

Lorsqu'une commande est validée :

le stock nécessaire est automatiquement réservé afin d'éviter les conflits de stock entre plusieurs vendeurs.

Lorsqu'un élément est défini comme service :

il ne dépend pas d'un nombre de stock,
mais l'entreprise devra confirmer qu'elle possède les ressources nécessaires avant de valider la commande du service.

Ici, un produit est créé puis mis en vente.

Ensuite, on peut enregistrer une fabrication ou une livraison d'un nombre précis de produits avec le prix dépensé pour ce réapprovisionnement.

Le module Gestion de Stock crée alors une demande de réapprovisionnement dans la base de données.

Le module Finance vient ensuite consulter les demandes de réapprovisionnement et décide :

de valider,
ou de refuser la demande selon les fonds disponibles dans l'entreprise.

Lorsqu'un réapprovisionnement est validé :

il passe en cours,
puis lorsqu'il devient effectif,
le stock augmente automatiquement.

Une demande de réapprovisionnement peut avoir plusieurs états :

En attente,
Validée,
Refusée,
En cours,
Terminée.

Lorsqu'une perte est enregistrée :

le directeur est directement notifié avec la valeur estimée de la perte,
et le stock est automatiquement mis à jour.

Les produits importants ne seront jamais supprimés définitivement.

Lorsqu'un utilisateur souhaite supprimer un produit :

celui-ci sera archivé,
afin de conserver l'historique des ventes et des mouvements liés à ce produit.
Module Vente

Ici, nous pouvons :

Enregistrer une commande,
Valider une commande,
Choisir un livreur pour une commande,
Annuler une commande,
Voir les statistiques des ventes.

Lorsqu'une commande arrive :

on enregistre les informations du client :
nom,
prénom,
email,
numéro de téléphone.

Puis :

si le stock disponible est suffisant,
ou si les ressources nécessaires pour un service sont disponibles,
la commande peut être validée.

Une commande validée devient alors un bon de commande.

Une commande peut avoir plusieurs états :

Brouillon,
Validée,
Partiellement payée,
Payée,
En livraison,
Livrée,
Annulée.

Une commande peut aussi recevoir plusieurs paiements.

Ainsi :

un client peut payer en plusieurs fois,
et le système met automatiquement à jour le montant restant à payer.

Ensuite, lorsque le module Finance confirme le paiement total ou partiel de la commande :

la livraison peut commencer avec le choix du livreur.

Les commandes importantes ne seront jamais supprimées définitivement.

Lorsqu'une commande est supprimée :

elle sera archivée afin de conserver l'historique commercial de l'entreprise.
Module Finances

Ici, nous pouvons :

Valider le paiement d'une commande,
Valider le réapprovisionnement d'un produit,
Noter toutes les dépenses de l'entreprise,
Noter toutes les entrées d'argent de l'entreprise,
Noter le salaire des employés,
Noter les frais mensuels des applications et services utilisés,
Signaler une perte d'argent ou un détournement,
Effectuer des remboursements,
Voir les statistiques financières.

Lorsqu'un bon de commande arrive :

le module Finance attend le paiement du client.

Lorsqu'un paiement est effectué :

le paiement est enregistré,
l'argent virtuel de l'entreprise augmente automatiquement,
et cette entrée est enregistrée dans l'historique financier.

Une commande peut recevoir :

un paiement complet,
ou plusieurs paiements partiels.

Le système met alors le statut de la commande à :

Partiellement payée lorsque la valeur cumulée des paiements partiels atteint 60% de la valeur de la commande.
ou Payée lorsque c'est 100%.

Lorsqu'une demande de réapprovisionnement est validée :

l'argent virtuel diminue automatiquement selon le coût du réapprovisionnement,
et cette dépense est enregistrée.

Lorsque l'utilisateur note une dépense :

l'argent virtuel diminue.

Lorsque l'utilisateur note une entrée :

l'argent virtuel augmente.

Toutes les fins de mois :

le salaire des employés,
ainsi que les dépenses liées aux applications et services,
sont automatiquement enregistrés comme dépenses.

Lorsqu'une perte d'argent est signalée :

l'utilisateur renseigne le montant restant,
le motif de la perte,
et le système met automatiquement à jour le montant virtuel de l'entreprise.

Une commande payée pourra aussi être remboursée totalement ou partiellement.

Chaque remboursement sera enregistré comme une sortie d'argent.

Le système permettra également de générer chaque mois un rapport financier contenant :

l'argent en début de mois,
les dépenses,
les entrées,
les remboursements,
les pertes,
et le solde final.

Les données financières importantes ne seront jamais supprimées définitivement.

Elles seront archivées afin de préserver l'historique financier de l'entreprise.

Module Gestion des tâches

Ici, nous pouvons :

Planifier les tâches des employés,
Voir les tableaux de tâches de chaque employé,
Voir les avancées en pourcentage,
Marquer l'avancement d'une tâche.

Lorsqu'un supérieur ajoute une tâche à un employé :

celui-ci reçoit automatiquement une notification.

Il est possible de voir les tâches assignées à chaque employé sous forme de tableau.

Pour son fichier de tâches :

une personne peut mettre le pourcentage d'accomplissement,
marquer une tâche comme terminée,
renseigner la date de début,
et laisser le système enregistrer automatiquement la date de fin lorsque la tâche atteint 100%.

Une tâche peut être :

reportée,
annulée,
ou terminée.

Lorsqu'une tâche est annulée ou reportée :

la raison doit être obligatoirement renseignée.
Module Livraison

Ici, nous pouvons :

Voir les livraisons en attente,
Choisir un livreur,
Lancer une livraison,
Confirmer une livraison,
Signaler un problème de livraison,
Voir les statistiques de livraison.

Lorsqu'une commande passe en état livrable :

une livraison est automatiquement créée.

Le responsable peut alors :

choisir un livreur,
définir les informations de livraison,
puis lancer la livraison.

Une livraison peut avoir plusieurs états :

En attente,
En préparation,
En cours,
Livrée,
Échec,
Retour.

Le livreur peut :

confirmer qu'une commande a été livrée,
signaler un échec,
ou indiquer un retour de marchandise avec le motif correspondant.

Lorsqu'une livraison échoue :

le stock peut être réajusté automatiquement selon la situation.
Module Événements

Ici, nous pouvons :

Définir ou retirer un évènement auquel les employés participeront,
Consulter le calendrier des évènements.
Notifications et Sécurité

Le système possèdera un centre de notifications.

Les utilisateurs recevront des notifications lorsqu'il y aura :

une nouvelle tâche,
une invitation d'entreprise,
une perte enregistrée,
un paiement validé,
un faible niveau de stock,
une livraison échouée,
ou tout autre événement important.

Chaque notification pourra avoir plusieurs états :

Non lue,
Lue,
Archivée.

Chaque action importante effectuée dans le système sera enregistrée dans un historique.

Le système enregistrera :

l'utilisateur,
l'entreprise,
le module concerné,
l'action effectuée,
la date,
et les modifications réalisées.

Toutes les requêtes effectuées dans le système devront obligatoirement vérifier l'entreprise sélectionnée afin d'empêcher qu'un utilisateur puisse accéder aux données d'une autre entreprise.

