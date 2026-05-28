import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LoaderCircle, AlertCircle } from 'lucide-react';

import AuthLayout from '../components/auth/AuthLayout';
import { useAuth } from '../hooks/useAuth';
import agoraLogo from '../assets/images/logo_sans_background.svg';
import '../assets/styles/pages/LoginPage.css';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
);

const LoginPage = () => {
    const { loginAuth, isLoading } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail]           = useState(() => window.localStorage.getItem('auth_last_email') || '');
    const [password, setPassword]     = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError]           = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) { setError('Veuillez saisir votre adresse e-mail.'); return; }
        if (!password)     { setError('Veuillez saisir votre mot de passe.'); return; }

        window.localStorage.setItem('auth_last_email', email.trim());

        const ok = await loginAuth({ email: email.trim(), password });
        if (ok) {
            navigate('/choix-role', { replace: true });
        } else {
            setError('Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.');
        }
    };

    return (
        <AuthLayout>
            <div className="loginPage-root">
                <header className="loginPage-header">
                    <div className="loginPage-logo">
                        <img src={agoraLogo} alt="AGORA" className="loginPage-logo__img" />
                    </div>
                </header>

                <div className="loginPage-content">
                    <div className="loginPage-headline">
                        <h1 className="loginPage-title">Bon retour</h1>
                        <p className="loginPage-desc">
                            Connectez-vous pour accéder à votre espace de gestion.
                        </p>
                    </div>

                    <form className="loginPage-form" onSubmit={handleSubmit} noValidate>
                        <div className="loginPage-field">
                            <label className="loginPage-label" htmlFor="login-email">
                                Adresse e-mail
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                className="loginPage-input"
                                placeholder="vous@exemple.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                autoComplete="email"
                                disabled={isLoading}
                                aria-required="true"
                            />
                        </div>

                        <div className="loginPage-field">
                            <label className="loginPage-label" htmlFor="login-password">
                                Mot de passe
                            </label>
                            <div className="loginPage-inputWrap">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="loginPage-input loginPage-input--withIcon"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                    aria-required="true"
                                />
                                <button
                                    type="button"
                                    className="loginPage-eyeBtn"
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                    tabIndex={-1}
                                >
                                    {showPassword
                                        ? <EyeOff size={18} strokeWidth={1.8} />
                                        : <Eye size={18} strokeWidth={1.8} />
                                    }
                                </button>
                            </div>
                        </div>

                        <div className="loginPage-forgotRow">
                            <Link to="/forgot-password" className="loginPage-forgotLink">
                                Mot de passe oublié ?
                            </Link>
                        </div>

                        {error && (
                            <div className="loginPage-error" role="alert">
                                <AlertCircle size={15} strokeWidth={2} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="loginPage-cta"
                            disabled={isLoading}
                        >
                            {isLoading
                                ? <><LoaderCircle size={18} className="loginPage-spinner" /> Connexion…</>
                                : 'Se connecter'
                            }
                        </button>

                        <div className="loginPage-divider" aria-hidden="true">
                            <span className="loginPage-divider__line" />
                            <span className="loginPage-divider__text">ou</span>
                            <span className="loginPage-divider__line" />
                        </div>

                        <button type="button" className="loginPage-googleBtn" aria-label="Continuer avec Google">
                            <GoogleIcon />
                            <span>Continuer avec Google</span>
                        </button>
                    </form>

                    <p className="loginPage-signupRow">
                        Pas encore de compte ?{' '}
                        <Link to="/signup" className="loginPage-signupLink">
                            Créer un compte
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default LoginPage;
