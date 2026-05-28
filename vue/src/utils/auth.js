import { ApiError, createApiErrorFromPayload, ensureEmailFormat, fetchMockJson } from './mockApi';
import { buildSession, createSessionTimeout, isSessionExpired, normalizeEmail, resetBrowserStorage } from './session';

const SESSION_KEY = 'auth_session';
const SESSION_ACTIVE_FLAG = 'auth_active';

function parseUserSession(payload, fallbackMessage) {
    const error = createApiErrorFromPayload(payload, fallbackMessage);
    if (error) throw error;

    const user = payload?.user ?? payload?.session?.user ?? payload?.data?.user;
    if (!user) {
        throw new ApiError(fallbackMessage, { status: 500, code: 'INVALID_MOCK_PAYLOAD' });
    }

    return buildSession(user);
}

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

export async function loginAuthFromApi(credentials = {}) {
    const payload = await fetchMockJson('../mockups/auth-login.json');
    const email = normalizeEmail(credentials.email);
    const password = String(credentials.password || '');

    if (!ensureEmailFormat(email)) {
        throw new ApiError('Adresse e-mail invalide.', { status: 422, code: 'INVALID_EMAIL' });
    }

    const users = Array.isArray(payload.users) ? payload.users : [];
    const matchingUser = users.find(user => normalizeEmail(user.email) === email);

    if (!matchingUser || matchingUser.password !== password) {
        throw new ApiError(payload.invalidCredentialsMessage || "Identifiants incorrects.", {
            status: 422,
            code: 'INVALID_CREDENTIALS',
        });
    }

    if (matchingUser.isArchived) {
        throw new ApiError(payload.archivedMessage || "Ce compte est archivé.", {
            status: 403,
            code: 'ACCOUNT_ARCHIVED',
        });
    }

    const sessionUser = {
        email: matchingUser.email,
        nom: matchingUser.nom,
        prenom: matchingUser.prenom,
        expires_at: matchingUser.expires_at ?? payload.user?.expires_at,
    };

    const session = buildSession(sessionUser);
    saveAuthSession(session);
    return session;
}

export async function logoutAuthFromApi() {
    const payload = await fetchMockJson('../mockups/auth-logout.json');
    const error = createApiErrorFromPayload(payload, 'Impossible de se déconnecter.');
    if (error) throw error;

    clearAuthSession();
    return true;
}

export async function recoverAuthSessionFromApi() {
    const payload = await fetchMockJson('../mockups/auth-recover.json');
    const error = createApiErrorFromPayload(payload, "Impossible de récupérer la session.");
    if (error) throw error;

    return parseUserSession(payload, "Impossible de récupérer la session.");
}

export async function requestSignupCodeFromApi({ prenom, nom, email }) {
    const payload = await fetchMockJson('../mockups/signup-check-email.json');
    const normalizedEmail = normalizeEmail(email);

    if (!ensureEmailFormat(normalizedEmail)) {
        throw new ApiError("L'adresse e-mail est invalide.", { status: 422, code: 'INVALID_EMAIL' });
    }

    const activeUsers = Array.isArray(payload.activeUsers) ? payload.activeUsers : [];
    const archivedUsers = Array.isArray(payload.archivedUsers) ? payload.archivedUsers : [];
    const activeMatch = activeUsers.find(user => normalizeEmail(user.email) === normalizedEmail);
    const archivedMatch = archivedUsers.find(user => normalizeEmail(user.email) === normalizedEmail);

    if (activeMatch && !archivedMatch) {
        throw new ApiError(payload.takenMessage || 'Un compte actif existe déjà avec cette adresse e-mail.', {
            status: 409,
            code: 'EMAIL_ALREADY_USED',
        });
    }

    const code = String(payload.verificationCode || '246810');
    const expiresAt = Date.now() + (Number(payload.codeExpiresInMinutes || 10) * 60 * 1000);

    return {
        ok: true,
        message: payload.message || 'Code de vérification envoyé.',
        user: {
            prenom,
            nom,
            email: normalizedEmail,
        },
        verificationCode: code,
        expiresAt,
        canResendAfterSeconds: Number(payload.canResendAfterSeconds || 60),
    };
}

