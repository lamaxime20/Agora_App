import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
    requestAdminPasswordResetCodeFromApi,
    verifyAdminPasswordResetCodeFromApi,
    changeAdminPasswordFromApi,
} from '../../utils/adminAuth';

import '../../assets/styles/pages/admin/forgotPasswordPage.css';

const STEP_EMAIL    = 1;
const STEP_CODE     = 2;
const STEP_PASSWORD = 3;

function ForgotPasswordPageAdmin() {
    const [step, setStep]           = useState(STEP_EMAIL);
    const [email, setEmail]         = useState('');
    const [code, setCode]           = useState(['', '', '', '', '', '']);
    const [password, setPassword]   = useState('');
    const [confirm, setConfirm]     = useState('');
    const [error, setError]         = useState('');
    const [success, setSuccess]     = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const codeRefs = useRef([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (step !== STEP_CODE) return;
        let t = 60;
        setResendTimer(60);
        setCanResend(false);
        const interval = setInterval(() => {
            t -= 1;
            setResendTimer(t);
            if (t <= 0) {
                clearInterval(interval);
                setCanResend(true);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [step]);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await requestAdminPasswordResetCodeFromApi({ email });
            setStep(STEP_CODE);
        } catch (err) {
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeChange = (index, value) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...code];
        next[index] = digit;
        setCode(next);
        if (digit && index < 5) {
            codeRefs.current[index + 1]?.focus();
        }
    };

    const handleCodeKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            codeRefs.current[index - 1]?.focus();
        }
    };

    const handleCodePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setCode(pasted.split(''));
            e.preventDefault();
        }
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length < 6) { setError('Veuillez saisir les 6 chiffres.'); return; }
        setError('');
        setIsLoading(true);
        try {
            await verifyAdminPasswordResetCodeFromApi({ email, code: fullCode });
            setStep(STEP_PASSWORD);
        } catch (err) {
            setError(err.message || 'Code invalide ou expiré.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setError('');
        setIsLoading(true);
        try {
            await requestAdminPasswordResetCodeFromApi({ email });
            setCode(['', '', '', '', '', '']);
            setCanResend(false);
            setResendTimer(60);
        } catch (err) {
            setError(err.message || 'Impossible de renvoyer le code.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
        if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
        setError('');
        setIsLoading(true);
        try {
            await changeAdminPasswordFromApi({ email, password });
            setSuccess('Mot de passe modifié avec succès.');
            setTimeout(() => navigate('/admin/login', { replace: true }), 1500);
        } catch (err) {
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setIsLoading(false);
        }
    };

    const progressWidth = ((step - 1) / 2) * 100;

    return (
        <div className="adminForgot-root">
            <div className="adminForgot-progress" aria-hidden="true">
                <div
                    className="adminForgot-progress__bar"
                    style={{ width: `${progressWidth}%` }}
                />
            </div>

            <div className="adminForgot-card">
                <div className="adminForgot-header">
                    <Link to="/admin/login" className="adminForgot-backLink" aria-label="Retour à la connexion">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                    </Link>
                    <div className="adminForgot-steps" aria-label={`Étape ${step} sur 3`}>
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`adminForgot-steps__dot${s === step ? ' adminForgot-steps__dot--active' : s < step ? ' adminForgot-steps__dot--done' : ''}`} />
                        ))}
                    </div>
                </div>

                {step === STEP_EMAIL && (
                    <form className="adminForgot-form" onSubmit={handleEmailSubmit} noValidate>
                        <div className="adminForgot-form__headline">
                            <h1 className="adminForgot-form__title">Mot de passe oublié</h1>
                            <p className="adminForgot-form__subtitle">Saisissez votre adresse e-mail administrateur pour recevoir un code de réinitialisation.</p>
                        </div>
                        <div className="adminForgot-field">
                            <label className="adminForgot-field__label" htmlFor="forgotEmail">Adresse e-mail</label>
                            <input
                                id="forgotEmail"
                                type="email"
                                className="adminForgot-field__input"
                                placeholder="admin@agora.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                disabled={isLoading}
                            />
                        </div>
                        {error && <p className="adminForgot-form__error" role="alert">{error}</p>}
                        <button type="submit" className="adminForgot-form__submit" disabled={isLoading || !email}>
                            {isLoading ? <span className="adminForgot-form__spinner" aria-hidden="true" /> : 'Envoyer le code'}
                        </button>
                    </form>
                )}

                {step === STEP_CODE && (
                    <form className="adminForgot-form" onSubmit={handleCodeSubmit} noValidate>
                        <div className="adminForgot-form__headline">
                            <h1 className="adminForgot-form__title">Vérification</h1>
                            <p className="adminForgot-form__subtitle">Un code à 6 chiffres a été envoyé à <strong>{email}</strong>.</p>
                        </div>
                        <div className="adminForgot-otp" onPaste={handleCodePaste}>
                            {code.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => (codeRefs.current[i] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className={`adminForgot-otp__input${digit ? ' adminForgot-otp__input--filled' : ''}`}
                                    value={digit}
                                    onChange={e => handleCodeChange(i, e.target.value)}
                                    onKeyDown={e => handleCodeKeyDown(i, e)}
                                    aria-label={`Chiffre ${i + 1}`}
                                    disabled={isLoading}
                                />
                            ))}
                        </div>
                        <div className="adminForgot-form__resend">
                            {canResend ? (
                                <button type="button" className="adminForgot-form__resendBtn" onClick={handleResend} disabled={isLoading}>
                                    Renvoyer le code
                                </button>
                            ) : (
                                <span className="adminForgot-form__resendTimer">
                                    Renvoyer dans {resendTimer}s
                                </span>
                            )}
                        </div>
                        {error && <p className="adminForgot-form__error" role="alert">{error}</p>}
                        <div className="adminForgot-form__actions">
                            <button type="button" className="adminForgot-form__back" onClick={() => { setStep(STEP_EMAIL); setError(''); setCode(['','','','','','']); }}>
                                Précédent
                            </button>
                            <button type="submit" className="adminForgot-form__submit" disabled={isLoading || code.join('').length < 6}>
                                {isLoading ? <span className="adminForgot-form__spinner" aria-hidden="true" /> : 'Valider'}
                            </button>
                        </div>
                    </form>
                )}

                {step === STEP_PASSWORD && (
                    <form className="adminForgot-form" onSubmit={handlePasswordSubmit} noValidate>
                        <div className="adminForgot-form__headline">
                            <h1 className="adminForgot-form__title">Nouveau mot de passe</h1>
                            <p className="adminForgot-form__subtitle">Choisissez un nouveau mot de passe sécurisé.</p>
                        </div>
                        <div className="adminForgot-field">
                            <label className="adminForgot-field__label" htmlFor="newPassword">Nouveau mot de passe</label>
                            <input
                                id="newPassword"
                                type="password"
                                className="adminForgot-field__input"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="adminForgot-field">
                            <label className="adminForgot-field__label" htmlFor="confirmPassword">Confirmer le mot de passe</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="adminForgot-field__input"
                                placeholder="••••••••"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        {error && <p className="adminForgot-form__error" role="alert">{error}</p>}
                        {success && <p className="adminForgot-form__success" role="status">{success}</p>}
                        <div className="adminForgot-form__actions">
                            <button type="button" className="adminForgot-form__back" onClick={() => { setStep(STEP_EMAIL); setError(''); }}>
                                Précédent
                            </button>
                            <button type="submit" className="adminForgot-form__submit" disabled={isLoading || !password || !confirm}>
                                {isLoading ? <span className="adminForgot-form__spinner" aria-hidden="true" /> : 'Changer le mot de passe'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ForgotPasswordPageAdmin;
