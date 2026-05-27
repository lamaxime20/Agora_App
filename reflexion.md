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