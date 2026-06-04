### Condition de check_email lors de la création d'un nouveau compte dans l'application

Lorsque l'utilisateur va créer un compte avec une adresse email, au moment de vérifier si un compte avec cet email n'existe pas encore, on fera cette condition
Si un utilisateur existe avec email et que l'utilisateur est archivé ou bien si aucun utilisateur n'existe avec cet email, on retourne que l'email est valide
Dans le cas contraire, on retourne que l'email est invalide.

### Logique signup
ça va se passer avec plusieurs form,
- Le premier form aura comme champs, nom, prénom, email
Chaque champ aura une balise <p> pour afficher l'erreur
Le form aura un bouton suivant, en dessous du bouton, il y aura
une balise <p> pour afficher l'erreur global (réseau etc...)
Lorsque on clique sur le bouton suivant, celui ci appelle une fonction dans utils qui va checker avec un lien API si l'email est déjà utilisé ou pas, et si l'email n'est pas utilisé, le backend va renvoyer un code de confirmation  par email et le frontend va renvoyer vers le second form
Il doit y avoir un bouton continuer avec Google.

- Le second form aura 06 champs pour entrer le code de vérification
en dessous du code, il y aura une balise <p> pour afficher l'erreur global (réseau etc...)
avec des boutons précedent et suivant
Lorsqu'on clique sur précédent, on rentre au premier form et là, si l'utilisateur ne change pas d'email et clique sur suivant, on n'envoit plus le lien API et on passe une fois à la vérification du code de vérification, si l'utilisateur change l'email ou bien, si le code de vérification expire, on rappel le lien API et il retournera un nouveau code.
Lorsque on clique sur le bouton suivant, on appelle un lien API pour vérifier le code de vérification, ensuite si c'est ok, le frontend dirige vers le troisième form.

- Le troisième form aura deux champs, un champ mot de passe et un champ de confirmation de mot de passe.
Chaque champ aura une balise <p> pour afficher l'erreur
Et en dessous, il y aura un bouton créer son compte avec une balise <p> pour afficher l'erreur global (réseau etc...)
quand on clique sur créer son compte, on appelle un lien API pour créer le compte et si tout est bon, on appelle un lien API pour login et le backend va retourner un token.
Quand on clique sur précédent, ça doit renvoyer vers le premier form et la logique d'envoi d'email doit être appliqué

- Tout le long de la création de compte, on stocke les infos que l'utilisateur remplit dans le localStorage et on efface tout dans le localStorage à la fin pour que l'utilisateur n'ait pas à recommencer à chaque fois

### Logique vérification mot de passe
Même logique que dans signup,
Un form pour l'email, dès qu'il clique sur suivant, on appelle un lien API pour vérifier l'existence de l'email, créer un code avec expiration dans 01 heure et le renvoyer
Le deuxième form sera là pour confirmer le code avec un bouton précédent et un bouton suivant
Quand on clique sur précédent, on rentre au form 1
Quand on clique sur suivant, on appelle un lien API pour vérifier le code et si tout est ok, on envoit au form 3
Le form 3 aura entrer le nouveau mot de passe, confirmer le mot de passe
Avec un bouton précédent et un bouton changer le mot de passe
Quand on clique sur précédent, on rentre au form 1
Quand on clique sur changer le mot de passe, on appelle un lien API pour changer le mot de passe et si tout est ok, on renvoit vers login
Au form 2, il y a possibilité de renvoyer le code, mais uniquement selon un timer
Lorsqu'on rentre au form 1 après l'envoit du premier code, on ne rappelle le lien API que dans deux conditions : soit, on a changé l'email, soit le code a expiré

### Logique login
l'utilisateur entre son email et son mot de passe, on fait un appel API vers le backend, et ensuite on récupère sa réponse et si c'est bon, on envoit vers "/application" en respectant les règles des contexts
Il doit y avoir un bouton continuer avec Google.

### Logique choix de role
Il y aura deux formulaires pour cela, un pour l'entreprise et un autre pour les rôles
Sur cette page, on va faire une requête API pour avoir le mappage des rôle de l'utilisateur en fonction des entreprises auxquelles il appartient.
- Sur le premier formulaire, il y aura la liste des entreprises auxquelles il appartient avec un bouton changer d'email, il devra cliquer sur une entreprise pour aller sur le second formulaire
- Sur le second formulaire, il y aura le nom de l'entreprise, la liste de ses rôles en fonction de l'entreprise qu'il aura choisi avec un bouton changer d'email et un bouton retour. Quand il va cliquer sur un rôle, on va faire un fetch vers le lien API correspondant, puis lorsque le backend aura répondu favorablement, on se dirige vers "/application"

### Logique des Contexts
Il y aura deux context afin de bien gérer les sessions de l'utilisateur
Tout d'abord, tu dois savoir qu'après le signup ou le login d'un utiiisateur, le backend va envoyer au frontend via les cookies HTTPOnly le token de l'utilisateur (on appelle ce token, "tokenAuth") et aussi, l'email, le nom, le prénom du USER, et le jour plus l'heure minute seconde d'expiration du token.
Ensuite, on dirige l'utilisateur vers la page "/choix-role", A partir de là, l'utilisateur va choisir une entreprise + un role et dès que le choix est fait, on appelle le lien API pour faire expirer le tokenAuth dans la base de données et maintenant créer le tokenAutorization.
Donc le backend va maintenant retourner au deuxième lien, le tokenAutorization en HTTPOnly, l'email, le nom, le prénom du USER et le jour + heure + minute + seconde d'expiration du token. et on va diriger l'utilisateur vers la page "/application"
## ContextAuth
Ce contextAuth va s'occuper du parcours de l'utilisateur entre la confirmation du signup/login, jusqu'à la confirmation du choix de entreprise + role.
Ainsi, si le token expire d'une quelconque manière, l'utilisateur doit automatiquement être redirigé vers le /login
Si le token est encore valide et que l'utilisateur veut se rendre sur une page autre que "/choix-role" ou "/create-entreprise", on le ramène vers le "/404 not found" avec un bouton retour pour rentrer à la page ou il était ou à défaut à la page "/choix-role"

