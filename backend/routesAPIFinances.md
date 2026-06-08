# Routes API — Module Finances

Toutes les routes nécessitent un token d'autorisation valide (cookie HTTPOnly `tokenAutorization`).
Le contrôleur extrait systématiquement `entreprise_id`, `utilisateur_id` et `role_id` depuis ce token.

---

## DASHBOARD

### 1. GET /api/finances/dashboard

**Entrées (query params)**
- `periode` — string optionnel : `today|week|month|year`, défaut `month`

**Actions du contrôleur**
1. Définir `date_debut` et `date_fin` selon `periode`.
2. **Section `main`** :
   - `argent_virtuel` = `entreprises.argent_virtuel` WHERE `id = entreprise_id`
   - `total_entrees` = SUM(`montant`) FROM `mouvements_financiers` WHERE `entreprise_id = entreprise_id` AND `sens = 'entree'` AND `date_operation BETWEEN date_debut AND date_fin`
   - `total_sorties` = SUM(`montant`) FROM `mouvements_financiers` WHERE `sens = 'sortie'` AND même période
   - `benefice_net` = `total_entrees` - `total_sorties`
   - `commandes_en_attente_validation` = COUNT des commandes WHERE `statut = 'brouillon'` AND `entreprise = entreprise_id` AND `actif = TRUE`
   - `commandes_en_attente_paiement` = COUNT des commandes WHERE `statut = 'validee'` AND `etat_payement != 'paye'` AND `entreprise = entreprise_id` AND `actif = TRUE`
3. **Section `tresorerie`** : reconstituer l'évolution quotidienne de `argent_virtuel` sur les 30 derniers jours en cumulant les `mouvements_financiers` dans l'ordre chronologique à partir d'une valeur de départ. Chaque point = `{ date, valeur }`.
4. **Section `activites`** : récupérer les 10 derniers `mouvements_financiers` WHERE `entreprise_id = entreprise_id`, triés par `date_operation DESC`. Pour chaque mouvement, joindre `utilisateurs` sur `utilisateur_id`.

**Réponse 200**
```json
{
  "main": {
    "argent_virtuel": 5000000,
    "total_entrees": 1200000,
    "total_sorties": 800000,
    "benefice_net": 400000,
    "commandes_en_attente_validation": 3,
    "commandes_en_attente_paiement": 5
  },
  "tresorerie": [{ "date": "2026-05-10", "valeur": 4800000 }],
  "activites": [
    { "id": "uuid", "date_operation": "2026-06-08T09:00:00Z", "type_operation": "paiement_commande", "montant": 50000, "sens": "entree", "description": "Paiement commande CMD-2026-00001", "utilisateur": "Martin Lucie" }
  ]
}
```

---

## COMMANDES

### 2. GET /api/finances/commandes/a-valider

**Entrées (query params)**
- `page` — int, défaut 1
- `per_page` — int, défaut 20
- `recherche` — string optionnel (filtre sur numéro généré et nom client)

**Actions du contrôleur**
1. Récupérer les commandes WHERE `statut = 'brouillon'` AND `entreprise = entreprise_id` AND `actif = TRUE`.
2. Joindre `clients` pour nom + prénom.
3. Pour chaque commande, calculer le numéro généré (format `CMD-{ANNÉE}-{SÉQUENCE}`) et le nombre de produits via COUNT dans `contenir_produit`.
4. Appliquer filtre `recherche`, trier par `date_commande ASC` (les plus anciennes en premier), paginer.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "numero": "CMD-2026-00001", "client": "Dupont Jean", "montant_commande": 45000, "date": "2026-06-01", "produits_count": 3 }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 8 }
}
```

---

### 3. POST /api/finances/commandes/{id}/valider

**Entrées (path param)**
- `id` — UUID de la commande

**Actions du contrôleur**
1. Récupérer la commande WHERE `id = {id}` AND `entreprise = entreprise_id`. Retourner 404 si absente.
2. Vérifier que `commandes.statut = 'brouillon'`. Sinon → retourner 422 `{ "message": "Cette commande n'est plus en attente de validation." }`.
3. Mettre à jour `commandes` : `statut = 'validee'`, `utilisateur_valide = utilisateur_id`, `date_validation = NOW()`.
4. Créer une notification pour chaque utilisateur ayant un rôle Ventes dans l'entreprise : `type_notification = 'paiement'`, `titre = 'Commande validée'`, `message = 'La commande {numero} a été validée par le module Finance.'`.
5. Insérer dans `historiques` : `module = 'finances'`, `table_concernee = 'commandes'`, `id_element = commande.id`, `action = 'validation commande'`, `utilisateur`, `entreprise`.

**Réponse 200**
```json
{ "message": "Commande validée avec succès." }
```

---

### 4. GET /api/finances/commandes

**Entrées (query params)**
- `page` — int, défaut 1
- `per_page` — int, défaut 20
- `recherche` — string optionnel (numéro généré, nom client)
- `etat_payement` — string optionnel : `tous|non_paye|partiellement_paye`, défaut `tous`
- `date_debut` — date optionnelle, filtre sur `commandes.date_commande`
- `date_fin` — date optionnelle

**Actions du contrôleur**
1. Récupérer les commandes WHERE `statut = 'validee'` AND `etat_payement != 'paye'` AND `entreprise = entreprise_id` AND `actif = TRUE`.
2. Pour chaque commande, calculer `total_paye` = SUM(`montant`) FROM `payements` WHERE `commande = commande.id` AND `actif = TRUE`.
3. Joindre `clients` pour nom + prénom.
4. Appliquer filtres, trier par `date_commande DESC`, paginer.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "numero": "CMD-2026-00001", "client": "Dupont Jean", "montant_commande": 45000, "montant_minimum_validation": 45000, "total_paye": 15000, "etat_payement": "partiellement_paye", "date": "2026-06-01" }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 20 }
}
```

