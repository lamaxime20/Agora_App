import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    getEntrepriseParametresFromApi,
    updateEntrepriseParametresFromApi,
} from '../utils/entrepriseParametres';

import '../assets/styles/pages/parametres-entreprise.css';

const SECTEURS = [
    'Technologie', 'Commerce', 'Santé', 'Éducation', 'Finance',
    'Agriculture', 'Transport', 'Immobilier', 'Industrie', 'Services', 'Autre',
];

const EMPTY_FORM = {
    nom:                  '',
    secteur_activite:     '',
    email:                '',
    telephone:            '',
    site_web:             '',
    pays:                 '',
    ville:                '',
    adresse:              '',
    description:          '',
    politique_entreprise: '',
    couleur_primaire:     '#F39C12',
    couleur_secondaire:   '#2C3E50',
    couleur_tertiaire:    '#27AE60',
};

function fromApi(data) {
    return {
        nom:                  data.nom                 ?? '',
        secteur_activite:     data.secteur_activite    ?? '',
        email:                data.email               ?? '',
        telephone:            data.telephone           ?? '',
        site_web:             data.site_web            ?? '',
        pays:                 data.pays                ?? '',
        ville:                data.ville               ?? '',
        adresse:              data.adresse             ?? '',
        description:          data.description         ?? '',
        politique_entreprise: data.politique_entreprise ?? '',
        couleur_primaire:     data.couleur_primaire    ?? '#F39C12',
        couleur_secondaire:   data.couleur_secondaire  ?? '#2C3E50',
        couleur_tertiaire:    data.couleur_tertiaire   ?? '#27AE60',
    };
}