## ContextAutorization
Ce contextAutorization va s'occuper du parcours utilisateur de la confirmation de entreprise + role à la navigation dans toute l'application.
A partir de là, l'utilisateur n'a pas le droit d'accéder à "/login" "/signup" "/choix-role" mais il peut accéder à "/create-entreprise" pour créer une nouvelle entreprise.
Si le token devient invalide, l'utilisateur est directement ramené à "/login"
Si l'utilisateur essaye d'accéder à une page interdite, on l'ammène à "/404 Not Found" avec un bouton retour pour rentrer à la page ou il était ou à défaut à "/application"

## Règles
- Quelque soit le token, pour effacer les données liées à la session et le token du frontend, on doit d'abord se rassurer que le backend a rendu ce token invalide dans la base de données, si l'opération de rendre le token invalide via un lien API échoue (le backend va renvoyer une erreur), on affiche un léger frame petit, qui va indiquer "déconnexion impossible, vérifier votre connexion"
- Si par erreur, les données de l'utilisateur dans le localStorage ont été effacé, il doit avoir un lien API pour récupérer ces informations juste avec les credentials (donc le token contenu dans le cookie HTTPOnly)

L'objectif est de restreindre au maximum les accès non désirés


### Logique de la creation d'entreprise
Il y aura 6 formulaires
- Sur le premier formulaire, le visiteur devra remplir le nom, et le secteur d'entreprise de l'entreprise (les deux champs sont obligatoires) avec un bouton suivant.
- Sur le second formulaire, l'utilisateur devra mettre le logo de son entreprise (champ non obligatoire) avec un bouton précédent, un bouton skip et un bouton suivant
- Sur le troisième formulaire, l'utilisateur devra mettre les couleurs de l'entreprise (en formation hexadécimal).
Pour lui faciliter la tâche, il y aura comme dans VSCODE un cardre pour sélectionner la couleur (je vais donner le cardre en image)
Il y aura trois champ pour les trois couleurs (tous non obligatoire)
- Sur le quatrième formulaire, l'utilisateur devra remplir l'email, le numéro de téléphone et le site web du site. L'email obligatoire, le numéro de téléphone obligatoire, le site web non obligatoire.
Avec deux boutons suivant et précédent.
- Sur le cinquième formulaire, l'utilisateur devra remplir le pays, la ville, et l'adresse street de son entreprise. Tous les champs sont obligatoires, avec deux boutons suivant et précédent.
- Sur le dernier formulaire, l'utilisateur devra remplir la politique de son entreprise, avec la description de son entreprise. Tous les deux champs sont obligatoires, avec un bouton précédent et un bouton créer l'entreprise.
Tout le long des 06 formulaires, les données devront être enregistrées dans le localStorage afin que l'utilisateur ne perde pas les champs déjà remplis et sa position dans les formulaires.
Du premier au sixième formulaire, il doit y avoir un bouton annuler en haut à gauche qui va diriger vers le dernier lien où était l'utilisateur avant d'arriver à "/create-entreprise" à défaut.
Le champ du logo doit être un champ de drag and drop avec possibilité de choisir une image spécifique de son appareil avec possibilité de retirer une image si l'utilisateur en a mis une qui ne lui plait pas.
Quand sur le dernier formulaire, on va cliquer sur le bouton créer son entreprise, on va envoyer toutes les données avec le credentials via un lien API, ensuite le backend va créer l'entreprise, trouver l'id de l'utilisateur à l'aide du token, puis avec l'id de l'utilisateur et l'id de l'entreprise, il va mettre l'utilisateur directeur dans la table appartenir_entreprise.
Puis, il va désactiver le token qui a été envoyé par les crédentials (que ce soit le token session ou le token choix role) et créer un nouveau token session avec l'entreprise crée et le rôle directeur, puis envoyer ce token.
Pour ce qui est de l'enregistrement de l'image, on va créer une fonction controller qui va enregistrer l'image dans le storage de Laravel puis génerer le lien URL pour accéder à l'image. C'est ce lien URL qu'on va enregistrer dans la Base de données
Quand le token va arriver au niveau du frontend avec HTTPOnly, le frontend va d'abord effacer complètement le localStorage puis, l'interface "/create-entreprise" va afficher entreprise créer avec succès, voir le dashboard, avec un bouton voir le dashboard qui va renvoyer vers "/application".

