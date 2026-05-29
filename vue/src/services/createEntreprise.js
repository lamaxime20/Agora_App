import mockResponse from '../mockups/create-entreprise.json';

// ─── Constantes métier ─────────────────────────────────────────────────────────

export const SECTEURS = [
    'Agriculture & Élevage',
    'Alimentation & Restauration',
    "Artisanat & Métiers d'art",
    'BTP & Construction',
    'Commerce de détail',
    'Commerce de gros',
    'Communication & Marketing',
    'Conseil & Services aux entreprises',
    'Culture & Divertissement',
    'Éducation & Formation',
    'Énergie & Environnement',
    'Finance & Assurance',
    'Hôtellerie & Tourisme',
    'Immobilier',
    'Import & Export',
    'Industrie & Manufacture',
    'Informatique & Technologie',
    'Logistique & Transport',
    'Mode & Textile',
    'ONG & Associations',
    'Pharmacie & Santé',
    'Services à la personne',
    'Télécommunications',
    'Autre',
];

export const PAYS = [
    'Cameroun',
    "Côte d'Ivoire",
    'Sénégal',
    'Mali',
    'Burkina Faso',
    'Niger',
    'Tchad',
    'Congo',
    'RDC',
    'Gabon',
    'Bénin',
    'Togo',
    'Guinée',
    'Madagascar',
    'Maroc',
    'Algérie',
    'Tunisie',
    'Égypte',
    'France',
    'Belgique',
    'Canada',
    'États-Unis',
    'Autre',
];

export const PREFIXES_TELEPHONE = [
    { code: '+237', pays: 'Cameroun' },
    { code: '+225', pays: "Côte d'Ivoire" },
    { code: '+221', pays: 'Sénégal' },
    { code: '+223', pays: 'Mali' },
    { code: '+226', pays: 'Burkina Faso' },
    { code: '+227', pays: 'Niger' },
    { code: '+235', pays: 'Tchad' },
    { code: '+242', pays: 'Congo' },
    { code: '+243', pays: 'RDC' },
    { code: '+241', pays: 'Gabon' },
    { code: '+229', pays: 'Bénin' },
    { code: '+228', pays: 'Togo' },
    { code: '+224', pays: 'Guinée' },
    { code: '+261', pays: 'Madagascar' },
    { code: '+212', pays: 'Maroc' },
    { code: '+213', pays: 'Algérie' },
    { code: '+216', pays: 'Tunisie' },
    { code: '+20',  pays: 'Égypte' },
    { code: '+33',  pays: 'France' },
    { code: '+32',  pays: 'Belgique' },
    { code: '+1',   pays: 'Canada / USA' },
];

// ─── Gestion du brouillon localStorage ────────────────────────────────────────

const DRAFT_KEY = 'agora_create_entreprise_draft';

export const DRAFT_DEFAULTS = {
    step: 1,
    nom: '',
    secteur: '',
    logoPreview: '',
    couleur1: '',
    couleur2: '',
    couleur3: '',
    telephonePrefix: '+237',
    telephoneNumber: '',
    email: '',
    siteWeb: '',
    pays: '',
    ville: '',
    adresse: '',
    politique: '',
    description: '',
};

export function getDraft() {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return { ...DRAFT_DEFAULTS };
        return { ...DRAFT_DEFAULTS, ...JSON.parse(raw) };
    } catch {
        return { ...DRAFT_DEFAULTS };
    }
}

export function saveDraft(data) {
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
        // silent — quota exceeded ou mode privé
    }
}

export function clearDraft() {
    try {
        localStorage.removeItem(DRAFT_KEY);
    } catch {
        // silent
    }
}

// ─── Validation par étape ──────────────────────────────────────────────────────

