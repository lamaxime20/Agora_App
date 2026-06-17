import { useState } from 'react';

import { changeAdminEmailMock, changeAdminSelfPasswordMock } from '../../services/admin/api';
import { useAdmin } from '../../context/AdminContext';

import '../../assets/styles/pages/admin/parametresAdmin.css';

function ParametresAdmin() {
    const { admin } = useAdmin();

    const [emailForm, setEmailForm]             = useState({ nouvelEmail: '' });
    const [emailLoading, setEmailLoading]       = useState(false);
    const [emailError, setEmailError]           = useState('');
    const [emailSuccess, setEmailSuccess]       = useState('');

    const [passwordForm, setPasswordForm]       = useState({ ancien: '', nouveau: '', confirmation: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError]     = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setEmailError('');
        setEmailSuccess('');
        if (!emailForm.nouvelEmail) { setEmailError("L'adresse e-mail est requise."); return; }
        setEmailLoading(true);
        try {
            await changeAdminEmailMock(emailForm.nouvelEmail);
            setEmailSuccess('Adresse e-mail mise à jour avec succès.');
            setEmailForm({ nouvelEmail: '' });
            setTimeout(() => setEmailSuccess(''), 4000);
        } catch (err) {
            setEmailError(err.message || 'Une erreur est survenue.');
        } finally {
            setEmailLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        if (!passwordForm.ancien) { setPasswordError("L'ancien mot de passe est requis."); return; }
        if (passwordForm.nouveau.length < 8) { setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return; }
        if (passwordForm.nouveau !== passwordForm.confirmation) { setPasswordError('Les mots de passe ne correspondent pas.'); return; }
        setPasswordLoading(true);
        try {
            await changeAdminSelfPasswordMock(passwordForm.ancien, passwordForm.nouveau);
            setPasswordSuccess('Mot de passe mis à jour avec succès.');
            setPasswordForm({ ancien: '', nouveau: '', confirmation: '' });
            setTimeout(() => setPasswordSuccess(''), 4000);
        } catch (err) {
            setPasswordError(err.message || 'Une erreur est survenue.');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="parametresAdmin-root">
            <div className="parametresAdmin-topBar">
                <h2 className="parametresAdmin-topBar__title">Mes paramètres</h2>
                <p className="parametresAdmin-topBar__subtitle">Compte : <strong>{admin?.email}</strong></p>
            </div>

            <div className="parametresAdmin-cards">
                <div className="parametresAdmin-card">
                    <h3 className="parametresAdmin-card__title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        Changer l'adresse e-mail
                    </h3>
                    <p className="parametresAdmin-card__current">Adresse actuelle : <strong>{admin?.email}</strong></p>
                    <form className="parametresAdmin-form" onSubmit={handleEmailSubmit} noValidate>
                        <div className="parametresAdmin-field">
                            <label className="parametresAdmin-field__label" htmlFor="nouvelEmail">Nouvelle adresse e-mail</label>
                            <input
                                id="nouvelEmail"
                                type="email"
                                className="parametresAdmin-field__input"
                                placeholder="nouveau@agora.com"
                                value={emailForm.nouvelEmail}
                                onChange={e => setEmailForm(f => ({ ...f, nouvelEmail: e.target.value }))}
                                required
                                disabled={emailLoading}
                            />
                        </div>
                        {emailError   && <p className="parametresAdmin-form__error"   role="alert">{emailError}</p>}
                        {emailSuccess && <p className="parametresAdmin-form__success" role="status">{emailSuccess}</p>}
                        <button type="submit" className="parametresAdmin-form__submit" disabled={emailLoading || !emailForm.nouvelEmail}>
                            {emailLoading ? 'Mise à jour...' : "Changer l'e-mail"}
                        </button>
                    </form>
                </div>

                <div className="parametresAdmin-card">
                    <h3 className="parametresAdmin-card__title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        Changer le mot de passe
                    </h3>
                    <form className="parametresAdmin-form" onSubmit={handlePasswordSubmit} noValidate>
                        <div className="parametresAdmin-field">
                            <label className="parametresAdmin-field__label" htmlFor="ancienPassword">Mot de passe actuel</label>
                            <input
                                id="ancienPassword"
                                type="password"
                                className="parametresAdmin-field__input"
                                placeholder="••••••••"
                                value={passwordForm.ancien}
                                onChange={e => setPasswordForm(f => ({ ...f, ancien: e.target.value }))}
                                required
                                disabled={passwordLoading}
                            />
                        </div>
                        <div className="parametresAdmin-field">
                            <label className="parametresAdmin-field__label" htmlFor="nouveauPassword">Nouveau mot de passe</label>
                            <input
                                id="nouveauPassword"
                                type="password"
                                className="parametresAdmin-field__input"
                                placeholder="••••••••"
                                value={passwordForm.nouveau}
                                onChange={e => setPasswordForm(f => ({ ...f, nouveau: e.target.value }))}
                                required
                                disabled={passwordLoading}
                            />
                        </div>
                        <div className="parametresAdmin-field">
                            <label className="parametresAdmin-field__label" htmlFor="confirmationPassword">Confirmer le mot de passe</label>
                            <input
                                id="confirmationPassword"
                                type="password"
                                className="parametresAdmin-field__input"
                                placeholder="••••••••"
                                value={passwordForm.confirmation}
                                onChange={e => setPasswordForm(f => ({ ...f, confirmation: e.target.value }))}
                                required
                                disabled={passwordLoading}
                            />
                        </div>
                        {passwordError   && <p className="parametresAdmin-form__error"   role="alert">{passwordError}</p>}
                        {passwordSuccess && <p className="parametresAdmin-form__success" role="status">{passwordSuccess}</p>}
                        <button type="submit" className="parametresAdmin-form__submit" disabled={passwordLoading || !passwordForm.ancien || !passwordForm.nouveau || !passwordForm.confirmation}>
                            {passwordLoading ? 'Mise à jour...' : 'Changer le mot de passe'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ParametresAdmin;
