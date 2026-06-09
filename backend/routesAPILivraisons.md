# Routes API — Module Livraisons

Toutes les routes nécessitent un token d'autorisation valide (cookie HTTPOnly `tokenAutorization`).
Le contrôleur extrait systématiquement `entreprise_id`, `utilisateur_id` et `role_id` depuis ce token.

Le **numéro de livraison** suit le format `LIV-{ANNÉE}-{SÉQUENCE_5_CHIFFRES}` (ex. `LIV-2026-00005`), incrémental par entreprise par année.

---

## DASHBOARD

### 1. GET /api/livraisons/dashboard

**Entrées (query params)**
- `periode` — string optionnel : `aujourd_hui|cette_semaine|ce_mois`, défaut `aujourd_hui`
- `date_debut` — date optionnelle, utilisée si `periode` est absent (période personnalisée)
- `date_fin` — date optionnelle, utilisée si `periode` est absent

**Actions du contrôleur**
1. Définir `date_debut` et `date_fin` :
   - `aujourd_hui` → début = `CURRENT_DATE 00:00:00`, fin = `CURRENT_DATE 23:59:59`
   - `cette_semaine` → lundi au dimanche de la semaine ISO courante
   - `ce_mois` → 1er jour au dernier jour du mois courant
   - Si `date_debut` + `date_fin` fournis sans `periode` → utiliser ces valeurs directement.
2. **Section `kpis`** — toutes les livraisons de l'entreprise (JOIN `livraisons` → `commandes` WHERE `commandes.entreprise = entreprise_id`) :
   - `enCours` = COUNT WHERE `livraisons.statut = 'en_cours'` AND `livraisons.actif = TRUE` (temps réel, sans filtre période)
   - `livrees` = COUNT WHERE `livraisons.statut = 'livree'` AND `livraisons.date_livraison_effective BETWEEN date_debut AND date_fin`
   - `echecs` = COUNT WHERE `livraisons.statut = 'echec'` AND `livraisons.date_creation BETWEEN date_debut AND date_fin`
   - `retours` = COUNT WHERE `livraisons.statut = 'retour'` AND `livraisons.date_creation BETWEEN date_debut AND date_fin`
   - `tauxReussite` = `livrees` / (`livrees` + `echecs` + `retours`) × 100, arrondi à 1 décimale (retourner 0 si dénominateur = 0)
   - `livreursActifs` = COUNT(DISTINCT `livraisons.livreur`) WHERE `livraisons.statut = 'en_cours'` AND `livraisons.actif = TRUE` (temps réel)
3. **Section `activiteRecente`** : récupérer les 10 dernières livraisons de l'entreprise triées par `livraisons.date_creation DESC`. Joindre `commandes` pour le numéro CMD généré (format `CMD-{ANNÉE}-{SÉQUENCE}`). Joindre `utilisateurs` via `livraisons.livreur` pour `name` + `prename`. Retourner l'heure au format HH:MM depuis `date_creation`.
4. **Section `repartitionStatuts`** : calculer `{ livrees, echecs, retours }` sur la période.
5. **Section `graphiqueJours`** : pour chacun des 7 derniers jours (J-6 à aujourd'hui), grouper les livraisons par jour (filtre sur `livraisons.date_creation`) → `{ jour (label DD/MM), livrees, echecs, retours }`.

**Réponse 200**
```json
{
  "kpis": {
    "enCours": 5,
    "livrees": 12,
    "echecs": 2,
    "retours": 1,
    "tauxReussite": 80.0,
    "livreursActifs": 4
  },
  "activiteRecente": [
    { "id": "uuid", "commande": "CMD-2026-00012", "livreur": "Koumba Jean", "statut": "en_cours", "heure": "14:32" }
  ],
  "repartitionStatuts": { "livrees": 12, "echecs": 2, "retours": 1 },
  "graphiqueJours": [
    { "jour": "03/06", "livrees": 4, "echecs": 0, "retours": 1 },
    { "jour": "04/06", "livrees": 3, "echecs": 1, "retours": 0 }
  ]
}
```

---

## COMMANDES À LIVRER

### 2. GET /api/livraisons/commandes-a-livrer

**Entrées (query params)**
- `page` — int, défaut 1
- `per_page` — int, défaut 20
- `recherche` — string optionnel (filtre ILIKE sur numéro CMD généré et `clients.nom` + `prenom`)

**Actions du contrôleur**
1. Récupérer les commandes WHERE `commandes.statut = 'validee'` AND `commandes.entreprise = entreprise_id` AND `commandes.actif = TRUE`.
2. Pour chaque commande, appliquer les filtres d'éligibilité (exclure si l'une des conditions est vraie) :
   - Calculer `total_paye` = SUM(`payements.montant`) WHERE `payements.commande = commandes.id` AND `payements.actif = TRUE`. Exclure si `total_paye < commandes.montant_minimum_validation`.
   - Exclure si EXISTS (SELECT 1 FROM `livraisons` WHERE `livraisons.commande = commandes.id` AND `livraisons.statut = 'en_cours'` AND `livraisons.actif = TRUE`).
   - Exclure si EXISTS (SELECT 1 FROM `livraisons` WHERE `livraisons.commande = commandes.id` AND `livraisons.statut = 'livree'` AND `livraisons.actif = TRUE`).
