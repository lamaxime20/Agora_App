import { useState, useEffect, useCallback, useRef } from "react";
import {
    fetchStockStatistiques,
    fetchStockProduits,
    fetchStockRavitaillements,
    fetchStockPertes,
} from "./gestionStock.js";

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCached(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}

function monthLabel(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

function groupByMonth(items, dateKey, mapValue) {
    const acc = new Map();
    items.forEach((item) => {
        const key = monthLabel(item[dateKey]);
        const current = acc.get(key) ?? { mois: key, valeur: 0, nb: 0, montant: 0, entrees: 0, sorties: 0, pertes: 0 };
        const value = mapValue(item);
        current.valeur += value.valeur ?? 0;
        current.montant += value.montant ?? 0;
        current.nb += value.nb ?? 0;
        current.entrees += value.entrees ?? 0;
        current.sorties += value.sorties ?? 0;
        current.pertes += value.pertes ?? 0;
        acc.set(key, current);
    });
    return [...acc.values()];
}

function normalizeVueGenerale(payload) {
    const k = payload?.kpis ?? {};
    const evolutionValeurStock = (payload?.evolution_valeur_stock ?? []).map((item) => {
        const delta = item.ancienne != null && item.nouvelle != null
            ? Number(item.nouvelle) - Number(item.ancienne)
            : 0;
        return {
            mois: monthLabel(item.date_action),
            valeur: delta,
        };
    });

    const evolutionPertes = (payload?.evolution_pertes ?? []).map((item) => ({
        mois: monthLabel(item.date),
        valeur: Number(item.total ?? 0),
    }));

    const evolutionReappro = (payload?.evolution_ravitaillements ?? []).map((item) => ({
        mois: monthLabel(item.date),
        montant: Number(item.total ?? 0),
        nb: Number(item.total ?? 0),
    }));

    return {
        kpis: {
            totalProduits: Number(k.produits_actifs ?? 0),
            totalCategories: Number(k.categories ?? 0),
            valeurTotaleStock: Number(k.valeur_stock ?? 0),
            totalProduitsRupture: Number(k.ruptures_stock ?? 0),
            totalProduitsFaible: Number(k.stocks_faibles ?? 0),
            coutTotalPertes: Number(k.valeur_pertes ?? 0),
            variationProduits: 0,
            variationCategories: 0,
            variationValeur: 0,
            variationRupture: 0,
            variationFaible: 0,
            variationPertes: 0,
        },
        evolutionValeurStock,
        evolutionPertes,
        evolutionReappro,
    };
}

function normalizeProduits(payload) {
    const produits = payload?.produits ?? [];
    const sortedByVentes = [...produits].sort((a, b) => Number(b.quantite_vendue ?? 0) - Number(a.quantite_vendue ?? 0));
    const sortedByCA = [...produits].sort((a, b) => Number(b.ca_total ?? 0) - Number(a.ca_total ?? 0));
    const sortedAsc = [...produits].sort((a, b) => Number(a.quantite_vendue ?? 0) - Number(b.quantite_vendue ?? 0));

    const topVendu = sortedByVentes[0] ?? null;
    const moinsVendu = sortedAsc[0] ?? null;
    const maxCA = sortedByCA[0] ?? null;
    const minCA = sortedByCA[sortedByCA.length - 1] ?? null;

    return {
        kpis: {
            topVenduNom: topVendu?.nom ?? "—",
            topVenduQty: Number(topVendu?.quantite_vendue ?? 0),
            moinsVenduNom: moinsVendu?.nom ?? "—",
            moinsVenduQty: Number(moinsVendu?.quantite_vendue ?? 0),
            maxCANom: maxCA?.nom ?? "—",
            maxCAValeur: Number(maxCA?.ca_total ?? 0),
            minCANom: minCA?.nom ?? "—",
            minCAValeur: Number(minCA?.ca_total ?? 0),
        },
        topParVente: sortedByVentes.slice(0, 10).map((item) => ({
            nom: item.nom,
            quantite: Number(item.quantite_vendue ?? 0),
        })),
        topParCA: sortedByCA.slice(0, 10).map((item) => ({
            nom: item.nom,
            ca: Number(item.ca_total ?? 0),
        })),
        tableau: produits.map((item) => ({
            nom: item.nom,
            categorie: item.categorie ?? "—",
            quantite: Number(item.quantite_vendue ?? 0),
            ca: Number(item.ca_total ?? 0),
            croissance: 0,
        })),
    };
}

function normalizeStock(payload, produits) {
    const k = payload?.kpis ?? {};
    const valeurTotale = produits.reduce((acc, item) => acc + Number(item.stock_actuel ?? 0) * Number(item.prix_unitaire ?? 0), 0);
    const stockMoyen = produits.length ? produits.reduce((acc, item) => acc + Number(item.stock_actuel ?? 0), 0) / produits.length : 0;
    const produitFaible = produits.filter((item) => Number(item.stock_actuel ?? 0) > 0 && Number(item.stock_actuel ?? 0) <= Number(item.seuil_alerte ?? 0)).length;
    const produitRupture = produits.filter((item) => Number(item.stock_actuel ?? 0) <= 0).length;

    const parCategorieMap = new Map();
    produits.forEach((item) => {
        const key = item.categorie?.nom ?? "Sans catégorie";
        const current = parCategorieMap.get(key) ?? { categorie: key, valeur: 0, nbProduits: 0 };
        current.valeur += Number(item.stock_actuel ?? 0) * Number(item.prix_unitaire ?? 0);
        current.nbProduits += 1;
        parCategorieMap.set(key, current);
    });

    const evolutionMensuelle = groupByMonth(
        payload?.evolution_stock ?? [],
        "date_action",
        (item) => {
            const delta = item.ancienne != null && item.nouvelle != null ? Number(item.nouvelle) - Number(item.ancienne) : 0;
            const type = String(item.action ?? "");
            return {
                entrees: delta > 0 ? delta : 0,
                sorties: delta < 0 ? Math.abs(delta) : 0,
                pertes: type.includes("perte") ? Math.abs(delta) || 1 : 0,
            };
        }
    ).map((item) => ({
        mois: item.mois,
        entrees: item.entrees,
        sorties: item.sorties,
        pertes: item.pertes,
    }));

    return {
        kpis: {
            valeurTotale,
            stockMoyen,
            produitsFaible,
            produitsRupture,
            variationValeur: 0,
            variationFaible: 0,
        },
        parCategorie: [...parCategorieMap.values()],
        evolutionMensuelle,
        tableau: produits.map((item) => ({
            nom: item.nom,
            categorie: item.categorie?.nom ?? "—",
            stock: Number(item.stock_actuel ?? 0),
            reserve: Number(item.stock_reserve ?? 0),
            disponible: Number(item.stock_disponible ?? 0),
            valeur: Number(item.stock_actuel ?? 0) * Number(item.prix_unitaire ?? 0),
            statut: item.statut,
        })),
    };
}

function normalizeRavitaillements(payload, items) {
    const totalNb = items.length;
    const montantTotal = items.reduce((acc, item) => acc + Number(item.montant_total ?? 0), 0);
    const fournisseurs = new Map();
    const period = new Map();

    items.forEach((item) => {
        const fournisseur = item.fournisseur ?? item.produit?.nom ?? "—";
        const current = fournisseurs.get(fournisseur) ?? { nom: fournisseur, montant: 0 };
        current.montant += Number(item.montant_total ?? 0);
        fournisseurs.set(fournisseur, current);

        const month = monthLabel(item.date_demande);
        const p = period.get(month) ?? { mois: month, montant: 0 };
        p.montant += Number(item.montant_total ?? 0);
        period.set(month, p);
    });

    return {
        kpis: {
            totalNb,
            montantTotal,
            tauxRespectDelais: items.length ? Math.round((items.filter((i) => i.statut === "reçu").length / items.length) * 100) : 0,
            nbFournisseurs: fournisseurs.size,
        },
        parPeriode: [...period.values()],
        topFournisseurs: [...fournisseurs.values()].sort((a, b) => b.montant - a.montant).slice(0, 10),
        tableau: items.map((item) => ({
            nom: item.produit?.nom ?? "—",
            quantite: Number(item.lignes?.[0]?.quantite ?? 0),
            montant: Number(item.montant_total ?? 0),
            nb: 1,
        })),
    };
}

function normalizePertes(payload, items) {
    const valeurTotale = items.reduce((acc, item) => acc + Number(item.valeur_totale ?? 0), 0);
    const nbTotal = items.length;
    const produitMap = new Map();
    const categorieMap = new Map();
    const motifMap = new Map();
    const monthly = new Map();

    items.forEach((item) => {
        const prodKey = item.produit?.nom ?? "—";
        const current = produitMap.get(prodKey) ?? { nom: prodKey, quantite: 0, valeur: 0, nbIncidents: 0 };
        current.quantite += Number(item.quantite ?? 0);
        current.valeur += Number(item.valeur_totale ?? 0);
        current.nbIncidents += 1;
        produitMap.set(prodKey, current);

        const catKey = item.produit?.categorie ?? "Sans catégorie";
        const catCurrent = categorieMap.get(catKey) ?? { categorie: catKey, valeur: 0 };
        catCurrent.valeur += Number(item.valeur_totale ?? 0);
        categorieMap.set(catKey, catCurrent);

        const motifKey = item.motif ?? "autre";
        const motifCurrent = motifMap.get(motifKey) ?? { motif: motifKey, valeur: 0, color: "var(--color-error)" };
        motifCurrent.valeur += Number(item.valeur_totale ?? 0);
        motifMap.set(motifKey, motifCurrent);

        const month = monthLabel(item.date_declaration);
        const m = monthly.get(month) ?? { mois: month, valeur: 0, nb: 0 };
        m.valeur += Number(item.valeur_totale ?? 0);
        m.nb += 1;
        monthly.set(month, m);
    });

    const top = [...produitMap.values()].sort((a, b) => b.quantite - a.quantite)[0] ?? null;
    const categoriePlusTouchee = [...categorieMap.entries()].sort((a, b) => b[1].valeur - a[1].valeur)[0]?.[0] ?? "—";

    return {
        kpis: {
            valeurTotale,
            nbTotal,
            produitPlusToucheNom: top?.nom ?? "—",
            produitPlusToucheQty: top?.quantite ?? 0,
            categoriePlusTouchee,
        },
        evolutionMensuelle: [...monthly.values()],
        parMotif: [...motifMap.values()],
        tableau: [...produitMap.values()].sort((a, b) => b.quantite - a.quantite),
    };
}

export function useStatistiques(page) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tick, setTick] = useState(0);
    const abortRef = useRef(null);

    const refresh = useCallback(() => {
        cache.delete(`stats-${page}`);
        setTick((n) => n + 1);
    }, [page]);

    useEffect(() => {
        const token = { alive: true };
        abortRef.current = token;

        const cached = getCached(`stats-${page}`);
        if (cached) {
            setData(cached);
            setLoading(false);
            setError(null);
            return () => {
                token.alive = false;
            };
        }

        setLoading(true);
        setError(null);

        (async () => {
            try {
                if (!token.alive) return;

                if (page === "vueGenerale") {
                    const payload = await fetchStockStatistiques("vueGenerale");
                    const normalized = normalizeVueGenerale(payload);
                    setCached(`stats-${page}`, normalized);
                    if (token.alive) setData(normalized);
                } else if (page === "produits") {
                    const payload = await fetchStockStatistiques("produits");
                    const normalized = normalizeProduits(payload);
                    setCached(`stats-${page}`, normalized);
                    if (token.alive) setData(normalized);
                } else if (page === "stock") {
                    const [stockPayload, produitsPayload, vueGeneralePayload] = await Promise.all([
                        fetchStockStatistiques("stock"),
                        fetchStockProduits({ limit: 100 }),
                        fetchStockStatistiques("vueGenerale"),
                    ]);
                    const normalized = normalizeStock(
                        {
                            ...stockPayload,
                            evolution_stock: vueGeneralePayload?.evolutionValeurStock ?? vueGeneralePayload?.evolution_valeur_stock ?? [],
                        },
                        produitsPayload.items ?? produitsPayload
                    );
                    setCached(`stats-${page}`, normalized);
                    if (token.alive) setData(normalized);
                } else if (page === "reapprovisionnements") {
                    const [statsPayload, reapproPayload] = await Promise.all([
                        fetchStockStatistiques("reapprovisionnements"),
                        fetchStockRavitaillements({ limit: 100 }),
                    ]);
                    const normalized = normalizeRavitaillements(statsPayload, reapproPayload.items ?? []);
                    setCached(`stats-${page}`, normalized);
                    if (token.alive) setData(normalized);
                } else if (page === "pertes") {
                    const [statsPayload, pertesPayload] = await Promise.all([
                        fetchStockStatistiques("pertes"),
                        fetchStockPertes({ limit: 100 }),
                    ]);
                    const normalized = normalizePertes(statsPayload, pertesPayload.items ?? []);
                    setCached(`stats-${page}`, normalized);
                    if (token.alive) setData(normalized);
                } else {
                    throw new Error("Page de statistiques inconnue.");
                }
            } catch {
                if (token.alive) {
                    setError("Impossible de charger les statistiques.");
                }
            } finally {
                if (token.alive) setLoading(false);
            }
        })();

        return () => {
            token.alive = false;
        };
    }, [page, tick]);

    return { data, loading, error, refresh };
}

export function formatCompact(n) {
    if (n == null) return "—";
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + " M";
    if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + " k";
    return Number(n).toLocaleString("fr-FR");
}

export function formatFCFA(n) {
    if (n == null) return "—";
    return Number(n).toLocaleString("fr-FR") + " FCFA";
}

export function formatPct(n, showPlus = true) {
    if (n == null) return null;
    const sign = n > 0 && showPlus ? "+" : "";
    return `${sign}${Number(n).toFixed(1)} %`;
}
