import { ApiError, createApiErrorFromPayload, fetchMockJson } from './mockApi';
import { buildSession, createSessionTimeout, isSessionExpired, resetBrowserStorage } from './session';

const SESSION_KEY = 'authorization_session';
const SESSION_ACTIVE_FLAG = 'authorization_active';

function parseAuthorizationSession(payload, fallbackMessage) {
    const error = createApiErrorFromPayload(payload, fallbackMessage);
    if (error) throw error;

    const user = payload?.user ?? payload?.session?.user ?? payload?.data?.user;
    if (!user) {
        throw new ApiError(fallbackMessage, { status: 500, code: 'INVALID_MOCK_PAYLOAD' });
    }

    return buildSession(user);
}

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

export async function getEntreprisesFromApi() {
    const payload = await fetchMockJson('../mockups/entreprises.json');
    const error = createApiErrorFromPayload(payload, 'Impossible de charger vos entreprises.');
    if (error) throw error;

    return payload.entreprises ?? [];
}

export async function selectRoleFromApi({ entrepriseId, roleId }) {
    const payload = await fetchMockJson('../mockups/choixRole.json');
    const error = createApiErrorFromPayload(payload, 'Échec de la sélection du rôle.');
    if (error) throw error;

    const companies = Array.isArray(payload.entreprises) ? payload.entreprises : [];
    const selectedCompany = companies.find(company => company.id === entrepriseId);
    const selectedRole = selectedCompany?.roles?.find(role => role.id === roleId);

    if (!selectedCompany || !selectedRole) {
        throw new ApiError(payload.invalidSelectionMessage || 'Le rôle demandé est introuvable.', {
            status: 422,
            code: 'INVALID_ROLE_SELECTION',
        });
    }

    const session = parseAuthorizationSession(payload, 'Échec de la sélection du rôle.');
    saveAuthorizationSession(session);
    return session;
}

export async function logoutAuthorizationFromApi() {
    const payload = await fetchMockJson('../mockups/logoutAuthorization.json');
    const error = createApiErrorFromPayload(payload, 'Impossible de se déconnecter.');
    if (error) throw error;

    clearAuthorizationSession();
    return true;
}

export async function recoverAuthorizationSessionFromApi() {
    const payload = await fetchMockJson('../mockups/recoverAuthorization.json');
    const error = createApiErrorFromPayload(payload, "Impossible de récupérer la session d'autorisation.");
    if (error) throw error;

    return parseAuthorizationSession(payload, "Impossible de récupérer la session d'autorisation.");
}
