import { apiFetch } from '../services/api';
import { ApiError } from './mockApi';
import { buildSession, createSessionTimeout, isSessionExpired, resetBrowserStorage } from './session';

const SESSION_KEY        = 'authorization_session';
const SESSION_ACTIVE_FLAG = 'authorization_active';

// ─── Session locale ───────────────────────────────────────────────────────────

export function saveAuthorizationSession(session) {
    resetBrowserStorage();
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.sessionStorage.setItem(SESSION_ACTIVE_FLAG, 'true');
}

export function clearAuthorizationSession() {
    resetBrowserStorage();
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

export { isSessionExpired, createSessionTimeout };

// ─── Entreprises ──────────────────────────────────────────────────────────────

// GET /api/user/entreprises
export async function getEntreprisesFromApi() {
    const payload = await apiFetch('user/entreprises');
    return payload.entreprises ?? [];
}

// ─── Sélection de rôle ────────────────────────────────────────────────────────

// POST /api/auth/select-role
export async function selectRoleFromApi({ entrepriseId, roleId }) {
    const payload = await apiFetch('auth/select-role', {
        method: 'POST',
        body: { entreprise_id: entrepriseId, role_id: roleId },
    });

    const user = payload?.user;
    if (!user) {
        throw new ApiError('Sélection de rôle invalide.', { status: 500, code: 'INVALID_RESPONSE' });
    }

    const session = buildSession(user);
    saveAuthorizationSession(session);
    return session;
}

// ─── Déconnexion et récupération de session ───────────────────────────────────

// POST /api/auth/logout/application
export async function logoutAuthorizationFromApi() {
    await apiFetch('auth/logout/application', { method: 'POST' });
    clearAuthorizationSession();
    return true;
}

// GET /api/auth/me/application
export async function recoverAuthorizationSessionFromApi() {
    const payload = await apiFetch('auth/me/application');
    const user = payload?.user;
    if (!user) {
        throw new ApiError("Impossible de récupérer la session d'autorisation.", {
            status: 500,
            code: 'INVALID_RESPONSE',
        });
    }
    return buildSession(user);
}
