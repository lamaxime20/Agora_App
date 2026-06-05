Routes API — Gestion de Stock (alignées sur bd.sql)
Conventions tirées du schéma : ravitaillements, pertes_produits, produits, categories_produit, commandes, contenir_produit, historiques

Produits — table produits
GET /api/stock/produits

Entrée : ?search=&categorie=<uuid>&type_produit=physique|service&statut=actif|archive&page=1&limit=25
Contrôleur : joint categories_produit, filtre par entreprise (extrait du token de session), calcule stock_disponible = stock_actuel - SUM(quantite des commandes validées non livrées pour ce produit), détermine le statut d'alerte dynamiquement (stock_actuel ≤ seuil_alerte → faible, stock_actuel = 0 → rupture).
Réponse : { data: { produits: [...], total, page, limit } }
POST /api/stock/produits

Entrée : multipart/form-data — nom*, prix_unitaire*, type_produit*, categorie*(uuid), stock_actuel (si physique), seuil_alerte (si physique), unite_mesure (si physique), description?, image?
Contrôleur : vérifie que categorie appartient à l'entreprise, crée la ligne dans produits avec utilisateur=token.userId, insère un enregistrement dans historiques (module="stock", table_concernee="produits", action="création"), envoie notification type="stock" au directeur si stock_actuel ≤ seuil_alerte.
Réponse : { data: { produit } } 201
GET /api/stock/produits/:id

Contrôleur : joint categories_produit, retourne le produit + statistiques agrégées depuis ravitaillements (nb, montant total), pertes_produits (nb, quantité totale perdue), contenir_produit + commandes (nb ventes, CA), évolution stock_actuel reconstruite depuis historiques.
Réponse : { data: { produit, statistiques: { nb_ravitaillements, montant_total_reappro, nb_pertes, quantite_perdue_totale, nb_ventes, ca_total }, evolution_stock_7j: [...] } }
PATCH /api/stock/produits/:id

Entrée : multipart/form-data — nom?, prix_unitaire?, seuil_alerte?, unite_mesure?, description?, categorie?, image? (type_produit ignoré)
Contrôleur : met à jour, insère dans historiques pour chaque champ modifié (ancienne_valeur, nouvelle_valeur), re-évalue seuil pour notifications.
Réponse : { data: { produit } } 200
DELETE /api/stock/produits/:id

Entrée : { password: string }
Contrôleur : vérifie le password_hash de l'utilisateur dans utilisateurs, passe statut = 'archive' dans produits, insère dans historiques (action="archivage"). Ne supprime jamais physiquement.
Réponse : { message: "Produit archivé" } 200
Catégories — table categories_produit
GET /api/stock/categories

Contrôleur : retourne toutes les lignes categories_produit filtrées par entreprise.
Réponse : { data: { categories: [{ id, categorie, description }] } }
POST /api/stock/categories

Entrée : { categorie: string*, description?: string }
Contrôleur : crée la ligne, insère utilisateur depuis le token. Contrainte UNIQUE(categorie, entreprise) — retourne 409 si doublon.
Réponse : { data: { categorie } } 201
Ravitaillements — table ravitaillements
Le schéma BDD a un ravitaillement par produit (pas de table lignes). Un ravitaillement = 1 produit + quantité + montant.

GET /api/stock/ravitaillements

Entrée : ?statut=en_attente|refuse|en_cours|annule|termine&produit=<uuid>&dateDebut=&dateFin=&page=1&limit=25
Contrôleur : joint produits, utilisateurs (demande + confirmation + annulation), filtre par entreprise.
Réponse : { data: { ravitaillements: [...], total } }
POST /api/stock/ravitaillements

Entrée : { produit_id: uuid*, quantite: number*, montant_a_depenser: number* }
Contrôleur : vérifie que le produit est physique et actif, crée le ravitaillement avec statut='en_attente', utilisateur_demande=token.userId. Insère dans historiques. Envoie notification type="stock" au directeur.
Réponse : { data: { ravitaillement } } 201
PATCH /api/stock/ravitaillements/:id/annuler

Entrée : { raison_annulation: string* (min 10 car.) }
Contrôleur : vérifie statut IN ('en_attente','en_cours'), passe à statut='annule', remplit raison_annulation, date_annulation, utilisateur_annulation=token.userId. Insère dans historiques. Envoie notification.
Réponse : { data: { ravitaillement } } 200
PATCH /api/stock/ravitaillements/:id/confirmer

Entrée : { password: string* }
Contrôleur : vérifie le mot de passe, vérifie statut='en_cours', passe à statut='termine', incrémente produits.stock_actuel += ravitaillement.quantite, remplit user_confirmation, date_validation. Insère dans historiques (action="ravitaillement", ancienne_valeur=stock_avant, nouvelle_valeur=stock_après). Éteint les notifications de rupture/stock faible si seuil dépassé.
Réponse : { data: { ravitaillement } } 200
Pertes — table pertes_produits
La BDD n'a pas de colonne statut ni date_limite_annulation dans pertes_produits. Le statut "annulée" et la fenêtre de 24h doivent être gérés différemment : soit en ajoutant les colonnes au schéma, soit en déduisant "annulable" via date_perte + 24h > now et en vérifiant l'absence d'un enregistrement de restauration dans historiques.

