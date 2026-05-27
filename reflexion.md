### Condition de check_email lors de la création d'un nouveau compte dans l'application

Lorsque l'utilisateur va créer un compte avec une adresse email, au moment de vérifier si un compte avec cet email n'existe pas encore, on fera cette condition
Si un utilisateur existe avec email et que l'utilisateur est archivé ou bien si aucun utilisateur n'existe avec cet email, on retourne que l'email est valide
Dans le cas contraire, on retourne que l'email est invalide.