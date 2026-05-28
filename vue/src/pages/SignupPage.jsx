import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Eye, EyeOff, LoaderCircle,
    AlertCircle, ShieldCheck, Mail, CheckCircle,
} from 'lucide-react';

import AuthLayout from '../components/auth/AuthLayout';
import OTPInput from '../components/auth/OTPInput';
import PasswordStrength from '../components/auth/PasswordStrength';
import {
    clearSignupDraft,
    getSignupDraft,
    saveSignupDraft,
    simulateSignupStep,
    validatePassword,
    validateSignupInfo,
} from '../services/signupFlow';
import agoraLogo from '../assets/images/logo_sans_background.svg';
import '../assets/styles/pages/SignupPage.css';

const STEPS = { INFO: 'info', OTP: 'otp', PASSWORD: 'password', SUCCESS: 'success' };

const OTP_TIMER = 59;

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
);

const SignupPage = () => {
    const navigate = useNavigate();

    const [step, setStep]     = useState(STEPS.INFO);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors]  = useState({});

    const [prenom, setPrenom] = useState('');
    const [nom, setNom]       = useState('');
    const [email, setEmail]   = useState('');

    const [otp, setOtp]         = useState('');
    const [otpError, setOtpError] = useState(false);
    const [timer, setTimer]     = useState(OTP_TIMER);
    const [canResend, setCanResend] = useState(false);

    const [password, setPassword]         = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass]         = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);

    const timerRef = useRef(null);

    useEffect(() => {
        const draft = getSignupDraft();
        if (draft) {
            if (draft.prenom) setPrenom(draft.prenom);
            if (draft.nom) setNom(draft.nom);
            if (draft.email) setEmail(draft.email);
        }
    }, []);

    const startOtpTimer = () => {
        setTimer(OTP_TIMER);
        setCanResend(false);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimer(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    setCanResend(true);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
    };

    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        const errs = validateSignupInfo({ prenom, nom, email });
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({});
        setLoading(true);
        saveSignupDraft({ prenom, nom, email });
        await simulateSignupStep();
        setLoading(false);
        startOtpTimer();
        setStep(STEPS.OTP);
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        if (otp.replace(/\s/g, '').length < 6) {
            setOtpError(true);
            setTimeout(() => setOtpError(false), 600);
            return;
        }
        setLoading(true);
        await simulateSignupStep();
        setLoading(false);
        setStep(STEPS.PASSWORD);
    };

    const handleResendOtp = async () => {
        if (!canResend) return;
        setOtp('');
        startOtpTimer();
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const errs = validatePassword(password, confirmPassword);
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({});
        setLoading(true);
        await simulateSignupStep(900);
        clearSignupDraft();
        setLoading(false);
        setStep(STEPS.SUCCESS);
        setTimeout(() => navigate('/login', { replace: true }), 3200);
    };

    const formatTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    return (
        <AuthLayout>
            <div className="signupPage-root">

                {/* ── STEP 1 : Info ───────────────────────────────────────── */}
                {step === STEPS.INFO && (
                    <div className="signupPage-step" key="info">
                        <header className="signupPage-header">
                            <div className="signupPage-logo">
                                <img src={agoraLogo} alt="AGORA" className="signupPage-logo__img" />
                            </div>
                        </header>

                        <div className="signupPage-content">
                            <div className="signupPage-headline">
                                <h1 className="signupPage-title">Créer votre compte</h1>
                                <p className="signupPage-desc">
                                    Centralisez votre gestion commerciale en quelques minutes.
                                </p>
                            </div>

                            <form className="signupPage-form" onSubmit={handleInfoSubmit} noValidate>
                                <div className="signupPage-row">
                                    <div className="signupPage-field">
                                        <label className="signupPage-label" htmlFor="signup-prenom">Prénom</label>
                                        <input
                                            id="signup-prenom"
                                            type="text"
                                            className={`signupPage-input${errors.prenom ? ' signupPage-input--error' : ''}`}
                                            placeholder="Marie"
                                            value={prenom}
                                            onChange={e => setPrenom(e.target.value)}
                                            autoComplete="given-name"
                                            disabled={loading}
                                        />
                                        {errors.prenom && <span className="signupPage-fieldError">{errors.prenom}</span>}
                                    </div>
                                    <div className="signupPage-field">
                                        <label className="signupPage-label" htmlFor="signup-nom">Nom</label>
                                        <input
                                            id="signup-nom"
                                            type="text"
                                            className={`signupPage-input${errors.nom ? ' signupPage-input--error' : ''}`}
                                            placeholder="Dupont"
                                            value={nom}
                                            onChange={e => setNom(e.target.value)}
                                            autoComplete="family-name"
                                            disabled={loading}
                                        />
                                        {errors.nom && <span className="signupPage-fieldError">{errors.nom}</span>}
                                    </div>
                                </div>

                                <div className="signupPage-field">
                                    <label className="signupPage-label" htmlFor="signup-email">Adresse e-mail</label>
                                    <input
                                        id="signup-email"
                                        type="email"
                                        className={`signupPage-input${errors.email ? ' signupPage-input--error' : ''}`}
                                        placeholder="vous@exemple.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        autoComplete="email"
                                        disabled={loading}
                                    />
                                    {errors.email && (
                                        <span className="signupPage-fieldError">
                                            <AlertCircle size={13} strokeWidth={2} /> {errors.email}
                                        </span>
                                    )}
                                </div>

                                <button type="submit" className="signupPage-cta" disabled={loading}>
                                    {loading
                                        ? <><LoaderCircle size={18} className="signupPage-spinner" /> Envoi du code…</>
                                        : 'Continuer'
                                    }
                                </button>

                                <div className="signupPage-divider" aria-hidden="true">
                                    <span className="signupPage-divider__line" />
                                    <span className="signupPage-divider__text">ou</span>
                                    <span className="signupPage-divider__line" />
                                </div>

                                <button type="button" className="signupPage-googleBtn" aria-label="Continuer avec Google">
                                    <GoogleIcon />
                                    <span>Continuer avec Google</span>
                                </button>
                            </form>

                            <p className="signupPage-loginRow">
                                Vous avez déjà un compte ?{' '}
                                <Link to="/login" className="signupPage-loginLink">Se connecter</Link>
                            </p>
                        </div>
                    </div>
                )}

                {/* ── STEP 2 : OTP ────────────────────────────────────────── */}
                {step === STEPS.OTP && (
                    <div className="signupPage-step" key="otp">
                        <button
                            type="button"
                            className="signupPage-backBtn"
                            onClick={() => { setStep(STEPS.INFO); setOtp(''); }}
                            aria-label="Retour"
                        >
                            <ArrowLeft size={18} strokeWidth={2} />
                        </button>

                        <div className="signupPage-content">
                            <div className="signupPage-otpIcon">
                                <Mail size={28} strokeWidth={1.5} />
                                <div className="signupPage-otpIcon__glow" />
                            </div>

                            <div className="signupPage-headline">
                                <h1 className="signupPage-title">Vérification</h1>
                                <p className="signupPage-desc">
                                    Code envoyé à <strong>{email}</strong>.<br />
                                    Saisissez les 6 chiffres reçus.
                                </p>
                            </div>

                            <form className="signupPage-form signupPage-form--otp" onSubmit={handleOtpSubmit} noValidate>
                                <OTPInput
                                    value={otp}
                                    onChange={setOtp}
                                    error={otpError}
                                    disabled={loading}
                                />

                                {otpError && (
                                    <p className="signupPage-otpError" role="alert">
                                        Code incorrect. Vérifiez et réessayez.
                                    </p>
                                )}

                                <div className="signupPage-timerRow">
                                    {canResend
                                        ? (
                                            <button type="button" className="signupPage-resendBtn" onClick={handleResendOtp}>
                                                Renvoyer le code
                                            </button>
                                        )
                                        : (
                                            <span className="signupPage-timer">
                                                Renvoyer dans <strong>{formatTimer(timer)}</strong>
                                            </span>
                                        )
                                    }
                                </div>

                                <button type="submit" className="signupPage-cta" disabled={loading || otp.length < 6}>
                                    {loading
                                        ? <><LoaderCircle size={18} className="signupPage-spinner" /> Vérification…</>
                                        : 'Vérifier le code'
                                    }
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── STEP 3 : Password ───────────────────────────────────── */}
                {step === STEPS.PASSWORD && (
                    <div className="signupPage-step" key="password">
                        <button
                            type="button"
                            className="signupPage-backBtn"
                            onClick={() => setStep(STEPS.OTP)}
                            aria-label="Retour"
                        >
                            <ArrowLeft size={18} strokeWidth={2} />
                        </button>

                        <div className="signupPage-content">
                            <div className="signupPage-otpIcon signupPage-otpIcon--shield">
                                <ShieldCheck size={28} strokeWidth={1.5} />
                                <div className="signupPage-otpIcon__glow signupPage-otpIcon__glow--shield" />
                            </div>

                            <div className="signupPage-headline">
                                <h1 className="signupPage-title">Sécurisez votre compte</h1>
                                <p className="signupPage-desc">
                                    Dernière étape avant d'entrer dans votre espace.
                                </p>
                            </div>

                            <form className="signupPage-form" onSubmit={handlePasswordSubmit} noValidate>
                                <div className="signupPage-field">
                                    <label className="signupPage-label" htmlFor="signup-pass">Mot de passe</label>
                                    <div className="signupPage-inputWrap">
                                        <input
                                            id="signup-pass"
                                            type={showPass ? 'text' : 'password'}
                                            className={`signupPage-input signupPage-input--withIcon${errors.password ? ' signupPage-input--error' : ''}`}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            autoComplete="new-password"
                                            disabled={loading}
                                        />
                                        <button type="button" className="signupPage-eyeBtn" onClick={() => setShowPass(v => !v)} tabIndex={-1} aria-label={showPass ? 'Masquer' : 'Afficher'}>
                                            {showPass ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                                        </button>
                                    </div>
                                    <PasswordStrength password={password} />
                                    {errors.password && <span className="signupPage-fieldError">{errors.password}</span>}
                                </div>

                                <div className="signupPage-field">
                                    <label className="signupPage-label" htmlFor="signup-confirm">Confirmer le mot de passe</label>
                                    <div className="signupPage-inputWrap">
                                        <input
                                            id="signup-confirm"
                                            type={showConfirm ? 'text' : 'password'}
                                            className={`signupPage-input signupPage-input--withIcon${errors.confirm ? ' signupPage-input--error' : ''}`}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            autoComplete="new-password"
                                            disabled={loading}
                                        />
                                        <button type="button" className="signupPage-eyeBtn" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} aria-label={showConfirm ? 'Masquer' : 'Afficher'}>
                                            {showConfirm ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                                        </button>
                                    </div>
                                    {errors.confirm && <span className="signupPage-fieldError">{errors.confirm}</span>}
                                </div>

                                <button type="submit" className="signupPage-cta" disabled={loading}>
                                    {loading
                                        ? <><LoaderCircle size={18} className="signupPage-spinner" /> Création…</>
                                        : 'Créer mon compte'
                                    }
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── STEP 4 : Success ────────────────────────────────────── */}
                {step === STEPS.SUCCESS && (
                    <div className="signupPage-step signupPage-step--success" key="success">
                        <div className="signupPage-success">
                            <div className="signupPage-success__circle">
                                <div className="signupPage-success__glow" />
                                <CheckCircle size={48} strokeWidth={1.5} className="signupPage-success__icon" />
                                <div className="signupPage-success__particle signupPage-success__particle--1" />
                                <div className="signupPage-success__particle signupPage-success__particle--2" />
                                <div className="signupPage-success__particle signupPage-success__particle--3" />
                                <div className="signupPage-success__particle signupPage-success__particle--4" />
                                <div className="signupPage-success__particle signupPage-success__particle--5" />
                                <div className="signupPage-success__particle signupPage-success__particle--6" />
                            </div>
                            <h1 className="signupPage-success__title">Compte créé avec succès</h1>
                            <p className="signupPage-success__desc">
                                Préparation de votre espace de travail…
                            </p>
                            <div className="signupPage-success__loader">
                                <div className="signupPage-success__loaderBar" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
};

export default SignupPage;