### Logique du module Gestion de Stock
Quand l'utilisateur arrive sur son espace de travail pour la gestion de stock, il y a une sidebar à gauche qui s'ouvre et se ferme et qui va lui permettre de sélectionner les pages sur lesquelles il veut travailler.
La sideBar aura 06 onglets (Dashboard, Produits, Reapprovisionnement, Réservation, Pertes, Statistiques) et sur le côté droit de la page, c'est l'interface correspondant à l'onglet sélectionné, qui va s'afficher.
#### Dashboard
Ici on va réfléchir après sur ce que va contenir le dashboard
#### Produits
Ici, l'interface de droite va montrer deux boutons en haut, un bouton Liste de Produits, et un autre Historique transaction de produits
##### Liste de Produits
Il y aura une barre de recherche pour rechercher un produit.
Il y aura deux boutons, un bouton pour ajouter un nouveau produit et un autre pour ajouter une catégorie
Quand on clique sur le bouton Ajoute un nouveau produit, une interface va s'ouvrir en floutant l'interface de derrière avec les champs :
- nom
- drag an drop pour l'image
- prix unitaire
- deux radio à unique selection pour le type de produit (physique ou service)
Si le type sélectionné est "service", les champs stock actuel, seuil d'alerte et unité de mesure sont masqués car ils ne sont pas applicables aux services.
- stock actuel
- seuil d'alerte de stock
- unité de mesure
- la description
- la categorie (qui sera un champ texte avec une liste de toutes les catégories en bas, à chaque entrée utilisateur, la liste se filtre et quand on clique sur un élément de la liste, ça remplace ce qui était dans le champ texte, on va charger les catégories en fonction des catégories de l'entreprise enregistrées dans la BD, donc si l'entreprise n'a enregistré aucune catégorie, on met dans la liste pas de catégorie enregistrée)
Pour les produits physiques, l'utilisateur doit définir un seuil d'alerte.
Lorsque le stock disponible devient inférieur ou égal à ce seuil, une notification de stock faible est automatiquement envoyée aux utilisateurs concernés.
Chaque entrée utilisateur est stockée dans le localStorage afin que si on ferme sans savoir l'interface, qu'on n'ait pas à réremplir tous les champs
Quand on clique sur le bouton ajouter une catégorie, un formulaire va s'afficher avec les champs :
- nom de la catégorie
- Description
Ici, on va afficher la liste des tous les produits de l'entreprise avec au bout droit de chaque élément produit, un badge qui va montrer la disponibilité du produit (en stock, indisponible, en rupture de stock)
Lorsqu'un produit atteint son seuil d'alerte, une notification de stock faible est automatiquement créée.

Lorsqu'un produit ne possède plus aucun stock disponible, une notification de rupture de stock est automatiquement créée.
Quand on clique sur un élément produit, on nous emmène vers une page produit qui comporte :
- un bouton retour
- L'image du produit
- Le nom du produit
- La description du produit
- La catégorie du produit
- Le type du produit (physique ou service)
- Les indications de disponibilité du produit (ces indications s'affichent uniquement pour les produits physiques) :
    - En stock
    - Réservé
    - Disponible
- Deux quatre boutons :
    - Ravitailler produit
    - Signaler une perte
    - Modifier produit
    - Supprimer produit
    Quand on clique sur ravitailler produit, une interface s'ouvre avec un champ pour indiquer le nombre de d'item de ce produit à ravitailler, et le montant total de ce ravitaillement.
    Quand on clique sur signaler perte, une interface s'ouvre avec un champ pour indiquer le nombre d'item de ce produit perdu et la raison de la perte
    Quand on clique sur modifier un produit, l'interface d'ajout de produit s'ouvre sauf que là, les informations du produit sont déjà présentes et le champ type de produit est disable (parce qu'on ne peut pas changer le type d'un produit) et le bouton de soumission va appeler un autre lien API.
    Quand on clique sur supprimer un produit, une interface demandant le mot de passe de l'utilisateur et un bouton confirmation de suppression s'affiche. Et quand on supprime, dans la base de donné, le statut passe à archive
- Des statistiques sur le produit :

    - Quantité totale vendue
    - Chiffre d'affaires généré
    - Nombre de commandes contenant ce produit

    - Stock actuel
    - Stock réservé
    - Stock disponible

    - Nombre total de réapprovisionnements
    - Quantité totale réapprovisionnée
    - Coût total des réapprovisionnements

    - Quantité totale perdue
    - Valeur financière estimée des pertes

    - Evolution des ventes sur les 7 derniers jours
    - Evolution des ventes sur les 30 derniers jours
Cette page produit aura sa propre route avec un slug "/application/produit/:slug" avec slug = id du produit
##### historique de transaction de produit
Ici, il y aura la liste de toutes les actions qui auront effectuées une modification du stock des produits.
Quand on va cliquer sur une liste, un pane va s'ouvrir pour montrer toutes les informations de l'action (que ce soit un ravitaillement, une perte, une commande livrée etc...)
En haut, il y aura des champs période (début - fin), une barre de recherche, une sélection du type de produit, une selection de la catégorie afin de filtrer la liste en fonction de tous ces paramètres.
Et il y aura un bouton pour génerer soit un fichier .pdf, .csv ou .docx de la liste filtrée.
Le fichier soit avoir tous les élements de la liste et tous les détails (ou informations) pour chaque élément. (c'est le backend qui génère le document avant de l'envoyer au frontend)

#### Rapprovisionnement
Ici, l'interface de droite va montrer deux boutons en haut, un bouton Rapprovisionnement, et un autre Historique Rapprovisionnement
##### Rapprovisionnement
Il y aura un bouton Faire un réapprovisionnement
En dessous, il y aura la liste de tous les réapprovisionnemnent en attente ou bien en cours
Pour chaque ligne, il y aura le statut indiqué à droite et un bouton pour annuler et si le ravitaillement est en cours, il y aura un bouton pour confirmer le ravitaillement (donc le terminer).
Quand on clique sur annuler, une interface s'ouvre pour demander la raison de l'annulation et avec un bouton pour confirmer l'annulation
Quand on clique sur confirmer, une interface s'affiche pour que l'utilisateur entre son mot de passe pour valider définitivement que le ravitaillement est effectué.
Lorsqu'un réapprovisionnement est validé, une notification est automatiquement envoyée aux utilisateurs concernés.

Lorsqu'un réapprovisionnement est refusé ou annulé, une notification est automatiquement envoyée avec la raison du refus ou de l'annulation.

##### Historique Réapprovisionnement
Ici, il y aura comme dans historique de transaction, tous les reapprovisionnements.
Maintenant, ceux qui respectent les deux conditions de l'interface Rapprovisionnement, auront leurs boutons, sinon, le reste aura juste le statut et quand on clique sur une ligne, tous les détails (informations) s'affichent sur un pane qui va s'ouvrir
Et il y aura tous les boutons pour les filtres, et un bouton pour génerer le rapport de la liste filtrée en .csv, .pdf ou .docx

#### Réservations
Ici, on va afficher la liste des reservations qu'on a faite sur tous les produits.
Une réservation arrive lorsqu'on enregistre une commande pour un produit. Donc en fait, toutes les commandes sont des réservations pour le produit commandé
Lorsqu'une commande est validée, le backend vérifie automatiquement que le stock disponible est suffisant pour satisfaire la quantité demandée.

Stock disponible = stock actuel - stock réservé.

Si le stock disponible est insuffisant, la validation de la commande est refusée.
Une réservation a trois états :
- en_cours : lorsque la commande n'est pas annulé, et que la livraison associée à la commande n'est pas validée
- validé : lorsque la livraison liée à la commande est validée et donc le stock a été déduit
- annulé : lorsque la commande a été annulée
Le stock réservé n'est jamais stocké dans la base de données.

Il est calculé dynamiquement à partir des commandes validées dont la livraison n'a pas encore été confirmée.

Le stock disponible est également calculé dynamiquement :

stock disponible = stock actuel - stock réservé.
Quand on clique sur une ligne de réservation, un pane s'ouvre et affiche toutes les informations liées à la réservation.
Et il y aura tous les boutons pour les filtres, et un bouton pour génerer le rapport de la liste filtrée en .csv, .pdf ou .docx
La validation d'une commande ne modifie jamais directement le stock actuel.

Le stock actuel est diminué uniquement lorsqu'une livraison associée à cette commande est confirmée avec succès.
#### Pertes
Ici, l'interface de droite va montrer deux boutons en haut, un bouton Pertes, et un autre Historique Pertes
##### Pertes
Ici, il y aura un bouton Signaler une perte
En dessous, il y aura la liste des pertes enregistrées il y a moins de 24 heures avec un bouton annuler la perte (on peut annuler une perte que si elle a été enregistrée il y a moins de 24 heures)
Quand on clique sur annuler, une interface s'ouvre pour demander le mot de passe de l'utilisateur avec un bouton pour confirmer l'annulation
Quand on clique sur une ligne, un pane s'ouvre pour montrer toutes les informations de la perte et aussi, si la perte a été enregistrée il y a moins de 24 heures, il y aura un bouton pour annuler la perte (avec la même logique d'annulation que celle décrite précédement)
Quand on clique sur signaler une perte, une interface s'ouvre avec les champs :
- selection du produit (avec une barre de recherche pour filtrer les produits)
- nombre d'item perdus
- raison de la perte
- un bouton pour confirmer la perte
Lorsqu'une perte est enregistrée, une notification est automatiquement envoyée au directeur de l'entreprise avec la quantité perdue et la valeur estimée de la perte.
##### Historique Pertes
Ici, il y aura la liste de toutes les pertes enregistrées et quand une perte respecte les conditions de l'interface pertes, elle aura les boutons associés.
Quand on clique sur une ligne de perte, un pane va s'ouvrir pour montrer toutes les informations de la perte et aussi, si la perte a été enregistrée il y a moins de 24 heures, il y aura un bouton pour annuler la perte (avec la même logique d'annulation que celle décrite précédement)
Et il y aura tous les boutons pour les filtres, et un bouton pour génerer le rapport de la liste filtrée en .csv, .pdf ou .docx
#### Statistiques

