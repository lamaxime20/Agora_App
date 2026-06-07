import { apiFetch, apiFetchMultipart } from "./api";

export const GESTION_STOCK_DASHBOARD = "Dashboard";
export const GESTION_STOCK_PRODUITS = "Produits";
export const GESTION_STOCK_REAPPROVISIONNEMENT = "Réapprovisionnement";
export const GESTION_STOCK_RESERVATIONS = "Réservations";
export const GESTION_STOCK_PERTES = "Pertes";
export const GESTION_STOCK_STATISTIQUES = "Statistiques";

const productCache = new Map();

function buildQuery(params = {}) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        searchParams.set(key, value);
    });

    const query = searchParams.toString();
    return query ? `?${query}` : "";
}

function shortRef(id, prefix) {
    const raw = String(id ?? "").replace(/-/g, "").slice(0, 8).toUpperCase();
    return `${prefix}-${raw || "00000000"}`;
}

function formatPerson(person) {
    if (!person) return { id: null, nom: "—", prenom: "" };
    const nom = [person.prenom, person.nom].filter(Boolean).join(" ").trim() || person.nom || "—";
    return {
        id: person.id ?? null,
        nom,
        prenom: person.prenom ?? "",
    };
}

function normalizeCategory(raw) {
    if (!raw) return null;
    if (typeof raw === "string") return { id: null, nom: raw || "—", description: "" };
    return {
        id: raw.id ?? null,
        nom: raw.categorie ?? raw.nom ?? "—",
        description: raw.description ?? "",
    };
}

function normalizeProduct(raw) {
    if (!raw) return null;

    const stockActuel = Number(raw.stock_actuel ?? raw.quantite_stock ?? 0);
    const stockDisponible = Number(raw.stock_disponible ?? Math.max(0, stockActuel - Number(raw.stock_reserve ?? 0)));
    const seuil = Number(raw.seuil_alerte ?? 0);

    let statut = raw.statut_disponibilite || raw.statut || "disponible";
    if (statut === "Rupture de stock" || statut === "rupture") statut = "rupture";
    else if (statut === "Stock faible" || statut === "faible") statut = "faible";
    else if (statut === "En stock" || statut === "disponible") statut = "disponible";
    else if (stockActuel <= 0) statut = "rupture";
    else if (stockActuel <= seuil) statut = "faible";
    else statut = "disponible";

    const categorie = normalizeCategory(raw.categorie);
    const id = raw.id ?? null;

    const produit = {
        id,
        nom: raw.nom ?? "—",
        reference: raw.reference ?? id,
        image_url: raw.image_url ?? raw.image ?? null,
        prix_unitaire: Number(raw.prix_unitaire ?? 0),
        seuil_alerte: seuil,
        type: raw.type ?? raw.type_produit ?? "physique",
        type_produit: raw.type_produit ?? raw.type ?? "physique",
        quantite_stock: stockActuel,
        stock_actuel: stockActuel,
        stock_disponible: stockDisponible,
        stock_reserve: Number(raw.stock_reserve ?? Math.max(0, stockActuel - stockDisponible)),
        unite: raw.unite ?? raw.unite_mesure ?? "",
        unite_mesure: raw.unite_mesure ?? raw.unite ?? "",
        description: raw.description ?? "",
        statut,
        categorie,
        categorie_id: raw.categorie_id ?? categorie?.id ?? null,
    };

    if (id) {
        productCache.set(id, produit);
    }

    return produit;
}

function normalizeProductFromCache(id) {
    return productCache.get(id) ?? null;
}

