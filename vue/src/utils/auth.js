import { apiFetch } from '../services/api';
import { ApiError, ensureEmailFormat } from './mockApi';
import { buildSession, createSessionTimeout, isSessionExpired, normalizeEmail, resetBrowserStorage } from './session';

const SESSION_KEY        = 'auth_session';
const SESSION_ACTIVE_FLAG = 'auth_active';

// ─── Session locale ───────────────────────────────────────────────────────────

export function saveAuthSession(session) {
    resetBrowserStorage();
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.sessionStorage.setItem(SESSION_ACTIVE_FLAG, 'true');
}

export function clearAuthSession() {
    resetBrowserStorage();
}

export function getAuthSession() {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        clearAuthSession();
        return null;
    }
}

export function wasAuthSessionActive() {
    return window.sessionStorage.getItem(SESSION_ACTIVE_FLAG) === 'true';
}

export { isSessionExpired, createSessionTimeout };

// ─── Auth ─────────────────────────────────────────────────────────────────────

// POST /api/auth/login
export async function loginAuthFromApi(credentials = {}) {
    const email    = normalizeEmail(credentials.email);
    const password = String(credentials.password || '');

    if (!ensureEmailFormat(email)) {
        throw new ApiError('Adresse e-mail invalide.', { status: 422, code: 'INVALID_EMAIL' });
    }

    const payload = await apiFetch('auth/login', { method: 'POST', body: { email, password } });

    const user = payload?.user;
    if (!user) {
        throw new ApiError('Réponse invalide du serveur.', { status: 500, code: 'INVALID_RESPONSE' });
    }

    const session = buildSession(user);
    saveAuthSession(session);
    return session;
}

// POST /api/auth/logout
export async function logoutAuthFromApi() {
    await apiFetch('auth/logout', { method: 'POST' });
    clearAuthSession();
    return true;
}

// GET /api/auth/me
export async function recoverAuthSessionFromApi() {
    const payload = await apiFetch('auth/me');
    const user = payload?.user;
    if (!user) {
        throw new ApiError("Impossible de récupérer la session.", { status: 500, code: 'INVALID_RESPONSE' });
    }
    return buildSession(user);
}

// ─── Inscription ──────────────────────────────────────────────────────────────

// POST /api/auth/signup/check-email
// Le code de vérification est envoyé par e-mail — il n'est pas retourné dans la réponse.
export async function requestSignupCodeFromApi({ prenom, nom, email }) {
    const normalizedEmail = normalizeEmail(email);

    if (!ensureEmailFormat(normalizedEmail)) {
        throw new ApiError("L'adresse e-mail est invalide.", { status: 422, code: 'INVALID_EMAIL' });
    }

    await apiFetch('auth/signup/check-email', {
        method: 'POST',
        body: { nom, prenom, email: normalizedEmail },
    });

    return {
        ok: true,
        message: 'Un code de vérification a été envoyé à votre adresse e-mail.',
        user: { prenom, nom, email: normalizedEmail },
        expiresAt: Date.now() + 10 * 60 * 1000,
        canResendAfterSeconds: 60,
    };
}

// POST /api/auth/signup/verify-code
export async function verifySignupCodeFromApi({ code, email, draft }) {
    const targetEmail = email || draft?.user?.email || draft?.email;

    if (!targetEmail) {
        throw new ApiError("L'adresse e-mail est requise.", { status: 422, code: 'INVALID_EMAIL' });
    }

    const normalizedCode = String(code || '').replace(/\s/g, '');

    await apiFetch('auth/signup/verify-code', {
        method: 'POST',
        body: { email: targetEmail, code: normalizedCode },
    });

    return { ok: true, message: 'Code de vérification validé.' };
}

// POST /api/auth/signup
export async function createSignupAccountFromApi({ prenom, nom, email, password }) {
    if (!prenom?.trim() || !nom?.trim() || !ensureEmailFormat(email) || !password) {
        throw new ApiError('Les données du formulaire sont incomplètes.', {
            status: 422,
            code: 'INVALID_SIGNUP_PAYLOAD',
        });
    }

    const payload = await apiFetch('auth/signup', {
        method: 'POST',
        body: { nom, prenom, email, password },
    });

    return {
        ok: true,
        message: payload.message || 'Compte créé avec succès.',
        user: payload.user,
    };
}

// ─── Réinitialisation du mot de passe ─────────────────────────────────────────

// POST /api/auth/password/send-code
// Le code est envoyé par e-mail — il n'est pas retourné dans la réponse.
export async function requestPasswordResetCodeFromApi({ email }) {
    const normalizedEmail = normalizeEmail(email);

    if (!ensureEmailFormat(normalizedEmail)) {
        throw new ApiError("L'adresse e-mail est invalide.", { status: 422, code: 'INVALID_EMAIL' });
    }

    await apiFetch('auth/password/send-code', {
        method: 'POST',
        body: { email: normalizedEmail },
    });

    return {
        ok: true,
        message: 'Un code de réinitialisation a été envoyé à votre adresse e-mail.',
        expiresAt: Date.now() + 60 * 60 * 1000,
        canResendAfterSeconds: 60,
    };
}

// POST /api/auth/password/verify-code
export async function verifyPasswordResetCodeFromApi({ code, email, draft }) {
    const targetEmail = email || draft?.email;

    if (!targetEmail) {
        throw new ApiError("L'adresse e-mail est requise.", { status: 422, code: 'INVALID_EMAIL' });
    }

    const normalizedCode = String(code || '').replace(/\s/g, '');

    await apiFetch('auth/password/verify-code', {
        method: 'POST',
        body: { email: targetEmail, code: normalizedCode },
    });

    return { ok: true, message: 'Code de réinitialisation validé.' };
}

// POST /api/auth/password/reset
export async function changePasswordFromApi({ email, password }) {
    if (!ensureEmailFormat(email) || !password) {
        throw new ApiError('Les données du formulaire sont incomplètes.', {
            status: 422,
            code: 'INVALID_PASSWORD_PAYLOAD',
        });
    }

    await apiFetch('auth/password/reset', {
        method: 'POST',
        body: { email, password, password_confirmation: password },
    });

    return { ok: true, message: 'Mot de passe modifié avec succès.' };
}
