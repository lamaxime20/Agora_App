Ajout d'un trigger pour mettre automatiquement à jour le nombre d'exemplaire d'un produit en fonction de la perte ou de l'ajout

Bon, le backend aura ses statuts pour les commandes qu'il va envoyer au frontend
reçu
validé
en cours de livraison
annulé
livré

Une commande dont le id=x est marquée comme reçu si le statut de la tuple de id x dans la table commandes est marqué comme reçu

Une commande est marquée comme validé si dans la table commandes, le statut de la tuple de id x est marqué validé, et si dans la table livraisons, il n'y a aucune tuple qui fait référence à la commande de id x ou bien, toutes les tuples de livraisons qui y font référence sont marquées annulé.

Une commande est marqué en cours de livraison si dans la table commandes, le statut de la tuple de id x est marqué validé, état du payement est marqué au moins partiellement, et si dans la table livraisons, il y a une seule tuple qui fait référence à la commande de id x dont le statut est en_cours

Une commande est marquée annulé, lorsque dans la table commandes, le statut de la tuple de id x est marqué annulé.

Une commande de id x est marquée comme livré, si dans la table commandes, la tuple de la commande x doit avoir comme statut validé, état du payement est marqué au moins partiellement, et dans la table livraison, il doit y avoir une seule tuple dont le statut est marqué validé

Dans la table livraisons, pour une commande de id x dont le statut est en cours de livraison, il ne doit y avoir qu'une seule tuple dont le statut est en_cours, tout le reste des livraisons pour la commande x doivent être annulées sinon, on n'ajoute pas de livraison pour la commande x.

Si dans la table commandes, une commande de id x est marquée annulé, toutes les tuples de la table livraisons qui font références à la commande x, doivent être marquées annulé.

Une commande livrée ne peut plus recevoir de nouvelle livraison en_cours.


On va calculer dynamiquement les stocks réservés en listant le nombre de commandes validés qui n'ont aucune livraisons successful et donc, on peut calculer le stock_disponible avec le stock actuel - le réservé qu'on a calculé
Quand la livraison est success, on diminue le stock_actuel
Comme ça, on évite de modifier les tuples de la table commande à chaque fois

# Personaliser les emails envoyé par Laravel
Afin qu'ils respectent le branding d'AGORA

# Remplacer le message d'erreur de Login
remplacer le message "Impossible de joindre le serveur." par le message "vérifier votre connexion"

# Rendre Actif le bouton continuer avec Google

# Services d'envoi de mail
Je veux configurer l'envoi de mail normal avec les variables d'environnement "MAIL_MAILER=log
MAIL_SCHEME=null
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}""
Et il y aussi Brevo.
En temps normal, ce sera le système d'envoi normal avec SMTP qui sera en fonctionnement, puis lorsque ce système va tomber en panne ou ne plus marcher à cause d'une restriction, brevo va prendre le relais et à partir de là, on va d'abord m'envoyer un email pour indiquer que le système SMTP ne fonctionne plus.

# La phase de passage entre la page de choix de role et la page de choix de module est lente
Il faut que je regarde ce qui se passe, et que j'optimise le code pour que ça soit plus rapide ou bien ajouter un loader pour que l'utilisateur puisse patienter pendant le chargement de la page