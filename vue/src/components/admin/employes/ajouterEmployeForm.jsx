import { useState } from 'react';

import {
    ROLES_EMPLOYE,
    checkEmailEmployeeMock,
    addEmployeeMock,
} from '../../../services/admin/api';

import '../../../assets/styles/components/admin/employes/ajouterEmployeForm.css';

function AjouterEmployeForm({ onDone, onCancel }) {
    const [step, setStep]         = useState('form');
    const [email, setEmail]       = useState('');
    const [role, setRole]         = useState(ROLES_EMPLOYE[0].value);
    const [nom, setNom]           = useState('');
    const [prenom, setPrenom]     = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError]       = useState('');

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        if (!email.trim()) { setError("L'adresse e-mail est requise."); return; }
        setError('');
        setIsLoading(true);
        try {
            const res = await checkEmailEmployeeMock(email.trim().toLowerCase());
            if (res.exists) {
                await addEmployeeMock({ email, role });
                onDone?.();
            } else {
                setStep('newUser');
            }
        } catch {
            setError("Une erreur est survenue lors de la vérification.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitNewUser = async (e) => {
        e.preventDefault();
        if (!nom.trim() || !prenom.trim()) { setError("Nom et prénom sont requis."); return; }
        setError('');
        setIsLoading(true);
        try {
            await addEmployeeMock({ email, role, nom, prenom, password: '12345678' });
            onDone?.();
        } catch {
            setError("Une erreur est survenue lors de la création.");
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 'newUser') {
        return (
            <form className="ajouterEmployeForm-root" onSubmit={handleSubmitNewUser} noValidate>
                <div className="ajouterEmployeForm-info" role="status">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Aucun compte trouvé pour <strong>{email}</strong>. Un nouveau compte sera créé avec le mot de passe par défaut <strong>12345678</strong>.
                </div>

                <div className="ajouterEmployeForm-field">
                    <label className="ajouterEmployeForm-field__label" htmlFor="empPrenom">Prénom *</label>
                    <input
                        id="empPrenom"
                        type="text"
                        className="ajouterEmployeForm-field__input"
                        value={prenom}
                        onChange={e => setPrenom(e.target.value)}
                        required
                        disabled={isLoading}
                        autoFocus
                    />
                </div>

                <div className="ajouterEmployeForm-field">
                    <label className="ajouterEmployeForm-field__label" htmlFor="empNom">Nom *</label>
                    <input
                        id="empNom"
                        type="text"
                        className="ajouterEmployeForm-field__input"
                        value={nom}
                        onChange={e => setNom(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>

                {error && <p className="ajouterEmployeForm-error" role="alert">{error}</p>}

                <div className="ajouterEmployeForm-actions">
                    <button type="button" className="ajouterEmployeForm-actions__back" onClick={() => { setStep('form'); setError(''); }} disabled={isLoading}>
                        Retour
                    </button>
                    <button type="submit" className="ajouterEmployeForm-actions__submit" disabled={isLoading || !nom || !prenom}>
                        {isLoading ? <span className="ajouterEmployeForm-spinner" aria-hidden="true" /> : 'Créer et ajouter'}
                    </button>
                </div>
            </form>
        );
    }

    return (
        <form className="ajouterEmployeForm-root" onSubmit={handleSubmitForm} noValidate>
            <div className="ajouterEmployeForm-field">
                <label className="ajouterEmployeForm-field__label" htmlFor="empEmail">Adresse e-mail *</label>
                <input
                    id="empEmail"
                    type="email"
                    className="ajouterEmployeForm-field__input"
                    placeholder="employe@exemple.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    autoFocus
                />
            </div>

            <div className="ajouterEmployeForm-field">
                <label className="ajouterEmployeForm-field__label" htmlFor="empRole">Rôle *</label>
                <select
                    id="empRole"
                    className="ajouterEmployeForm-field__select"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    disabled={isLoading}
                >
                    {ROLES_EMPLOYE.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                </select>
            </div>

            {error && <p className="ajouterEmployeForm-error" role="alert">{error}</p>}

            <div className="ajouterEmployeForm-actions">
                <button type="button" className="ajouterEmployeForm-actions__cancel" onClick={onCancel} disabled={isLoading}>
                    Annuler
                </button>
                <button type="submit" className="ajouterEmployeForm-actions__submit" disabled={isLoading || !email}>
                    {isLoading ? <span className="ajouterEmployeForm-spinner" aria-hidden="true" /> : 'Suivant'}
                </button>
            </div>
        </form>
    );
}

export default AjouterEmployeForm;
