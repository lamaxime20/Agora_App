const SESSION_STORAGE_KEY = "auth_session";

function parseBackendExpiration(user) {
    const backendExpiration = user?.expires_at ?? user?.expiration ?? user?.date_expiration;

    if (!backendExpiration) {
        return null;
    }

    const expiresAt = Date.parse(backendExpiration);

    return Number.isNaN(expiresAt) ? null : expiresAt;
}

function buildSession(user) {
    const expiresAt = parseBackendExpiration(user)
        ?? Date.now() + (user.jour_expiration * 24 * 60 * 60 * 1000);

    return {
        user,
        expiresAt,
    };
}

function saveSession(session) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getSessionSnapshot() {
    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (!rawSession) {
        return null;
    }

    try {
        return JSON.parse(rawSession);
    } catch {
        clearSession();
        return null;
    }
}

export function isSessionExpired(expiresAt) {
    if (!expiresAt) {
        return true;
    }

    return Date.now() >= expiresAt;
}

export function createSessionTimeout(expiresAt, onExpire) {
    const remainingTime = Math.max(expiresAt - Date.now(), 0);

    return window.setTimeout(() => {
        clearSession();
        onExpire();
    }, remainingTime);
}

export async function loginAuthFromAPI(credentials) {
    // Simulate an API call for authentication
    try {
        const response = await fetch("../mockups/auth.json");

        if(!response.ok) {
            const error = response.json().message || "Failed to authenticate";
            throw new Error(error);
        }

        const user = await response.json().user;
        const session = buildSession(user);
        saveSession(session);
        return session;
    } catch (error) {
        throw error;
    }
}

export async function logoutAuthFromDatabase() {
    // Simulate an API call for logging out
    try {
        const response = await fetch("../mockups/logoutAuth.json");

        if(!response.ok) {
            const error = response.json().message || "Failed to logout";
            throw new Error(error);
        }

        clearSession();
        return true;
    } catch (error) {
        throw error;
    }
}