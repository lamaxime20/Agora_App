const PREFIX = "agora_ventes_";
const TTL    = 12 * 60 * 60 * 1000; // 12 h

export function readCache(key) {
    try {
        const raw = localStorage.getItem(PREFIX + key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > TTL) {
            localStorage.removeItem(PREFIX + key);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

export function writeCache(key, data) {
    try {
        localStorage.setItem(PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
    } catch {
        // quota dépassé ou mode privé — silencieux
    }
}

export function clearCache(key) {
    try {
        localStorage.removeItem(PREFIX + key);
    } catch {
        // silencieux
    }
}
