const SIGNUP_DRAFT_KEY = 'signup_draft';

export function saveSignupDraft(data) {
    try {
        window.localStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(data));
    } catch {
        // ignore storage errors
    }
}

export function getSignupDraft() {
    try {
        const raw = window.localStorage.getItem(SIGNUP_DRAFT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function clearSignupDraft() {
    window.localStorage.removeItem(SIGNUP_DRAFT_KEY);
}

export function validateSignupInfo({ prenom, nom, email }) {
    const errors = {};

    if (!prenom?.trim()) errors.prenom = 'Le prénom est requis.';
    else if (prenom.trim().length < 2) errors.prenom = 'Au moins 2 caractères.';

    if (!nom?.trim()) errors.nom = 'Le nom est requis.';
    else if (nom.trim().length < 2) errors.nom = 'Au moins 2 caractères.';

    if (!email?.trim()) errors.email = "L'adresse e-mail est requise.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Adresse e-mail invalide.';

    return errors;
}

export function validatePassword(password, confirm) {
    const errors = {};

    if (!password) errors.password = 'Le mot de passe est requis.';
    else if (password.length < 8) errors.password = 'Au moins 8 caractères requis.';

    if (!confirm) errors.confirm = 'Veuillez confirmer votre mot de passe.';
    else if (password !== confirm) errors.confirm = 'Les mots de passe ne correspondent pas.';

    return errors;
}

export function getPasswordStrength(password) {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) score++;
    return Math.min(score, 3);
}

export function simulateSignupStep(ms = 700) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
