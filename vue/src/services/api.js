import { ApiError } from '../utils/mockApi';

// ─── URL de base du backend ───────────────────────────────────────────────────
// Changez cette valeur pour pointer vers votre environnement (staging, production, etc.)

// export const BASE_URL = 'http://localhost:8000';
export const BASE_URL = 'https://agora-app-fm8r.onrender.com';

// ─── Client HTTP central ──────────────────────────────────────────────────────
// Toutes les requêtes vers l'API passent par cette fonction.
// Les cookies HTTPOnly (tokenAuth, tokenAuthorization) sont envoyés automatiquement
// grâce à credentials: 'include'.

export async function apiFetch(endpoint, { method = 'GET', body = null } = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    const config = {
        method,
        headers,
        credentials: 'include',
    };

    if (body !== null) {
        config.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(`${BASE_URL}/api/${endpoint}`, config);
    } catch {
        throw new ApiError('Impossible de joindre le serveur.', {
            status: 0,
            code: 'NETWORK_ERROR',
        });
    }

    let payload;
    try {
        payload = await response.json();
    } catch {
        throw new ApiError('La réponse du serveur est invalide.', {
            status: response.status,
            code: 'INVALID_RESPONSE',
        });
    }

    if (!response.ok) {
        const message = payload?.message || 'Une erreur est survenue.';
        throw new ApiError(message, {
            status: response.status,
            code: payload?.code || 'API_ERROR',
            details: payload,
        });
    }

    return payload;
}