3. Joindre `clients` via `commandes.client` pour `nom` + `prenom`.
4. Calculer le numéro CMD généré (`CMD-{ANNÉE}-{SÉQUENCE_5_CHIFFRES}`).
5. Déterminer `etatPaiement` : `'valide'` si `total_paye >= commandes.montant_commande`, sinon `'partiel'`.
6. Appliquer filtre `recherche`, trier par `commandes.date_commande ASC` (les plus anciennes en premier), paginer.

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "numero": "CMD-2026-00005",
      "client": "Dupont Jean",
      "montant": 45000,
      "date": "2026-06-01",
      "etatPaiement": "valide"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 8 }
}
```

---

### 3. GET /api/livraisons/historique

**Entrées (query params)**
- `page` — int, défaut 1
- `per_page` — int, défaut 20
- `recherche` — string optionnel (filtre ILIKE sur numéro LIV, numéro CMD, `clients.nom`, `utilisateurs.name` livreur)
- `statut` — string optionnel : `tous|en_cours|livree|echec|retour`, défaut `tous`
- `date_debut` — date optionnelle, filtre sur `livraisons.date_creation`
- `date_fin` — date optionnelle

**Actions du contrôleur**
1. Récupérer toutes les livraisons via JOIN `livraisons` → `commandes` ON `commandes.id = livraisons.commande` WHERE `commandes.entreprise = entreprise_id` AND `livraisons.actif = TRUE`.
2. Pour chaque livraison :
   - Calculer le numéro LIV généré (`LIV-{ANNÉE}-{SÉQUENCE_5_CHIFFRES}` par entreprise).
   - Calculer le numéro CMD généré.
   - Joindre `clients` via `commandes.client` pour `nom` + `prenom`.
   - Joindre `utilisateurs` via `livraisons.livreur` pour `name` + `prename`.
3. Appliquer tous les filtres (recherche, statut, plage dates sur `livraisons.date_creation`), trier par `livraisons.date_creation DESC`, paginer.

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "numero": "LIV-2026-00005",
      "commande": "CMD-2026-00003",
      "client": "Dupont Jean",
      "livreur": "Koumba Jean",
      "statut": "en_cours",
      "montant": 45000,
      "dateCreation": "2026-06-05T09:00:00Z",
      "dateLancement": "2026-06-05T10:00:00Z",
      "dateLivraison": null
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 45 }
}
```

---

### 4. GET /api/livraisons/{id}

**Entrées (path param)**
- `id` — UUID de la livraison

**Actions du contrôleur**
1. Récupérer la livraison WHERE `id = {id}` AND `actif = TRUE`. Joindre `commandes` pour vérifier `commandes.entreprise = entreprise_id`. Retourner 404 si absente.
2. Calculer le numéro LIV et le numéro CMD.
3. Joindre `utilisateurs` via `livraisons.livreur` pour `name` + `prename` + `email`.
4. Joindre `clients` via `commandes.client` pour `nom` + `prenom` + `telephone`.
5. Récupérer les produits via `contenir_produit JOIN produits ON produits.id = contenir_produit.produit_id` WHERE `contenir_produit.commande_id = livraisons.commande`.

**Réponse 200**
```json
{
  "id": "uuid",
  "numero": "LIV-2026-00005",
  "statut": "en_cours",
  "motif": null,
  "dateCreation": "2026-06-05T09:00:00Z",
  "dateLancement": "2026-06-05T10:00:00Z",
  "dateLivraison": null,
  "livreur": "Koumba Jean",
  "commande": "CMD-2026-00003",
  "client": "Dupont Jean",
  "telephone": "+237600000001",
  "adresse": "Rue de l'Église, Douala",
  "montant": 45000,
  "produits": [
    { "nom": "Huile de palme 1L", "quantite": 3, "prix": 2500 }
  ]
}
```

---

### 5. GET /api/livraisons/historique/export

**Entrées (query params)**
- `format` — enum `pdf|csv|docx`, **requis**
- Mêmes filtres optionnels que route #3 (sans `page`, sans `per_page`)

**Actions du contrôleur**
1. Appliquer les mêmes filtres que route #3 sans pagination. Pour chaque livraison, inclure tous les champs de la route #3 plus : `adresse_livraison` de la commande, liste des produits (nom, quantité, prix unitaire), `motif_echec` ou `motif_retour` si applicable, `raison_annulation` si applicable.
2. Générer le fichier dans le format demandé.

**Réponse 200** — Fichier téléchargeable avec `Content-Disposition: attachment`.

---

## LIVREURS

### 6. GET /api/livraisons/livreurs

**Entrées (query params)**
- `recherche` — string optionnel, filtre ILIKE sur `utilisateurs.name` + `prename`

