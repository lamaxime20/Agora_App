import { apiFetch } from './api';

// GET /api/user/entreprises
export async function getEntreprises() {
    const payload = await apiFetch('user/entreprises');
    return payload.entreprises ?? [];
}
