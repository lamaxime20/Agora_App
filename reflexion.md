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