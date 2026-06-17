import { useCallback, useEffect, useState } from 'react';

import { getCompanyMock, updateCompanyMock } from '../../services/admin/api';
import { getAdminEntrepriseId }              from '../../utils/adminAuth';

import '../../assets/styles/pages/admin/entreprise.css';

const SECTEURS = [
    'Technologie', 'Commerce', 'Santé', 'Éducation', 'Finance',
    'Agriculture', 'Transport', 'Immobilier', 'Industrie', 'Services', 'Autre',
];

function EntrepriseAdmin() {
    const [company, setCompany]     = useState(null);
    const [form, setForm]           = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving]   = useState(false);
    const [error, setError]         = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const loadCompany = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await getCompanyMock(getAdminEntrepriseId());
            const data = res?.data;
            setCompany(data);
            setForm({
                name:        data.name        ?? '',
                secteur:     data.secteur     ?? '',
                logo:        data.logo        ?? '',
                color1:      data.colors?.[0] ?? '#F39C12',
                color2:      data.colors?.[1] ?? '#2C3E50',
                color3:      data.colors?.[2] ?? '#27AE60',
                email:       data.email       ?? '',
                phone:       data.phone       ?? '',
                website:     data.website     ?? '',
                country:     data.country     ?? '',
                city:        data.city        ?? '',
                address:     data.address     ?? '',
                description: data.description ?? '',
                policy:      data.policy      ?? '',
            });
        } catch {
            setError("Impossible de charger les informations de l'entreprise.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadCompany(); }, [loadCompany]);

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccessMsg('');
        try {
            await updateCompanyMock(getAdminEntrepriseId(), form);
            setSuccessMsg('Informations mises à jour avec succès.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch {
            setError('Impossible de sauvegarder les modifications.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="entrepriseAdmin-root">
                <div className="entrepriseAdmin-skeleton" aria-label="Chargement">
                    {[1, 2, 3, 4].map(i => <div key={i} className="entrepriseAdmin-skeleton__section" />)}
                </div>
            </div>
        );
    }

    if (error && !form) {
        return (
            <div className="entrepriseAdmin-root">
                <div className="entrepriseAdmin-error" role="alert">
                    <p>{error}</p>
                    <button type="button" className="entrepriseAdmin-error__retry" onClick={loadCompany}>Réessayer</button>
                </div>
            </div>
        );
    }

    return (
        <div className="entrepriseAdmin-root">
            <div className="entrepriseAdmin-topBar">
                <h2 className="entrepriseAdmin-topBar__title">Paramètres de l'entreprise</h2>
                <p className="entrepriseAdmin-topBar__subtitle">Gérez les informations officielles de votre entreprise.</p>
            </div>

            {successMsg && <div className="entrepriseAdmin-toast" role="status">{successMsg}</div>}
            {error      && <p className="entrepriseAdmin-formError" role="alert">{error}</p>}

            <form className="entrepriseAdmin-form" onSubmit={handleSubmit} noValidate>

                <section className="entrepriseAdmin-section">
                    <h3 className="entrepriseAdmin-section__title">Informations générales</h3>
                    <div className="entrepriseAdmin-section__grid">
                        <div className="entrepriseAdmin-field">
                            <label className="entrepriseAdmin-field__label" htmlFor="compNom">Nom de l'entreprise *</label>
                            <input
                                id="compNom"
                                type="text"
                                className="entrepriseAdmin-field__input"
                                value={form.name}
                                onChange={handleChange('name')}
                                required
                            />
                        </div>
                        <div className="entrepriseAdmin-field">
                            <label className="entrepriseAdmin-field__label" htmlFor="compSecteur">Secteur d'activité *</label>
                            <select id="compSecteur" className="entrepriseAdmin-field__select" value={form.secteur} onChange={handleChange('secteur')} required>
                                <option value="">Sélectionner...</option>
                                {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="entrepriseAdmin-section">
                    <h3 className="entrepriseAdmin-section__title">Couleurs de la marque</h3>
                    <p className="entrepriseAdmin-section__hint">Ces couleurs seront utilisées pour personnaliser l'interface de votre entreprise.</p>
                    <div className="entrepriseAdmin-colors">
                        {['color1', 'color2', 'color3'].map((key, i) => (
                            <div key={key} className="entrepriseAdmin-colorField">
                                <label className="entrepriseAdmin-colorField__label" htmlFor={`comp${key}`}>
                                    Couleur {i + 1}
                                </label>
                                <div className="entrepriseAdmin-colorField__wrap">
                                    <input
                                        id={`comp${key}`}
                                        type="color"
                                        className="entrepriseAdmin-colorField__picker"
                                        value={form[key]}
                                        onChange={handleChange(key)}
                                    />
                                    <input
                                        type="text"
                                        className="entrepriseAdmin-colorField__hex"
                                        value={form[key]}
                                        onChange={handleChange(key)}
                                        pattern="^#[0-9A-Fa-f]{6}$"
                                        placeholder="#F39C12"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="entrepriseAdmin-section">
                    <h3 className="entrepriseAdmin-section__title">Coordonnées</h3>
                    <div className="entrepriseAdmin-section__grid">
                        <div className="entrepriseAdmin-field">
                            <label className="entrepriseAdmin-field__label" htmlFor="compEmail">Email de contact *</label>
                            <input id="compEmail" type="email" className="entrepriseAdmin-field__input" value={form.email} onChange={handleChange('email')} required />
                        </div>
                        <div className="entrepriseAdmin-field">
                            <label className="entrepriseAdmin-field__label" htmlFor="compPhone">Téléphone *</label>
                            <input id="compPhone" type="tel" className="entrepriseAdmin-field__input" value={form.phone} onChange={handleChange('phone')} required />
                        </div>
                        <div className="entrepriseAdmin-field entrepriseAdmin-field--full">
                            <label className="entrepriseAdmin-field__label" htmlFor="compWebsite">Site web</label>
                            <input id="compWebsite" type="url" className="entrepriseAdmin-field__input" value={form.website} onChange={handleChange('website')} placeholder="https://" />
                        </div>
                    </div>
                </section>

                <section className="entrepriseAdmin-section">
                    <h3 className="entrepriseAdmin-section__title">Adresse</h3>
                    <div className="entrepriseAdmin-section__grid">
                        <div className="entrepriseAdmin-field">
                            <label className="entrepriseAdmin-field__label" htmlFor="compCountry">Pays *</label>
                            <input id="compCountry" type="text" className="entrepriseAdmin-field__input" value={form.country} onChange={handleChange('country')} required />
                        </div>
                        <div className="entrepriseAdmin-field">
                            <label className="entrepriseAdmin-field__label" htmlFor="compCity">Ville *</label>
                            <input id="compCity" type="text" className="entrepriseAdmin-field__input" value={form.city} onChange={handleChange('city')} required />
                        </div>
                        <div className="entrepriseAdmin-field entrepriseAdmin-field--full">
                            <label className="entrepriseAdmin-field__label" htmlFor="compAddress">Adresse *</label>
                            <input id="compAddress" type="text" className="entrepriseAdmin-field__input" value={form.address} onChange={handleChange('address')} required />
                        </div>
                    </div>
                </section>

                <section className="entrepriseAdmin-section">
                    <h3 className="entrepriseAdmin-section__title">Présentation</h3>
                    <div className="entrepriseAdmin-field">
                        <label className="entrepriseAdmin-field__label" htmlFor="compDesc">Description *</label>
                        <textarea id="compDesc" className="entrepriseAdmin-field__textarea" value={form.description} onChange={handleChange('description')} rows={4} required />
                    </div>
                    <div className="entrepriseAdmin-field">
                        <label className="entrepriseAdmin-field__label" htmlFor="compPolicy">Politique de l'entreprise *</label>
                        <textarea id="compPolicy" className="entrepriseAdmin-field__textarea" value={form.policy} onChange={handleChange('policy')} rows={4} required />
                    </div>
                </section>

                <div className="entrepriseAdmin-formActions">
                    <button type="submit" className="entrepriseAdmin-formActions__saveBtn" disabled={isSaving}>
                        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EntrepriseAdmin;
