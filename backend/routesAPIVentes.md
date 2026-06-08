# Routes API — Module Ventes

Toutes les routes nécessitent un token d'autorisation valide (cookie HTTPOnly `tokenAutorization`).
Le contrôleur extrait systématiquement `entreprise_id`, `utilisateur_id` et `role_id` depuis ce token.

---

## 1. GET /api/ventes/clients

**Entrées (query params)**
- `page` — int, défaut 1
- `per_page` — int, défaut 20
- `recherche` — string optionnel, filtre ILIKE sur `nom`, `prenom`, `email`, `telephone`

**Actions du contrôleur**
1. Extraire `entreprise_id` depuis le token.
2. Requêter la table `clients` WHERE `entreprise = entreprise_id`.
3. Pour chaque client, calculer `commandes` = COUNT des tuples dans `commandes` WHERE `client = clients.id` (tous statuts).
4. Pour chaque client, calculer `ca_total` = SUM des `montant` dans `payements` en joignant `commandes` WHERE `commandes.client = clients.id` AND `payements.entreprise = entreprise_id` AND `payements.actif = TRUE`.
5. Appliquer le filtre `recherche` (ILIKE).
6. Trier par `nom ASC`, paginer.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "nom": "string", "prenom": "string", "email": "string", "telephone": "string", "commandes": 5, "ca_total": 120000 }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 50 }
}
```

---

## 2. GET /api/ventes/clients/{id}

**Entrées (path param)**
- `id` — UUID du client

**Actions du contrôleur**
1. Récupérer le client WHERE `id = {id}` AND `entreprise = entreprise_id`. Retourner 404 si absent.
2. Calculer `resume` :
   - `total_commandes` = COUNT des commandes du client
   - `ca_total` = SUM(payements.montant) liés aux commandes de ce client
   - `commande_moyenne` = ca_total / total_commandes (0 si pas de commandes)
   - `derniere_commande` = MAX(date_commande) des commandes du client
3. Récupérer les 10 dernières commandes du client (ORDER BY `date_commande DESC`), avec statut métier calculé (voir route #5 pour la règle de calcul), numéro généré, montant, date.

**Réponse 200**
```json
{
  "client": { "id": "uuid", "nom": "string", "prenom": "string", "email": "string", "telephone": "string", "date_creation": "2026-01-15T10:00:00Z" },
  "resume": { "total_commandes": 12, "ca_total": 360000, "commande_moyenne": 30000, "derniere_commande": "2026-05-15" },
  "dernieres_commandes": [
    { "id": "uuid", "numero": "CMD-2026-00001", "date": "2026-05-15", "statut": "livré", "montant": 35000 }
  ]
}
```

---

## 3. POST /api/ventes/clients

**Entrées (body JSON)**
- `nom` — string, **requis**
- `prenom` — string, optionnel
- `email` — string, optionnel, format email valide
- `telephone` — string, optionnel

**Actions du contrôleur**
1. Valider que `nom` est présent et non vide.
2. Si `email` fourni, vérifier l'unicité : aucun tuple dans `clients` WHERE `email = {email}` AND `entreprise = entreprise_id`. Si doublon → retourner 409 `{ "message": "Un client avec cet email existe déjà." }`.
3. Insérer dans `clients` : `nom`, `prenom`, `email`, `telephone`, `entreprise = entreprise_id`.
4. Insérer dans `historiques` : `module = 'ventes'`, `table_concernee = 'clients'`, `id_element = client.id`, `action = 'création client'`, `utilisateur`, `entreprise`.

**Réponse 201**
```json
{
  "client": { "id": "uuid", "nom": "string", "prenom": "string", "email": "string", "telephone": "string" }
}
```

---

## 4. GET /api/ventes/clients/export

**Entrées (query params)**
- `format` — enum `pdf|csv|docx`, **requis**
- `recherche` — string, optionnel (même logique que route #1)

**Actions du contrôleur**
1. Appliquer les mêmes filtres que GET /api/ventes/clients, sans pagination (tous les résultats).
2. Construire le document avec les colonnes : nom, prénom, email, téléphone, nombre de commandes, CA total.
3. Générer le fichier dans le format demandé via le service d'export Laravel (PDF : DomPDF, CSV : League CSV, DOCX : PHPWord).
4. Insérer dans `historiques` : `action = 'export clients'`, `details_action = format`.

**Réponse 200** — Fichier téléchargeable avec `Content-Disposition: attachment`.

---

## 5. GET /api/ventes/commandes

**Entrées (query params)**
- `page` — int, défaut 1
- `per_page` — int, défaut 20
- `recherche` — string optionnel (filtre sur numéro généré et nom client)
- `statut` — string optionnel : `tous|reçu|validé|en cours de livraison|livré|annulé`
- `date_debut` — date optionnelle, filtre sur `date_commande`
- `date_fin` — date optionnelle, filtre sur `date_commande`
- `montant_min` — decimal optionnel, filtre sur `montant_commande`
- `montant_max` — decimal optionnel, filtre sur `montant_commande`

**Actions du contrôleur**
1. Récupérer les commandes WHERE `entreprise = entreprise_id` AND `actif = TRUE`.
2. Pour chaque commande, calculer le **statut métier affiché** selon les règles suivantes (le statut DB est dans `commandes.statut`) :
   - `"reçu"` si `commandes.statut = 'brouillon'`
   - `"annulé"` si `commandes.statut = 'annulee'`
   - `"livré"` si `commandes.statut = 'validee'` ET il existe dans `livraisons` un tuple WHERE `commande = commande.id` AND `statut = 'livree'`
   - `"en cours de livraison"` si `commandes.statut = 'validee'` ET il existe dans `livraisons` un tuple WHERE `commande = commande.id` AND `statut = 'en_cours'`
   - `"validé"` si `commandes.statut = 'validee'` ET aucune livraison en statut `en_cours` ni `livree` pour cette commande
3. Générer le **numéro lisible** : format `CMD-{ANNÉE}-{SÉQUENCE_5_CHIFFRES}` où la séquence est incrémentale par entreprise par année (stocké via un compteur séparé ou calculé par position).
4. Joindre `clients` pour obtenir `nom` + `prenom`.
5. Appliquer tous les filtres (recherche sur numéro et nom client, filtre sur statut calculé, plage de dates sur `date_commande`, plage de montants sur `montant_commande`).
6. Trier par `date_commande DESC`, paginer.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "numero": "CMD-2026-00001", "client": "Dupont Jean", "montant": 45000, "statut": "validé", "date": "2026-06-01" }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 150, "has_more": true }
}
```