export async function verifySignupCodeFromApi({ code, draft }) {
    const payload = await fetchMockJson('../mockups/signup-verify-code.json');
    const error = createApiErrorFromPayload(payload, 'Code de vérification invalide.');
    if (error) throw error;

    const expectedCode = String(payload.verificationCode || '246810');
    const normalizedCode = String(code || '').replace(/\s/g, '');

    if (draft?.expiresAt && Date.now() > draft.expiresAt) {
        throw new ApiError(payload.expiredMessage || 'Le code de vérification a expiré.', {
            status: 410,
            code: 'CODE_EXPIRED',
        });
    }

    if (normalizedCode !== expectedCode) {
        throw new ApiError(payload.invalidMessage || 'Le code de vérification est incorrect.', {
            status: 422,
            code: 'INVALID_CODE',
        });
    }

    return {
        ok: true,
        message: payload.message || 'Code de vérification validé.',
    };
}

export async function createSignupAccountFromApi({ prenom, nom, email, password }) {
    const payload = await fetchMockJson('../mockups/signup-create-account.json');
    const error = createApiErrorFromPayload(payload, 'Impossible de créer le compte.');
    if (error) throw error;

    if (!prenom?.trim() || !nom?.trim() || !ensureEmailFormat(email) || !password) {
        throw new ApiError('Les données du formulaire sont incomplètes.', {
            status: 422,
            code: 'INVALID_SIGNUP_PAYLOAD',
        });
    }

    return {
        ok: true,
        message: payload.message || 'Compte créé avec succès.',
        user: {
            email,
            nom,
            prenom,
            expires_at: payload.user?.expires_at ?? payload.expires_at,
        },
    };
}

export async function requestPasswordResetCodeFromApi({ email }) {
    const payload = await fetchMockJson('../mockups/password-send-code.json');
    const normalizedEmail = normalizeEmail(email);

    if (!ensureEmailFormat(normalizedEmail)) {
        throw new ApiError("L'adresse e-mail est invalide.", { status: 422, code: 'INVALID_EMAIL' });
    }

    const activeUsers = Array.isArray(payload.activeUsers) ? payload.activeUsers : [];
    const activeMatch = activeUsers.find(user => normalizeEmail(user.email) === normalizedEmail);

    if (!activeMatch) {
        throw new ApiError(payload.unknownEmailMessage || "Aucun compte actif n'existe avec cette adresse e-mail.", {
            status: 404,
            code: 'EMAIL_NOT_FOUND',
        });
    }

    const code = String(payload.verificationCode || '246810');
    const expiresAt = Date.now() + (Number(payload.codeExpiresInMinutes || 60) * 60 * 1000);

    return {
        ok: true,
        message: payload.message || 'Code de réinitialisation envoyé.',
        verificationCode: code,
        expiresAt,
        canResendAfterSeconds: Number(payload.canResendAfterSeconds || 60),
    };
}

export async function verifyPasswordResetCodeFromApi({ code, draft }) {
    const payload = await fetchMockJson('../mockups/password-verify-code.json');
    const error = createApiErrorFromPayload(payload, 'Code de réinitialisation invalide.');
    if (error) throw error;

    const expectedCode = String(payload.verificationCode || '246810');
    const normalizedCode = String(code || '').replace(/\s/g, '');

    if (draft?.expiresAt && Date.now() > draft.expiresAt) {
        throw new ApiError(payload.expiredMessage || 'Le code de réinitialisation a expiré.', {
            status: 410,
            code: 'CODE_EXPIRED',
        });
    }

    if (normalizedCode !== expectedCode) {
        throw new ApiError(payload.invalidMessage || 'Le code de réinitialisation est incorrect.', {
            status: 422,
            code: 'INVALID_CODE',
        });
    }

    return {
        ok: true,
        message: payload.message || 'Code de réinitialisation validé.',
    };
}

export async function changePasswordFromApi({ email, password }) {
    const payload = await fetchMockJson('../mockups/password-change.json');
    const error = createApiErrorFromPayload(payload, 'Impossible de modifier le mot de passe.');
    if (error) throw error;

    if (!ensureEmailFormat(email) || !password) {
        throw new ApiError('Les données du formulaire sont incomplètes.', {
            status: 422,
            code: 'INVALID_PASSWORD_PAYLOAD',
        });
    }

    return {
        ok: true,
        message: payload.message || 'Mot de passe modifié avec succès.',
    };
}