---

### 5. GET /api/finances/commandes/{id}

**Entrées (path param)**
- `id` — UUID de la commande

**Actions du contrôleur**
1. Récupérer la commande WHERE `id = {id}` AND `entreprise = entreprise_id`. Retourner 404 si absente.
2. Récupérer le client associé depuis `clients`.
3. Récupérer les produits via `contenir_produit JOIN produits`.
4. Récupérer les paiements depuis `payements` WHERE `commande = {id}` AND `actif = TRUE`, triés par `date_payement ASC`. Joindre `utilisateurs` sur `user_enregistre` pour nom + prénom.
5. Calculer `total_paye` = SUM des montants des paiements actifs.

**Réponse 200**
```json
{
  "commande": { "id": "uuid", "numero": "CMD-...", "statut": "validee", "etat_payement": "partiellement_paye", "montant_commande": 45000, "montant_minimum_validation": 45000, "total_paye": 15000, "date_commande": "2026-06-01" },
  "client": { "id": "uuid", "nom": "Dupont", "prenom": "Jean", "telephone": "+237600000001", "email": "jean@mail.com" },
  "produits": [{ "id": "uuid", "nom": "Huile de palme 1L", "quantite": 3, "prix_unitaire": 2500, "montant": 7500 }],
  "paiements": [{ "id": "uuid", "montant": 15000, "date_payement": "2026-06-02", "mode_payement": "cash", "reference_transaction": null, "enregistre_par": "Martin Lucie" }]
}
```

---

### 6. PATCH /api/finances/commandes/{id}/montant-minimum

**Entrées (path param + body JSON)**
- `id` — UUID de la commande
- `montant_minimum_validation` — decimal, **requis**, doit être > 0

**Actions du contrôleur**
1. Récupérer la commande WHERE `id = {id}` AND `entreprise = entreprise_id`. Retourner 404 si absente.
2. Vérifier que `commandes.statut = 'validee'` ET `etat_payement != 'paye'`. Sinon → retourner 422 `{ "message": "Impossible de modifier le montant minimum : commande déjà soldée ou non validée." }`.
3. Sauvegarder l'ancienne valeur dans une variable locale.
4. Mettre à jour `commandes.montant_minimum_validation = {montant_minimum_validation}`.
5. Insérer dans `historiques` : `module = 'finances'`, `action = 'modification montant minimum de validation'`, `ancienne_valeur = ancienne_valeur`, `nouvelle_valeur = montant_minimum_validation`, `id_element = commande.id`, `utilisateur`, `entreprise`.

**Réponse 200**
```json
{ "montant_minimum_validation": 30000 }
```

---

### 7. POST /api/finances/commandes/{id}/paiements

**Entrées (path param + body JSON)**
- `id` — UUID de la commande
- `montant` — decimal, **requis**, doit être > 0
- `mode_payement` — enum `cash|mobile_money|carte_bancaire|virement|cheque`, **requis**
- `reference_transaction` — string, optionnel (obligatoire si `mode_payement != 'cash'`)

**Actions du contrôleur**
1. Récupérer la commande WHERE `id = {id}` AND `entreprise = entreprise_id`. Retourner 404 si absente.
2. Vérifier que `commandes.statut = 'validee'`. Sinon → retourner 422.
3. Valider que `montant > 0`.
4. Insérer dans `payements` : `commande = {id}`, `montant`, `mode_payement`, `reference_transaction`, `user_enregistre = utilisateur_id`, `entreprise = entreprise_id`, `date_payement = NOW()`, `actif = TRUE`. Récupérer l'UUID généré (`payement_id`).
5. Recalculer `total_paye` = SUM(`montant`) FROM `payements` WHERE `commande = {id}` AND `actif = TRUE`.
6. Déterminer le nouvel `etat_payement` :
   - `'non_paye'` si `total_paye = 0`
   - `'partiellement_paye'` si `0 < total_paye < montant_commande`
   - `'paye'` si `total_paye >= montant_commande`
7. Mettre à jour `commandes.etat_payement`.
8. Augmenter `entreprises.argent_virtuel` de `montant` WHERE `id = entreprise_id`.
9. Insérer dans `mouvements_financiers` : `type_operation = 'paiement_commande'`, `sens = 'entree'`, `montant`, `reference_id = payement_id`, `entreprise_id`, `utilisateur_id = utilisateur_id`, `description = 'Paiement commande {numero}'`, `date_operation = NOW()`.
10. Si `total_paye >= commandes.montant_minimum_validation` : créer une notification pour les utilisateurs ayant le rôle Livraisons dans l'entreprise : `type_notification = 'livraison'`, `message = 'La commande {numero} est prête pour la livraison (seuil de paiement atteint).'`.
11. Créer une notification pour les utilisateurs Ventes : `type_notification = 'paiement'`, `message = 'Un paiement de {montant} a été enregistré pour la commande {numero}.'`.
12. Insérer dans `historiques` : `module = 'finances'`, `action = 'enregistrement paiement'`, `details_action = '{montant} - {mode_payement}'`, `id_element = commande.id`.

**Réponse 201**
```json
{
  "paiement": { "id": "uuid", "montant": 15000, "mode_payement": "cash", "date_payement": "2026-06-08T10:30:00Z" },
  "commande": { "etat_payement": "partiellement_paye", "total_paye": 30000, "montant_minimum_atteint": false }
}
```

---

### 8. GET /api/finances/paiements

