import loginData       from '../../mockups/admin/login.json';
import companyListData  from '../../mockups/admin/company-list.json';
import companyData      from '../../mockups/admin/company.json';
import productsData     from '../../mockups/admin/products.json';
import categoriesData   from '../../mockups/admin/categories.json';
import employeesData    from '../../mockups/admin/employees.json';
import adminsData       from '../../mockups/admin/admins.json';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

// ─── Rôles disponibles (hors directeur) ──────────────────────────────────────

export const ROLES_EMPLOYE = [
    { value: 'employe_stock',    label: 'Gestionnaire de stock' },
    { value: 'employe_ventes',   label: 'Responsable des ventes' },
    { value: 'employe_finances', label: 'Responsable finances' },
    { value: 'employe_livreur',  label: 'Livreur' },
    { value: 'employe_rh',       label: 'Responsable RH' },
];

export function getRoleLabel(value) {
    return ROLES_EMPLOYE.find(r => r.value === value)?.label ?? value;
}

// ─── Auth admin ───────────────────────────────────────────────────────────────

export async function loginAdminMock({ email, password }) {
    await delay();
    if (email === 'admin@agora.com') {
        return { ...loginData };
    }
    return { success: false, message: 'Email ou mot de passe incorrect.' };
}

export async function logoutAdminMock() {
    await delay(100);
    return { success: true };
}

// ─── Entreprise ───────────────────────────────────────────────────────────────

export async function getCompanyListMock() {
    await delay();
    return { ...companyListData };
}

export async function getCompanyMock() {
    await delay();
    return { ...companyData };
}

export async function updateCompanyMock(_id, _data) {
    await delay(400);
    return { success: true, message: "Entreprise mise à jour avec succès." };
}

export async function createCompanyAdminMock(data) {
    await delay(500);
    return {
        success: true,
        message: "Entreprise créée avec succès.",
        data: { id: Date.now(), ...data },
    };
}

// ─── Recherche utilisateur (choix directeur) ──────────────────────────────────

export async function searchUserByEmailMock(email) {
    await delay(300);
    const knownEmails = ['paul.durand@example.com', 'jean.dupont@agora.com'];
    const exists = knownEmails.includes(email);
    return {
        success: true,
        exists,
        user: exists ? { id: 10, nom: 'Durand', prenom: 'Paul', email } : null,
    };
}

export async function createDirecteurMock(data) {
    await delay(400);
    return { success: true, message: "Directeur créé avec succès.", defaultPassword: 'directeur237' };
}

// ─── Produits ─────────────────────────────────────────────────────────────────

export async function getProductsMock() {
    await delay();
    return { ...productsData };
}

export async function addProductMock(data) {
    await delay(500);
    return {
        success: true,
        message: 'Produit ajouté avec succès.',
        data: { id: Date.now(), ...data },
    };
}

export async function deleteProductMock(_id, password) {
    await delay(350);
    if (!password) return { success: false, message: 'Mot de passe requis.' };
    return { success: true, message: 'Produit supprimé avec succès.' };
}

// ─── Catégories ───────────────────────────────────────────────────────────────

export async function getCategoriesMock() {
    await delay();
    return { ...categoriesData };
}

export async function addCategorieMock(data) {
    await delay(350);
    return {
        success: true,
        message: 'Catégorie ajoutée avec succès.',
        data: { id: Date.now(), nb_produits: 0, ...data },
    };
}

export async function deleteCategorieMock(_id, password) {
    await delay(350);
    if (!password) return { success: false, message: 'Mot de passe requis.' };
    return { success: true, message: 'Catégorie supprimée avec succès.' };
}

// ─── Employés ─────────────────────────────────────────────────────────────────

export async function getEmployeesMock() {
    await delay();
    return { ...employeesData };
}

export async function checkEmailEmployeeMock(email) {
    await delay(200);
    const existants = ['jean.dupont@agora.com', 'marie.martin@agora.com', 'pierre.kamga@agora.com'];
    return { success: true, exists: existants.includes(email.toLowerCase()) };
}

export async function addEmployeeMock(_data) {
    await delay(450);
    return { success: true, message: 'Employé ajouté avec succès.' };
}

export async function updateEmployeeRoleMock(_id, _role, password) {
    await delay(300);
    if (!password) return { success: false, message: 'Mot de passe requis.' };
    return { success: true, message: 'Rôle mis à jour.' };
}

export async function removeEmployeeMock(_id, password) {
    await delay(300);
    if (!password) return { success: false, message: 'Mot de passe requis.' };
    return { success: true, message: 'Employé retiré avec succès.' };
}

// ─── Admins ───────────────────────────────────────────────────────────────────

export async function getAdminsMock() {
    await delay();
    return { ...adminsData };
}

export async function addAdminMock(_data) {
    await delay(450);
    return { success: true, message: 'Administrateur ajouté avec succès.' };
}

export async function resetAdminPasswordMock(_id) {
    await delay(300);
    return { success: true, message: 'Mot de passe réinitialisé.' };
}

export async function disableAdminMock(_id, password) {
    await delay(300);
    if (!password) return { success: false, message: 'Mot de passe requis.' };
    return { success: true, message: 'Administrateur désactivé.' };
}

// ─── Paramètres admin (self) ──────────────────────────────────────────────────

export async function changeAdminEmailMock(_email) {
    await delay(300);
    return { success: true, message: 'Adresse e-mail mise à jour.' };
}

export async function changeAdminSelfPasswordMock(_oldPassword, _newPassword) {
    await delay(300);
    return { success: true, message: 'Mot de passe mis à jour.' };
}

// ─── Réinitialisation mot de passe admin ──────────────────────────────────────

export async function sendAdminResetCodeMock(_data) {
    await delay(500);
    return { success: true, message: 'Code de réinitialisation envoyé.' };
}

export async function verifyAdminResetCodeMock(_data) {
    await delay(300);
    return { success: true, message: 'Code validé.' };
}

export async function resetAdminPasswordFromCodeMock(_data) {
    await delay(400);
    return { success: true, message: 'Mot de passe réinitialisé avec succès.' };
}
