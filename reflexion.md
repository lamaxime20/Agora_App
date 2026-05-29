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
Quand le token va arriver au niveau du frontend avec HTTPOnly, le frontend va d'abord effacer complètement le localStorage puis, l'interface "/create-entreprise" va afficher entreprise créer avec succès, voir le dashboard, avec un bouton voir le dashboard qui va renvoyer vers "/application".