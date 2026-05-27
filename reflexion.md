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
l'utilisateur entre son email et son mot de passe, on fait un appel API vers le backend, et ensuite on récupère sa réponse.

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