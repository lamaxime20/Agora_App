import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Eye, EyeOff, LoaderCircle,
    AlertCircle, KeyRound, CheckCircle,
} from 'lucide-react';

import AuthLayout from '../components/auth/AuthLayout';
import OTPInput from '../components/auth/OTPInput';
import PasswordStrength from '../components/auth/PasswordStrength';
import { simulateSignupStep, validatePassword } from '../services/signupFlow';
import '../assets/styles/pages/ForgotPasswordPage.css';

const STEPS = { EMAIL: 'email', OTP: 'otp', PASSWORD: 'password', SUCCESS: 'success' };
const OTP_TIMER = 59;

const ForgotPasswordPage = () => {
    const navigate = useNavigate();

    const [step, setStep]       = useState(STEPS.EMAIL);
    const [loading, setLoading] = useState(false);

    const [email, setEmail]     = useState('');
    const [emailError, setEmailError] = useState('');

    const [otp, setOtp]         = useState('');
    const [otpError, setOtpError] = useState(false);
    const [timer, setTimer]     = useState(OTP_TIMER);
    const [canResend, setCanResend] = useState(false);

    const [password, setPassword]         = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordErrors, setPasswordErrors]   = useState({});
    const [showPass, setShowPass]         = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);

    const timerRef = useRef(null);

    const startTimer = () => {
        setTimer(OTP_TIMER);
        setCanResend(false);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimer(t => {
                if (t <= 1) { clearInterval(timerRef.current); setCanResend(true); return 0; }
                return t - 1;
            });
        }, 1000);
    };

    const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) { setEmailError("L'adresse e-mail est requise."); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Adresse e-mail invalide.'); return; }
        setEmailError('');
        setLoading(true);
        await simulateSignupStep();
        setLoading(false);
        startTimer();
        setStep(STEPS.OTP);
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        if (otp.length < 6) {
            setOtpError(true);
            setTimeout(() => setOtpError(false), 600);
            return;
        }
        setLoading(true);
        await simulateSignupStep();
        setLoading(false);
        setStep(STEPS.PASSWORD);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const errs = validatePassword(password, confirmPassword);
        if (Object.keys(errs).length) { setPasswordErrors(errs); return; }
        setPasswordErrors({});
        setLoading(true);
        await simulateSignupStep(900);
        setLoading(false);
        setStep(STEPS.SUCCESS);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
    };

    return (
        <AuthLayout>
            <div className="forgotPage-root">

                {/* ── STEP 1 : Email ──────────────────────────────────────── */}
                {step === STEPS.EMAIL && (
                    <div className="forgotPage-step" key="email">
                        <Link to="/login" className="forgotPage-backBtn" aria-label="Retour à la connexion">
                            <ArrowLeft size={18} strokeWidth={2} />
                        </Link>

                        <div className="forgotPage-content">
                            <div className="forgotPage-icon">
                                <KeyRound size={28} strokeWidth={1.5} />
                                <div className="forgotPage-icon__glow" />
                            </div>

                            <div className="forgotPage-headline">
                                <h1 className="forgotPage-title">Mot de passe oublié ?</h1>
                                <p className="forgotPage-desc">
                                    Saisissez votre adresse e-mail. Nous vous enverrons un code de réinitialisation.
                                </p>
                            </div>

                            <form className="forgotPage-form" onSubmit={handleEmailSubmit} noValidate>
                                <div className="forgotPage-field">
                                    <label className="forgotPage-label" htmlFor="forgot-email">
                                        Adresse e-mail
                                    </label>
                                    <input
                                        id="forgot-email"
                                        type="email"
                                        className={`forgotPage-input${emailError ? ' forgotPage-input--error' : ''}`}
                                        placeholder="vous@exemple.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        autoComplete="email"
                                        disabled={loading}
                                        autoFocus
                                    />
                                    {emailError && (
                                        <span className="forgotPage-fieldError">
                                            <AlertCircle size={13} strokeWidth={2} /> {emailError}
                                        </span>
                                    )}
                                </div>

                                <button type="submit" className="forgotPage-cta" disabled={loading}>
                                    {loading
                                        ? <><LoaderCircle size={18} className="forgotPage-spinner" /> Envoi…</>
                                        : 'Envoyer le code'
                                    }
                                </button>
                            </form>

                            <p className="forgotPage-loginRow">
                                <Link to="/login" className="forgotPage-loginLink">
                                    <ArrowLeft size={13} strokeWidth={2.5} />
                                    Retour à la connexion
                                </Link>
                            </p>
                        </div>
                    </div>
                )}

                {/* ── STEP 2 : OTP ────────────────────────────────────────── */}
                {step === STEPS.OTP && (
                    <div className="forgotPage-step" key="otp">
                        <button type="button" className="forgotPage-backBtn" onClick={() => { setStep(STEPS.EMAIL); setOtp(''); }} aria-label="Retour">
                            <ArrowLeft size={18} strokeWidth={2} />
                        </button>

                        <div className="forgotPage-content">
                            <div className="forgotPage-icon forgotPage-icon--otp">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                </svg>
                                <div className="forgotPage-icon__glow" />
                            </div>

                            <div className="forgotPage-headline">
                                <h1 className="forgotPage-title">Vérification</h1>
                                <p className="forgotPage-desc">
                                    Code envoyé à <strong>{email}</strong>. Saisissez les 6 chiffres.
                                </p>
                            </div>

                            <form className="forgotPage-form forgotPage-form--otp" onSubmit={handleOtpSubmit} noValidate>
                                <OTPInput value={otp} onChange={setOtp} error={otpError} disabled={loading} />

                                {otpError && (
                                    <p className="forgotPage-otpError" role="alert">
                                        Code incorrect. Vérifiez et réessayez.
                                    </p>
                                )}

                                <div className="forgotPage-timerRow">
                                    {canResend
                                        ? <button type="button" className="forgotPage-resendBtn" onClick={() => { setOtp(''); startTimer(); }}>Renvoyer le code</button>
                                        : <span className="forgotPage-timer">Renvoyer dans <strong>{formatTimer(timer)}</strong></span>
                                    }
                                </div>

                                <button type="submit" className="forgotPage-cta" disabled={loading || otp.length < 6}>
                                    {loading
                                        ? <><LoaderCircle size={18} className="forgotPage-spinner" /> Vérification…</>
                                        : 'Confirmer'
                                    }
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── STEP 3 : New password ───────────────────────────────── */}
                {step === STEPS.PASSWORD && (
                    <div className="forgotPage-step" key="password">
                        <button type="button" className="forgotPage-backBtn" onClick={() => setStep(STEPS.OTP)} aria-label="Retour">
                            <ArrowLeft size={18} strokeWidth={2} />
                        </button>

                        <div className="forgotPage-content">
                            <div className="forgotPage-icon forgotPage-icon--shield">
                                <KeyRound size={28} strokeWidth={1.5} />
                                <div className="forgotPage-icon__glow forgotPage-icon__glow--shield" />
                            </div>

                            <div className="forgotPage-headline">
                                <h1 className="forgotPage-title">Nouveau mot de passe</h1>
                                <p className="forgotPage-desc">
                                    Choisissez un mot de passe sécurisé pour votre compte.
                                </p>
                            </div>

                            <form className="forgotPage-form" onSubmit={handlePasswordSubmit} noValidate>
                                <div className="forgotPage-field">
                                    <label className="forgotPage-label" htmlFor="forgot-pass">Nouveau mot de passe</label>
                                    <div className="forgotPage-inputWrap">
                                        <input
                                            id="forgot-pass"
                                            type={showPass ? 'text' : 'password'}
                                            className={`forgotPage-input forgotPage-input--withIcon${passwordErrors.password ? ' forgotPage-input--error' : ''}`}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            autoComplete="new-password"
                                            disabled={loading}
                                        />
                                        <button type="button" className="forgotPage-eyeBtn" onClick={() => setShowPass(v => !v)} tabIndex={-1} aria-label={showPass ? 'Masquer' : 'Afficher'}>
                                            {showPass ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                                        </button>
                                    </div>
                                    <PasswordStrength password={password} />
                                    {passwordErrors.password && <span className="forgotPage-fieldError">{passwordErrors.password}</span>}
                                </div>

                                <div className="forgotPage-field">
                                    <label className="forgotPage-label" htmlFor="forgot-confirm">Confirmer le mot de passe</label>
                                    <div className="forgotPage-inputWrap">
                                        <input
                                            id="forgot-confirm"
                                            type={showConfirm ? 'text' : 'password'}
                                            className={`forgotPage-input forgotPage-input--withIcon${passwordErrors.confirm ? ' forgotPage-input--error' : ''}`}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            autoComplete="new-password"
                                            disabled={loading}
                                        />
                                        <button type="button" className="forgotPage-eyeBtn" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} aria-label={showConfirm ? 'Masquer' : 'Afficher'}>
                                            {showConfirm ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                                        </button>
                                    </div>
                                    {passwordErrors.confirm && <span className="forgotPage-fieldError">{passwordErrors.confirm}</span>}
                                </div>

                                <button type="submit" className="forgotPage-cta" disabled={loading}>
                                    {loading
                                        ? <><LoaderCircle size={18} className="forgotPage-spinner" /> Enregistrement…</>
                                        : 'Réinitialiser le mot de passe'
                                    }
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── STEP 4 : Success ────────────────────────────────────── */}
                {step === STEPS.SUCCESS && (
                    <div className="forgotPage-step forgotPage-step--success" key="success">
                        <div className="forgotPage-success">
                            <div className="forgotPage-success__circle">
                                <div className="forgotPage-success__glow" />
                                <CheckCircle size={48} strokeWidth={1.5} className="forgotPage-success__icon" />
                            </div>
                            <h1 className="forgotPage-success__title">Mot de passe réinitialisé</h1>
                            <p className="forgotPage-success__desc">
                                Votre mot de passe a été mis à jour. Redirection vers la connexion…
                            </p>
                            <div className="forgotPage-success__loader">
                                <div className="forgotPage-success__loaderBar" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