---

## 6. GET /api/ventes/commandes/{id}

**Entrées (path param)**
- `id` — UUID de la commande

**Actions du contrôleur**
1. Récupérer la commande WHERE `id = {id}` AND `entreprise = entreprise_id`. Retourner 404 si absente.
2. Récupérer le client associé depuis `clients`.
3. Récupérer les produits via `contenir_produit JOIN produits ON produits.id = contenir_produit.produit_id` WHERE `commande_id = {id}`.
4. Récupérer l'historique des paiements depuis `payements` WHERE `commande = {id}` AND `actif = TRUE`, triés par `date_payement ASC`. Pour chaque paiement, joindre `utilisateurs` sur `user_enregistre` pour obtenir nom + prénom.
5. Récupérer les livraisons depuis `livraisons` WHERE `commande = {id}`, triées par `date_creation ASC`.

**Réponse 200**
```json
{
  "commande": { "id": "uuid", "numero": "CMD-2026-00001", "statut": "validé", "montant": 45000, "adresse": "Rue de l'Église, Douala", "date_livraison": "2026-06-10", "notes": "Fragile" },
  "client": { "id": "uuid", "nom": "Dupont", "prenom": "Jean", "email": "jean@mail.com", "telephone": "+237600000001" },
  "produits": [
    { "id": "uuid", "nom": "Huile de palme 1L", "quantite": 3, "prix_unitaire": 2500, "reduction": 0, "montant": 7500 }
  ],
  "paiements": [
    { "montant": 15000, "date": "2026-06-02", "mode": "cash", "reference": null, "enregistre_par": "Martin Lucie" }
  ],
  "livraisons": [
    { "statut": "en_cours", "date": "2026-06-05", "note": null }
  ]
}
```