function ParametresEntreprise() {
    const navigate = useNavigate();

    const [form,       setForm]       = useState(EMPTY_FORM);
    const [isLoading,  setIsLoading]  = useState(true);
    const [isSaving,   setIsSaving]   = useState(false);
    const [loadError,  setLoadError]  = useState('');
    const [saveError,  setSaveError]  = useState('');
    const [fieldErrors,setFieldErrors]= useState({});
    const [toast,      setToast]      = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setLoadError('');
        try {
            const data = await getEntrepriseParametresFromApi();
            setForm(fromApi(data));
        } catch {
            setLoadError("Impossible de charger les informations de l'entreprise.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveError('');
        setFieldErrors({});
        setToast('');
        try {
            const updated = await updateEntrepriseParametresFromApi(form);
            setForm(fromApi(updated));
            setToast('Modifications enregistrées.');
            setTimeout(() => setToast(''), 3000);
        } catch (err) {
            if (err?.details?.errors) {
                setFieldErrors(err.details.errors);
            } else {
                setSaveError(err?.message ?? 'Impossible de sauvegarder les modifications.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    // ── Loading skeleton ────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="pe-root">
                <div className="pe-skeleton">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="pe-skeleton__section" />
                    ))}
                </div>
            </div>
        );
    }

    // ── Hard load error ─────────────────────────────────────────────────────
    if (loadError) {
        return (
            <div className="pe-root">
                <div className="pe-load-error" role="alert">
                    <p>{loadError}</p>
                    <button type="button" className="pe-load-error__retry" onClick={loadData}>
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pe-root">
            {/* ── Top bar ── */}
            <div className="pe-topBar">
                <button
                    type="button"
                    className="pe-topBar__back"
                    onClick={() => navigate(-1)}
                    aria-label="Retour"
                >
                    ←
                </button>
                <div>
                    <h1 className="pe-topBar__title">Paramètres de l'entreprise</h1>
                    <p className="pe-topBar__subtitle">
                        Gérez les informations officielles de votre entreprise.
                    </p>
                </div>
            </div>

            {/* ── Inline save error ── */}
            {saveError && (
                <p className="pe-saveError" role="alert">{saveError}</p>
            )}

            <form className="pe-form" onSubmit={handleSubmit} noValidate>

                {/* ── Section : informations générales ── */}
                <section className="pe-section">
                    <h2 className="pe-section__title">Informations générales</h2>
                    <div className="pe-grid">
                        <div className="pe-field">
                            <label className="pe-field__label" htmlFor="pe-nom">
                                Nom de l'entreprise *
                            </label>
                            <input
                                id="pe-nom"
                                type="text"
                                className={`pe-field__input${fieldErrors.nom ? ' pe-field__input--error' : ''}`}
                                value={form.nom}
                                onChange={handleChange('nom')}
                                required
                            />
                            {fieldErrors.nom && (
                                <span className="pe-field__error">{fieldErrors.nom}</span>
                            )}
                        </div>

                        <div className="pe-field">
                            <label className="pe-field__label" htmlFor="pe-secteur">
                                Secteur d'activité
                            </label>
                            <select
                                id="pe-secteur"
                                className="pe-field__select"
                                value={form.secteur_activite}
                                onChange={handleChange('secteur_activite')}
                            >
                                <option value="">Sélectionner…</option>
                                {SECTEURS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* ── Section : couleurs ── */}
                <section className="pe-section">
                    <h2 className="pe-section__title">Couleurs de la marque</h2>
                    <p className="pe-section__hint">
                        Ces couleurs personnalisent l'interface de votre entreprise.
                    </p>
                    <div className="pe-colors">
                        {[
                            { key: 'couleur_primaire',   label: 'Couleur primaire' },
                            { key: 'couleur_secondaire', label: 'Couleur secondaire' },
                            { key: 'couleur_tertiaire',  label: 'Couleur tertiaire' },
                        ].map(({ key, label }) => (
                            <div className="pe-colorField" key={key}>
                                <label className="pe-colorField__label" htmlFor={`pe-${key}`}>
                                    {label}
                                </label>
                                <div className="pe-colorField__wrap">
                                    <input
                                        id={`pe-${key}`}
                                        type="color"
                                        className="pe-colorField__picker"
                                        value={form[key]}
                                        onChange={handleChange(key)}
                                    />
                                    <input
                                        type="text"
                                        className={`pe-colorField__hex${fieldErrors[key] ? ' pe-field__input--error' : ''}`}
                                        value={form[key]}
                                        onChange={handleChange(key)}
                                        pattern="^#[0-9A-Fa-f]{6}$"
                                        placeholder="#F39C12"
                                    />
                                </div>
                                {fieldErrors[key] && (
                                    <span className="pe-field__error">{fieldErrors[key]}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Section : coordonnées ── */}
                <section className="pe-section">
                    <h2 className="pe-section__title">Coordonnées</h2>
                    <div className="pe-grid">
                        <div className="pe-field">
                            <label className="pe-field__label" htmlFor="pe-email">
                                E-mail de contact
                            </label>
                            <input
                                id="pe-email"
                                type="email"
                                className={`pe-field__input${fieldErrors.email ? ' pe-field__input--error' : ''}`}
                                value={form.email}
                                onChange={handleChange('email')}
                            />
                            {fieldErrors.email && (
                                <span className="pe-field__error">{fieldErrors.email}</span>
                            )}
                        </div>

                        <div className="pe-field">
                            <label className="pe-field__label" htmlFor="pe-telephone">
                                Téléphone
                            </label>
                            <input
                                id="pe-telephone"
                                type="tel"
                                className="pe-field__input"
                                value={form.telephone}
                                onChange={handleChange('telephone')}
                            />
                        </div>

                        <div className="pe-field pe-field--full">
                            <label className="pe-field__label" htmlFor="pe-siteweb">
                                Site web
                            </label>
                            <input
                                id="pe-siteweb"
                                type="url"
                                className={`pe-field__input${fieldErrors.site_web ? ' pe-field__input--error' : ''}`}
                                value={form.site_web}
                                onChange={handleChange('site_web')}
                                placeholder="https://"
                            />
                            {fieldErrors.site_web && (
                                <span className="pe-field__error">{fieldErrors.site_web}</span>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Section : adresse ── */}
                <section className="pe-section">
                    <h2 className="pe-section__title">Adresse</h2>
                    <div className="pe-grid">
                        <div className="pe-field">
                            <label className="pe-field__label" htmlFor="pe-pays">Pays</label>
                            <input
                                id="pe-pays"
                                type="text"
                                className="pe-field__input"
                                value={form.pays}
                                onChange={handleChange('pays')}
                            />
                        </div>

                        <div className="pe-field">
                            <label className="pe-field__label" htmlFor="pe-ville">Ville</label>
                            <input
                                id="pe-ville"
                                type="text"
                                className="pe-field__input"
                                value={form.ville}
                                onChange={handleChange('ville')}
                            />
                        </div>

                        <div className="pe-field pe-field--full">
                            <label className="pe-field__label" htmlFor="pe-adresse">
                                Adresse complète
                            </label>
                            <input
                                id="pe-adresse"
                                type="text"
                                className="pe-field__input"
                                value={form.adresse}
                                onChange={handleChange('adresse')}
                            />
                        </div>
                    </div>
                </section>

                {/* ── Section : présentation ── */}
                <section className="pe-section">
                    <h2 className="pe-section__title">Présentation</h2>

                    <div className="pe-field">
                        <label className="pe-field__label" htmlFor="pe-description">
                            Description
                        </label>
                        <textarea
                            id="pe-description"
                            className="pe-field__textarea"
                            value={form.description}
                            onChange={handleChange('description')}
                            rows={4}
                        />
                    </div>

                    <div className="pe-field">
                        <label className="pe-field__label" htmlFor="pe-politique">
                            Politique de l'entreprise
                        </label>
                        <textarea
                            id="pe-politique"
                            className="pe-field__textarea"
                            value={form.politique_entreprise}
                            onChange={handleChange('politique_entreprise')}
                            rows={4}
                        />
                    </div>
                </section>

                {/* ── Actions ── */}
                <div className="pe-actions">
                    <button
                        type="submit"
                        className="pe-actions__save"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </form>

            {/* ── Toast success ── */}
            {toast && (
                <div className="pe-toast" role="status">{toast}</div>
            )}
        </div>
    );
}

export default ParametresEntreprise;
