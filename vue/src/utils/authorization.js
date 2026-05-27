import choixRoleResponse from '../mockups/choixRole.json';
import logoutAuthorizationResponse from '../mockups/logoutAuthorization.json';
import recoverAuthorizationResponse from '../mockups/recoverAuthorization.json';

const SESSION_KEY = 'authorization_session';
const SESSION_ACTIVE_FLAG = 'authorization_active';
const SIMULATED_DELAY = 400;

function simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
}

function parseExpiration(user) {
    const raw = user?.expires_at ?? user?.expiration ?? user?.date_expiration;
    if (!raw) return null;
    const ts = Date.parse(raw);
    return Number.isNaN(ts) ? null : ts;
}

function buildSession(user) {
    const expiresAt = parseExpiration(user) ?? Date.now() + 24 * 60 * 60 * 1000;
    return { user, expiresAt };
}

export function saveAuthorizationSession(session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.sessionStorage.setItem(SESSION_ACTIVE_FLAG, 'true');
}

export function clearAuthorizationSession() {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_ACTIVE_FLAG);
}

export function getAuthorizationSession() {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        clearAuthorizationSession();
        return null;
    }
}

export function wasAuthorizationSessionActive() {
    return window.sessionStorage.getItem(SESSION_ACTIVE_FLAG) === 'true';
}

export function isSessionExpired(expiresAt) {
    if (!expiresAt) return true;
    return Date.now() >= expiresAt;
}

export function createSessionTimeout(expiresAt, onExpire) {
    const remaining = Math.max(expiresAt - Date.now(), 0);
    return window.setTimeout(onExpire, remaining);
}

export async function selectRoleFromApi() {
    await simulateDelay();

    if (!choixRoleResponse.ok) {
        throw new Error(choixRoleResponse.message || 'Échec de la sélection du rôle');
    }

    const session = buildSession(choixRoleResponse.user);
    saveAuthorizationSession(session);
    return session;
}

export async function logoutAuthorizationFromApi() {
    await simulateDelay();

    if (!logoutAuthorizationResponse.ok) {
        throw new Error(logoutAuthorizationResponse.message || 'Impossible de se déconnecter');
    }

    clearAuthorizationSession();
    return true;
}

export async function recoverAuthorizationSessionFromApi() {
    await simulateDelay();

    if (!recoverAuthorizationResponse.ok) {
        throw new Error(recoverAuthorizationResponse.message || "Impossible de récupérer la session d'autorisation");
    }

    const session = buildSession(recoverAuthorizationResponse.user);
    saveAuthorizationSession(session);
    return session;
}
