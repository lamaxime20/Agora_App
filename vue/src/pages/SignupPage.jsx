import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    ArrowLeft,
    Eye,
    EyeOff,
    LoaderCircle,
    Mail,
    ShieldCheck,
} from 'lucide-react';

import AuthLayout from '../components/auth/AuthLayout';
import OTPInput from '../components/auth/OTPInput';
import PasswordStrength from '../components/auth/PasswordStrength';
import { useAuth } from '../hooks/useAuth';
import {
    createSignupAccountFromApi,
    requestSignupCodeFromApi,
    verifySignupCodeFromApi,
} from '../utils/auth';
import { getApiErrorMessage, isUnauthorizedError } from '../utils/mockApi';
import { resetBrowserStorage } from '../utils/session';
import {
    clearSignupDraft,
    getSignupDraft,
    saveSignupDraft,
    shouldRequestNewVerificationCode,
    validatePassword,
    validateSignupInfo,
} from '../services/signupFlow';
import agoraLogo from '../assets/images/logo_sans_background.svg';
import '../assets/styles/pages/SignupPage.css';

const STEPS = { INFO: 'info', OTP: 'otp', PASSWORD: 'password' };

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
);

const createInitialDraft = () => getSignupDraft() || {};

const SignupPage = () => {
    const navigate = useNavigate();
    const { loginAuth, isLoading: authLoading } = useAuth();

    const initialDraft = useMemo(createInitialDraft, []);

    const [step, setStep] = useState(initialDraft.stage || STEPS.INFO);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [globalError, setGlobalError] = useState('');

    const [prenom, setPrenom] = useState(initialDraft.prenom || '');
    const [nom, setNom] = useState(initialDraft.nom || '');
    const [email, setEmail] = useState(initialDraft.email || '');
    const [requestedEmail, setRequestedEmail] = useState(initialDraft.requestedEmail || initialDraft.email || '');

    const [otp, setOtp] = useState(initialDraft.otp || '');
    const [verificationCode, setVerificationCode] = useState(initialDraft.verificationCode || '');
    const [codeExpiresAt, setCodeExpiresAt] = useState(initialDraft.codeExpiresAt || null);
    const [resendAt, setResendAt] = useState(initialDraft.resendAt || 0);
    const [timer, setTimer] = useState(0);
    const [canResend, setCanResend] = useState(Boolean(!initialDraft.resendAt || Date.now() >= initialDraft.resendAt));

    const [password, setPassword] = useState(initialDraft.password || '');
    const [confirmPassword, setConfirmPassword] = useState(initialDraft.confirmPassword || '');
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        saveSignupDraft({
            stage: step,
            prenom,
            nom,
            email,
            requestedEmail,
            otp,
            verificationCode,
            codeExpiresAt,
            resendAt,
            password,
            confirmPassword,
        });
    }, [confirmPassword, codeExpiresAt, email, nom, otp, password, prenom, requestedEmail, resendAt, step, verificationCode]);

    useEffect(() => {
        if (step !== STEPS.OTP) {
            return undefined;
        }

        const refreshTimer = () => {
            const remaining = Math.max(resendAt - Date.now(), 0);
            setTimer(Math.ceil(remaining / 1000));
            setCanResend(remaining === 0);
            return remaining;
        };

        const remaining = refreshTimer();
        if (remaining === 0) {
            return undefined;
        }

        const intervalId = window.setInterval(refreshTimer, 1000);
        return () => window.clearInterval(intervalId);
    }, [resendAt, step]);

    const setApiProblem = (message) => {
        setGlobalError(message);
        setLoading(false);
    };

    const handleUnauthorized = () => {
        resetBrowserStorage();
        navigate('/login', { replace: true });
    };

    const requestCode = async ({ preserveStep = false } = {}) => {
        const response = await requestSignupCodeFromApi({ prenom, nom, email });
        const nextExpiresAt = response.expiresAt;
        const nextResendAt = Date.now() + (response.canResendAfterSeconds * 1000);

        setVerificationCode(response.verificationCode);
        setRequestedEmail(email);
        setCodeExpiresAt(nextExpiresAt);
        setResendAt(nextResendAt);
        setOtp('');
        setFieldErrors({});
        setGlobalError('');

        if (!preserveStep) {
            setStep(STEPS.OTP);
        }

        return response;
    };

    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        const errors = validateSignupInfo({ prenom, nom, email });
        setFieldErrors(errors);
        setGlobalError('');

        if (Object.keys(errors).length) {
            return;
        }

        const storedDraft = getSignupDraft();
        const nextDraft = {
            stage: STEPS.OTP,
            prenom,
            nom,
            email,
            requestedEmail,
            otp,
            verificationCode,
            codeExpiresAt,
            resendAt,
            password,
            confirmPassword,
        };

        saveSignupDraft(nextDraft);

        if (!shouldRequestNewVerificationCode(storedDraft, email) && storedDraft?.verificationCode) {
            setStep(STEPS.OTP);
            return;
        }

        setLoading(true);
        try {
            await requestCode();
        } catch (error) {
            if (isUnauthorizedError(error)) {
                handleUnauthorized();
                return;
            }

            if (error?.status === 409) {
                setFieldErrors(previous => ({ ...previous, email: error.message }));
            } else {
                setApiProblem(getApiErrorMessage(error, 'Impossible d’envoyer le code pour le moment.'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setGlobalError('');
        setFieldErrors(previous => ({ ...previous, otp: '' }));

        if (!otp.replace(/\s/g, '').trim() || otp.replace(/\s/g, '').length < 6) {
            setFieldErrors(previous => ({ ...previous, otp: 'Veuillez saisir les 6 chiffres du code.' }));
            return;
        }

        setLoading(true);
        try {
            await verifySignupCodeFromApi({
                code: otp,
                email,
                draft: {
                    expiresAt: codeExpiresAt,
                },
            });
            setStep(STEPS.PASSWORD);
            setFieldErrors({});
        } catch (error) {
            if (isUnauthorizedError(error)) {
                handleUnauthorized();
                return;
            }

            if (error?.status === 410) {
                setFieldErrors(previous => ({ ...previous, otp: error.message }));
            } else {
                setApiProblem(getApiErrorMessage(error, 'La vérification du code a échoué.'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!canResend || loading) {
            return;
        }

        setLoading(true);
        try {
            await requestCode({ preserveStep: true });
        } catch (error) {
            if (isUnauthorizedError(error)) {
                handleUnauthorized();
                return;
            }

            setApiProblem(getApiErrorMessage(error, 'Impossible de renvoyer le code pour le moment.'));
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const errors = validatePassword(password, confirmPassword);
        setFieldErrors(errors);
        setGlobalError('');

        if (Object.keys(errors).length) {
            return;
        }

        setLoading(true);
        try {
            await createSignupAccountFromApi({ prenom, nom, email, password });
            const loginSession = await loginAuth({ email, password });
            if (loginSession) {
                clearSignupDraft();
                navigate('/choix-role', { replace: true });
            }
        } catch (error) {
            if (isUnauthorizedError(error)) {
                handleUnauthorized();
                return;
            }

            setApiProblem(getApiErrorMessage(error, 'La création du compte a échoué.'));
        } finally {
            setLoading(false);
        }
    };

    const formatTimer = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

    return (
        <AuthLayout>
            <div className="signupPage-root" aria-busy={loading || authLoading}>
                {(loading || authLoading) && (
                    <div className="signupPage-overlay" role="status" aria-live="polite">
                        <div className="signupPage-overlayCard">
                            <LoaderCircle size={28} className="signupPage-overlaySpinner" />
                            <p className="signupPage-overlayText">
                                {step === STEPS.PASSWORD ? 'Création du compte…' : 'Traitement en cours…'}
                            </p>
                        </div>
                    </div>
                )}

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
                                            className={`signupPage-input${fieldErrors.prenom ? ' signupPage-input--error' : ''}`}
                                            placeholder="Marie"
                                            value={prenom}
                                            onChange={e => setPrenom(e.target.value)}
                                            autoComplete="given-name"
                                            disabled={loading || authLoading}
                                        />
                                        {fieldErrors.prenom && <span className="signupPage-fieldError">{fieldErrors.prenom}</span>}
                                    </div>
                                    <div className="signupPage-field">
                                        <label className="signupPage-label" htmlFor="signup-nom">Nom</label>
                                        <input
                                            id="signup-nom"
                                            type="text"
                                            className={`signupPage-input${fieldErrors.nom ? ' signupPage-input--error' : ''}`}
                                            placeholder="Dupont"
                                            value={nom}
                                            onChange={e => setNom(e.target.value)}
                                            autoComplete="family-name"
                                            disabled={loading || authLoading}
                                        />
                                        {fieldErrors.nom && <span className="signupPage-fieldError">{fieldErrors.nom}</span>}
                                    </div>
                                </div>

                                <div className="signupPage-field">
                                    <label className="signupPage-label" htmlFor="signup-email">Adresse e-mail</label>
                                    <input
                                        id="signup-email"
                                        type="email"
                                        className={`signupPage-input${fieldErrors.email ? ' signupPage-input--error' : ''}`}
                                        placeholder="vous@exemple.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        autoComplete="email"
                                        disabled={loading || authLoading}
                                    />
                                    {fieldErrors.email && (
                                        <span className="signupPage-fieldError">
                                            <AlertCircle size={13} strokeWidth={2} /> {fieldErrors.email}
                                        </span>
                                    )}
                                </div>

                                {globalError && (
                                    <p className="signupPage-globalError" role="alert">
                                        {globalError}
                                    </p>
                                )}

                                <button type="submit" className="signupPage-cta" disabled={loading || authLoading}>
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

                                <button type="button" className="signupPage-googleBtn" aria-label="Continuer avec Google" disabled={loading || authLoading}>
                                    <GoogleIcon />
                                    <span>Continuer avec Google</span>
                                </button>
                            </form>

                            <p className="signupPage-loginRow">
                                Vous avez déjà un compte ?{' '}
                                <Link to="/login" className="signupPage-loginLink">
                                    Se connecter
                                </Link>
                            </p>
                        </div>
                    </div>
                )}

                {step === STEPS.OTP && (
                    <div className="signupPage-step" key="otp">
                        <button
                            type="button"
                            className="signupPage-backBtn"
                            onClick={() => setStep(STEPS.INFO)}
                            aria-label="Retour"
                            disabled={loading || authLoading}
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
                                    error={Boolean(fieldErrors.otp)}
                                    disabled={loading || authLoading}
                                />

                                {fieldErrors.otp && (
                                    <p className="signupPage-otpError" role="alert">
                                        {fieldErrors.otp}
                                    </p>
                                )}

                                {globalError && (
                                    <p className="signupPage-globalError" role="alert">
                                        {globalError}
                                    </p>
                                )}

                                <div className="signupPage-timerRow">
                                    {canResend
                                        ? (
                                            <button type="button" className="signupPage-resendBtn" onClick={handleResendOtp} disabled={loading || authLoading}>
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

                                <button type="submit" className="signupPage-cta" disabled={loading || authLoading || otp.length < 6}>
                                    {loading
                                        ? <><LoaderCircle size={18} className="signupPage-spinner" /> Vérification…</>
                                        : 'Vérifier le code'
                                    }
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {step === STEPS.PASSWORD && (
                    <div className="signupPage-step" key="password">
                        <button
                            type="button"
                            className="signupPage-backBtn"
                            onClick={() => setStep(STEPS.OTP)}
                            aria-label="Retour"
                            disabled={loading || authLoading}
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
                                    Dernière étape avant d’entrer dans votre espace.
                                </p>
                            </div>

                            <form className="signupPage-form" onSubmit={handlePasswordSubmit} noValidate>
                                <div className="signupPage-field">
                                    <label className="signupPage-label" htmlFor="signup-pass">Mot de passe</label>
                                    <div className="signupPage-inputWrap">
                                        <input
                                            id="signup-pass"
                                            type={showPass ? 'text' : 'password'}
                                            className={`signupPage-input signupPage-input--withIcon${fieldErrors.password ? ' signupPage-input--error' : ''}`}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            autoComplete="new-password"
                                            disabled={loading || authLoading}
                                        />
                                        <button
                                            type="button"
                                            className="signupPage-eyeBtn"
                                            onClick={() => setShowPass(v => !v)}
                                            tabIndex={-1}
                                            aria-label={showPass ? 'Masquer' : 'Afficher'}
                                            disabled={loading || authLoading}
                                        >
                                            {showPass ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                                        </button>
                                    </div>
                                    <PasswordStrength password={password} />
                                    {fieldErrors.password && <span className="signupPage-fieldError">{fieldErrors.password}</span>}
                                </div>

                                <div className="signupPage-field">
                                    <label className="signupPage-label" htmlFor="signup-confirm">Confirmer le mot de passe</label>
                                    <div className="signupPage-inputWrap">
                                        <input
                                            id="signup-confirm"
                                            type={showConfirm ? 'text' : 'password'}
                                            className={`signupPage-input signupPage-input--withIcon${fieldErrors.confirm ? ' signupPage-input--error' : ''}`}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            autoComplete="new-password"
                                            disabled={loading || authLoading}
                                        />
                                        <button
                                            type="button"
                                            className="signupPage-eyeBtn"
                                            onClick={() => setShowConfirm(v => !v)}
                                            tabIndex={-1}
                                            aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                                            disabled={loading || authLoading}
                                        >
                                            {showConfirm ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                                        </button>
                                    </div>
                                    {fieldErrors.confirm && <span className="signupPage-fieldError">{fieldErrors.confirm}</span>}
                                </div>

                                {globalError && (
                                    <p className="signupPage-globalError" role="alert">
                                        {globalError}
                                    </p>
                                )}

                                <button type="submit" className="signupPage-cta" disabled={loading || authLoading}>
                                    {loading
                                        ? <><LoaderCircle size={18} className="signupPage-spinner" /> Création…</>
                                        : 'Créer mon compte'
                                    }
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
};

export default SignupPage;