function normalizeRavitaillement(raw) {
    const produit = normalizeProduct(raw.produit ? {
        id: raw.produit.id,
        nom: raw.produit.nom,
        image: raw.produit.image,
    } : normalizeProductFromCache(raw.produit?.id));

    const quantite = Number(raw.quantite ?? 0);
    const montant = Number(raw.montant_a_depenser ?? raw.montant_total ?? 0);
    const statusMap = {
        en_attente: "en_attente",
        en_cours: "en_cours",
        termine: "reçu",
        annule: "annulé",
    };
    const statut = statusMap[raw.statut] ?? raw.statut ?? "en_attente";

    const dateDemande = raw.date_creation ?? raw.date_demande ?? null;
    const dateValidation = raw.date_validation ?? raw.date_reception_prevue ?? null;
    const dateReception = raw.date_execution ?? raw.date_reception_reelle ?? null;

    return {
        id: raw.id,
        reference: raw.reference ?? shortRef(raw.id, "RAV"),
        fournisseur: raw.fournisseur ?? produit?.nom ?? "—",
        montant_total: montant,
        date_demande: dateDemande,
        demandeur: formatPerson(raw.utilisateur_demande),
        date_reception_prevue: dateValidation,
        date_reception_reelle: dateReception,
        statut,
        lignes: [
            {
                nom: produit?.nom ?? "Produit",
                quantite,
                prix_unitaire: quantite > 0 ? montant / quantite : montant,
                sous_total: montant,
                unite: produit?.unite ?? produit?.unite_mesure ?? "unité",
            },
        ],
        produit,
        note: raw.raison_annulation ?? raw.note ?? "",
        raison_annulation: raw.raison_annulation ?? "",
        utilisateur_demande: raw.utilisateur_demande ? formatPerson(raw.utilisateur_demande) : null,
        utilisateur_confirmation: raw.utilisateur_confirmation ? formatPerson(raw.utilisateur_confirmation) : null,
        utilisateur_annulation: raw.utilisateur_annulation ? formatPerson(raw.utilisateur_annulation) : null,
    };
}

function normalizePerte(raw, productDetail = null) {
    const produit = normalizeProduct({
        ...(productDetail ?? {}),
        id: raw.produit?.id ?? productDetail?.id,
        nom: raw.produit?.nom ?? productDetail?.nom ?? "—",
        image: raw.produit?.image ?? productDetail?.image_url ?? null,
        prix_unitaire: productDetail?.prix_unitaire ?? 0,
        seuil_alerte: productDetail?.seuil_alerte ?? 0,
        type_produit: productDetail?.type_produit ?? "physique",
        stock_actuel: productDetail?.stock_actuel ?? productDetail?.quantite_stock ?? 0,
        unite_mesure: productDetail?.unite_mesure ?? productDetail?.unite ?? "",
        categorie: productDetail?.categorie ?? null,
    });

    const quantite = Number(raw.quantite_perdu ?? raw.quantite ?? 0);
    const prixUnitaire = Number(produit?.prix_unitaire ?? 0);
    const valeurTotale = Number((quantite * prixUnitaire).toFixed(2));
    const datePerte = raw.date_perte ?? raw.date_declaration ?? null;
    const dateLimite = datePerte ? new Date(new Date(datePerte).getTime() + 24 * 60 * 60 * 1000).toISOString() : null;
    const annulable = Boolean(raw.annulable);
    const statut = raw.statut ?? (annulable ? "confirmée" : "annulée");

    return {
        id: raw.id,
        reference: raw.reference ?? shortRef(raw.id, "PER"),
        produit: {
            id: produit?.id,
            nom: produit?.nom ?? "—",
            reference: produit?.reference ?? produit?.id,
            unite: produit?.unite ?? produit?.unite_mesure ?? "unité",
            prix_unitaire: prixUnitaire,
            categorie: produit?.categorie?.nom ?? "",
            type_produit: produit?.type_produit ?? "physique",
            image_url: produit?.image_url ?? null,
        },
        quantite,
        valeur_totale: valeurTotale,
        date_declaration: datePerte,
        date_limite_annulation: dateLimite,
        motif: raw.motif_perte ?? raw.motif ?? "autre",
        declarant: formatPerson(raw.utilisateur ?? raw.utilisateurSignale),
        statut,
        note: raw.note ?? "",
        annulable,
    };
}

