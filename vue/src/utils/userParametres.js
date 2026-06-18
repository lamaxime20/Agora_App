import { apiFetch } from '../services/api';
import { ApiError, ensureEmailFormat } from './mockApi';

// PATCH /api/user/parametres/email
export async function updateEmailFromApi({ email }) {
    if (!ensureEmailFormat(email)) {
        throw new ApiError('Adresse e-mail invalide.', { status: 422, code: 'INVALID_EMAIL' });
    }

    const payload = await apiFetch('user/parametres/email', {
        method: 'PATCH',
        body: { email },
    });

    return { ok: true, email: payload.email };
}

// PATCH /api/user/parametres/mot-de-passe
export async function updatePasswordFromApi({ password_actuel, password, password_confirmation }) {
    if (!password_actuel || !password || !password_confirmation) {
        throw new ApiError('Tous les champs sont requis.', { status: 422, code: 'MISSING_FIELDS' });
    }

    await apiFetch('user/parametres/mot-de-passe', {
        method: 'PATCH',
        body: { password_actuel, password, password_confirmation },
    });

    return { ok: true };
}
