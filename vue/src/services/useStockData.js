import { useState, useEffect, useCallback, useRef } from "react";
import { readCache, writeCache, clearCache } from "./stockCache.js";

/**
 * Hook SWR pour les listes du module Stock.
 *
 * Comportement :
 *  1. Lecture synchrone du localStorage → affichage immédiat si données présentes.
 *  2. Appel API en arrière-plan (toujours, sauf si cache mémoire récent < 5 min).
 *  3. Succès API  → mise à jour du localStorage + state.
 *  4. Erreur API  → erreur affichée ; les données obsolètes restent visibles.
 *
 * @param {() => Promise<any>} fetchFn  Fonction qui retourne les données fraîches.
 * @param {string}             cacheKey Clé de cache (unique par type de liste).
 * @returns {{ data, loading, error, refresh }}
 */

const memCache  = new Map();
const MEM_TTL   = 5 * 60 * 1000;

function memRead(key) {
    const entry = memCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > MEM_TTL) { memCache.delete(key); return null; }
    return entry.data;
}

function memWrite(key, data) {
    memCache.set(key, { data, ts: Date.now() });
}

export function useStockData(fetchFn, cacheKey) {
    const fetchRef = useRef(fetchFn);
    fetchRef.current = fetchFn;

    const [data,    setData]    = useState(() => readCache(cacheKey));
    const [loading, setLoading] = useState(() => !readCache(cacheKey));
    const [error,   setError]   = useState(null);
    const [tick,    setTick]    = useState(0);

    const refresh = useCallback(() => {
        clearCache(cacheKey);
        memCache.delete(cacheKey);
        setData(null);
        setLoading(true);
        setError(null);
        setTick(n => n + 1);
    }, [cacheKey]);

    useEffect(() => {
        // Cache mémoire récent : pas besoin de rappeler l'API dans la même session.
        const memHit = memRead(cacheKey);
        if (memHit) {
            setData(memHit);
            setLoading(false);
            return;
        }

        let alive = true;

        (async () => {
            try {
                const result = await fetchRef.current();
                if (!alive) return;
                memWrite(cacheKey, result);
                writeCache(cacheKey, result);
                setData(result);
                setError(null);
            } catch {
                if (alive) setError("Impossible de charger les données.");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; };
    }, [cacheKey, tick]);

    return { data, loading, error, refresh };
}