**Entrées (query params)**
- `page`, `per_page`
- `recherche` — string optionnel (filtre sur `commandes.numero_genere`, nom client, `reference_transaction`)
- `date_debut`, `date_fin` — filtre sur `payements.date_payement`
- `mode_payement` — enum optionnel, filtre sur le mode

**Actions du contrôleur**
1. Récupérer tous les `payements` WHERE `entreprise = entreprise_id` AND `actif = TRUE`.
2. Joindre `commandes` pour le numéro généré, joindre `clients` (via commande) pour le nom, joindre `utilisateurs` (via `user_enregistre`) pour le nom de l'enregistreur.
3. Appliquer filtres, trier par `date_payement DESC`, paginer.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "commande_numero": "CMD-2026-00001", "client": "Dupont Jean", "montant": 15000, "mode_payement": "cash", "reference_transaction": null, "date_payement": "2026-06-02", "enregistre_par": "Martin Lucie" }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 200 }
}
```

---

### 9. GET /api/finances/paiements/export

**Entrées (query params)**
- `format` — enum `pdf|csv|docx`, **requis**
- Mêmes filtres optionnels que route #8

**Actions du contrôleur**
1. Appliquer les mêmes filtres sans pagination. Inclure tous les champs de la route #8 plus : montant de la commande associée, etat_payement de la commande.
2. Générer le fichier dans le format demandé.

**Réponse 200** — Fichier téléchargeable.

---

## REMBOURSEMENTS

### 10. GET /api/finances/remboursements

**Entrées (query params)**
- `page`, `per_page`
- `recherche` — string optionnel (numéro commande, nom client, cause)
- `date_debut`, `date_fin` — filtre sur `remboursements.date_remboursement`

**Actions du contrôleur**
1. Récupérer `remboursements` WHERE `entreprise = entreprise_id` AND `actif = TRUE`.
2. Joindre `commandes` pour le numéro généré, joindre `clients` (via commande) pour le nom, joindre `utilisateurs` (via `utilisateur_engage`) pour le nom de l'enregistreur.
3. Appliquer filtres, trier par `date_remboursement DESC`, paginer.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "commande_numero": "CMD-2026-00001", "client": "Dupont Jean", "montant": 5000, "cause": "Produit défectueux", "date_remboursement": "2026-06-03", "enregistre_par": "Martin Lucie" }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 30 }
}
```

---

### 11. GET /api/finances/commandes-remboursables

**Entrées** — aucune

**Actions du contrôleur**
1. Récupérer les commandes WHERE `entreprise = entreprise_id` AND `statut = 'validee'` AND (`etat_payement = 'paye'` OR `etat_payement = 'partiellement_paye'`) AND `actif = TRUE`.
2. Pour chaque commande :
   - `total_paye` = SUM(`payements.montant`) WHERE `commande = id` AND `actif = TRUE`
   - `deja_rembourse` = SUM(`remboursements.montant`) WHERE `commande = id` AND `actif = TRUE`
   - `montant_remboursable` = `total_paye` - `deja_rembourse`
3. Filtrer uniquement les commandes avec `montant_remboursable > 0`.
4. Joindre `clients` pour nom + prénom.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "numero": "CMD-2026-00001", "client": "Dupont Jean", "montant_commande": 45000, "total_paye": 45000, "montant_remboursable": 40000 }
  ]
}
```

---

### 12. POST /api/finances/remboursements

**Entrées (body JSON)**
- `commande_id` — UUID, **requis**
- `montant` — decimal, **requis**, doit être > 0
- `cause` — string, **requis**

**Actions du contrôleur**
1. Récupérer la commande WHERE `id = commande_id` AND `entreprise = entreprise_id`. Retourner 404 si absente.
2. Vérifier que `etat_payement != 'non_paye'`. Sinon → retourner 422 `{ "message": "Aucun paiement enregistré pour cette commande." }`.
3. Calculer `total_paye` = SUM(`payements.montant`) actifs et `deja_rembourse` = SUM(`remboursements.montant`) actifs pour cette commande.
4. Vérifier que `montant <= (total_paye - deja_rembourse)`. Sinon → retourner 422 `{ "message": "Le montant du remboursement dépasse le total payé disponible." }`.
5. Insérer dans `remboursements` : `commande = commande_id`, `cause`, `montant`, `utilisateur_engage = utilisateur_id`, `entreprise = entreprise_id`, `date_remboursement = NOW()`, `actif = TRUE`. Récupérer `remboursement_id`.
6. Diminuer `entreprises.argent_virtuel` de `montant`.
7. Recalculer `etat_payement` de la commande après déduction du remboursement (recalcul basé sur `total_paye - total_rembourse` par rapport à `montant_commande`) et mettre à jour `commandes.etat_payement`.
8. Insérer dans `mouvements_financiers` : `type_operation = 'remboursement_commande'`, `sens = 'sortie'`, `montant`, `reference_id = remboursement_id`, `entreprise_id`, `utilisateur_id`, `description = 'Remboursement commande {numero} : {cause}'`.
9. Insérer dans `historiques` : `module = 'finances'`, `action = 'remboursement enregistré'`, `id_element = commande_id`.

**Réponse 201**
```json
{
  "remboursement": { "id": "uuid", "montant": 5000, "cause": "Produit défectueux", "date_remboursement": "2026-06-08T11:00:00Z" }
}
```

---

### 13. GET /api/finances/remboursements/export

**Entrées (query params)**
- `format` — enum `pdf|csv|docx`, **requis**
- Mêmes filtres optionnels que route #10

**Actions du contrôleur**
1. Appliquer les mêmes filtres sans pagination. Inclure tous les champs de la route #10 plus : détails de la commande associée (montant, produits).
2. Générer le fichier dans le format demandé.

**Réponse 200** — Fichier téléchargeable.

---

## DÉPENSES

### 14. GET /api/finances/depenses

**Entrées (query params)**
- `page`, `per_page`
- `recherche` — string optionnel (filtre ILIKE sur `raison`)
- `date_debut`, `date_fin` — filtre sur `depenses.date_depense`

**Actions du contrôleur**
1. Récupérer `depenses` WHERE `entreprise = entreprise_id` AND `actif = TRUE`.
2. Joindre `utilisateurs` (via `utilisateur_marque`) pour nom + prénom.
3. Appliquer filtres, trier par `date_depense DESC`, paginer.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "montant": 25000, "raison": "Achat fournitures de bureau", "date_depense": "2026-06-05", "enregistre_par": "Martin Lucie" }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 80 }
}
```