Cette section permet d'accéder à plusieurs pages de statistiques spécialisées.

##### Vue Générale

Cette page affiche :

- Nombre total de produits
- Nombre total de catégories
- Valeur totale du stock
- Produits en rupture de stock
- Produits en stock faible
- Quantité perdue sur la période
- Coût des pertes sur la période

##### Produits

Cette page affiche :

- Produits les plus vendus
- Produits les moins vendus
- Produits générant le plus de chiffre d'affaires
- Produits générant le moins de chiffre d'affaires

##### Stock

Cette page affiche :

- Répartition du stock par catégorie
- Valeur du stock par catégorie
- Evolution du stock dans le temps
- Produits les plus stockés
- Produits les moins stockés

##### Réapprovisionnements

Cette page affiche :

- Nombre de réapprovisionnements par période
- Coût total des réapprovisionnements
- Produits les plus réapprovisionnés
- Produits les moins réapprovisionnés

##### Pertes

Cette page affiche :

- Produits les plus touchés par les pertes
- Produits les moins touchés par les pertes
- Valeur financière des pertes
- Répartition des pertes par catégorie
- Evolution des pertes dans le temps

### Logique du module ventes
Quand l'utilisateur arrive sur son espace de travail pour la gestion des ventes, il y a une sidebar à gauche qui s'ouvre et se ferme et qui va lui permettre de sélectionner les pages sur lesquelles il veut travailler.
La sideBar aura 05 onglets (Dashboard, Commandes, Réservations, Clients, Statistiques) et sur le côté droit de la page, c'est l'interface correspondant à l'onglet sélectionné, qui va s'afficher.
#### Dashboard
Ici on va réfléchir après sur ce que va contenir le dashboard
#### Commandes
Ici, l'interface de droite va montrer deux boutons en haut, un bouton nouvelle commande, et un autre Historique de Commandes
##### Nouvelle Commande
Ici, ça sera un formulaire pour enregistrer une nouvelle commande, avec les champs :
- Choix du client : qui va ouvrir un pane avec la liste de tous les clients, avec une barre de recherche pour filtrer les clients, et quand on clique sur un client, le pane se ferme et le champ choix du client se remplit avec le nom du client sélectionné. Dans ce même pane, il y aura un bouton pour ajouter un nouveau client qui va ouvrir une interface pour ajouter un client avec les champs nom, prénom, email, numéro de téléphone. Et quand on ajoute le client, le client est ajouté à la base de données, le pane se ferme et le champ choix du client se remplit avec le nom du client ajouté, si un client avec le même email existe déjà, on affiche une erreur "un client avec cet email existe déjà".
- Choix du produit : qui va ouvrir un pane avec deux zones. La zone du heut va afficher les produits qu'on a déjà sélectionné pour la commande avec leurs quantités, et la zone du bas va afficher la liste de tous les produits avec une barre de recherche pour filtrer les produits. Dans la zone du haut, chaque ligne de produit aura un bouton moins et un bouton plus pour modifier la quantité du produit dans la commande, et un bouton supprimer pour retirer le produit de la commande Quand la quantité atteint zéro, le produit descend automatiquement dans la zone du bas. Dans la zone du bas, quand on clique sur un produit, il s'ajoute à la zone du haut avec une quantité de 1, si le produit est déjà dans la zone du haut, on n'affiche pas ce produit dans la zone du bas.
- Adresse de livraison
- Date de livraison souhaitée
- Un champ de texte pour les notes supplémentaires
- Un bouton pour confirmer la commande
Le montant total de la commande est calculé automatiquement à partir des produits sélectionnés.