**Actions du contrôleur**
1. Récupérer tous les utilisateurs depuis `appartenir_entreprise` WHERE `entreprise_id = entreprise_id` AND `appartenir_entreprise.statut = 'actif'`, jointés sur `roles_utilisateur` WHERE `roles_utilisateur.role = 'employe_livreur'`.
2. Joindre `utilisateurs` via `appartenir_entreprise.utilisateur_id` pour `name`, `prename` et (si disponible dans profil étendu) `telephone`.
3. Pour chaque livreur, calculer `livraisonsEnCours` = COUNT FROM `livraisons` WHERE `livreur = utilisateurs.id` AND `statut = 'en_cours'` AND `actif = TRUE`.
4. Appliquer filtre `recherche` si fourni, trier par `utilisateurs.name ASC`.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "nom": "Koumba Jean", "telephone": "+237612345678", "livraisonsEnCours": 2 }
  ]
}
```

---

## MES LIVRAISONS (livreur connecté)

### 7. GET /api/livraisons/mes-livraisons

**Entrées** — aucune (tout depuis le token)

**Actions du contrôleur**
1. Extraire `utilisateur_id` depuis le token.
2. Récupérer toutes les livraisons WHERE `livraisons.livreur = utilisateur_id` AND `livraisons.statut = 'en_cours'` AND `livraisons.actif = TRUE`.
3. Pour chaque livraison : joindre `commandes` pour numéro CMD, `adresse_livraison`, `montant_commande`, `date_livraison_prevue` ; joindre `clients` via `commandes.client` pour `nom` + `prenom` + `telephone`.
4. Récupérer les produits via `contenir_produit JOIN produits` WHERE `contenir_produit.commande_id = livraisons.commande`.
5. Trier par `livraisons.date_creation ASC` (les plus anciennes en premier).

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "commande": "CMD-2026-00003",
      "client": "Dupont Jean",
      "telephone": "+237600000001",
      "adresse": "Rue de l'Église, Douala",
      "montant": 45000,
      "dateLancement": null,
      "statut": "en_cours",
      "produits": [
        { "nom": "Huile de palme 1L", "quantite": 3, "prix": 2500 }
      ]
    }
  ]
}
```

---

### 8. GET /api/livraisons/mes-livraisons/historique

**Entrées (query params)**
- `page` — int, défaut 1
- `per_page` — int, défaut 20
- `recherche` — string optionnel (filtre ILIKE sur numéro CMD, `clients.nom` + `prenom`)
- `statut` — string optionnel : `tous|en_cours|livree|echec|retour`, défaut `tous`
- `date_debut` — date optionnelle, filtre sur `livraisons.date_creation`
- `date_fin` — date optionnelle