function normalizeReservation(raw) {
    const etat = raw.etat_metier ?? raw.statut ?? "en cours de livraison";
    let statut = "en_cours";
    if (etat === "livrée" || etat === "livree") statut = "validé";
    else if (etat === "annulée" || etat === "annulee") statut = "annulé";
    else statut = "en_cours";

    const lignes = Array.isArray(raw.lignes)
        ? raw.lignes.map((ligne) => {
            const produit = ligne.produit ? normalizeProduct({
                id: ligne.produit.id,
                nom: ligne.produit.nom,
                type_produit: ligne.produit.type,
            }) : null;

            return {
                nom: produit?.nom ?? ligne.nom ?? "—",
                type: produit?.type_produit ?? ligne.type ?? "physique",
                quantite_reservee: Number(ligne.quantite ?? ligne.quantite_reservee ?? 0),
                quantite_stock_actuel: Number(ligne.quantite_stock_actuel ?? produit?.quantite_stock ?? 0),
                sous_total: Number(ligne.montant ?? ligne.sous_total ?? 0),
                produit_id: ligne.produit_id ?? produit?.id ?? null,
            };
        })
        : [];

    return {
        id: raw.id,
        reference: raw.reference ?? shortRef(raw.id, "CMD"),
        client: formatPerson(raw.client),
        commercial: formatPerson(raw.utilisateur_enregistre ?? raw.utilisateur_valide),
        date_reservation: raw.date_commande ?? raw.date_reservation ?? null,
        date_expiration: raw.date_livraison_prevue ?? raw.date_expiration ?? null,
        montant_total: Number(raw.montant_commande ?? raw.montant_total ?? 0),
        statut,
        lignes,
        note: raw.notes_supplementaires ?? raw.note ?? "",
        commande: raw,
    };
}

function normalizeHistorique(raw, element = null) {
    const historique = raw.historique ?? raw;
    const linked = element ?? raw.element ?? null;
    const action = historique.action ?? "modification";
    const typeMap = {
        creation: "creation",
        mise_a_jour: "modification",
        ravitaillement: "ravitaillement",
        validation_ravitaillement: "ravitaillement",
        perte: "perte",
        annulation_perte: "annulation_perte",
        archivage: "archivage",
    };
    const type = typeMap[action] ?? action ?? "modification";

    let produit = null;
    let variation = null;
    let stockAvant = null;
    let stockApres = null;
    let detail = null;
    let note = historique.details_action ?? "";

    if (linked && linked.nom && linked.prix_unitaire != null) {
        produit = normalizeProduct(linked);
    }

    if (historique.table_concernee === "produits" && linked) {
        produit = normalizeProduct(linked);
        if (historique.ancienne_valeur != null) stockAvant = Number(historique.ancienne_valeur);
        if (historique.nouvelle_valeur != null) stockApres = Number(historique.nouvelle_valeur);
        if (stockAvant != null && stockApres != null) variation = stockApres - stockAvant;
        detail = {
            stock_initial: stockAvant ?? 0,
            prix_unitaire: produit?.prix_unitaire ?? 0,
            categorie: produit?.categorie?.nom ?? "—",
            type_produit: produit?.type_produit ?? "physique",
            champ_modifie: historique.action === "mise_a_jour" ? historique.details_action : "Création",
            ancienne_valeur: historique.ancienne_valeur ?? null,
            nouvelle_valeur: historique.nouvelle_valeur ?? null,
            raison: historique.details_action ?? "",
            stock_archive: historique.nouvelle_valeur ?? null,
        };
    } else if (historique.table_concernee === "ravitaillements" && linked) {
        produit = normalizeProduct(linked.produit ?? linked);
        variation = Number(linked.quantite ?? 0);
        stockAvant = null;
        stockApres = null;
        detail = {
            quantite: Number(linked.quantite ?? 0),
            montant: Number(linked.montant_a_depenser ?? 0),
            fournisseur: linked.fournisseur ?? produit?.nom ?? "—",
            demandeur: formatPerson(linked.utilisateur_demande).nom,
            validateur: formatPerson(linked.utilisateur_confirmation).nom,
            date_demande: linked.date_creation ?? null,
            date_validation: linked.date_validation ?? null,
            statut: linked.statut ?? "en_attente",
            raison_annulation: linked.raison_annulation ?? "",
            reapprovisionnement_ref: shortRef(linked.id, "RAV"),
        };
    } else if (historique.table_concernee === "pertes_produits" && linked) {
        produit = normalizeProduct(linked.produit ?? linked);
        variation = -Number(linked.quantite_perdu ?? 0);
        stockAvant = null;
        stockApres = null;
        detail = {
            quantite_perdue: Number(linked.quantite_perdu ?? 0),
            valeur_estimee: Number((Number(linked.quantite_perdu ?? 0) * Number(produit?.prix_unitaire ?? 0)).toFixed(2)),
            motif: linked.motif_perte ?? "",
            annulable: Boolean(linked.annulable),
        };
    } else if (historique.table_concernee === "commandes" && linked) {
        const firstLine = linked.lignes?.[0];
        produit = firstLine?.produit ? normalizeProduct({
            id: firstLine.produit.id,
            nom: firstLine.produit.nom,
            type_produit: firstLine.produit.type ?? "physique",
            categorie: firstLine.produit.categorie,
        }) : null;
        variation = firstLine ? Number(firstLine.quantite ?? 0) : null;
        detail = {
            commande_ref: shortRef(linked.id, "CMD"),
            client: linked.client ? formatPerson(linked.client).nom : "—",
            quantite_livree: firstLine ? Number(firstLine.quantite ?? 0) : 0,
            date_validation_livraison: linked.date_validation ?? null,
            impact_stock: linked.etat_metier ?? "—",
        };
    }

    const date = historique.date_action ?? null;
    const utilisateur = formatPerson(historique.utilisateur);

    return {
        id: historique.id,
        type,
        date,
        variation,
        stock_avant: stockAvant,
        stock_apres: stockApres,
        produit: produit ? {
            id: produit.id,
            nom: produit.nom,
            reference: produit.reference ?? produit.id,
            categorie: produit.categorie?.nom ?? "",
            type_produit: produit.type_produit ?? produit.type ?? "physique",
            unite: produit.unite ?? produit.unite_mesure ?? "",
            image_url: produit.image_url ?? null,
        } : {
            id: null,
            nom: "—",
            reference: "—",
            categorie: "",
            type_produit: "physique",
            unite: "",
            image_url: null,
        },
        utilisateur,
        detail,
        note,
    };
}