montant_commande = somme(quantité × prix_unitaire - réduction)

Ce montant est enregistré dans la table commandes lors de la création de la commande.
Quand on confirme la commande, on vérifie que le stock disponible de chaque produit est suffisant pour satisfaire la quantité demandée. Si le stock disponible est insuffisant pour au moins un produit, on affiche une erreur "stock insuffisant pour le produit X" et la commande n'est pas enregistrée. Si le stock disponible est suffisant pour tous les produits, la commande est enregistrée avec un statut "brouillon" dans la base de données. Ensuite, une notification est automatiquement envoyée aux utilisateurs du module Finance afin de les informer qu'une nouvelle commande a été enregistrée et qu'elle est en attente de validation.
##### Historique de Commandes
Ici, il y aura la liste de toutes les commandes enregistrées avec leurs statuts respectifs (
    reçu
    validé
    en cours de livraison
    annulé
    livré
)
INFOS : Bon, le backend aura ses statuts pour les commandes qu'il va envoyer au frontend
reçu
validé
en cours de livraison
annulé
livré

Une commande dont le id=x est marquée comme reçu si le statut de la tuple de id x dans la table commandes est marqué comme brouillon

Une commande est marquée comme validé si dans la table commandes, le statut de la tuple de id x est marqué validé, et si dans la table livraisons, il n'y a aucune tuple qui fait référence à la commande de id x ou bien, toutes les tuples de livraisons qui y font référence sont marquées annulé.

Une commande est marqué en cours de livraison si dans la table commandes, le statut de la tuple de id x est marqué validé, état du payement est marqué au moins partiellement, et si dans la table livraisons, il y a une seule tuple qui fait référence à la commande de id x dont le statut est en_cours

Une commande est marquée annulé, lorsque dans la table commandes, le statut de la tuple de id x est marqué annulé.

Une commande de id x est marquée comme livré, si dans la table commandes, la tuple de la commande x doit avoir comme statut validé, état du payement est marqué au moins partiellement, et dans la table livraison, il doit y avoir une seule tuple dont le statut est marqué validé

Dans la table livraisons, pour une commande de id x dont le statut est en cours de livraison, il ne doit y avoir qu'une seule tuple dont le statut est en_cours, tout le reste des livraisons pour la commande x doivent être annulées sinon, on n'ajoute pas de livraison pour la commande x.

Si dans la table commandes, une commande de id x est marquée annulé, toutes les tuples de la table livraisons qui font références à la commande x, doivent être marquées annulé.

Une commande livrée ne peut plus recevoir de nouvelle livraison en_cours.
Maintenant, en fonction des statuts, il y aura des boutons différents pour chaque commande que l'utilisateur peut cliquer :
- reçu : un bouton pour annuler la commande
- validé : un bouton pour annuler la commande
- en cours de livraison : un bouton pour annuler la commande.
- annulé : aucun bouton
- livré : aucun bouton
Quand on clique sur annuler la commande, une interface s'ouvre pour demander la raison de l'annulation et avec un bouton pour confirmer l'annulation
Quand on clique sur une ligne de commande, un pane s'ouvre pour montrer toutes les informations de la commande et aussi, en fonction du statut de la commande, les boutons associés (annuler la commande etc...)
Le pane affiche également l'historique des paiements associés à la commande :

* date du paiement
* montant payé
* mode de paiement
* référence de transaction
* utilisateur ayant enregistré le paiement

Ces informations sont uniquement consultables depuis le module Vente. L'enregistrement des paiements est effectué exclusivement par le module Finance.

Et il y aura tous les boutons pour les filtres, et un bouton pour génerer le rapport de la liste filtrée en .csv, .pdf ou .docx
Notifications automatiques :

* Lorsqu'une nouvelle commande est enregistrée, une notification est envoyée au module Finance.
* Lorsqu'une commande est validée par le module Finance, une notification est envoyée au module Vente.
* Lorsqu'un paiement est enregistré par le module Finance, une notification est envoyée au module Vente.
* Lorsqu'une livraison est créée par le module Livraison, une notification est envoyée au module Vente.
* Lorsqu'une livraison est annulée, une notification est envoyée au module Vente.
* Lorsqu'une livraison est confirmée, une notification est envoyée au module Vente, au module Finance et au module Gestion de Stock.
#### Réservations
Ici, on va afficher la liste des reservations qu'on a faite sur tous les produits.
Une réservation arrive lorsqu'on enregistre une commande pour un produit. Donc en fait, toutes les commandes sont des réservations pour le produit commandé
Lorsqu'une commande est validée, le backend vérifie automatiquement que le stock disponible est suffisant pour satisfaire la quantité demandée.
Stock disponible = stock actuel - stock réservé.
Si le stock disponible est insuffisant, la validation de la commande est refusée.
Une réservation a trois états :
- en_cours : lorsque la commande n'est pas annulé, et que la livraison associée à la commande n'est pas validée
- validé : lorsque la livraison liée à la commande est validée et donc le stock a été déduit
- annulé : lorsque la commande a été annulée
Le stock réservé n'est jamais stocké dans la base de données.
Le stock réservé est calculé dynamiquement à partir des commandes validées dont aucune livraison n'a encore été confirmée.

Les commandes annulées ainsi que les commandes dont la livraison a été confirmée ne participent pas au calcul du stock réservé.
Il est calculé dynamiquement à partir des commandes validées dont la livraison n'a pas encore été confirmée.
Le stock disponible est également calculé dynamiquement :
stock disponible = stock actuel - stock réservé.
Le stock actuel n'est jamais diminué lors de la validation d'une commande.

Le stock actuel est diminué uniquement lorsqu'une livraison est confirmée par le module Livraison.

Lorsqu'une livraison est confirmée, le backend déduit automatiquement du stock actuel la quantité réellement livrée pour chaque produit concerné.