GET /api/stock/pertes

Entrée : ?motif=&dateDebut=&dateFin=&page=1&limit=25
Contrôleur : retourne les pertes de l'entreprise, joint produits et utilisateurs. Calcule dynamiquement pour chaque perte : annulable = (date_perte + INTERVAL '24 hours') > NOW() ET aucune restauration de stock liée dans historiques.
Réponse : { data: { pertes: [...], total } }
POST /api/stock/pertes

Entrée : { produit_id: uuid*, quantite_perdu: number*, motif_perte: string* }
Contrôleur : vérifie que le produit est physique, actif et que stock_actuel >= quantite_perdu, décrémente produits.stock_actuel, crée la ligne dans pertes_produits, insère dans historiques (action="perte"). Envoie notification type="perte" au directeur avec valeur estimée (quantite × prix_unitaire). Si le nouveau stock ≤ seuil_alerte → notification type="stock".
Réponse : { data: { perte } } 201
DELETE /api/stock/pertes/:id (annulation)

Entrée : { password: string* }
Contrôleur : vérifie mot de passe, vérifie (date_perte + 24h) > NOW(), vérifie qu'aucune restauration n'a déjà été faite (via historiques), restaure produits.stock_actuel += quantite_perdu, supprime la ligne de pertes_produits (ou marque via un booléen annulee si tu préfères un soft-delete — recommandé d'ajouter la colonne), insère dans historiques (action="annulation_perte").
Réponse : { message: "Perte annulée, stock restauré" } 200
Réservations — tables commandes + contenir_produit
GET /api/stock/reservations

Entrée : ?statut=validee|brouillon|annulee&dateDebut=&dateFin=&search=&page=1&limit=25
Contrôleur : retourne les commandes de l'entreprise, joint clients, utilisateurs (enregistré + validé), joint contenir_produit avec produits. Calcule stock_reserve par produit = SUM(quantite des commandes validées non encore livrées). KPIs : nb commandes actives, articles total, valeur totale.
Réponse : { data: { commandes: [...], total, kpis: { actives, articles_total, valeur_totale } } }
GET /api/stock/reservations/:id

Contrôleur : retourne la commande complète avec ses lignes (contenir_produit + détail produit), statut paiement, livraison associée (livraisons).
Réponse : { data: { commande, lignes: [...], livraison?: {...} } }
Historique de transactions — table historiques
GET /api/stock/historique

Entrée : ?module=stock&type=&produit_id=&categorie=&utilisateur_id=&dateDebut=&dateFin=&search=&sortCol=date&sortDir=desc&page=1&limit=25
Contrôleur : filtre historiques par module='stock' et entreprise, joint utilisateurs, produits (via id_element selon table_concernee). Retourne le journal complet des actions de stock avec ancienne_valeur / nouvelle_valeur.
Réponse : { data: { transactions: [...], total } }
GET /api/stock/historique/:id

Contrôleur : retourne l'entrée complète de historiques avec toutes ses métadonnées + le détail de l'entité liée (id_element → jointure sur table_concernee).
Réponse : { data: { transaction } }
Statistiques — agrégations multi-tables
GET /api/stock/statistiques/vue-generale

Entrée : ?dateDebut=&dateFin=
Contrôleur : requête agrégée unique — COUNT(produits WHERE statut='actif'), COUNT(categories_produit), SUM(stock_actuel * prix_unitaire), COUNT(produits WHERE stock_actuel=0), COUNT(produits WHERE stock_actuel <= seuil_alerte AND stock_actuel > 0), SUM(pertes_produits.quantite_perdu * produits.prix_unitaire) sur la période, séries temporelles sur 6 mois depuis historiques.
Réponse : { data: { kpis: {...}, evolution_valeur_stock: [...], evolution_pertes: [...], evolution_ravitaillements: [...] } }
GET /api/stock/statistiques/produits
GET /api/stock/statistiques/stock
GET /api/stock/statistiques/ravitaillements
GET /api/stock/statistiques/pertes

Même pattern : chacune agrège ses tables respectives (contenir_produit+commandes pour ventes, ravitaillements pour réappro, pertes_produits pour pertes, historiques pour évolution stock) et retourne KPIs + séries temporelles + tableaux de détail.
Note schéma : La table pertes_produits n'a pas de colonne statut ni date_limite_annulation. Pour supporter l'annulation sur 24h proprement, il faudra ajouter annulee BOOLEAN DEFAULT FALSE et laisser historiques tracer la restauration — ou ajouter date_limite_annulation TIMESTAMP généré à l'insertion.