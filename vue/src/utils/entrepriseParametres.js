import { apiFetch } from '../services/api';

// GET /api/entreprise/parametres
export async function getEntrepriseParametresFromApi() {
    const payload = await apiFetch('entreprise/parametres');
    return payload.entreprise;
}

// PATCH /api/entreprise/parametres
export async function updateEntrepriseParametresFromApi(data) {
    const payload = await apiFetch('entreprise/parametres', {
        method: 'PATCH',
        body: data,
    });
    return payload.entreprise;
}