---

### 15. POST /api/finances/depenses

**Entrées (body JSON)**
- `montant` — decimal, **requis**, doit être > 0
- `date_depense` — datetime, **requis**
- `raison` — string, **requis**

**Actions du contrôleur**
1. Valider tous les champs.
2. Insérer dans `depenses` : `montant`, `date_depense`, `raison`, `entreprise = entreprise_id`, `utilisateur_marque = utilisateur_id`, `actif = TRUE`. Récupérer `depense_id`.
3. Diminuer `entreprises.argent_virtuel` de `montant`.
4. Insérer dans `mouvements_financiers` : `type_operation = 'depense_generale'`, `sens = 'sortie'`, `montant`, `reference_id = depense_id`, `entreprise_id`, `utilisateur_id`, `description = raison`.
5. Insérer dans `historiques` : `module = 'finances'`, `action = 'dépense enregistrée'`, `id_element = depense_id`.

**Réponse 201**
```json
{
  "depense": { "id": "uuid", "montant": 25000, "raison": "Achat fournitures de bureau", "date_depense": "2026-06-05" }
}
```

---

### 16. GET /api/finances/depenses/export

**Entrées (query params)**
- `format` — enum `pdf|csv|docx`, **requis**
- Mêmes filtres optionnels que route #14

**Actions du contrôleur**
1. Appliquer les mêmes filtres sans pagination.
2. Générer le fichier dans le format demandé.

**Réponse 200** — Fichier téléchargeable.

---

## ENTRÉES

### 17. GET /api/finances/entrees

**Entrées (query params)**
- `page`, `per_page`
- `recherche` — string optionnel (filtre ILIKE sur `raison`)
- `date_debut`, `date_fin` — filtre sur `entrees_argent.date_entree`

**Actions du contrôleur**
1. Récupérer `entrees_argent` WHERE `entreprise = entreprise_id` AND `actif = TRUE`.
2. Joindre `utilisateurs` (via `utilisateur_marque`) pour nom + prénom.
3. Appliquer filtres, trier par `date_entree DESC`, paginer.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "montant": 100000, "raison": "Subvention gouvernementale", "date_entree": "2026-06-01", "enregistre_par": "Martin Lucie" }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 25 }
}
```

---

### 18. POST /api/finances/entrees

**Entrées (body JSON)**
- `montant` — decimal, **requis**, doit être > 0
- `date_entree` — datetime, **requis**
- `raison` — string, **requis**

**Actions du contrôleur**
1. Valider tous les champs.
2. Insérer dans `entrees_argent` : `montant`, `raison`, `date_entree`, `entreprise = entreprise_id`, `utilisateur_marque = utilisateur_id`, `actif = TRUE`. Récupérer `entree_id`.
3. Augmenter `entreprises.argent_virtuel` de `montant`.
4. Insérer dans `mouvements_financiers` : `type_operation = 'entree_generale'`, `sens = 'entree'`, `montant`, `reference_id = entree_id`, `entreprise_id`, `utilisateur_id`, `description = raison`.
5. Insérer dans `historiques` : `module = 'finances'`, `action = 'entrée enregistrée'`, `id_element = entree_id`.

**Réponse 201**
```json
{
  "entree": { "id": "uuid", "montant": 100000, "raison": "Subvention gouvernementale", "date_entree": "2026-06-01" }
}
```

---

### 19. GET /api/finances/entrees/export

**Entrées (query params)**
- `format` — enum `pdf|csv|docx`, **requis**
- Mêmes filtres optionnels que route #17

**Actions du contrôleur**
1. Appliquer les mêmes filtres sans pagination. Générer le fichier dans le format demandé.

**Réponse 200** — Fichier téléchargeable.

---

## ABONNEMENTS

### 20. GET /api/finances/abonnements

**Entrées (query params)**
- `page`, `per_page`
- `statut` — string optionnel : `tous|actif|resilié`, défaut `actif`
- `date_debut`, `date_fin` — filtre sur `frais_mensuel.date_abonnement`

**Actions du contrôleur**
1. Récupérer `frais_mensuel` WHERE `entreprise = entreprise_id` AND `actif = TRUE`.
2. Appliquer filtre statut : `depense_active = TRUE` pour 'actif', `depense_active = FALSE` pour 'resilié'.
3. Trier par `date_abonnement DESC`, paginer.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "service_paye": "Slack", "fournisseur": "Salesforce Inc.", "montant_mensuel": 50000, "date_abonnement": "2026-01-01", "depense_active": true }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 10 }
}
```

---

### 21. GET /api/finances/abonnements/{id}

**Entrées (path param)**
- `id` — UUID de l'abonnement

**Actions du contrôleur**
1. Récupérer le `frais_mensuel` WHERE `id = {id}` AND `entreprise = entreprise_id`. Retourner 404 si absent.
2. Récupérer l'historique des paiements depuis `paiements_abonnements` WHERE `abonnement = {id}`, triés par `date_paiement DESC`. Joindre `utilisateurs` sur `user_enregistre`.

