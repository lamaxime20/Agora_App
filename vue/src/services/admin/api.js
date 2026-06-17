const API_BASE = '/api';

// ─── Helper fetch ─────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
    const { body, headers: extraHeaders, ...rest } = options;

    const res = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...extraHeaders,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        ...rest,
    });

    const json = await res.json();

    if (!res.ok) {
        const err = new Error(json.message || 'Une erreur est survenue.');
        err.code   = json.code;
        err.status = res.status;
        err.errors = json.errors;
        throw err;
    }

    return json;
}

function getEntrepriseId() {
    return localStorage.getItem('adminEntrepriseId');
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ─── Rôles disponibles (valeurs exactes de roles_utilisateur.role en DB) ──────

export const ROLES_EMPLOYE = [
    { value: 'employe_gestion_stock', label: 'Gestionnaire de stock' },
    { value: 'employe_vente',         label: 'Responsable des ventes' },
    { value: 'employe_finances',      label: 'Responsable finances' },
    { value: 'employe_livraison',     label: 'Livreur' },
    { value: 'employe_rh',            label: 'Responsable RH' },
];

export function getRoleLabel(value) {
    return ROLES_EMPLOYE.find(r => r.value === value)?.label ?? value;
}

// ─── Auth admin ───────────────────────────────────────────────────────────────

export async function loginAdminMock({ email, password }) {
    const data = await apiFetch('/admin/auth/login', {
        method: 'POST',
        body: { email, password },
    });
    // Transforme la réponse réelle vers le format attendu par adminAuth.js
    return {
        success:          true,
        admin:            data.admin,
        tokenExpiration:  data.admin?.expires_at,
    };
}

export async function logoutAdminMock() {
    await apiFetch('/admin/auth/logout', { method: 'POST' });
    return { success: true };
}

// ─── Entreprises ──────────────────────────────────────────────────────────────

export async function getCompanyListMock() {
    return apiFetch('/admin/entreprises');
}

export async function getCompanyMock(id) {
    return apiFetch(`/admin/entreprises/${id}`);
}

export async function updateCompanyMock(id, data) {
    return apiFetch(`/admin/entreprises/${id}`, {
        method: 'PUT',
        body: data,
    });
}

export async function createCompanyAdminMock(data) {
    let logoPayload = data.logo;
    if (logoPayload instanceof File) {
        logoPayload = await fileToBase64(logoPayload);
    }
    return apiFetch('/admin/entreprises', {
        method: 'POST',
        body: { ...data, logo: logoPayload },
    });
}

// ─── Recherche utilisateur & création directeur ───────────────────────────────

export async function searchUserByEmailMock(email) {
    return apiFetch(`/admin/utilisateurs/recherche?email=${encodeURIComponent(email)}`);
}

export async function createDirecteurMock(data) {
    return apiFetch('/admin/directeurs', {
        method: 'POST',
        body: data,
    });
}

// ─── Produits ─────────────────────────────────────────────────────────────────

export async function getProductsMock() {
    const id = getEntrepriseId();
    return apiFetch(`/admin/entreprises/${id}/produits`);
}

export async function addProductMock(data) {
    const id = getEntrepriseId();
    let imagePayload = data.image;
    if (imagePayload instanceof File) {
        imagePayload = await fileToBase64(imagePayload);
    }
    return apiFetch(`/admin/entreprises/${id}/produits`, {
        method: 'POST',
        body: { ...data, image: imagePayload },
    });
}

export async function deleteProductMock(produitId, password) {
    const id = getEntrepriseId();
    return apiFetch(`/admin/entreprises/${id}/produits/${produitId}`, {
        method: 'DELETE',
        body: { password },
    });
}

// ─── Catégories ───────────────────────────────────────────────────────────────

export async function getCategoriesMock() {
    const id = getEntrepriseId();
    return apiFetch(`/admin/entreprises/${id}/categories`);
}

export async function addCategorieMock(data) {
    const id = getEntrepriseId();
    return apiFetch(`/admin/entreprises/${id}/categories`, {
        method: 'POST',
        body: data,
    });
}

export async function deleteCategorieMock(categorieId, password) {
    const id = getEntrepriseId();
    return apiFetch(`/admin/entreprises/${id}/categories/${categorieId}`, {
        method: 'DELETE',
        body: { password },
    });
}

// ─── Employés ─────────────────────────────────────────────────────────────────

export async function getEmployeesMock() {
    const id = getEntrepriseId();
    return apiFetch(`/admin/entreprises/${id}/employes`);
}

export async function checkEmailEmployeeMock(email) {
    const id = getEntrepriseId();
    return apiFetch(`/admin/entreprises/${id}/employes/check-email`, {
        method: 'POST',
        body: { email },
    });
}

export async function addEmployeeMock(data) {
    const id = getEntrepriseId();
    return apiFetch(`/admin/entreprises/${id}/employes`, {
        method: 'POST',
        body: data,
    });
}

export async function updateEmployeeRoleMock(utilisateurId, role, password) {
    const id = getEntrepriseId();
    return apiFetch(`/admin/entreprises/${id}/employes/${utilisateurId}/role`, {
        method: 'PATCH',
        body: { role, password },
    });
}

export async function removeEmployeeMock(utilisateurId, password) {
    const id = getEntrepriseId();
    return apiFetch(`/admin/entreprises/${id}/employes/${utilisateurId}`, {
        method: 'DELETE',
        body: { password },
    });
}

// ─── Admins ───────────────────────────────────────────────────────────────────

export async function getAdminsMock() {
    return apiFetch('/admin/admins');
}

export async function addAdminMock(data) {
    return apiFetch('/admin/admins', {
        method: 'POST',
        body: data,
    });
}

export async function resetAdminPasswordMock(adminId) {
    return apiFetch(`/admin/admins/${adminId}/reinitialiser-mot-de-passe`, {
        method: 'POST',
    });
}

export async function disableAdminMock(adminId, password) {
    return apiFetch(`/admin/admins/${adminId}/desactiver`, {
        method: 'PATCH',
        body: { password },
    });
}

// ─── Paramètres admin (self) ──────────────────────────────────────────────────

export async function changeAdminEmailMock(email) {
    return apiFetch('/admin/parametres/email', {
        method: 'PATCH',
        body: { email },
    });
}

export async function changeAdminSelfPasswordMock(password_actuel, password) {
    return apiFetch('/admin/parametres/mot-de-passe', {
        method: 'PATCH',
        body: { password_actuel, password, password_confirmation: password },
    });
}

// ─── Réinitialisation mot de passe (flux oubli de mot de passe) ──────────────

export async function sendAdminResetCodeMock({ email }) {
    return apiFetch('/admin/auth/password/send-code', {
        method: 'POST',
        body: { email },
    });
}

export async function verifyAdminResetCodeMock({ email, code }) {
    return apiFetch('/admin/auth/password/verify-code', {
        method: 'POST',
        body: { email, code },
    });
}

export async function resetAdminPasswordFromCodeMock({ email, password }) {
    return apiFetch('/admin/auth/password/reset', {
        method: 'POST',
        body: { email, password, password_confirmation: password },
    });
}