function isValidHex(hex) {
    return /^#[0-9A-Fa-f]{6}$/.test(String(hex || '').trim());
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function isValidUrl(url) {
    const v = String(url || '').trim();
    if (!v) return true;
    return /^https?:\/\/.+\..+/.test(v);
}

export function validateStep(step, data) {
    const errors = {};

    if (step === 1) {
        if (!String(data.nom || '').trim())
            errors.nom = 'Entrez le nom de votre entreprise';
        if (!String(data.secteur || '').trim())
            errors.secteur = "Choisissez un secteur d'activité";
    }

    if (step === 3) {
        ['couleur1', 'couleur2', 'couleur3'].forEach((key) => {
            const val = String(data[key] || '').trim();
            if (val && !isValidHex(val))
                errors[key] = 'Format invalide — utilisez #RRGGBB';
        });
    }

    if (step === 4) {
        if (!String(data.email || '').trim())
            errors.email = 'Entrez une adresse email';
        else if (!isValidEmail(data.email))
            errors.email = 'Entrez une adresse email valide';

        if (!String(data.telephoneNumber || '').trim())
            errors.telephoneNumber = 'Entrez un numéro de téléphone';

        if (!isValidUrl(data.siteWeb))
            errors.siteWeb = 'Entrez une URL valide (http:// ou https://)';
    }

    if (step === 5) {
        if (!String(data.pays || '').trim())
            errors.pays = 'Choisissez un pays';
        if (!String(data.ville || '').trim())
            errors.ville = 'Entrez une ville';
        if (!String(data.adresse || '').trim())
            errors.adresse = 'Entrez une adresse';
    }

    if (step === 6) {
        if (!String(data.politique || '').trim())
            errors.politique = "Décrivez la politique de l'entreprise";
        if (!String(data.description || '').trim())
            errors.description = "Décrivez votre entreprise";
    }

    return errors;
}

// ─── Utilitaires couleur (HSV ↔ HEX) ──────────────────────────────────────────

function hsvToRgb(h, s, v) {
    const s1 = s / 100;
    const v1 = v / 100;
    const c  = v1 * s1;
    const x  = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m  = v1 - c;
    let r1, g1, b1;
    if      (h < 60)  { r1 = c; g1 = x; b1 = 0; }
    else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
    else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
    else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
    else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
    else              { r1 = c; g1 = 0; b1 = x; }
    return {
        r: Math.round((r1 + m) * 255),
        g: Math.round((g1 + m) * 255),
        b: Math.round((b1 + m) * 255),
    };
}

function rgbToHsv(r, g, b) {
    const r1 = r / 255, g1 = g / 255, b1 = b / 255;
    const max = Math.max(r1, g1, b1);
    const min = Math.min(r1, g1, b1);
    const d   = max - min;
    let h = 0;
    if (d !== 0) {
        if      (max === r1) h = ((g1 - b1) / d) % 6;
        else if (max === g1) h = (b1 - r1) / d + 2;
        else                  h = (r1 - g1) / d + 4;
        h = Math.round(h * 60);
        if (h < 0) h += 360;
    }
    return {
        h,
        s: max === 0 ? 0 : Math.round((d / max) * 100),
        v: Math.round(max * 100),
    };
}

function hexToRgb(hex) {
    const clean = String(hex || '').replace('#', '').trim();
    if (clean.length !== 6) return null;
    return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16),
    };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b]
        .map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'))
        .join('');
}

export function hexToHsv(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return { h: 0, s: 100, v: 100 };
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
}

export function hsvToHex(h, s, v) {
    const { r, g, b } = hsvToRgb(h, s, v);
    return rgbToHex(r, g, b);
}

export function isValidHexColor(hex) {
    return isValidHex(hex);
}

// ─── Appel API (mockup) ────────────────────────────────────────────────────────

export async function submitCreateEntreprise(formData) {
    // TODO: remplacer par l'appel API réel :
    // const form = new FormData();
    // Object.entries(formData).forEach(([k, v]) => v && form.append(k, v));
    // if (formData.logoFile) form.append('logo', formData.logoFile);
    // return await apiFetchMultipart('entreprises/create', form);

    await new Promise(resolve => setTimeout(resolve, 2800));

    // Simule aléatoirement une erreur réseau (5 % de chance) pour tester le flux
    // if (Math.random() < 0.05) throw new Error('Erreur réseau simulée');

    return { ...mockResponse };
}
