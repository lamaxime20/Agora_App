export class ApiError extends Error {
    constructor(message, { status = 500, code = 'API_ERROR', details = null } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
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
