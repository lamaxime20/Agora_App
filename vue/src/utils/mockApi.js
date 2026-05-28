const DEFAULT_DELAY = 450;

export class ApiError extends Error {
    constructor(message, { status = 500, code = 'API_ERROR', details = null } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

function delay(ms = DEFAULT_DELAY) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchMockJson(relativePath, { delayMs = DEFAULT_DELAY } = {}) {
    try {
        const response = await fetch(new URL(relativePath, import.meta.url));
        if (!response.ok) {
            throw new ApiError('La réponse simulée est inaccessible.', { status: response.status });
        }

        const payload = await response.json();
        await delay(payload.delay ?? delayMs);
        return payload;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError("Impossible de joindre la ressource simulée.", {
            status: 500,
            code: 'MOCK_FETCH_FAILED',
            details: error,
        });
    }
}

export function isUnauthorizedError(error) {
    return error?.status === 401 || error?.code === 'UNAUTHORIZED';
}

export function getApiErrorMessage(error, fallback = 'Une erreur est survenue.') {
    if (!error) return fallback;
    return error.message || fallback;
}

export function createApiErrorFromPayload(payload, fallbackMessage, fallbackStatus = 500) {
    if (payload?.ok === false) {
        return new ApiError(payload.message || fallbackMessage, {
            status: payload.status ?? fallbackStatus,
            code: payload.code || 'API_RESPONSE_ERROR',
            details: payload,
        });
    }

    return null;
}

export function ensureEmailFormat(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}
