import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAdmin } from '../../context/AdminContext';

import '../../assets/styles/pages/admin/loginPage.css';

function LoginPageAdmin() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError]       = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { loginAdmin } = useAdmin();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            console.log("Yes")
            await loginAdmin({ email, password });
            navigate('/admin/choix-entreprise', { replace: true });
            console.log("No")
        } catch (err) {
            setError(err.message || 'Identifiants incorrects.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="adminLogin-root">
            <div className="adminLogin-card">
                <div className="adminLogin-brand">
                    <div className="adminLogin-logo" aria-hidden="true">
                        <span className="adminLogin-logo__letter">A</span>
                    </div>
                    <h1 className="adminLogin-title">Connexion Administrateur</h1>
                    <p className="adminLogin-subtitle">Accéder au centre de contrôle AGORA</p>
                </div>

                <form className="adminLogin-form" onSubmit={handleSubmit} noValidate>
                    <div className="adminLogin-field">
                        <label className="adminLogin-field__label" htmlFor="adminEmail">
                            Adresse e-mail
                        </label>
                        <input
                            id="adminEmail"
                            type="email"
                            className="adminLogin-field__input"
                            placeholder="admin@agora.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="adminLogin-field">
                        <label className="adminLogin-field__label" htmlFor="adminPassword">
                            Mot de passe
                        </label>
                        <div className="adminLogin-field__inputWrap">
                            <input
                                id="adminPassword"
                                type={showPass ? 'text' : 'password'}
                                className="adminLogin-field__input adminLogin-field__input--withToggle"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="adminLogin-field__eyeBtn"
                                onClick={() => setShowPass(v => !v)}
                                aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            >
                                {showPass ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="adminLogin-form__error" role="alert">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="adminLogin-form__submit"
                        disabled={isLoading || !email || !password}
                    >
                        {isLoading ? (
                            <span className="adminLogin-form__submitSpinner" aria-hidden="true" />
                        ) : 'Se connecter'}
                    </button>

                    <div className="adminLogin-form__links">
                        <Link to="/admin/forgot-password" className="adminLogin-form__forgotLink">
                            Mot de passe oublié ?
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPageAdmin;