async function fetchAndNormalizeProducts(params = {}) {
    const payload = await apiFetch(`stock/produits${buildQuery(params)}`);
    const produits = payload?.data?.produits ?? [];
    return {
        items: produits.map(normalizeProduct),
        total: payload?.data?.total ?? produits.length,
        page: payload?.data?.page ?? 1,
        limit: payload?.data?.limit ?? produits.length,
    };
}

export async function fetchStockCategories(params = {}) {
    const payload = await apiFetch(`stock/categories${buildQuery(params)}`);
    const categories = payload?.data?.categories ?? [];
    return categories.map(normalizeCategory);
}

export async function createStockCategorie(body) {
    return apiFetch("stock/categories", { method: "POST", body });
}

export async function fetchStockProduits(params = {}) {
    return fetchAndNormalizeProducts(params);
}

export async function fetchStockProduitById(id) {
    const payload = await apiFetch(`stock/produits/${id}`);
    const produit = normalizeProduct(payload?.data?.produit);
    return {
        produit,
        statistiques: payload?.data?.statistiques ?? {},
        evolution_stock_7j: payload?.data?.evolution_stock_7j ?? [],
    };
}

export async function createStockProduit(formData) {
    return apiFetchMultipart("stock/produits", formData, { method: "POST" });
}

export async function updateStockProduit(id, formData) {
    return apiFetchMultipart(`stock/produits/${id}`, formData, { method: "PATCH" });
}

export async function archiveStockProduit(id, password) {
    return apiFetch(`stock/produits/${id}`, {
        method: "DELETE",
        body: { password },
    });
}

export async function fetchStockRavitaillements(params = {}) {
    const payload = await apiFetch(`stock/ravitaillements${buildQuery(params)}`);
    const ravitaillements = payload?.data?.ravitaillements ?? [];
    return {
        items: ravitaillements.map(normalizeRavitaillement),
        total: payload?.data?.total ?? ravitaillements.length,
    };
}

export async function createStockRavitaillement(body) {
    return apiFetch("stock/ravitaillements", { method: "POST", body });
}

export async function annulerStockRavitaillement(id, raison_annulation) {
    return apiFetch(`stock/ravitaillements/${id}/annuler`, {
        method: "PATCH",
        body: { raison_annulation },
    });
}

export async function confirmerStockRavitaillement(id, password) {
    return apiFetch(`stock/ravitaillements/${id}/confirmer`, {
        method: "PATCH",
        body: { password },
    });
}

