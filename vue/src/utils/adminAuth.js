import { ApiError, ensureEmailFormat } from './mockApi';
import { isSessionExpired, createSessionTimeout, normalizeEmail } from './session';
import {
    loginAdminMock,
    logoutAdminMock,
    sendAdminResetCodeMock,
    verifyAdminResetCodeMock,
    resetAdminPasswordFromCodeMock,
} from '../services/admin/api';

const ADMIN_SESSION_KEY = 'admin_session';
const ADMIN_SESSION_FLAG = 'admin_active';

// ─── Session locale ───────────────────────────────────────────────────────────

export function saveAdminSession(session) {
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    window.sessionStorage.setItem(ADMIN_SESSION_FLAG, 'true');
}

export function clearAdminSession() {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    window.sessionStorage.removeItem(ADMIN_SESSION_FLAG);
    window.localStorage.removeItem('adminEntrepriseId');
}

export function getAdminSession() {
    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        clearAdminSession();
        return null;
    }
}

export function wasAdminSessionActive() {
    return window.sessionStorage.getItem(ADMIN_SESSION_FLAG) === 'true';
}

export function getAdminEntrepriseId() {
    return window.localStorage.getItem('adminEntrepriseId');
}

export function setAdminEntrepriseId(id) {
    window.localStorage.setItem('adminEntrepriseId', String(id));
}

export { isSessionExpired, createSessionTimeout };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildAdminSession(admin, tokenExpiration) {
    const expiresAt = tokenExpiration
        ? (Date.parse(tokenExpiration) || Date.now() + 24 * 60 * 60 * 1000)
        : Date.now() + 24 * 60 * 60 * 1000;
    return { admin, expiresAt };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAdminFromApi(credentials = {}) {
    const email    = normalizeEmail(credentials.email);
    const password = String(credentials.password || '');

    if (!ensureEmailFormat(email)) {
        throw new ApiError('Adresse e-mail invalide.', { status: 422, code: 'INVALID_EMAIL' });
    }

    const payload = await loginAdminMock({ email, password });

    if (!payload?.success) {
        throw new ApiError(payload?.message || 'Identifiants incorrects.', { status: 401, code: 'UNAUTHORIZED' });
    }

    const session = buildAdminSession(payload.admin, payload.tokenExpiration);
    saveAdminSession(session);
    return session;
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAdminFromApi() {
    await logoutAdminMock();
    clearAdminSession();
    return true;
}

// ─── Réinitialisation du mot de passe admin ───────────────────────────────────

export async function requestAdminPasswordResetCodeFromApi({ email }) {
    const normalizedEmail = normalizeEmail(email);

    if (!ensureEmailFormat(normalizedEmail)) {
        throw new ApiError("L'adresse e-mail est invalide.", { status: 422, code: 'INVALID_EMAIL' });
    }

    await sendAdminResetCodeMock({ email: normalizedEmail });

    return {
        ok: true,
        message: 'Un code de réinitialisation a été envoyé à votre adresse e-mail.',
        expiresAt: Date.now() + 60 * 60 * 1000,
        canResendAfterSeconds: 60,
    };
}

export async function verifyAdminPasswordResetCodeFromApi({ code, email }) {
    if (!email) {
        throw new ApiError("L'adresse e-mail est requise.", { status: 422, code: 'INVALID_EMAIL' });
    }

    const normalizedCode = String(code || '').replace(/\s/g, '');
    await verifyAdminResetCodeMock({ email, code: normalizedCode });

    return { ok: true, message: 'Code de réinitialisation validé.' };
}

export async function changeAdminPasswordFromApi({ email, password }) {
    if (!ensureEmailFormat(email) || !password) {
        throw new ApiError('Les données du formulaire sont incomplètes.', {
            status: 422,
            code: 'INVALID_PASSWORD_PAYLOAD',
        });
    }

    await resetAdminPasswordFromCodeMock({ email, password });

    return { ok: true, message: 'Mot de passe modifié avec succès.' };
}