Cette opération est effectuée automatiquement par les mécanismes de gestion de stock de l'application.
Quand on clique sur une ligne de réservation, un pane s'ouvre et affiche toutes les informations liées à la réservation.
Et il y aura tous les boutons pour les filtres, et un bouton pour génerer le rapport de la liste filtrée en .csv, .pdf ou .docx
#### Clients
Ici, il y aura la liste de tous les clients avec leurs informations respectives (nom, prénom, email, numéro de téléphone) et quand on clique sur un client, un pane s'ouvre pour montrer toutes les informations du client et aussi, un bouton pour voir toutes les commandes du client. Quand on clique sur ce bouton, une interface s'ouvre avec la liste de toutes les commandes du client avec leurs statuts respectifs (reçu, validé, en cours de livraison, annulé, livré)
#### Statistiques
Cette section permet d'accéder à plusieurs pages de statistiques spécialisées.
##### Vue Générale
Cette page affiche :
- Nombre total de clients
- Nombre total de commandes
- Nombre total de produits
- Chiffre d'affaires total
- Commandes en cours de livraison
- Commandes livrées
- Commandes annulées
- Produits en rupture de stock
- Produits en stock faible
##### Clients
Cette page affiche :
- Clients les plus actifs (en fonction du nombre de commandes)
- Clients les moins actifs (en fonction du nombre de commandes)
- Clients qui génèrent le plus de chiffre d'affaires
- Clients qui génèrent le moins de chiffre d'affaires
##### Commandes
Cette page affiche :
- Commandes les plus frequentes (en fonction du nombre de commandes)
- Commandes les moins fréquentes (en fonction du nombre de commandes)
- Commandes générant le plus de chiffre d'affaires
- Commandes générant le moins de chiffre d'affaires
Toutes les actions importantes du module Vente sont enregistrées dans l'historique du système :

* création d'une commande
* annulation d'une commande
* validation d'une commande
* enregistrement d'un paiement
* création d'une livraison
* annulation d'une livraison
* confirmation d'une livraison

L'historique conserve l'utilisateur concerné, l'entreprise concernée, la date de l'action et les modifications effectuées.

