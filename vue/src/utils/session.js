const SESSION_RESET_EVENT = 'agora:session-reset';

export function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

export function parseSessionExpiration(user) {
    const rawExpiration = user?.expires_at ?? user?.expiration ?? user?.date_expiration ?? user?.expiresAt;
    if (!rawExpiration) return null;

    const timestamp = Date.parse(rawExpiration);
    return Number.isNaN(timestamp) ? null : timestamp;
}

export function buildSession(user) {
    const expiresAt = parseSessionExpiration(user) ?? Date.now() + 24 * 60 * 60 * 1000;
    return { user, expiresAt };
}

export function isSessionExpired(expiresAt) {
    if (!expiresAt) return true;
    return Date.now() >= expiresAt;
}

export function createSessionTimeout(expiresAt, onExpire) {
    const remaining = Math.max(expiresAt - Date.now(), 0);
    return window.setTimeout(onExpire, remaining);
}

export function emitSessionReset() {
    window.dispatchEvent(new CustomEvent(SESSION_RESET_EVENT));
}

export function onSessionReset(handler) {
    window.addEventListener(SESSION_RESET_EVENT, handler);
    return () => window.removeEventListener(SESSION_RESET_EVENT, handler);
}

export function resetBrowserStorage() {
    window.localStorage.clear();
    window.sessionStorage.clear();
    emitSessionReset();
}