**Réponse 200**
```json
{
  "abonnement": { "id": "uuid", "service_paye": "Slack", "fournisseur": "Salesforce Inc.", "montant_mensuel": 50000, "date_abonnement": "2026-01-01", "depense_active": true },
  "paiements": [
    { "id": "uuid", "montant": 50000, "date_paiement": "2026-06-01", "reference_transaction": "abonnement Slack", "enregistre_par": "Système automatique" }
  ]
}
```

---

### 22. POST /api/finances/abonnements

**Entrées (body JSON)**
- `service_paye` — string, **requis**
- `fournisseur` — string, optionnel
- `montant_mensuel` — decimal, **requis**, doit être > 0
- `date_abonnement` — date, **requis**

**Actions du contrôleur**
1. Valider tous les champs.
2. Insérer dans `frais_mensuel` : `service_paye`, `fournisseur`, `montant_mensuel`, `date_abonnement`, `depense_active = TRUE`, `entreprise = entreprise_id`, `actif = TRUE`. Récupérer `abonnement_id`.
3. Récupérer `entreprises.directeur` WHERE `id = entreprise_id`.
4. Créer une notification pour le directeur : `type_notification = 'paiement'`, `titre = 'Nouvel abonnement enregistré'`, `message = 'Abonnement {service_paye} — {montant_mensuel} / mois — Fournisseur : {fournisseur}'`, `utilisateur = directeur_id`, `role = role_id`.
5. Insérer dans `historiques` : `module = 'finances'`, `action = 'abonnement créé'`, `id_element = abonnement_id`.

**Réponse 201**
```json
{
  "abonnement": { "id": "uuid", "service_paye": "Slack", "fournisseur": "Salesforce Inc.", "montant_mensuel": 50000, "date_abonnement": "2026-06-01" }
}
```

---

### 23. POST /api/finances/abonnements/{id}/resilier

**Entrées (path param + body JSON)**
- `id` — UUID de l'abonnement
- `couper_mois_courant` — boolean, **requis**

**Actions du contrôleur**
1. Récupérer le `frais_mensuel` WHERE `id = {id}` AND `entreprise = entreprise_id`. Retourner 404 si absent.
2. Vérifier que `depense_active = TRUE`. Sinon → retourner 422 `{ "message": "Cet abonnement est déjà résilié." }`.
3. Mettre à jour `frais_mensuel` : `depense_active = FALSE`.
4. Si `couper_mois_courant = true` :
   a. Insérer dans `paiements_abonnements` : `abonnement = id`, `montant = montant_mensuel`, `date_paiement = NOW()`, `reference_transaction = 'abonnement {service_paye}'`, `user_enregistre = utilisateur_id`, `entreprise = entreprise_id`. Récupérer `paiement_abo_id`.
   b. Diminuer `entreprises.argent_virtuel` de `montant_mensuel`.
   c. Insérer dans `mouvements_financiers` : `type_operation = 'paiement_abonnement'`, `sens = 'sortie'`, `montant = montant_mensuel`, `reference_id = paiement_abo_id`, `entreprise_id`, `utilisateur_id`.
5. Insérer dans `historiques` : `module = 'finances'`, `action = 'résiliation abonnement'`, `id_element = id`.

**Réponse 200**
```json
{ "message": "Abonnement résilié avec succès." }
```

---

### 24. POST /api/finances/abonnements/{id}/reactiver

**Entrées (path param + body JSON)**
- `id` — UUID de l'abonnement
- `payer_mois_courant` — boolean, **requis**

**Actions du contrôleur**
1. Récupérer le `frais_mensuel` WHERE `id = {id}` AND `entreprise = entreprise_id`. Retourner 404 si absent.
2. Vérifier que `depense_active = FALSE`. Sinon → retourner 422 `{ "message": "Cet abonnement est déjà actif." }`.
3. Mettre à jour `frais_mensuel` : `depense_active = TRUE`, `date_abonnement = CURRENT_DATE`.
4. Si `payer_mois_courant = true` :
   a. Insérer dans `paiements_abonnements` : `abonnement = id`, `montant = montant_mensuel`, `date_paiement = NOW()`, `reference_transaction = 'abonnement réactivé {service_paye}'`, `user_enregistre = utilisateur_id`, `entreprise = entreprise_id`. Récupérer `paiement_abo_id`.
   b. Diminuer `entreprises.argent_virtuel` de `montant_mensuel`.
   c. Insérer dans `mouvements_financiers` : `type_operation = 'paiement_abonnement'`, `sens = 'sortie'`, `montant = montant_mensuel`, `reference_id = paiement_abo_id`, `entreprise_id`, `utilisateur_id`.
5. Insérer dans `historiques` : `module = 'finances'`, `action = 'réactivation abonnement'`, `id_element = id`.

**Réponse 200**
```json
{ "message": "Abonnement réactivé avec succès." }
```

---

### 25. GET /api/finances/abonnements/export

**Entrées (query params)**
- `format` — enum `pdf|csv|docx`, **requis**
- Mêmes filtres optionnels que route #20

**Actions du contrôleur**
1. Appliquer les mêmes filtres sans pagination. Pour chaque abonnement, inclure l'historique de ses paiements.
2. Générer le fichier dans le format demandé.

**Réponse 200** — Fichier téléchargeable.

---

## RÉAPPROVISIONNEMENTS

### 26. GET /api/finances/reapprovisionnements/en-attente

**Entrées (query params)**
- `page`, `per_page`

