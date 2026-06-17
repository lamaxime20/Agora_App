import { useState } from 'react';

import { addAdminMock } from '../../../services/admin/api';

import '../../../assets/styles/components/admin/admin/ajouterAdmin.css';

function AjouterAdmin({ onDone, onCancel }) {
    const [form, setForm]           = useState({ email: '', password: '', confirmation: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError]         = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email.trim()) { setError("L'adresse e-mail est requise."); return; }
        if (form.password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
        if (form.password !== form.confirmation) { setError('Les mots de passe ne correspondent pas.'); return; }

        setError('');
        setIsLoading(true);
        try {
            const res = await addAdminMock(form);
            if (!res.success) { setError(res.message); return; }
            onDone?.();
        } catch {
            setError('Une erreur est survenue lors de la création.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="ajouterAdmin-root" onSubmit={handleSubmit} noValidate>
            <div className="ajouterAdmin-field">
                <label className="ajouterAdmin-field__label" htmlFor="adminEmail">Adresse e-mail *</label>
                <input
                    id="adminEmail"
                    type="email"
                    className="ajouterAdmin-field__input"
                    placeholder="nouvel-admin@agora.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    disabled={isLoading}
                    autoFocus
                />
            </div>

            <div className="ajouterAdmin-field">
                <label className="ajouterAdmin-field__label" htmlFor="adminPassword">Mot de passe *</label>
                <input
                    id="adminPassword"
                    type="password"
                    className="ajouterAdmin-field__input"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="ajouterAdmin-field">
                <label className="ajouterAdmin-field__label" htmlFor="adminConfirmation">Confirmer le mot de passe *</label>
                <input
                    id="adminConfirmation"
                    type="password"
                    className="ajouterAdmin-field__input"
                    placeholder="••••••••"
                    value={form.confirmation}
                    onChange={e => setForm(f => ({ ...f, confirmation: e.target.value }))}
                    required
                    disabled={isLoading}
                />
            </div>

            {error && <p className="ajouterAdmin-error" role="alert">{error}</p>}

            <div className="ajouterAdmin-actions">
                <button type="button" className="ajouterAdmin-actions__cancel" onClick={onCancel} disabled={isLoading}>
                    Annuler
                </button>
                <button type="submit" className="ajouterAdmin-actions__submit" disabled={isLoading || !form.email || !form.password || !form.confirmation}>
                    {isLoading ? <span className="ajouterAdmin-spinner" aria-hidden="true" /> : "Créer l'administrateur"}
                </button>
            </div>
        </form>
    );
}

export default AjouterAdmin;