### Logique du module Finance
Quand l'utilisateur arrive sur son espace de travail pour la gestion des finances, il y a une sidebar à gauche qui s'ouvre et se ferme et qui va lui permettre de sélectionner les pages sur lesquelles il veut travailler.
La sideBar aura 05 onglets (Dashboard, Commandes, remboursements, Dépenses, entrée, abonnement, reapprovisionnements, salaires, Statistiques) et sur le côté droit de la page, c'est l'interface correspondant à l'onglet sélectionné, qui va s'afficher.
#### Dashboard
Ici on va réfléchir après sur ce que va contenir le dashboard
#### Commandes
Ici, l'interface de droite va montrer deux boutons en haut, un bouton Commandes en attente de payement complet, et un autre Historique des payements
##### Commandes en attente de payement complet
Ici, il y aura la liste de toutes les commandes validées par le module Vente mais dont l'état du payement n'est pas marqué comme "payé", donc nous pouvons avoir le statut "en attente de paiement" et "partiellement payé".
Aussi, il y aura le statut de validation qui sera déterminé par le total de paiement minimum à enregistrer. Par défaut, ce total de paiement minimum sera égale au montant total de la commande. mais l'utilisateur peut cliquer sur ce montant pour le changer. Donc, quand le total de paiement enregistré atteint le seuil minimum, la commande est considérée comme validée et prête pour la livraison.
Quand on clique sur une ligne de commande, un pane s'ouvre pour montrer toutes les informations de la commande et aussi, les boutons associés pour enregistrer un paiement pour cette commande.
Le pane affiche également l'historique des paiements associés à la commande :
* date du paiement
* montant payé
* mode de paiement
* référence de transaction
* utilisateur ayant enregistré le paiement
Quand on clique sur le bouton pour enregistrer un paiement, une interface s'ouvre avec les champs :
- montant du paiement
- mode de paiement (carte bancaire, virement bancaire, espèces, chèque)
- référence de transaction (champ non obligatoire, à remplir uniquement si le mode de paiement est différent de espèces)
- un bouton pour confirmer l'enregistrement du paiement
Quand on confirme l'enregistrement du paiement, on se rassure que l'utilisateur a bien vérifié le montant du paiement et le paiement est enregistré dans la base de données en lien avec la commande correspondante.
##### Historique des paiements
Ici, il y aura la liste de tous les paiements enregistrés avec leurs informations respectives (date du paiement, montant payé, mode de paiement, référence de transaction, utilisateur ayant enregistré le paiement) et quand on clique sur une ligne de paiement, un pane s'ouvre pour montrer toutes les informations du paiement et aussi, un bouton pour voir la commande associée à ce paiement. Quand on clique sur ce bouton, une interface s'ouvre avec toutes les informations de la commande associée à ce paiement.
Et il y aura tous les boutons pour les filtres, et un bouton pour génerer le rapport de la liste filtrée en .csv, .pdf ou .docx
#### Remboursements
Ici, l'interface de droite va montrer deux boutons en haut, un bouton enregistrer un remboursement, et un autre Historique des remboursements
##### Enregistrer un remboursement
Ici, il y aura un formulaire pour enregistrer un remboursement avec les champs :
- Choix de la commande : qui va ouvrir un pane avec la liste de tous les commandes partiellement payées ou payées mais pas encore livrées, avec une barre de recherche pour filtrer les commandes, et quand on clique sur une commande, le pane se ferme et le champ choix de la commande se remplit avec le nom de la commande sélectionnée.
- montant du remboursement (ce montant ne doit pas dépasser le montant total payé pour la commande sélectionnée)
- La cause du remboursement (champ de texte)
- un bouton pour confirmer l'enregistrement du remboursement
Quand on confirme l'enregistrement du remboursement, on se rassure que l'utilisateur a bien vérifié le montant du remboursement et la cause du remboursement, et le remboursement est enregistré dans la base de données en lien avec la commande correspondante.
##### Historique des remboursements
Ici, il y aura la liste de tous les remboursements enregistrés avec leurs informations respectives (commande associée, montant du remboursement, cause du remboursement, date du remboursement, utilisateur ayant enregistré le remboursement) et quand on clique sur une ligne de remboursement, un pane s'ouvre pour montrer toutes les informations du remboursement et aussi, un bouton pour voir la commande associée à ce remboursement. Quand on clique sur ce bouton, une interface s'ouvre avec toutes les informations de la commande associée à ce remboursement.
Et il y aura tous les boutons pour les filtres, et un bouton pour génerer le rapport de la liste filtrée en .csv, .pdf ou .docx
#### Dépenses
Ici, l'interface de droite va montrer deux boutons en haut, un bouton enregistrer une dépense, et un autre Historique des dépenses
##### Enregistrer une dépense
Ici, il y aura un formulaire pour enregistrer une dépense avec les champs :
- date de la dépense
- montant de la dépense
- description de la dépense
- un bouton pour confirmer l'enregistrement de la dépense
Quand on confirme l'enregistrement de la dépense, on se rassure que l'utilisateur a bien vérifié le montant de la dépense et la description de la dépense, et la dépense est enregistrée dans la base de données.
##### Historique des dépenses
Ici, il y aura la liste de toutes les dépenses enregistrées avec leurs informations respectives (date de la dépense, montant de la dépense, description de la dépense) et quand on clique sur une ligne de dépense, un pane s'ouvre pour montrer toutes les informations de la dépense.
Et il y aura tous les boutons pour les filtres, et un bouton pour génerer le rapport de la liste filtrée en .csv, .pdf ou .docx
#### Entrées
Ici, l'interface de droite va montrer deux boutons en haut, un bouton enregistrer une entrée, et un autre Historique des entrées
##### Enregistrer une entrée
Ici, il y aura un formulaire pour enregistrer une entrée avec les champs :
- date de l'entrée
- montant de l'entrée
- description de l'entrée
- un bouton pour confirmer l'enregistrement de l'entrée
Quand on confirme l'enregistrement de l'entrée, on se rassure que l'utilisateur a bien vérifié le montant de l'entrée et la description de l'entrée, et l'entrée est enregistrée dans la base de données.
##### Historique des entrées
Ici, il y aura la liste de toutes les entrées enregistrées avec leurs informations respectives (date de l'entrée, montant de l'entrée, description de l'entrée) et quand on clique sur une ligne d'entrée, un pane s'ouvre pour montrer toutes les informations de l'entrée.
Et il y aura tous les boutons pour les filtres, et un bouton pour génerer le rapport de la liste filtrée en .csv, .pdf ou .docx
#### Abonnement
Ici, l'interface de droite va montrer deux boutons en haut, un bouton abonnement en cours, et un autre Historique des abonnements
##### Abonnement en cours
Ici, il y aura la liste de tous les abonnements enregistrés et qui sont actifs avec leurs informations respectives (date d'abonnement, montant de l'abonnement par mois, nom du service payé, fournisseur) et quand on clique sur une ligne d'abonnement, un pane s'ouvre pour montrer toutes les informations de l'abonnement.
Sur chaque ligne, il y aura un bouton pour couper l'abonnement, et quand on clique sur ce bouton, un pane s'ouvrir et demande à l'utilisateur de couper l'argent du mois en cours, ou bien non, et un bouton pour confirmer la coupure de l'abonnement. Si on confirme la coupure de l'abonnement, l'abonnement est marqué comme inactif dans la base de données et la date de fin d'abonnement est enregistrée.
En haut avant la liste, il y aura un bouton pour ajouter un nouvel abonnement qui va ouvrir une interface avec les champs :
- date de début d'abonnement
- montant de l'abonnement par mois
- nom du service payé
- fournisseur
- un bouton pour confirmer l'enregistrement de l'abonnement
Quand on confirme l'enregistrement de l'abonnement, on se rassure que l'utilisateur a bien vérifié la date de début d'abonnement, le montant de l'abonnement par mois, le nom du service payé et le fournisseur, et l'abonnement est enregistré dans la base de données.
Quand un abonnement est enregistré, une notification est automatiquement envoyée au directeur de l'entreprise avec le nom du service payé, le montant de l'abonnement par mois et le fournisseur et le backend va vérifier pour chaque abonnement le jour d'abonnement et si la date du jour correspond à la date de début d'abonnement, une notification de rappel de paiement est automatiquement envoyée au directeur de l'entreprise et on réduit automatiquement l'argent virtuelle de l'entreprise du montant de l'abonnement par mois, et on enregistre un paiement dans la base de données avec le montant de l'abonnement par mois, le mode de paiement "virtuel", et la référence de transaction "abonnement {nom_service}".
##### Historique des abonnements
Ici, il y aura la liste de tous les abonnements enregistrés actif ou inactif avec leurs informations respectives (date de début d'abonnement, date de fin d'abonnement, montant de l'abonnement par mois, nom du service payé, fournisseur) et quand on clique sur une ligne d'abonnement, un pane s'ouvre pour montrer toutes les informations de l'abonnement.
Pour les abonnements inactifs, il y aura un bouton pour réactiver l'abonnement, et quand on clique sur ce bouton, un pane s'ouvrir et demande à l'utilisateur de payer le mois en cours, ou bien non, et un bouton pour confirmer la réactivation de l'abonnement. Si on confirme la réactivation de l'abonnement, l'abonnement est marqué comme actif dans la base de données et la date de début d'abonnement est mise à jour avec la date du jour, aussi, si l'utilisateur a choisi de payer le mois en cours, on enregistre un paiement dans la base de données avec le montant du mois en cours, le mode de paiement "virtuel", et la référence de transaction "abonnement réactivé {nom_service}".
Et il y aura tous les boutons pour les filtres, et un bouton pour génerer le rapport de la liste filtrée en .csv, .pdf ou .docx
#### Reapprovisionnements
Ici, l'interface de droite va montrer deux boutons en haut, un bouton Rapprovisionnement, et un autre Historique Rapprovisionnement
##### Rapprovisionnement
Il y aura la liste de tous les réapprovisionnemnent en attente avec les boutons annuler et confirmer pour chaque réapprovisionnement en attente.
Quand on clique sur annuler, une interface s'ouvre pour demander la raison de l'annulation et avec un bouton pour confirmer l'annulation, le backend marque le ravitaillement comme refuse et une notification est automatiquement envoyée au module Gestion de Stock pour l'informer que le ravitaillement a été annulé avec la raison de l'annulation.
Quand on clique sur confirmer, une interface s'affiche pour que l'utilisateur entre son mot de passe pour valider définitivement que le ravitaillement peut être fait. A partir de là, le backend crée un paiement avec le montant total du ravitaillement, le mode de paiement "virtuel", et la référence de transaction "ravitaillement {id_ravitaillement}" et une notification est automatiquement envoyée au module Gestion de Stock pour l'informer que le ravitaillement est validé et qu'il doivent engager la livraison, l'argent virtuelle de l'entreprise est réduit du montant total du ravitaillement, et le réapprovisionnement est marqué comme validé dans la base de données.
##### Historique Réapprovisionnements
Ici, il y aura la liste de tous les reapprovisionnements validés ou refusés avec leurs informations respectives (produit, quantité, montant total du ravitaillement, statut du ravitaillement, date de la demande de ravitaillement) et quand on clique sur une ligne de ravitaillement, un pane s'ouvre pour montrer toutes les informations du ravitaillement et aussi, si le ravitaillement est en attente, les boutons associés pour annuler ou confirmer le ravitaillement.
Et il y aura tous les boutons pour les filtres, et un bouton pour génerer le rapport de la liste filtrée en .csv, .pdf ou .docx
#### Salaires
Ici, l'interface de droite va juste montrer la liste de tous les utilisateurs salariés de l'entreprise avec leurs informations respectives (nom, prénom, poste, salaire mensuel) et quand on clique sur une ligne de salarié, un pane s'ouvre pour montrer toutes les informations du salarié et aussi, un bouton pour voir l'historique des paiements de salaire de ce salarié. Quand on clique sur ce bouton, une interface s'ouvre avec la liste de tous les paiements de salaire de ce salarié avec leurs informations respectives (date du paiement, montant payé, mode de paiement, référence de transaction) et quand on clique sur une ligne de paiement de salaire, un pane s'ouvre pour montrer toutes les informations du paiement de salaire.
Et il y aura tous les boutons pour les filtres, et un bouton pour génerer le rapport de la liste filtrée en .csv, .pdf ou .docx
#### Statistiques
Cette section permet d'accéder à plusieurs pages de statistiques spécialisées.

### Logique du module Livraisons
Quand l'utilisateur arrive sur son espace de travail pour la gestion des livraisons, il y a une sidebar à gauche qui s'ouvre et se ferme et qui va lui permettre de sélectionner les pages sur lesquelles il veut travailler.
La sideBar aura 05 onglets (Dashboard, Commandes à livrer, Liste livraisons, Statistiques) et sur le côté droit de la page, c'est l'interface correspondant à l'onglet sélectionné, qui va s'afficher.
#### Dashboard
#### Commandes à livrer
Ici, l'interface de droite va montrer deux boutons en haut, un bouton Commandes à livrer, et un autre Historique des livraisons.
##### Commandes à livrer
Ici, toutes les commandes validées par les finances qui n'ont pas de livraisons 'en_cours' ou 'livree' seront affichées avec un bouton assigner un livreur
Quand on clique sur assigner un livreur, une interface s'ouvre avec un formulaire et les champs:
- choix du livreur, qui va permettre de selectionner un utilisateur parmis tous les utilisateurs qui ont le rôle employe_livreur dans l'entreprise
- un bouton confirmer la création d'une livraison pour la commande
Quand on confirme la création d'une livraison pour la commande, le backend crée un nouveau tuple livraison avec le statut 'en_cours' et lie celui ci à la commande actuelle
##### Historique des livraisons
Ici, on va afficher toutes les livraisons quelque soit l'état et quand on clique sur une ligne, on affiche tous les détails de la livraison et ceux de la commande associée.
Et il y aura tous les boutons pour les filtres, et un bouton pour génerer le rapport de la liste filtrée en .csv, .pdf ou .docx
#### Liste Livraisons
Ici, l'interface de droite va montrer deux boutons en haut, un bouton livraison 'en_cours', et un autre Historique de mes livraisons
##### livraison 'en_cours'
Ici, on va afficher toutes les livraisons en cours qu'on a assignées au livreur.
Si la date de lancement de la livraison n'a pas été renseigné, alors il y aura un bouton annuler la livraison et un bouton lancer la livraison
Quand on clique sur annuler la livraison, un pane s'ouvre avec les champs:
- raison de l'annulation
- un bouton pour confirmer l'annulation
Quand on clique sur confirmaer l'annulation, le backend marque la livraison comme echec avec le motif.
Quand on clique sur lancer la livraison, le backend enregistre la date d'aujoud'hui et la marque comme date de lancement.
Si la date de livraison a été renseigné, il y aura un bouton retour de la livraison, un bouton echec et un bouton valider la livraison
Quand on clique sur retour de la livraison, un pane s'ouvre avec les champs:
- raison du retour
- un bouton pour confirmer le retour
Quand on clique sur confirmer le retour, le backend marque la livraison comme retour avec le motif.
Quand on clique sur valider la livraison, un pane s'ouvrir pour demander à l'utilisateur que la commande a été effectivement livrée, quand il valide, le backend marque la livraison comme livree et le stock réservé est réduit sur chacun des stock des produits de la commande associée.
##### Historique de mes livraisons
Ici, on va afficher toutes les livraisons assignées à l'utilisateur quelque soit l'état et quand on clique sur une ligne, on affiche tous les détails de la livraison et ceux de la commande associée.
Et il y aura tous les boutons pour les filtres, et un bouton pour génerer le rapport de la liste filtrée en .csv, .pdf ou .docx