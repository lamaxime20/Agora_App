import { useState, useEffect, useCallback, useRef } from "react";
import statistiquesData from "../mockups/gestionStocks/statistiques.json";

/* ─── Cache mémoire (5 min TTL) ──────────────────────────────────────────────── */

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

/* ─── Hook principal ──────────────────────────────────────────────────────────── */

export function useStatistiques(page) {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);
    const [tick, setTick]       = useState(0);
    const abortRef = useRef(null);

    const refresh = useCallback(() => {
        cache.delete(`stats-${page}`);
        setTick(n => n + 1);
    }, [page]);

    useEffect(() => {
        if (abortRef.current) abortRef.current = false;
        const active = { alive: true };
        abortRef.current = active;

        const cached = getCached(`stats-${page}`);
        if (cached) {
            setData(cached);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        const timer = setTimeout(() => {
            if (!active.alive) return;
            try {
                const raw = statistiquesData.data;
                const pageData = page === "vueGenerale"        ? raw.vueGenerale
                               : page === "produits"            ? raw.produits
                               : page === "stock"               ? raw.stock
                               : page === "reapprovisionnements"? raw.reapprovisionnements
                               : page === "pertes"              ? raw.pertes
                               : raw;
                setCached(`stats-${page}`, pageData);
                setData(pageData);
                setLoading(false);
            } catch {
                setError("Impossible de charger les statistiques.");
                setLoading(false);
            }
        }, 650);

        return () => {
            active.alive = false;
            clearTimeout(timer);
        };
    }, [page, tick]);

    return { data, loading, error, refresh };
}

/* ─── Helpers formatage ───────────────────────────────────────────────────────── */

export function formatCompact(n) {
    if (n == null) return "—";
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + " M";
    if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(0) + " k";
    return n.toLocaleString("fr-FR");
}

export function formatFCFA(n) {
    if (n == null) return "—";
    return n.toLocaleString("fr-FR") + " FCFA";
}

export function formatPct(n, showPlus = true) {
    if (n == null) return null;
    const sign = n > 0 && showPlus ? "+" : "";
    return `${sign}${n.toFixed(1)} %`;
}