**Actions du contrôleur**
1. Extraire `utilisateur_id` depuis le token.
2. Récupérer toutes les livraisons WHERE `livraisons.livreur = utilisateur_id` AND `livraisons.actif = TRUE`. Joindre `commandes` ON `commandes.id = livraisons.commande`.
3. Pour chaque livraison : joindre `clients` via `commandes.client` pour `nom` + `prenom`. Calculer numéro CMD.
4. Récupérer les produits via `contenir_produit JOIN produits` pour les inclure dans la réponse (utilisé par DeliveryDrawer).
5. Appliquer filtres (recherche, statut, plage dates), trier par `livraisons.date_creation DESC`, paginer.

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "commande": "CMD-2026-00003",
      "client": "Dupont Jean",
      "telephone": "+237600000001",
      "adresse": "Rue de l'Église, Douala",
      "montant": 45000,
      "statut": "livree",
      "motif": null,
      "dateCreation": "2026-06-05T09:00:00Z",
      "dateLancement": "2026-06-05T10:00:00Z",
      "dateLivraison": "2026-06-05T14:30:00Z",
      "produits": [
        { "nom": "Huile de palme 1L", "quantite": 3, "prix": 2500 }
      ]
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 30 }
}
```

---

### 9. GET /api/livraisons/mes-livraisons/historique/export

**Entrées (query params)**
- `format` — enum `pdf|csv|docx`, **requis**
- Mêmes filtres optionnels que route #8 (sans `page`, sans `per_page`)

**Actions du contrôleur**
1. Appliquer les mêmes filtres que route #8 sans pagination. Inclure tous les champs de la route #8 plus : `motif_echec` ou `motif_retour` si applicable.
2. Générer le fichier dans le format demandé.

**Réponse 200** — Fichier téléchargeable avec `Content-Disposition: attachment`.

---

## MUTATIONS LIVRAISONS

### 10. POST /api/livraisons

**Entrées (body JSON)**
- `commande_id` — UUID, **requis**
- `livreur_id` — UUID, **requis**

**Actions du contrôleur**
1. Récupérer la commande WHERE `id = commande_id` AND `entreprise = entreprise_id` AND `actif = TRUE`. Retourner 404 si absente.
2. Vérifier que `commandes.statut = 'validee'`. Sinon → 422 `{ "message": "La commande n'est pas validée." }`.
3. Calculer `total_paye` = SUM(`payements.montant`) WHERE `payements.commande = commande_id` AND `payements.actif = TRUE`.
4. Vérifier que `total_paye >= commandes.montant_minimum_validation`. Sinon → 422 `{ "message": "Le seuil minimum de paiement n'a pas été atteint pour cette commande." }`.
5. Vérifier qu'il n'existe PAS de livraison WHERE `commande = commande_id` AND `statut = 'livree'` AND `actif = TRUE`. Sinon → 422 `{ "message": "Cette commande a déjà été livrée." }`.
6. Vérifier qu'il n'existe PAS de livraison WHERE `commande = commande_id` AND `statut = 'en_cours'` AND `actif = TRUE`. Sinon → 422 `{ "message": "Une livraison est déjà en cours pour cette commande." }`.
7. Vérifier que `livreur_id` correspond à un utilisateur actif dans `appartenir_entreprise` WHERE `utilisateur_id = livreur_id` AND `entreprise_id = entreprise_id` AND `statut = 'actif'`, jointés sur `roles_utilisateur` WHERE `role = 'employe_livreur'`. Sinon → 422 `{ "message": "Ce livreur n'appartient pas à l'entreprise ou n'a pas le rôle requis." }`.
8. Insérer dans `livraisons` : `commande = commande_id`, `livreur = livreur_id`, `statut = 'en_cours'`, `date_creation = NOW()`, `actif = TRUE`. Récupérer `livraison_id`.
9. Calculer le numéro LIV généré et le numéro CMD.
10. Créer une notification pour le livreur : `type_notification = 'livraison'`, `titre = 'Nouvelle livraison assignée'`, `message = 'Une nouvelle livraison vous a été assignée pour la commande {numero_commande}.'`, `utilisateur = livreur_id`, `entreprise = entreprise_id`, `role = role_id_livreur`.
11. Insérer dans `historiques` : `module = 'livraisons'`, `table_concernee = 'livraisons'`, `id_element = livraison_id`, `action = 'création livraison'`, `details_action = '{numero_commande} → {nom_livreur}'`, `utilisateur = utilisateur_id`, `entreprise = entreprise_id`.

**Réponse 201**
```json
{
  "livraison": { "id": "uuid", "numero": "LIV-2026-00008", "statut": "en_cours", "dateCreation": "2026-06-08T11:00:00Z" }
}
```

---

### 11. POST /api/livraisons/{id}/lancer

**Entrées (path param)**
- `id` — UUID de la livraison

Aucun body requis.

**Actions du contrôleur**
1. Récupérer la livraison WHERE `id = {id}` AND `actif = TRUE`. Joindre `commandes` pour vérifier `commandes.entreprise = entreprise_id`. Retourner 404 si absente.
2. Vérifier que `livraisons.statut = 'en_cours'`. Sinon → 422 `{ "message": "Cette livraison ne peut pas être lancée." }`.
3. Vérifier que `livraisons.date_lancement IS NULL`. Sinon → 422 `{ "message": "Cette livraison est déjà lancée." }`.
4. Mettre à jour `livraisons` : `date_lancement = NOW()`.
5. Calculer le numéro CMD.
6. Créer une notification pour chaque utilisateur ayant le rôle Ventes dans l'entreprise : `type_notification = 'livraison'`, `titre = 'Livraison démarrée'`, `message = 'La livraison de la commande {numero_commande} a démarré.'`.
7. Insérer dans `historiques` : `module = 'livraisons'`, `table_concernee = 'livraisons'`, `id_element = {id}`, `action = 'lancement livraison'`, `utilisateur = utilisateur_id`, `entreprise = entreprise_id`.

**Réponse 200**
```json
{ "message": "Livraison lancée.", "dateLancement": "2026-06-08T12:00:00Z" }
```

---

### 12. POST /api/livraisons/{id}/valider

**Entrées (path param)**
- `id` — UUID de la livraison

Aucun body requis.

**Actions du contrôleur**
1. Récupérer la livraison WHERE `id = {id}` AND `actif = TRUE`. Joindre `commandes` pour vérifier `commandes.entreprise = entreprise_id`. Retourner 404 si absente.
2. Vérifier que `livraisons.statut = 'en_cours'`. Sinon → 422 `{ "message": "Cette livraison ne peut pas être validée." }`.
3. Vérifier que `livraisons.date_lancement IS NOT NULL`. Sinon → 422 `{ "message": "La livraison doit être lancée avant d'être validée." }`.
4. Mettre à jour `livraisons` : `statut = 'livree'`, `date_livraison_effective = NOW()`.
5. Pour chaque produit de `type_produit = 'physique'` dans `contenir_produit` WHERE `commande_id = livraisons.commande` :
   - Récupérer `contenir_produit.quantite`.
   - Décrémenter `produits.stock_actuel` de `contenir_produit.quantite` WHERE `produits.id = contenir_produit.produit_id`.
   - Si `produits.stock_actuel < 0` après mise à jour, corriger à 0 (sécurité).
6. Calculer le numéro CMD.
7. Créer une notification pour chaque utilisateur Ventes : `type_notification = 'livraison'`, `titre = 'Livraison confirmée'`, `message = 'La livraison de la commande {numero_commande} a été confirmée.'`.
8. Créer une notification pour chaque utilisateur Finance : même `type_notification`, même message.
9. Créer une notification pour chaque utilisateur Gestion de Stock : `type_notification = 'stock'`, `titre = 'Stock mis à jour'`, `message = 'Stock mis à jour suite à la livraison confirmée de la commande {numero_commande}.'`.
10. Insérer dans `historiques` : `module = 'livraisons'`, `table_concernee = 'livraisons'`, `id_element = {id}`, `action = 'validation livraison'`, `utilisateur = utilisateur_id`, `entreprise = entreprise_id`.

**Réponse 200**
```json
{ "message": "Livraison validée avec succès." }
```

---

### 13. POST /api/livraisons/{id}/echec

**Entrées (path param + body JSON)**
- `id` — UUID de la livraison
- `motif` — string, **requis**, minimum 20 caractères

**Actions du contrôleur**
1. Récupérer la livraison WHERE `id = {id}` AND `actif = TRUE`. Joindre `commandes` pour vérifier `commandes.entreprise = entreprise_id`. Retourner 404 si absente.
2. Vérifier que `livraisons.statut = 'en_cours'`. Sinon → 422 `{ "message": "Cette livraison ne peut pas être marquée comme échouée." }`.
3. Vérifier que `livraisons.date_lancement IS NOT NULL`. Sinon → 422 `{ "message": "La livraison doit être lancée avant de déclarer un échec. Utilisez Annuler pour une livraison non lancée." }`.
4. Mettre à jour `livraisons` : `statut = 'echec'`, `motif_echec = motif`.
5. Calculer le numéro CMD.
6. Créer une notification pour le directeur de l'entreprise et chaque utilisateur Ventes : `type_notification = 'livraison'`, `titre = 'Échec de livraison'`, `message = 'La livraison de la commande {numero_commande} a échoué. Motif : {motif}.'`.
7. Insérer dans `historiques` : `module = 'livraisons'`, `table_concernee = 'livraisons'`, `id_element = {id}`, `action = 'échec livraison'`, `details_action = motif`, `utilisateur = utilisateur_id`, `entreprise = entreprise_id`.

**Réponse 200**
```json
{ "message": "Livraison marquée comme échouée." }
```

---

### 14. POST /api/livraisons/{id}/retour

**Entrées (path param + body JSON)**
- `id` — UUID de la livraison
- `motif` — string, **requis**, minimum 20 caractères

**Actions du contrôleur**
1. Récupérer la livraison WHERE `id = {id}` AND `actif = TRUE`. Joindre `commandes` pour vérifier `commandes.entreprise = entreprise_id`. Retourner 404 si absente.
2. Vérifier que `livraisons.statut = 'en_cours'`. Sinon → 422 `{ "message": "Cette livraison ne peut pas être retournée." }`.
3. Vérifier que `livraisons.date_lancement IS NOT NULL`. Sinon → 422 `{ "message": "La livraison doit être lancée avant de déclarer un retour. Utilisez Annuler pour une livraison non lancée." }`.
4. Mettre à jour `livraisons` : `statut = 'retour'`, `motif_retour = motif`.
5. Calculer le numéro CMD.
6. Créer une notification pour le directeur de l'entreprise, les utilisateurs Ventes et les utilisateurs Gestion de Stock : `type_notification = 'livraison'`, `titre = 'Retour de livraison'`, `message = 'La livraison de la commande {numero_commande} a été retournée. Motif : {motif}.'`.
7. Insérer dans `historiques` : `module = 'livraisons'`, `table_concernee = 'livraisons'`, `id_element = {id}`, `action = 'retour livraison'`, `details_action = motif`, `utilisateur = utilisateur_id`, `entreprise = entreprise_id`.

**Réponse 200**
```json
{ "message": "Retour de livraison enregistré." }
```

---

### 15. POST /api/livraisons/{id}/annuler

**Entrées (path param + body JSON)**
- `id` — UUID de la livraison
- `motif` — string, **requis**, minimum 20 caractères

**Actions du contrôleur**
1. Récupérer la livraison WHERE `id = {id}` AND `actif = TRUE`. Joindre `commandes` pour vérifier `commandes.entreprise = entreprise_id`. Retourner 404 si absente.
2. Vérifier que `livraisons.statut = 'en_cours'`. Sinon → 422 `{ "message": "Cette livraison ne peut pas être annulée." }`.
3. Vérifier que `livraisons.date_lancement IS NULL`. Sinon → 422 `{ "message": "Une livraison déjà lancée ne peut pas être annulée. Utilisez Échec ou Retour." }`.
4. Mettre à jour `livraisons` : `statut = 'echec'`, `motif_echec = motif`, `raison_annulation = motif`, `utilisateur_annulation = utilisateur_id`, `date_annulation = NOW()`.
5. Calculer le numéro CMD.
6. Créer une notification pour chaque utilisateur Ventes : `type_notification = 'livraison'`, `titre = 'Livraison annulée'`, `message = 'La livraison de la commande {numero_commande} a été annulée. Raison : {motif}.'`.
7. Insérer dans `historiques` : `module = 'livraisons'`, `table_concernee = 'livraisons'`, `id_element = {id}`, `action = 'annulation livraison'`, `details_action = motif`, `utilisateur = utilisateur_id`, `entreprise = entreprise_id`.

**Réponse 200**
```json
{ "message": "Livraison annulée." }
```

---

## STATISTIQUES

### 16. GET /api/livraisons/statistiques/general

**Entrées (query params)**
- `date_debut` — date, optionnelle
- `date_fin` — date, optionnelle

**Actions du contrôleur**
1. Sur la période définie (filtre sur `livraisons.date_creation` via JOIN `commandes` WHERE `commandes.entreprise = entreprise_id`) :
   - `total` = COUNT total des livraisons de l'entreprise
   - `livrees` = COUNT WHERE `livraisons.statut = 'livree'`
   - `echecs` = COUNT WHERE `livraisons.statut = 'echec'`
   - `retours` = COUNT WHERE `livraisons.statut = 'retour'`
   - `successRate` = `livrees` / `total` × 100, arrondi à 1 décimale (0 si `total = 0`)
   - `livreursActifs` = COUNT(DISTINCT `livraisons.livreur`) WHERE `livraisons.statut = 'en_cours'` (temps réel)
   - `tempsMoyenMinutes` = AVG(EXTRACT(EPOCH FROM (`livraisons.date_livraison_effective` - `livraisons.date_lancement`)) / 60) WHERE `livraisons.statut = 'livree'` AND `livraisons.date_lancement IS NOT NULL`, arrondi à l'entier
2. `repartitionStatuts` = `{ livrees, echecs, retours }` sur la période.
3. `evolution` : grouper les livraisons par mois sur la période (GROUP BY DATE_TRUNC('month', `livraisons.date_creation`)) → `[{ mois (YYYY-MM), livrees, echecs, retours }]`.

**Réponse 200**
```json
{
  "kpis": {
    "total": 120,
    "successRate": 85.0,
    "failures": 10,
    "returns": 8,
    "livreursActifs": 4,
    "tempsMoyenMinutes": 47
  },
  "repartitionStatuts": { "livrees": 102, "echecs": 10, "retours": 8 },
  "evolution": [
    { "mois": "2026-04", "livrees": 30, "echecs": 3, "retours": 2 },
    { "mois": "2026-05", "livrees": 35, "echecs": 4, "retours": 3 }
  ]
}
```

---

### 17. GET /api/livraisons/statistiques/livreurs

**Entrées (query params)**
- `date_debut` — date, optionnelle
- `date_fin` — date, optionnelle

**Actions du contrôleur**
1. Récupérer tous les utilisateurs avec rôle `employe_livreur` actif dans l'entreprise via `appartenir_entreprise JOIN roles_utilisateur`.
2. Pour chaque livreur, sur la période (filtre sur `livraisons.date_creation`) :
   - `livraisons` = COUNT des livraisons WHERE `livreur = utilisateurs.id`
   - `livrees` = COUNT WHERE `statut = 'livree'`
   - `echecs` = COUNT WHERE `statut = 'echec'`
   - `retours` = COUNT WHERE `statut = 'retour'`
   - `successRate` = `livrees` / `livraisons` × 100, arrondi à 1 décimale (0 si 0)
   - `tempsMoyenMin` = AVG(EXTRACT(EPOCH FROM (`date_livraison_effective` - `date_lancement`)) / 60) WHERE `statut = 'livree'` AND `date_lancement IS NOT NULL`, arrondi à l'entier
3. Trier par `livraisons DESC`.
4. Calculer :
   - `meilleurLivreur` = `name` + `prename` du livreur avec le `successRate` le plus élevé parmi ceux ayant au moins 1 livraison
   - `plusRapide` = `name` + `prename` du livreur avec le `tempsMoyenMin` le plus faible parmi ceux ayant au moins 1 livraison livrée
   - `plusActif` = `name` + `prename` du livreur avec le plus grand `livraisons`

**Réponse 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "nom": "Koumba Jean",
      "livraisons": 45,
      "livrees": 40,
      "echecs": 3,
      "retours": 2,
      "successRate": 88.9,
      "tempsMoyenMin": 42
    }
  ],
  "meilleurLivreur": "Koumba Jean",
  "plusRapide": "Mbarga Alice",
  "plusActif": "Koumba Jean"
}
```