**Actions du contrôleur**
1. Récupérer `ravitaillements` WHERE `statut = 'en_attente'` AND `entreprise = entreprise_id` AND `actif = TRUE`.
2. Joindre `produits` (via `ravitaillements.produit`) pour nom du produit, joindre `utilisateurs` (via `utilisateur_demande`) pour nom du demandeur.
3. Trier par `date_creation ASC` (les plus anciens en premier), paginer.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "produit": "Huile de palme 1L", "quantite": 100, "montant_a_depenser": 150000, "date_creation": "2026-06-05", "demandeur": "Nguene Paul" }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 5 }
}
```

---

### 27. GET /api/finances/reapprovisionnements

**Entrées (query params)**
- `page`, `per_page`
- `statut` — string optionnel : `tous|refuse|en_cours|annule|termine`, défaut `tous`
- `date_debut`, `date_fin` — filtre sur `ravitaillements.date_creation`

**Actions du contrôleur**
1. Récupérer `ravitaillements` WHERE `statut != 'en_attente'` AND `entreprise = entreprise_id` AND `actif = TRUE` (historique = tout sauf les en_attente déjà visibles dans la route #26).
2. Joindre `produits`, `utilisateurs` (demandeur + confirmateur via `user_confirmation` + annulateur via `utilisateur_annulation`).
3. Appliquer filtre statut et plage de dates, trier par `date_creation DESC`, paginer.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "produit": "Huile de palme 1L", "quantite": 100, "montant_a_depenser": 150000, "statut": "termine", "date_creation": "2026-06-01", "date_validation": "2026-06-02", "demandeur": "Nguene Paul", "confirme_par": "Martin Lucie" }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 40 }
}
```

---

### 28. POST /api/finances/reapprovisionnements/{id}/valider

**Entrées (path param + body JSON)**
- `id` — UUID du ravitaillement
- `mot_de_passe` — string, **requis**

**Actions du contrôleur**
1. Récupérer l'`utilisateur` depuis `utilisateurs` WHERE `id = utilisateur_id`. Vérifier `mot_de_passe` contre `password_hash` (bcrypt compare). Si incorrect → retourner 401 `{ "message": "Mot de passe incorrect." }`.
2. Récupérer le ravitaillement WHERE `id = {id}` AND `entreprise = entreprise_id`. Retourner 404 si absent.
3. Vérifier que `ravitaillements.statut = 'en_attente'`. Sinon → retourner 422.
4. Mettre à jour `ravitaillements` : `statut = 'en_cours'`, `user_confirmation = utilisateur_id`, `date_validation = NOW()`.
5. Diminuer `entreprises.argent_virtuel` de `ravitaillements.montant_a_depenser`.
6. Insérer dans `mouvements_financiers` : `type_operation = 'paiement_ravitaillement'`, `sens = 'sortie'`, `montant = montant_a_depenser`, `reference_id = id`, `entreprise_id`, `utilisateur_id = utilisateur_id`, `description = 'Validation ravitaillement - {produit_nom} ({quantite})'`.
7. Créer une notification pour chaque utilisateur ayant un rôle Gestion de Stock dans l'entreprise : `type_notification = 'stock'`, `message = 'Le réapprovisionnement pour {produit_nom} ({quantite}) a été validé. Veuillez engager la livraison.'`.
8. Insérer dans `historiques` : `module = 'finances'`, `action = 'validation réapprovisionnement'`, `id_element = id`.

**Réponse 200**
```json
{ "message": "Réapprovisionnement validé avec succès." }
```

---

### 29. POST /api/finances/reapprovisionnements/{id}/refuser

**Entrées (path param + body JSON)**
- `id` — UUID du ravitaillement
- `raison_annulation` — string, **requis**

**Actions du contrôleur**
1. Récupérer le ravitaillement WHERE `id = {id}` AND `entreprise = entreprise_id`. Retourner 404 si absent.
2. Vérifier que `ravitaillements.statut = 'en_attente'`. Sinon → retourner 422 `{ "message": "Ce réapprovisionnement ne peut plus être refusé." }`.
3. Mettre à jour `ravitaillements` : `statut = 'refuse'`, `raison_annulation`, `utilisateur_annulation = utilisateur_id`, `date_annulation = NOW()`.
4. Créer une notification pour chaque utilisateur ayant un rôle Gestion de Stock dans l'entreprise : `type_notification = 'stock'`, `message = 'Le réapprovisionnement pour {produit_nom} a été refusé. Raison : {raison_annulation}'`.
5. Insérer dans `historiques` : `module = 'finances'`, `action = 'refus réapprovisionnement'`, `id_element = id`, `details_action = raison_annulation`.

**Réponse 200**
```json
{ "message": "Réapprovisionnement refusé." }
```

---

### 30. GET /api/finances/reapprovisionnements/export

**Entrées (query params)**
- `format` — enum `pdf|csv|docx`, **requis**
- Mêmes filtres optionnels que route #27

**Actions du contrôleur**
1. Appliquer les mêmes filtres sans pagination. Inclure tous les champs de la route #27 plus : raison d'annulation si refusé.
2. Générer le fichier dans le format demandé.

**Réponse 200** — Fichier téléchargeable.

---

## SALAIRES

### 31. GET /api/finances/salaires

**Entrées (query params)**
- `page`, `per_page`
- `recherche` — string optionnel (filtre ILIKE sur `utilisateurs.nom` + `prenom`)
- `statut` — string optionnel : `tous|actif|archive`, défaut `actif`

