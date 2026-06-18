import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';

import { useAuthorization } from '../hooks/useAuthorization';
import { updateEmailFromApi, updatePasswordFromApi } from '../utils/userParametres';
import '../assets/styles/pages/parametres-utilisateur.css';

function FieldError({ message }) {
    if (!message) return null;
    return <p className="param-user__field-error" role="alert">{message}</p>;
}

function SuccessBanner({ message }) {
    if (!message) return null;
    return (
        <div className="param-user__success" role="status">
            <CheckCircle size={16} aria-hidden="true" />
            {message}
        </div>
    );
}

function ParametresUtilisateur() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuthorization();

    // ── Email form ──────────────────────────────────────────────────────────
    const [email, setEmail]           = useState(user?.email ?? '');
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailErrors, setEmailErrors]   = useState({});
    const [emailSuccess, setEmailSuccess] = useState('');

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setEmailErrors({});
        setEmailSuccess('');
        setEmailLoading(true);
        try {
            const result = await updateEmailFromApi({ email });
            updateUser({ email: result.email });
            setEmailSuccess('Adresse e-mail mise à jour.');
        } catch (err) {
            if (err?.details?.errors) {
                setEmailErrors(err.data.errors);
            } else {
                setEmailErrors({ email: err?.message ?? 'Une erreur est survenue.' });
            }
        } finally {
            setEmailLoading(false);
        }
    };

    // ── Password form ───────────────────────────────────────────────────────
    const [pwForm, setPwForm] = useState({
        password_actuel: '',
        password: '',
        password_confirmation: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        password_actuel: false,
        password: false,
        password_confirmation: false,
    });
    const [pwLoading, setPwLoading]   = useState(false);
    const [pwErrors,  setPwErrors]    = useState({});
    const [pwSuccess, setPwSuccess]   = useState('');

    const handlePwChange = (e) => {
        setPwForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const toggleShow = (field) => {
        setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handlePwSubmit = async (e) => {
        e.preventDefault();
        setPwErrors({});
        setPwSuccess('');
        setPwLoading(true);
        try {
            await updatePasswordFromApi(pwForm);
            setPwSuccess('Mot de passe mis à jour. Vous allez être déconnecté…');
            setPwForm({ password_actuel: '', password: '', password_confirmation: '' });
            // Let the server invalidate the session; back-navigation will show login
            setTimeout(() => navigate('/login', { replace: true }), 2500);
        } catch (err) {
            if (err?.details?.errors) {
                setPwErrors(err.data.errors);
            } else {
                setPwErrors({ password_actuel: err?.message ?? 'Une erreur est survenue.' });
            }
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <div className="param-user-root">
            <div className="param-user__inner">

                {/* Header */}
                <div className="param-user__header">
                    <button
                        type="button"
                        className="param-user__back-btn"
                        onClick={() => navigate(-1)}
                        aria-label="Retour"
                    >
                        <ArrowLeft size={18} aria-hidden="true" />
                    </button>
                    <h1 className="param-user__title">Paramètres du compte</h1>
                </div>

                {/* User info summary */}
                <div className="param-user__identity">
                    <p className="param-user__identity-name">{user?.prenom} {user?.nom}</p>
                    {user?.role && <span className="param-user__identity-role">{user.role}</span>}
                </div>

                {/* ── Section email ── */}
                <section className="param-user__section">
                    <div className="param-user__section-header">
                        <Mail size={18} className="param-user__section-icon" aria-hidden="true" />
                        <h2 className="param-user__section-title">Adresse e-mail</h2>
                    </div>

                    <form className="param-user__form" onSubmit={handleEmailSubmit} noValidate>
                        <div className="param-user__field">
                            <label className="param-user__label" htmlFor="email">
                                Nouvelle adresse e-mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                className={`param-user__input${emailErrors.email ? ' param-user__input--error' : ''}`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                            <FieldError message={emailErrors.email} />
                        </div>

                        <SuccessBanner message={emailSuccess} />

                        <button
                            type="submit"
                            className="param-user__submit-btn"
                            disabled={emailLoading || email === user?.email}
                        >
                            {emailLoading ? 'Mise à jour…' : "Mettre à jour l'e-mail"}
                        </button>
                    </form>
                </section>

                {/* ── Section password ── */}
                <section className="param-user__section">
                    <div className="param-user__section-header">
                        <Lock size={18} className="param-user__section-icon" aria-hidden="true" />
                        <h2 className="param-user__section-title">Mot de passe</h2>
                    </div>

                    <form className="param-user__form" onSubmit={handlePwSubmit} noValidate>
                        {[
                            { name: 'password_actuel',       label: 'Mot de passe actuel',          autocomplete: 'current-password' },
                            { name: 'password',              label: 'Nouveau mot de passe',          autocomplete: 'new-password' },
                            { name: 'password_confirmation', label: 'Confirmer le nouveau mot de passe', autocomplete: 'new-password' },
                        ].map(({ name, label, autocomplete }) => (
                            <div className="param-user__field" key={name}>
                                <label className="param-user__label" htmlFor={name}>{label}</label>
                                <div className="param-user__password-wrap">
                                    <input
                                        id={name}
                                        name={name}
                                        type={showPasswords[name] ? 'text' : 'password'}
                                        className={`param-user__input${pwErrors[name] ? ' param-user__input--error' : ''}`}
                                        value={pwForm[name]}
                                        onChange={handlePwChange}
                                        autoComplete={autocomplete}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="param-user__toggle-pw"
                                        onClick={() => toggleShow(name)}
                                        aria-label={showPasswords[name] ? 'Masquer' : 'Afficher'}
                                    >
                                        {showPasswords[name]
                                            ? <EyeOff size={16} aria-hidden="true" />
                                            : <Eye    size={16} aria-hidden="true" />
                                        }
                                    </button>
                                </div>
                                <FieldError message={pwErrors[name]} />
                            </div>
                        ))}

                        <SuccessBanner message={pwSuccess} />

                        <button
                            type="submit"
                            className="param-user__submit-btn"
                            disabled={pwLoading}
                        >
                            {pwLoading ? 'Mise à jour…' : 'Changer le mot de passe'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}

export default ParametresUtilisateur;