---

### 18. GET /api/livraisons/statistiques/activite

**Entrées (query params)**
- `date_debut` — date, optionnelle (défaut = J-30)
- `date_fin` — date, optionnelle

**Actions du contrôleur**
1. Sur la période définie (filtre sur `livraisons.date_creation` via JOIN `commandes` WHERE `commandes.entreprise = entreprise_id`) :
   - `parJour` : grouper par jour sur les 7 derniers jours (J-6 à aujourd'hui) → `[{ jour (label court ex. "Lun 03"), livrees, echecs, retours }]`
   - `parSemaine` : grouper par semaine ISO → `[{ semaine (label "S23"), livrees, echecs, retours }]`
   - `parMois` : grouper par mois → `[{ mois (YYYY-MM), livrees }]`
   - `joursActifs` : pour les 8 derniers jours, COUNT total des livraisons créées chaque jour → `[{ date (YYYY-MM-DD), count }]`

**Réponse 200**
```json
{
  "parJour": [
    { "jour": "Lun 03", "livrees": 5, "echecs": 1, "retours": 0 },
    { "jour": "Mar 04", "livrees": 4, "echecs": 0, "retours": 1 }
  ],
  "parSemaine": [
    { "semaine": "S23", "livrees": 22, "echecs": 3, "retours": 2 }
  ],
  "parMois": [
    { "mois": "2026-05", "livrees": 35 },
    { "mois": "2026-06", "livrees": 18 }
  ],
  "joursActifs": [
    { "date": "2026-06-02", "count": 6 },
    { "date": "2026-06-03", "count": 4 }
  ]
}
```

---

### 19. GET /api/livraisons/statistiques/echecs

**Entrées (query params)**
- `date_debut` — date, optionnelle
- `date_fin` — date, optionnelle

**Actions du contrôleur**
1. Récupérer toutes les livraisons WHERE `statut = 'echec'` de l'entreprise sur la période (filtre sur `livraisons.date_creation`).
2. `total` = COUNT.
3. `totalLivraisons` = COUNT de toutes les livraisons de l'entreprise sur la période.
4. `taux` = `total` / `totalLivraisons` × 100, arrondi à 2 décimales (0 si `totalLivraisons = 0`).
5. `clientsAbsents` = COUNT WHERE `motif_echec ILIKE '%absent%'`.
6. `adresseIncorrecte` = COUNT WHERE `motif_echec ILIKE '%adresse%'`.
7. Grouper les `motif_echec` : pour les 5 motifs les plus fréquents, calculer `count` et `pourcentage` = `count` / `total` × 100 (arrondi à l'entier).

**Réponse 200**
```json
{
  "kpis": {
    "total": 10,
    "taux": 8.33,
    "clientsAbsents": 4,
    "adresseIncorrecte": 2
  },
  "data": [
    { "motif": "Client absent", "count": 4, "pourcentage": 40 },
    { "motif": "Adresse incorrecte", "count": 2, "pourcentage": 20 },
    { "motif": "Colis endommagé", "count": 2, "pourcentage": 20 }
  ]
}
```

---

### 20. GET /api/livraisons/statistiques/retours

**Entrées (query params)**
- `date_debut` — date, optionnelle
- `date_fin` — date, optionnelle

**Actions du contrôleur**
1. Récupérer toutes les livraisons WHERE `statut = 'retour'` de l'entreprise sur la période (filtre sur `livraisons.date_creation`).
2. `total` = COUNT.
3. `refusClient` = COUNT WHERE `motif_retour ILIKE '%refus%'` OR `motif_retour ILIKE '%refusé%'`.
4. `produitNonConforme` = COUNT WHERE `motif_retour ILIKE '%conforme%'` OR `motif_retour ILIKE '%défaut%'` OR `motif_retour ILIKE '%non conforme%'`.
5. Grouper les `motif_retour` : pour les 5 motifs les plus fréquents, calculer `count` et `pourcentage`.

**Réponse 200**
```json
{
  "kpis": {
    "total": 8,
    "refusClient": 3,
    "produitNonConforme": 2
  },
  "data": [
    { "motif": "Refus du client", "count": 3, "pourcentage": 37 },
    { "motif": "Produit non conforme", "count": 2, "pourcentage": 25 },
    { "motif": "Mauvaise commande", "count": 2, "pourcentage": 25 }
  ]
}
```

---

### 21. GET /api/livraisons/statistiques/geographie

**Entrées (query params)**
- `date_debut` — date, optionnelle
- `date_fin` — date, optionnelle

**Actions du contrôleur**
1. Joindre `livraisons` → `commandes` WHERE `commandes.entreprise = entreprise_id` (filtre période sur `livraisons.date_creation`). La zone géographique est extraite depuis `commandes.adresse_livraison` (parsing du premier mot significatif constituant la ville, ou champ ville si structuré).
2. Pour chaque zone/ville distincte : `livraisons` (COUNT total), `succes` (COUNT WHERE `statut = 'livree'`), `echecs` (COUNT WHERE `statut = 'echec'`), `retours` (COUNT WHERE `statut = 'retour'`).
3. Exclure les lignes avec `adresse_livraison IS NULL` ou vide.
4. Calculer :
   - `villeActive` = nom de la ville avec le plus grand `livraisons`
   - `villeDifficile` = nom de la ville avec le plus grand `echecs`
   - `villeRentable` = nom de la ville avec le plus grand `succes`
5. Trier par `livraisons DESC`.

**Réponse 200**
```json
{
  "kpis": {
    "villeActive": "Douala",
    "villeDifficile": "Yaoundé",
    "villeRentable": "Douala"
  },
  "data": [
    { "ville": "Douala", "livraisons": 60, "succes": 55, "echecs": 3, "retours": 2 },
    { "ville": "Yaoundé", "livraisons": 30, "succes": 22, "echecs": 5, "retours": 3 }
  ]
}
```

---

### 22. GET /api/livraisons/statistiques/clients

**Entrées (query params)**
- `date_debut` — date, optionnelle
- `date_fin` — date, optionnelle
- `limit` — int, défaut 10

**Actions du contrôleur**
1. Joindre `livraisons` → `commandes` → `clients` WHERE `commandes.entreprise = entreprise_id` (filtre période sur `livraisons.date_creation`).
2. Pour chaque client : `commandes` (COUNT DISTINCT `commandes.id`), `livraisons` (COUNT WHERE `statut = 'livree'`), `retours` (COUNT WHERE `statut = 'retour'`), `echecs` (COUNT WHERE `statut = 'echec'`).
3. Calculer :
   - `clientPlusLivre` = `nom` + `prenom` du client avec le plus grand `livraisons`
   - `clientPlusRetours` = `nom` + `prenom` du client avec le plus grand `retours`
   - `clientPlusFidele` = `nom` + `prenom` du client avec le plus grand `commandes`
4. Trier par `livraisons DESC`, retourner `limit` clients.

**Réponse 200**
```json
{
  "kpis": {
    "clientPlusLivre": "Dupont Jean",
    "clientPlusRetours": "Martin Paul",
    "clientPlusFidele": "Dupont Jean"
  },
  "data": [
    { "client": "Dupont Jean", "commandes": 12, "livraisons": 10, "retours": 1, "echecs": 1 },
    { "client": "Martin Paul", "commandes": 8, "livraisons": 5, "retours": 2, "echecs": 1 }
  ]
}
```

---

### 23. GET /api/livraisons/statistiques/export

**Entrées (query params)**
- `format` — enum `pdf|csv|docx`, **requis**
- `section` — string optionnel : `general|livreurs|activite|echecs|retours|geographie|clients`, défaut `general`
- `date_debut`, `date_fin` — optionnels

**Actions du contrôleur**
1. En fonction de `section`, exécuter les mêmes calculs que la route de statistiques correspondante (routes #16 à #22) sans pagination.
2. Construire un rapport structuré avec titre, période, KPIs et tableaux de données.
3. Générer le fichier dans le format demandé.

**Réponse 200** — Fichier téléchargeable avec `Content-Disposition: attachment`.

---

## NOTIFICATIONS

### 24. GET /api/livraisons/notifications

**Entrées** — aucune (tout vient du token)

**Actions du contrôleur**
1. Extraire `utilisateur_id`, `entreprise_id`, `role_id` depuis le token.
2. Récupérer depuis `notifications` WHERE `utilisateur = utilisateur_id` AND `entreprise = entreprise_id` AND `role = role_id` AND `actif = TRUE` AND `statut != 'archivee'`.
3. Compter `non_lues` = COUNT WHERE `statut = 'non_lue'`.
4. Trier par `date_arrivee DESC`, retourner les 50 plus récentes.

**Réponse 200**
```json
{
  "non_lues": 2,
  "notifications": [
    {
      "id": "uuid",
      "titre": "Nouvelle livraison assignée",
      "message": "Une nouvelle livraison vous a été assignée pour la commande CMD-2026-00012.",
      "statut": "non_lue",
      "type_notification": "livraison",
      "date_arrivee": "2026-06-08T14:30:00Z"
    }
  ]
}
```

---

## RÉCAPITULATIF DES ROUTES

| # | Méthode | Route | Description |
|---|---------|-------|-------------|
| 1 | GET | `/api/livraisons/dashboard` | KPIs, activité récente, graphiques |
| 2 | GET | `/api/livraisons/commandes-a-livrer` | Commandes validées éligibles à la livraison |
| 3 | GET | `/api/livraisons/historique` | Toutes les livraisons de l'entreprise |
| 4 | GET | `/api/livraisons/{id}` | Détail complet d'une livraison |
| 5 | GET | `/api/livraisons/historique/export` | Export historique global |
| 6 | GET | `/api/livraisons/livreurs` | Utilisateurs avec rôle employe_livreur |
| 7 | GET | `/api/livraisons/mes-livraisons` | Livraisons en cours du livreur connecté |
| 8 | GET | `/api/livraisons/mes-livraisons/historique` | Historique personnel du livreur connecté |
| 9 | GET | `/api/livraisons/mes-livraisons/historique/export` | Export historique personnel |
| 10 | POST | `/api/livraisons` | Créer une livraison (assigner un livreur) |
| 11 | POST | `/api/livraisons/{id}/lancer` | Enregistrer le démarrage d'une livraison |
| 12 | POST | `/api/livraisons/{id}/valider` | Confirmer la livraison (décrémente stock) |
| 13 | POST | `/api/livraisons/{id}/echec` | Déclarer un échec (livraison lancée) |
| 14 | POST | `/api/livraisons/{id}/retour` | Déclarer un retour (livraison lancée) |
| 15 | POST | `/api/livraisons/{id}/annuler` | Annuler avant lancement |
| 16 | GET | `/api/livraisons/statistiques/general` | Vue générale + évolution mensuelle |
| 17 | GET | `/api/livraisons/statistiques/livreurs` | Performance par livreur |
| 18 | GET | `/api/livraisons/statistiques/activite` | Activité par jour / semaine / mois |
| 19 | GET | `/api/livraisons/statistiques/echecs` | Analyse des motifs d'échec |
| 20 | GET | `/api/livraisons/statistiques/retours` | Analyse des motifs de retour |
| 21 | GET | `/api/livraisons/statistiques/geographie` | Volume par zone géographique |
| 22 | GET | `/api/livraisons/statistiques/clients` | Top clients par volume livré |
| 23 | GET | `/api/livraisons/statistiques/export` | Export rapport statistiques |
| 24 | GET | `/api/livraisons/notifications` | Notifications du rôle connecté |