export async function fetchStockPertes(params = {}) {
    const payload = await apiFetch(`stock/pertes${buildQuery(params)}`);
    const pertes = payload?.data?.pertes ?? [];
    const uniqueProductIds = [...new Set(pertes.map((item) => item.produit?.id).filter(Boolean))];
    const productEntries = await Promise.all(
        uniqueProductIds.map(async (id) => {
            try {
                const detail = await fetchStockProduitById(id);
                return [id, detail.produit];
            } catch {
                return [id, null];
            }
        })
    );
    const productMap = new Map(productEntries);
    return {
        items: pertes.map((item) => normalizePerte(item, productMap.get(item.produit?.id) ?? null)),
        total: payload?.data?.total ?? pertes.length,
    };
}

export async function createStockPerte(body) {
    return apiFetch("stock/pertes", { method: "POST", body });
}

export async function annulerStockPerte(id, password) {
    return apiFetch(`stock/pertes/${id}`, {
        method: "DELETE",
        body: { password },
    });
}

export async function fetchStockReservations(params = {}) {
    const payload = await apiFetch(`stock/reservations${buildQuery(params)}`);
    const commandes = payload?.data?.commandes ?? [];
    const detailed = await Promise.all(
        commandes.map(async (commande) => {
            try {
                const detail = await fetchStockReservationById(commande.id);
                return detail.reservation;
            } catch {
                return normalizeReservation(commande);
            }
        })
    );
    return {
        items: detailed,
        total: payload?.data?.total ?? commandes.length,
        kpis: payload?.data?.kpis ?? null,
    };
}

export async function fetchStockReservationById(id) {
    const payload = await apiFetch(`stock/reservations/${id}`);
    const reservation = normalizeReservation(payload?.data?.commande ?? payload?.data ?? null);
    const lignes = (payload?.data?.lignes ?? []).map((ligne) => ({
        nom: ligne.produit?.nom ?? "—",
        type: ligne.produit?.type ?? "physique",
        quantite_reservee: Number(ligne.quantite ?? 0),
        quantite_stock_actuel: 0,
        sous_total: Number(ligne.montant ?? 0),
        produit_id: ligne.produit_id ?? ligne.produit?.id ?? null,
    }));
    return {
        reservation: {
            ...reservation,
            lignes: lignes.length > 0 ? lignes : reservation.lignes,
        },
        lignes,
        livraison: payload?.data?.livraison ?? null,
    };
}

export async function fetchStockHistorique(params = {}) {
    const payload = await apiFetch(`stock/historique${buildQuery(params)}`);
    const transactions = payload?.data?.transactions ?? [];

    const detailed = await Promise.all(
        transactions.map(async (txn) => {
            try {
                const detailPayload = await apiFetch(`stock/historique/${txn.id}`);
                return normalizeHistorique(detailPayload?.data?.transaction?.historique ?? txn, detailPayload?.data?.transaction?.element ?? null);
            } catch {
                return normalizeHistorique(txn, null);
            }
        })
    );

    return {
        items: detailed,
        total: payload?.data?.total ?? transactions.length,
    };
}

export async function fetchStockHistoriqueById(id) {
    const payload = await apiFetch(`stock/historique/${id}`);
    return normalizeHistorique(payload?.data?.transaction?.historique ?? null, payload?.data?.transaction?.element ?? null);
}

export async function fetchStockStatistiques(page, params = {}) {
    const endpointMap = {
        vueGenerale: "stock/statistiques/vue-generale",
        produits: "stock/statistiques/produits",
        stock: "stock/statistiques/stock",
        reapprovisionnements: "stock/statistiques/ravitaillements",
        pertes: "stock/statistiques/pertes",
    };

    const endpoint = endpointMap[page];
    if (!endpoint) {
        throw new Error(`Page de statistiques inconnue: ${page}`);
    }

    const payload = await apiFetch(`${endpoint}${buildQuery(params)}`);
    return payload?.data ?? {};
}

export async function fetchStockProductsForLookup() {
    const payload = await apiFetch(`stock/produits${buildQuery({ limit: 100 })}`);
    const produits = payload?.data?.produits ?? [];
    return produits.map(normalizeProduct);
}
