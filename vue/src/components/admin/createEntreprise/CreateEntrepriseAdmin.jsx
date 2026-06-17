import { useState } from 'react';

import { createCompanyAdminMock, searchUserByEmailMock, createDirecteurMock } from '../../../services/admin/api';
import { setAdminEntrepriseId } from '../../../utils/adminAuth';

import '../../../assets/styles/components/admin/createEntreprise/CreateEntrepriseAdmin.css';

const SECTEURS = [
    'Technologie', 'Commerce', 'Santé', 'Éducation', 'Finance',
    'Agriculture', 'Transport', 'Immobilier', 'Industrie', 'Services', 'Autre',
];

const TOTAL_STEPS = 7;

const emptyCompany = {
    nom: '', secteur: '', logo: null,
    color1: '#F39C12', color2: '#2C3E50', color3: '#27AE60',
    email: '', phone: '', website: '',
    country: '', city: '', address: '',
    description: '', policy: '',
};

const emptyDirecteur = { email: '', nom: '', prenom: '' };

function CreateEntrepriseAdmin({ onDone, onCancel }) {
    const [step, setStep]                     = useState(1);
    const [company, setCompany]               = useState({ ...emptyCompany });
    const [directeur, setDirecteur]           = useState({ ...emptyDirecteur });
    const [newUserNeeded, setNewUserNeeded]   = useState(false);
    const [isLoading, setIsLoading]           = useState(false);
    const [error, setError]                   = useState('');
    const [dragOver, setDragOver]             = useState(false);

    const handleCompanyChange = (field) => (e) => setCompany(c => ({ ...c, [field]: e.target.value }));

    const next = () => { setError(''); setStep(s => Math.min(s + 1, TOTAL_STEPS)); };
    const prev = () => { setError(''); setStep(s => Math.max(s - 1, 1)); };

    const handleLogoChange = (file) => {
        if (file && file.type.startsWith('image/')) {
            setCompany(c => ({ ...c, logo: file }));
        }
    };

    const handleSearchDirecteur = async (e) => {
        e.preventDefault();
        if (!directeur.email.trim()) { setError("L'e-mail est requis."); return; }
        setError('');
        setIsLoading(true);
        try {
            const res = await searchUserByEmailMock(directeur.email);
            if (res.exists) {
                setNewUserNeeded(false);
                await handleFinalCreate(false);
            } else {
                setNewUserNeeded(true);
            }
        } catch {
            setError("Erreur lors de la recherche.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalCreate = async (createUser = false) => {
        setIsLoading(true);
        setError('');
        try {
            if (createUser) {
                if (!directeur.nom.trim() || !directeur.prenom.trim()) {
                    setError('Nom et prénom du directeur sont requis.'); setIsLoading(false); return;
                }
                await createDirecteurMock({ ...directeur, password: 'directeur237' });
            }
            const res = await createCompanyAdminMock({ ...company, directeur: directeur.email });
            if (res.data?.id) setAdminEntrepriseId(res.data.id);
            localStorage.removeItem('admin_create_entreprise_draft');
            onDone?.();
        } catch {
            setError("Erreur lors de la création de l'entreprise.");
        } finally {
            setIsLoading(false);
        }
    };

    const progressWidth = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

    return (
        <div className="createEntrepriseAdmin-root">
            <div className="createEntrepriseAdmin-progressBar" aria-hidden="true">
                <div className="createEntrepriseAdmin-progressBar__fill" style={{ width: `${progressWidth}%` }} />
            </div>

            <header className="createEntrepriseAdmin-header">
                <button
                    type="button"
                    className="createEntrepriseAdmin-header__cancelBtn"
                    onClick={onCancel}
                >
                    Annuler
                </button>
                <span className="createEntrepriseAdmin-header__steps">Étape {step} / {TOTAL_STEPS}</span>
            </header>

            <div className="createEntrepriseAdmin-body">
                {step === 1 && (
                    <section className="createEntrepriseAdmin-step">
                        <h2 className="createEntrepriseAdmin-step__title">Informations de base</h2>
                        <div className="createEntrepriseAdmin-field">
                            <label className="createEntrepriseAdmin-field__label" htmlFor="crNom">Nom de l'entreprise *</label>
                            <input id="crNom" type="text" className="createEntrepriseAdmin-field__input" value={company.nom} onChange={handleCompanyChange('nom')} required />
                        </div>
                        <div className="createEntrepriseAdmin-field">
                            <label className="createEntrepriseAdmin-field__label" htmlFor="crSecteur">Secteur d'activité *</label>
                            <select id="crSecteur" className="createEntrepriseAdmin-field__select" value={company.secteur} onChange={handleCompanyChange('secteur')} required>
                                <option value="">Sélectionner...</option>
                                {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </section>
                )}

                {step === 2 && (
                    <section className="createEntrepriseAdmin-step">
                        <h2 className="createEntrepriseAdmin-step__title">Logo de l'entreprise</h2>
                        <p className="createEntrepriseAdmin-step__hint">Champ optionnel. Vous pouvez passer cette étape.</p>
                        <div
                            className={`createEntrepriseAdmin-dropzone${dragOver ? ' createEntrepriseAdmin-dropzone--active' : ''}`}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); handleLogoChange(e.dataTransfer.files[0]); }}
                            onClick={() => document.getElementById('logoInput').click()}
                            role="button"
                            tabIndex={0}
                            aria-label="Choisir ou déposer un logo"
                        >
                            {company.logo ? (
                                <>
                                    <img src={URL.createObjectURL(company.logo)} alt="Logo" className="createEntrepriseAdmin-dropzone__preview" />
                                    <button
                                        type="button"
                                        className="createEntrepriseAdmin-dropzone__removeBtn"
                                        onClick={e => { e.stopPropagation(); setCompany(c => ({ ...c, logo: null })); }}
                                    >×</button>
                                </>
                            ) : (
                                <div className="createEntrepriseAdmin-dropzone__placeholder">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                    <span>Glissez votre logo ou cliquez pour en choisir un</span>
                                </div>
                            )}
                            <input id="logoInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleLogoChange(e.target.files[0])} />
                        </div>
                    </section>
                )}

                {step === 3 && (
                    <section className="createEntrepriseAdmin-step">
                        <h2 className="createEntrepriseAdmin-step__title">Couleurs de la marque</h2>
                        <p className="createEntrepriseAdmin-step__hint">Tous les champs sont optionnels.</p>
                        {['color1', 'color2', 'color3'].map((key, i) => (
                            <div key={key} className="createEntrepriseAdmin-colorField">
                                <label className="createEntrepriseAdmin-field__label" htmlFor={`cr${key}`}>Couleur {i + 1}</label>
                                <div className="createEntrepriseAdmin-colorField__wrap">
                                    <input id={`cr${key}`} type="color" className="createEntrepriseAdmin-colorField__picker" value={company[key]} onChange={handleCompanyChange(key)} />
                                    <input type="text" className="createEntrepriseAdmin-colorField__hex" value={company[key]} onChange={handleCompanyChange(key)} placeholder="#F39C12" />
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {step === 4 && (
                    <section className="createEntrepriseAdmin-step">
                        <h2 className="createEntrepriseAdmin-step__title">Coordonnées</h2>
                        <div className="createEntrepriseAdmin-field">
                            <label className="createEntrepriseAdmin-field__label" htmlFor="crEmail">Email *</label>
                            <input id="crEmail" type="email" className="createEntrepriseAdmin-field__input" value={company.email} onChange={handleCompanyChange('email')} required />
                        </div>
                        <div className="createEntrepriseAdmin-field">
                            <label className="createEntrepriseAdmin-field__label" htmlFor="crPhone">Téléphone *</label>
                            <input id="crPhone" type="tel" className="createEntrepriseAdmin-field__input" value={company.phone} onChange={handleCompanyChange('phone')} required />
                        </div>
                        <div className="createEntrepriseAdmin-field">
                            <label className="createEntrepriseAdmin-field__label" htmlFor="crWebsite">Site web</label>
                            <input id="crWebsite" type="url" className="createEntrepriseAdmin-field__input" value={company.website} onChange={handleCompanyChange('website')} placeholder="https://" />
                        </div>
                    </section>
                )}

                {step === 5 && (
                    <section className="createEntrepriseAdmin-step">
                        <h2 className="createEntrepriseAdmin-step__title">Adresse</h2>
                        <div className="createEntrepriseAdmin-field">
                            <label className="createEntrepriseAdmin-field__label" htmlFor="crCountry">Pays *</label>
                            <input id="crCountry" type="text" className="createEntrepriseAdmin-field__input" value={company.country} onChange={handleCompanyChange('country')} required />
                        </div>
                        <div className="createEntrepriseAdmin-field">
                            <label className="createEntrepriseAdmin-field__label" htmlFor="crCity">Ville *</label>
                            <input id="crCity" type="text" className="createEntrepriseAdmin-field__input" value={company.city} onChange={handleCompanyChange('city')} required />
                        </div>
                        <div className="createEntrepriseAdmin-field">
                            <label className="createEntrepriseAdmin-field__label" htmlFor="crAddress">Adresse *</label>
                            <input id="crAddress" type="text" className="createEntrepriseAdmin-field__input" value={company.address} onChange={handleCompanyChange('address')} required />
                        </div>
                    </section>
                )}

                {step === 6 && (
                    <section className="createEntrepriseAdmin-step">
                        <h2 className="createEntrepriseAdmin-step__title">Présentation</h2>
                        <div className="createEntrepriseAdmin-field">
                            <label className="createEntrepriseAdmin-field__label" htmlFor="crDesc">Description *</label>
                            <textarea id="crDesc" className="createEntrepriseAdmin-field__textarea" value={company.description} onChange={handleCompanyChange('description')} rows={4} required />
                        </div>
                        <div className="createEntrepriseAdmin-field">
                            <label className="createEntrepriseAdmin-field__label" htmlFor="crPolicy">Politique *</label>
                            <textarea id="crPolicy" className="createEntrepriseAdmin-field__textarea" value={company.policy} onChange={handleCompanyChange('policy')} rows={4} required />
                        </div>
                    </section>
                )}

                {step === 7 && (
                    <section className="createEntrepriseAdmin-step">
                        <h2 className="createEntrepriseAdmin-step__title">Choix du directeur</h2>
                        <p className="createEntrepriseAdmin-step__hint">Recherchez l'utilisateur qui sera directeur de cette entreprise.</p>

                        {!newUserNeeded ? (
                            <form onSubmit={handleSearchDirecteur} noValidate>
                                <div className="createEntrepriseAdmin-field">
                                    <label className="createEntrepriseAdmin-field__label" htmlFor="dirEmail">Email du directeur *</label>
                                    <input
                                        id="dirEmail"
                                        type="email"
                                        className="createEntrepriseAdmin-field__input"
                                        value={directeur.email}
                                        onChange={e => setDirecteur(d => ({ ...d, email: e.target.value }))}
                                        required
                                        disabled={isLoading}
                                        placeholder="directeur@entreprise.com"
                                    />
                                </div>
                                {error && <p className="createEntrepriseAdmin-error" role="alert">{error}</p>}
                                <button type="submit" className="createEntrepriseAdmin-step__searchBtn" disabled={isLoading || !directeur.email}>
                                    {isLoading ? 'Recherche...' : "Rechercher et créer l'entreprise"}
                                </button>
                            </form>
                        ) : (
                            <div className="createEntrepriseAdmin-newUser">
                                <div className="createEntrepriseAdmin-newUser__info" role="status">
                                    Aucun compte trouvé pour <strong>{directeur.email}</strong>. Un compte sera créé avec le mot de passe par défaut <strong>directeur237</strong>.
                                </div>
                                <div className="createEntrepriseAdmin-field">
                                    <label className="createEntrepriseAdmin-field__label" htmlFor="dirPrenom">Prénom *</label>
                                    <input id="dirPrenom" type="text" className="createEntrepriseAdmin-field__input" value={directeur.prenom} onChange={e => setDirecteur(d => ({ ...d, prenom: e.target.value }))} required disabled={isLoading} />
                                </div>
                                <div className="createEntrepriseAdmin-field">
                                    <label className="createEntrepriseAdmin-field__label" htmlFor="dirNom">Nom *</label>
                                    <input id="dirNom" type="text" className="createEntrepriseAdmin-field__input" value={directeur.nom} onChange={e => setDirecteur(d => ({ ...d, nom: e.target.value }))} required disabled={isLoading} />
                                </div>
                                {error && <p className="createEntrepriseAdmin-error" role="alert">{error}</p>}
                                <div className="createEntrepriseAdmin-newUser__actions">
                                    <button type="button" className="createEntrepriseAdmin-newUser__backBtn" onClick={() => { setNewUserNeeded(false); setError(''); }} disabled={isLoading}>
                                        Modifier l'email
                                    </button>
                                    <button
                                        type="button"
                                        className="createEntrepriseAdmin-newUser__createBtn"
                                        onClick={() => handleFinalCreate(true)}
                                        disabled={isLoading || !directeur.nom || !directeur.prenom}
                                    >
                                        {isLoading ? 'Création...' : "Créer le directeur et l'entreprise"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {error && step < 7 && (
                    <p className="createEntrepriseAdmin-error" role="alert">{error}</p>
                )}

                {step < 7 && (
                    <div className="createEntrepriseAdmin-navActions">
                        {step > 1 && (
                            <button type="button" className="createEntrepriseAdmin-navActions__back" onClick={prev}>
                                Précédent
                            </button>
                        )}
                        {step === 2 && (
                            <button type="button" className="createEntrepriseAdmin-navActions__skip" onClick={next}>
                                Passer
                            </button>
                        )}
                        <button
                            type="button"
                            className="createEntrepriseAdmin-navActions__next"
                            onClick={next}
                        >
                            Suivant
                        </button>
                    </div>
                )}

                {step === 7 && !newUserNeeded && (
                    <div className="createEntrepriseAdmin-navActions">
                        <button type="button" className="createEntrepriseAdmin-navActions__back" onClick={prev}>
                            Précédent
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CreateEntrepriseAdmin;