**Actions du contrôleur**
1. Récupérer `salaires` WHERE `entreprise = entreprise_id` AND `actif = TRUE`.
2. Joindre `utilisateurs` (via `salaires.utilisateur`) pour nom + prénom.
3. Appliquer filtres (recherche, filtre statut sur `salaires.statut`), trier par `utilisateurs.nom ASC`, paginer.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "utilisateur": { "id": "uuid", "nom": "Mbarga", "prenom": "Alice" }, "montant": 200000, "date_debut": "2025-01-01", "date_fin": null, "statut": "actif" }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 15 }
}
```

---

### 32. GET /api/finances/salaires/{id}/paiements

**Entrées (path param + query params)**
- `id` — UUID du salaire
- `page`, `per_page`
- `date_debut`, `date_fin` — filtre sur `paiements_salaires.date_paiement`

**Actions du contrôleur**
1. Récupérer le salaire WHERE `id = {id}` AND `entreprise = entreprise_id`. Retourner 404 si absent.
2. Récupérer les paiements depuis `paiements_salaires` WHERE `salaire = {id}` AND `entreprise = entreprise_id`.
3. Joindre `utilisateurs` (via `user_enregistre`) pour nom + prénom.
4. Appliquer filtres dates, trier par `date_paiement DESC`, paginer.

**Réponse 200**
```json
{
  "salaire": { "id": "uuid", "utilisateur": { "nom": "Mbarga", "prenom": "Alice" }, "montant": 200000 },
  "paiements": [
    { "id": "uuid", "montant": 200000, "date_paiement": "2026-05-31", "mode_payement": "virtuel", "reference_transaction": "salaire 2026-05", "enregistre_par": "Système automatique" }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 6 }
}
```

---

### 33. GET /api/finances/salaires/export

**Entrées (query params)**
- `format` — enum `pdf|csv|docx`, **requis**
- Mêmes filtres optionnels que route #31

**Actions du contrôleur**
1. Appliquer les mêmes filtres sans pagination. Pour chaque salarié, inclure l'historique de ses paiements de salaire.
2. Générer le fichier dans le format demandé.

**Réponse 200** — Fichier téléchargeable.

---

## JOURNAL FINANCIER

### 34. GET /api/finances/journal

**Entrées (query params)**
- `page`, `per_page`
- `recherche` — string optionnel (filtre ILIKE sur `description`, `reference_id::text`, nom utilisateur)
- `type` — enum optionnel : `tous|paiement_commande|remboursement_commande|depense_generale|entree_generale|paiement_salaire|paiement_abonnement|paiement_ravitaillement|perte_argent`, défaut `tous`
- `sens` — enum optionnel : `tous|entree|sortie`, défaut `tous`
- `date_debut`, `date_fin` — filtre sur `mouvements_financiers.date_operation`

**Actions du contrôleur**
1. Récupérer `mouvements_financiers` WHERE `entreprise_id = entreprise_id`.
2. Joindre `utilisateurs` (via `utilisateur_id`) pour nom + prénom.
3. Appliquer tous les filtres.
4. Sur les données filtrées (avant pagination), calculer :
   - `kpis.total_entrees` = SUM(`montant`) WHERE `sens = 'entree'`
   - `kpis.total_sorties` = SUM(`montant`) WHERE `sens = 'sortie'`
5. Trier par `date_operation DESC`, paginer.

**Réponse 200**
```json
{
  "data": [
    { "id": "uuid", "date_operation": "2026-06-08T10:30:00Z", "type_operation": "paiement_commande", "montant": 45000, "sens": "entree", "description": "Paiement commande CMD-2026-00001", "reference_id": "uuid", "utilisateur": "Martin Lucie" }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 500 },
  "kpis": { "total_entrees": 3000000, "total_sorties": 2000000 }
}
```

---

### 35. GET /api/finances/journal/{id}

**Entrées (path param)**
- `id` — UUID du mouvement financier

**Actions du contrôleur**
1. Récupérer le mouvement WHERE `id = {id}` AND `entreprise_id = entreprise_id`. Retourner 404 si absent.
2. Joindre `utilisateurs` pour nom + prénom.
3. En fonction de `type_operation`, charger les détails de l'élément référencé via `reference_id` :
   - `paiement_commande` → récupérer le tuple dans `payements` + la commande associée
   - `remboursement_commande` → récupérer le tuple dans `remboursements` + la commande associée
   - `depense_generale` → récupérer le tuple dans `depenses`
   - `entree_generale` → récupérer le tuple dans `entrees_argent`
   - `paiement_salaire` → récupérer le tuple dans `paiements_salaires` + l'utilisateur salarié
   - `paiement_abonnement` → récupérer le tuple dans `paiements_abonnements` + le `frais_mensuel`
   - `paiement_ravitaillement` → récupérer le tuple dans `ravitaillements` + le produit associé

**Réponse 200**
```json
{
  "mouvement": {
    "id": "uuid",
    "date_operation": "2026-06-08T10:30:00Z",
    "type_operation": "paiement_commande",
    "montant": 45000,
    "sens": "entree",
    "description": "Paiement commande CMD-2026-00001",
    "utilisateur": "Martin Lucie",
    "reference": {
      "type": "payement",
      "id": "uuid",
      "details": { "commande_numero": "CMD-2026-00001", "mode_payement": "cash", "client": "Dupont Jean" }
    }
  }
}
```

---

### 36. GET /api/finances/journal/export

**Entrées (query params)**
- `format` — enum `pdf|csv|docx`, **requis**
- Mêmes filtres optionnels que route #34

**Actions du contrôleur**
1. Appliquer les mêmes filtres sans pagination. Inclure tous les champs de la route #34 plus les détails de l'élément référencé.
2. Générer le fichier dans le format demandé.

**Réponse 200** — Fichier téléchargeable.

---

## STATISTIQUES

### 37. GET /api/finances/statistiques/general

**Entrées (query params)**
- `date_debut`, `date_fin`

**Actions du contrôleur**
1. Sur la période définie :
   - `argent_virtuel_actuel` = `entreprises.argent_virtuel`
   - `total_entrees` = SUM(`montant`) FROM `mouvements_financiers` WHERE `sens = 'entree'` AND période
   - `total_sorties` = SUM(`montant`) WHERE `sens = 'sortie'` AND période
   - `benefice_net` = `total_entrees` - `total_sorties`
   - `nb_commandes_payees` = COUNT des commandes WHERE `etat_payement = 'paye'` AND `entreprise = entreprise_id` AND période
   - `total_remboursements` = SUM(`remboursements.montant`) WHERE `entreprise = entreprise_id` AND période
   - `total_depenses` = SUM(`depenses.montant`) WHERE `entreprise = entreprise_id` AND période
   - `total_reapprovisionnements` = SUM(`ravitaillements.montant_a_depenser`) WHERE `statut IN ('en_cours', 'termine')` AND `entreprise = entreprise_id` AND période
   - `total_salaires` = SUM(`paiements_salaires.montant`) WHERE `entreprise = entreprise_id` AND période
   - `total_abonnements` = SUM(`paiements_abonnements.montant`) WHERE `entreprise = entreprise_id` AND période

**Réponse 200**
```json
{
  "argent_virtuel_actuel": 5000000,
  "total_entrees": 3000000,
  "total_sorties": 2000000,
  "benefice_net": 1000000,
  "nb_commandes_payees": 45,
  "total_remboursements": 150000,
  "total_depenses": 300000,
  "total_reapprovisionnements": 800000,
  "total_salaires": 600000,
  "total_abonnements": 150000
}
```

---

### 38. GET /api/finances/statistiques/tresorerie

**Entrées (query params)**
- `date_debut`, `date_fin`
- `granularite` — string optionnel : `daily|weekly|monthly`, défaut `daily`

**Actions du contrôleur**
1. Récupérer tous les `mouvements_financiers` WHERE `entreprise_id = entreprise_id` AND `date_operation BETWEEN date_debut AND date_fin`, triés par `date_operation ASC`.
2. Calculer la valeur de départ = `argent_virtuel_actuel` - SUM(entrees depuis date_debut) + SUM(sorties depuis date_debut).
3. Construire la série temporelle en groupant par jour/semaine/mois selon `granularite`. Chaque point = `{ date, valeur_argent_virtuel }` calculé cumulativement.

**Réponse 200**
```json
{
  "evolution": [
    { "date": "2026-05-01", "valeur": 4800000 },
    { "date": "2026-05-02", "valeur": 4750000 }
  ]
}
```

---

### 39. GET /api/finances/statistiques/autres

**Entrées (query params)**
- `date_debut`, `date_fin`

**Actions du contrôleur**
Cette route retourne toutes les statistiques thématiques des pages : Commandes et paiements, Dépenses, Remboursements, Salaires, Abonnements, Réapprovisionnements, Flux financiers, Rapports mensuels.

1. **Section `commandes_paiements`** :
   - Répartition des paiements par `mode_payement` : SUM(`montant`) et COUNT GROUP BY `mode_payement`
   - Évolution des paiements par mois sur la période : SUM(`montant`) GROUP BY trunc(`date_payement`, 'month')

2. **Section `depenses`** :
   - Évolution des dépenses par mois : SUM(`montant`) FROM `depenses` GROUP BY mois

3. **Section `remboursements`** :
   - Évolution des remboursements par mois : SUM(`montant`) FROM `remboursements` GROUP BY mois

4. **Section `salaires`** :
   - Coût salarial total par mois : SUM(`montant`) FROM `paiements_salaires` GROUP BY mois

5. **Section `abonnements`** :
   - Coût total abonnements par mois : SUM(`montant`) FROM `paiements_abonnements` GROUP BY mois
   - Liste des abonnements actifs (`depense_active = TRUE`) avec `service_paye`, `montant_mensuel`, `fournisseur`

6. **Section `reapprovisionnements`** :
   - Coût total ravitaillements par mois : SUM(`montant_a_depenser`) FROM `ravitaillements` WHERE `statut IN ('en_cours','termine')` GROUP BY mois
   - Taux de refus : COUNT(refuse) / COUNT(total) × 100

7. **Section `flux_financiers`** :
   - Consolidation des flux par catégorie (`type_operation`): SUM(`montant`) GROUP BY `type_operation`, `sens` FROM `mouvements_financiers`

8. **Section `rapports_mensuels`** :
   - Résumé mensuel sur la période : pour chaque mois, `{ mois, total_entrees, total_sorties, benefice_net, argent_virtuel_fin_mois }`

**Réponse 200**
```json
{
  "commandes_paiements": {
    "modes": [{ "mode": "cash", "montant": 1000000, "count": 25 }],
    "evolution": [{ "mois": "2026-05", "montant": 800000 }]
  },
  "depenses": { "evolution": [{ "mois": "2026-05", "montant": 120000 }] },
  "remboursements": { "evolution": [{ "mois": "2026-05", "montant": 30000 }] },
  "salaires": { "evolution": [{ "mois": "2026-05", "montant": 600000 }] },
  "abonnements": {
    "evolution": [{ "mois": "2026-05", "montant": 150000 }],
    "actifs": [{ "id": "uuid", "service_paye": "Slack", "montant_mensuel": 50000, "fournisseur": "Salesforce" }]
  },
  "reapprovisionnements": {
    "evolution": [{ "mois": "2026-05", "montant": 300000 }],
    "taux_refus": 8.5
  },
  "flux_financiers": [
    { "type_operation": "paiement_commande", "sens": "entree", "total": 2500000 },
    { "type_operation": "depense_generale", "sens": "sortie", "total": 300000 }
  ],
  "rapports_mensuels": [
    { "mois": "2026-05", "total_entrees": 1200000, "total_sorties": 800000, "benefice_net": 400000, "argent_virtuel_fin_mois": 4800000 }
  ]
}
```