---

## 7. POST /api/ventes/commandes

**Entrées (body JSON)**
- `client_id` — UUID, **requis**
- `produits` — tableau d'objets `{ "id": UUID, "quantite": decimal }`, **requis**, au moins 1 élément
- `adresse_livraison` — string, optionnel
- `date_livraison_prevue` — date, optionnel
- `notes_supplementaires` — string, optionnel

**Actions du contrôleur**
1. Vérifier que `client_id` référence un tuple dans `clients` WHERE `entreprise = entreprise_id`.
2. Pour chaque entrée du tableau `produits` :
   a. Vérifier que le produit existe dans `produits` WHERE `id = produit.id` AND `entreprise = entreprise_id` AND `statut = 'actif'`.
   b. Récupérer `prix_unitaire` depuis `produits` (c'est le prix au moment de la commande qui sera stocké dans `contenir_produit`).
   c. Si `type_produit = 'physique'` : calculer dynamiquement `stock_reserve` = SUM(cp.quantite) FROM `contenir_produit cp` JOIN `commandes c` ON `c.id = cp.commande_id` WHERE `c.statut = 'validee'` AND `c.entreprise = entreprise_id` AND `cp.produit_id = produit.id` AND NOT EXISTS (SELECT 1 FROM `livraisons` WHERE `commande = c.id` AND `statut = 'livree'`).
   d. Calculer `stock_disponible = produits.stock_actuel - stock_reserve`.
   e. Si `produit.quantite > stock_disponible` → retourner 422 `{ "message": "Stock insuffisant pour le produit {nom}" }`.
3. Calculer `montant_commande` = SUM(produit.quantite × prix_unitaire) pour tous les produits (il n'y a pas de réduction par défaut à la création, `reduction = 0` sauf si l'interface l'envoie).
4. Insérer dans `commandes` : `statut = 'brouillon'`, `etat_payement = 'non_paye'`, `montant_commande`, `montant_minimum_validation = montant_commande`, `adresse_livraison`, `date_livraison_prevue`, `notes_supplementaires`, `utilisateur_enregistre = utilisateur_id`, `client = client_id`, `entreprise = entreprise_id`, `actif = TRUE`.
5. Pour chaque produit du tableau, insérer dans `contenir_produit` : `commande_id`, `produit_id`, `quantite`, `prix_unitaire` (copie du prix au moment de la commande), `reduction = 0`, `montant = quantite × prix_unitaire`.
6. Créer une notification pour chaque utilisateur ayant un rôle Finance dans `appartenir_entreprise` WHERE `entreprise_id = entreprise_id` et dont le `role_utilisateur_id` correspond au rôle Finance : insérer dans `notifications` `type_notification = 'paiement'`, `titre = 'Nouvelle commande'`, `message = 'Une nouvelle commande {numero} a été enregistrée et est en attente de validation.'`, `utilisateur = user_id_finance`, `entreprise = entreprise_id`, `role = role_finance_id`.
7. Insérer dans `historiques` : `module = 'ventes'`, `table_concernee = 'commandes'`, `id_element = commande.id`, `action = 'création commande'`, `details_action = "{client} - {montant} - {nb_produits} produit(s)"`, `utilisateur`, `entreprise`.

**Réponse 201**
```json
{
  "commande": { "id": "uuid", "numero": "CMD-2026-00042", "statut": "reçu", "montant": 45000, "date": "2026-06-08" }
}
```

---

## 8. POST /api/ventes/commandes/{id}/annuler

**Entrées (path param + body JSON)**
- `id` — UUID de la commande
- `raison_annulation` — string, **requis**, minimum 20 caractères

**Actions du contrôleur**
1. Récupérer la commande WHERE `id = {id}` AND `entreprise = entreprise_id`. Retourner 404 si absente.
2. Vérifier que `commandes.statut != 'annulee'`. Si déjà annulée → retourner 409 `{ "message": "Cette commande est déjà annulée." }`.
3. Vérifier qu'il n'existe pas de livraison avec `statut = 'livree'` pour cette commande. Si oui → retourner 422 `{ "message": "Impossible d'annuler une commande déjà livrée." }`.
4. Mettre à jour `commandes` : `statut = 'annulee'`, `raison_annulation = {raison_annulation}`, `date_annulation = NOW()`.
5. Pour toutes les livraisons en `statut = 'en_cours'` liées à cette commande : mettre à jour `livraisons` → `statut = 'echec'`, `motif_echec = 'Commande annulée : {raison_annulation}'`, `utilisateur_annulation = utilisateur_id`, `date_annulation = NOW()`.
6. Créer une notification pour les utilisateurs Finance de l'entreprise : `type_notification = 'paiement'`, `message = 'La commande {numero} a été annulée. Raison : {raison}'`.
7. Insérer dans `historiques` : `module = 'ventes'`, `action = 'annulation commande'`, `details_action = raison_annulation`.

**Réponse 200**
```json
{ "message": "Commande annulée avec succès." }
```

---

## 9. GET /api/ventes/commandes/export

**Entrées (query params)**
- `format` — enum `pdf|csv|docx`, **requis**
- Mêmes filtres optionnels que route #5 (sans `page`, sans `per_page`)

**Actions du contrôleur**
1. Appliquer les mêmes filtres que GET /api/ventes/commandes, sans pagination.
2. Pour chaque commande, inclure : numéro, client (nom + prénom + téléphone), montant, statut calculé, date commande, adresse livraison, notes, liste des produits (nom, quantité, prix unitaire, montant), historique des paiements (date, montant, mode, référence).
3. Générer le fichier dans le format demandé.
4. Insérer dans `historiques` : `action = 'export commandes'`, `details_action = format`.

**Réponse 200** — Fichier téléchargeable.

---

## 10. GET /api/ventes/produits

**Entrées (query params)**
- `recherche` — string, optionnel, filtre ILIKE sur `produits.nom`

**Actions du contrôleur**
1. Récupérer tous les produits WHERE `entreprise = entreprise_id` AND `statut = 'actif'`.
2. Pour chaque produit de `type_produit = 'physique'`, calculer dynamiquement `stock_reserve` (même formule que route #7 étape 2c) et `stock_disponible = stock_actuel - stock_reserve`.
3. Pour les produits de `type_produit = 'service'`, retourner `stock_disponible = null` (pas de gestion de stock).
4. Joindre `categories_produit` sur `produits.categorie` pour obtenir le nom de la catégorie.
5. Appliquer le filtre `recherche`.
6. Trier par `nom ASC`.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "nom": "Huile de palme 1L", "prix_unitaire": 2500, "reduction": 0, "stock_disponible": 48, "type_produit": "physique", "categorie": "Alimentation" }
  ]
}
```

---

## 11. GET /api/ventes/reservations

**Entrées (query params)**
- `page` — int, défaut 1
- `per_page` — int, défaut 20
- `recherche` — string optionnel (filtre sur `produits.nom`, nom client, numéro de commande)
- `statut` — string optionnel : `tous|en_cours|validé|annulé`
- `produit` — string optionnel, filtre ILIKE sur `produits.nom`
- `client` — string optionnel, filtre ILIKE sur `clients.nom` + `clients.prenom`
- `date_debut` — date optionnelle, filtre sur `commandes.date_commande`
- `date_fin` — date optionnelle, filtre sur `commandes.date_commande`

**Actions du contrôleur**
1. Requêter `contenir_produit cp` JOIN `commandes c` ON `c.id = cp.commande_id` JOIN `produits p` ON `p.id = cp.produit_id` JOIN `clients cl` ON `cl.id = c.client` WHERE `c.entreprise = entreprise_id`.
2. Pour chaque ligne (cp + c + p + cl), calculer le **statut de réservation** :
   - `"annulé"` si `c.statut = 'annulee'`
   - `"validé"` si il existe dans `livraisons` un tuple WHERE `commande = c.id` AND `statut = 'livree'`
   - `"en_cours"` sinon
3. Pour chaque produit physique, calculer dynamiquement `stock_reserve` et `stock_disponible` (même formule que route #7).
4. Construire un identifiant de réservation composite : `"{commande_id}_{produit_id}"`.
5. Appliquer tous les filtres (recherche, statut calculé, produit, client, plage dates).
6. Trier par `c.date_commande DESC`, paginer.

**Réponse 200**
```json
{
  "data": [{
    "id": "uuid_commande_uuid_produit",
    "produit_nom": "Huile de palme 1L",
    "quantite": 3,
    "client": "Dupont Jean",
    "commande_numero": "CMD-2026-00001",
    "statut": "en_cours",
    "date": "2026-06-01",
    "stock_actuel": 50,
    "stock_reserve": 10,
    "stock_disponible": 40
  }],
  "meta": { "page": 1, "per_page": 20, "total": 80 }
}
```

---

## 12. GET /api/ventes/reservations/{commande_id}/{produit_id}

**Entrées (path params)**
- `commande_id` — UUID de la commande
- `produit_id` — UUID du produit

**Actions du contrôleur**
1. Vérifier que la commande WHERE `id = commande_id` AND `entreprise = entreprise_id` existe. Retourner 404 sinon.
2. Récupérer le tuple de `contenir_produit` WHERE `commande_id = commande_id` AND `produit_id = produit_id`. Retourner 404 si absent.
3. Récupérer les détails complets du produit depuis `produits` avec `stock_reserve` et `stock_disponible` calculés dynamiquement.
4. Récupérer le client depuis `clients`.
5. Calculer le statut de la réservation (même règle que route #11 étape 2).
6. Calculer le numéro de la commande (même règle que route #5 étape 3).

**Réponse 200**
```json
{
  "reservation": { "quantite": 3, "date": "2026-06-01", "statut": "en_cours" },
  "produit": { "id": "uuid", "nom": "Huile de palme 1L", "stock_actuel": 50, "stock_reserve": 10, "stock_disponible": 40 },
  "commande": { "id": "uuid", "numero": "CMD-2026-00001", "statut": "reçu", "date": "2026-06-01" },
  "client": { "id": "uuid", "nom": "Dupont", "prenom": "Jean", "telephone": "+237600000001", "email": "jean@mail.com" }
}
```

---

## 13. GET /api/ventes/reservations/export

**Entrées (query params)**
- `format` — enum `pdf|csv|docx`, **requis**
- Mêmes filtres optionnels que route #11 (sans `page`, sans `per_page`)

**Actions du contrôleur**
1. Appliquer les mêmes filtres que GET /api/ventes/reservations, sans pagination.
2. Inclure pour chaque réservation : produit, quantité, client, numéro de commande, statut, date, stock actuel, stock réservé, stock disponible.
3. Générer le fichier dans le format demandé.

**Réponse 200** — Fichier téléchargeable.

---

## 14. GET /api/ventes/statistiques/general

**Entrées (query params)**
- `date_debut` — date, optionnelle
- `date_fin` — date, optionnelle

**Actions du contrôleur**
1. Extraire `entreprise_id`.
2. Sur la période définie par `date_debut` / `date_fin` (filtre sur `date_commande` pour les commandes, `date_payement` pour les paiements) :
   - `nb_clients` = COUNT(DISTINCT `commandes.client`) pour les commandes de l'entreprise sur la période
   - `nb_commandes` = COUNT des commandes de l'entreprise sur la période
   - `nb_produits` = COUNT des produits WHERE `entreprise = entreprise_id` AND `statut = 'actif'`
   - `ca_total` = SUM(`payements.montant`) WHERE `entreprise = entreprise_id` sur la période
   - `commandes_en_livraison` = COUNT des commandes avec statut métier calculé = "en cours de livraison"
   - `commandes_livrees` = COUNT des commandes avec statut métier calculé = "livré"
   - `commandes_annulees` = COUNT des commandes avec statut métier calculé = "annulé"
   - `taux_livraison` = `commandes_livrees` / (`commandes_livrees` + `commandes_annulees`) × 100, arrondi à 1 décimale (retourner 0 si dénominateur = 0)
   - `produits_rupture` = COUNT des produits physiques actifs de l'entreprise dont `stock_disponible_calcule = 0`
   - `produits_stock_faible` = COUNT des produits physiques actifs dont `0 < stock_disponible_calcule ≤ seuil_alerte`

**Réponse 200**
```json
{
  "kpis": { "nb_clients": 45, "nb_commandes": 120, "nb_produits": 35, "ca_total": 4500000 },
  "commandes_en_livraison": 8,
  "commandes_livrees": 90,
  "commandes_annulees": 12,
  "taux_livraison": 88.2,
  "produits_rupture": 2,
  "produits_stock_faible": 5
}
```

---

## 15. GET /api/ventes/statistiques/clients

**Entrées (query params)**
- `date_debut` — date, optionnelle
- `date_fin` — date, optionnelle
- `limit` — int, défaut 5

**Actions du contrôleur**
1. Pour chaque client de l'entreprise, calculer sur la période :
   - `ca_total` = SUM(`payements.montant`) liés à ses commandes
   - `commandes` = COUNT de ses commandes
2. Attribuer un rang (1 = meilleur).
3. `top_clients` = TOP `limit` clients par `ca_total DESC`, avec rang, id, nom, ca, commandes.
4. `clients_moins_actifs` = TOP `limit` clients par `ca_total ASC` (parmi ceux ayant au moins 1 commande), avec rang.
5. `ca_max` = MAX des ca_total individuels (pour normaliser les barres de progression côté frontend).

**Réponse 200**
```json
{
  "top_clients": [{ "rang": 1, "id": "uuid", "nom": "Dupont Jean", "ca": 350000, "commandes": 12 }],
  "clients_moins_actifs": [{ "rang": 1, "id": "uuid", "nom": "Martin Paul", "ca": 5000, "commandes": 1 }],
  "ca_max": 350000
}
```

---

## 16. GET /api/ventes/statistiques/commandes

**Entrées (query params)**
- `date_debut` — date, optionnelle
- `date_fin` — date, optionnelle
- `limit` — int, défaut 5

**Actions du contrôleur**
1. `plus_frequentes` = TOP `limit` produits par nombre d'apparitions dans `contenir_produit` (COUNT, GROUP BY `produit_id`), avec `montant_total = SUM(montant)`, rang, id, nom du produit.
2. `moins_frequentes` = TOP `limit` produits les moins commandés (ORDER BY COUNT ASC), parmi ceux ayant au moins 1 apparition.
3. `plus_gros_montants` = TOP `limit` commandes par `montant_commande DESC`, avec rang, id, numéro généré, montant, nom du client.
4. `plus_faibles_montants` = TOP `limit` commandes par `montant_commande ASC`.
5. `montant_max` = MAX(`montant_commande`) toutes commandes confondues sur la période.

**Réponse 200**
```json
{
  "plus_frequentes": [{ "rang": 1, "id": "uuid", "produit": "Huile de palme 1L", "commandes": 45, "montant_total": 112500 }],
  "moins_frequentes": [{ "rang": 1, "id": "uuid", "produit": "Lait en poudre 2,5kg", "commandes": 2, "montant_total": 13000 }],
  "plus_gros_montants": [{ "rang": 1, "id": "uuid", "numero": "CMD-2026-00005", "montant": 250000, "client": "Dupont Jean" }],
  "plus_faibles_montants": [{ "rang": 1, "id": "uuid", "numero": "CMD-2026-00010", "montant": 2500, "client": "Martin Paul" }],
  "montant_max": 250000
}
```

---

## 17. GET /api/ventes/notifications

**Entrées** — aucune (tout vient du token)

**Actions du contrôleur**
1. Extraire `utilisateur_id`, `entreprise_id`, `role_id` depuis le token.
2. Récupérer depuis `notifications` WHERE `utilisateur = utilisateur_id` AND `entreprise = entreprise_id` AND `role = role_id` AND `actif = TRUE` AND `statut != 'archivee'`.
3. Compter `non_lues` = COUNT WHERE `statut = 'non_lue'`.
4. Trier par `date_arrivee DESC`, retourner les 50 plus récentes.

**Réponse 200**
```json
{
  "non_lues": 3,
  "notifications": [
    { "id": "uuid", "titre": "Nouvelle commande validée", "message": "...", "statut": "non_lue", "type_notification": "paiement", "date_arrivee": "2026-06-08T14:30:00Z" }
  ]
}
```
