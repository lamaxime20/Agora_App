import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    ArrowLeft,
    Eye,
    EyeOff,
    KeyRound,
    LoaderCircle,
} from 'lucide-react';

import AuthLayout from '../components/auth/AuthLayout';
import OTPInput from '../components/auth/OTPInput';
import PasswordStrength from '../components/auth/PasswordStrength';
import {
    changePasswordFromApi,
    requestPasswordResetCodeFromApi,
    verifyPasswordResetCodeFromApi,
} from '../utils/auth';
import { getApiErrorMessage, isUnauthorizedError } from '../utils/mockApi';
import { resetBrowserStorage } from '../utils/session';
import {
    clearPasswordResetDraft,
    getPasswordResetDraft,
    isVerificationCodeStillValid,
    savePasswordResetDraft,
    validatePassword,
} from '../services/signupFlow';
import '../assets/styles/pages/ForgotPasswordPage.css';

const STEPS = { EMAIL: 'email', OTP: 'otp', PASSWORD: 'password' };

const createInitialDraft = () => getPasswordResetDraft() || {};

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const initialDraft = useMemo(createInitialDraft, []);

    const [step, setStep] = useState(initialDraft.stage || STEPS.EMAIL);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [globalError, setGlobalError] = useState('');

    const [email, setEmail] = useState(initialDraft.email || '');
    const [requestedEmail, setRequestedEmail] = useState(initialDraft.requestedEmail || initialDraft.email || '');
    const [otp, setOtp] = useState(initialDraft.otp || '');
    const [codeExpiresAt, setCodeExpiresAt] = useState(initialDraft.codeExpiresAt || null);
    const [resendAt, setResendAt] = useState(initialDraft.resendAt || 0);
    const [timer, setTimer] = useState(0);
    const [canResend, setCanResend] = useState(Boolean(!initialDraft.resendAt || Date.now() >= initialDraft.resendAt));

    const [password, setPassword] = useState(initialDraft.password || '');
    const [confirmPassword, setConfirmPassword] = useState(initialDraft.confirmPassword || '');
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        savePasswordResetDraft({
            stage: step,
            email,
            requestedEmail,
            otp,
            codeExpiresAt,
            resendAt,
            password,
            confirmPassword,
        });
    }, [codeExpiresAt, confirmPassword, email, otp, password, requestedEmail, resendAt, step]);

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
        const response = await requestPasswordResetCodeFromApi({ email });
        const nextResendAt = Date.now() + (response.canResendAfterSeconds * 1000);

        setCodeExpiresAt(response.expiresAt);
        setRequestedEmail(email);
        setResendAt(nextResendAt);
        setOtp('');
        setFieldErrors({});
        setGlobalError('');

        if (!preserveStep) {
            setStep(STEPS.OTP);
        }

        return response;
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});
        setGlobalError('');

        if (!email.trim()) {
            setFieldErrors({ email: "L’adresse e-mail est requise." });
            return;
        }

        const storedDraft = getPasswordResetDraft();
        const nextDraft = {
            stage: STEPS.OTP,
            email,
            requestedEmail,
            otp,
            codeExpiresAt,
            resendAt,
            password,
            confirmPassword,
        };

        savePasswordResetDraft(nextDraft);

        if (storedDraft?.requestedEmail?.trim().toLowerCase() === email.trim().toLowerCase() && isVerificationCodeStillValid({ expiresAt: storedDraft?.codeExpiresAt })) {
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

            if (error?.status === 404) {
                setFieldErrors({ email: error.message });
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
            await verifyPasswordResetCodeFromApi({
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
            await changePasswordFromApi({ email, password });
            clearPasswordResetDraft();
            navigate('/login', { replace: true });
        } catch (error) {
            if (isUnauthorizedError(error)) {
                handleUnauthorized();
                return;
            }

            setApiProblem(getApiErrorMessage(error, 'La modification du mot de passe a échoué.'));
        } finally {
            setLoading(false);
        }
    };

    const formatTimer = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

    return (
        <AuthLayout>
            <div className="forgotPage-root" aria-busy={loading}>
                {loading && (
                    <div className="forgotPage-overlay" role="status" aria-live="polite">
                        <div className="forgotPage-overlayCard">
                            <LoaderCircle size={28} className="forgotPage-overlaySpinner" />
                            <p className="forgotPage-overlayText">Traitement en cours…</p>
                        </div>
                    </div>
                )}

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
                                        className={`forgotPage-input${fieldErrors.email ? ' forgotPage-input--error' : ''}`}
                                        placeholder="vous@exemple.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        autoComplete="email"
                                        disabled={loading}
                                        autoFocus
                                    />
                                    {fieldErrors.email && (
                                        <span className="forgotPage-fieldError">
                                            <AlertCircle size={13} strokeWidth={2} /> {fieldErrors.email}
                                        </span>
                                    )}
                                </div>

                                {globalError && (
                                    <p className="forgotPage-globalError" role="alert">
                                        {globalError}
                                    </p>
                                )}

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

                {step === STEPS.OTP && (
                    <div className="forgotPage-step" key="otp">
                        <button
                            type="button"
                            className="forgotPage-backBtn"
                            onClick={() => setStep(STEPS.EMAIL)}
                            aria-label="Retour"
                            disabled={loading}
                        >
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
                                <OTPInput value={otp} onChange={setOtp} error={Boolean(fieldErrors.otp)} disabled={loading} />

                                {fieldErrors.otp && (
                                    <p className="forgotPage-otpError" role="alert">
                                        {fieldErrors.otp}
                                    </p>
                                )}

                                {globalError && (
                                    <p className="forgotPage-globalError" role="alert">
                                        {globalError}
                                    </p>
                                )}

                                <div className="forgotPage-timerRow">
                                    {canResend
                                        ? <button type="button" className="forgotPage-resendBtn" onClick={handleResendOtp} disabled={loading}>Renvoyer le code</button>
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

                {step === STEPS.PASSWORD && (
                    <div className="forgotPage-step" key="password">
                        <button type="button" className="forgotPage-backBtn" onClick={() => setStep(STEPS.OTP)} aria-label="Retour" disabled={loading}>
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
                                            className={`forgotPage-input forgotPage-input--withIcon${fieldErrors.password ? ' forgotPage-input--error' : ''}`}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            autoComplete="new-password"
                                            disabled={loading}
                                        />
                                        <button type="button" className="forgotPage-eyeBtn" onClick={() => setShowPass(v => !v)} tabIndex={-1} aria-label={showPass ? 'Masquer' : 'Afficher'} disabled={loading}>
                                            {showPass ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                                        </button>
                                    </div>
                                    <PasswordStrength password={password} />
                                    {fieldErrors.password && <span className="forgotPage-fieldError">{fieldErrors.password}</span>}
                                </div>

                                <div className="forgotPage-field">
                                    <label className="forgotPage-label" htmlFor="forgot-confirm">Confirmer le mot de passe</label>
                                    <div className="forgotPage-inputWrap">
                                        <input
                                            id="forgot-confirm"
                                            type={showConfirm ? 'text' : 'password'}
                                            className={`forgotPage-input forgotPage-input--withIcon${fieldErrors.confirm ? ' forgotPage-input--error' : ''}`}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            autoComplete="new-password"
                                            disabled={loading}
                                        />
                                        <button type="button" className="forgotPage-eyeBtn" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} aria-label={showConfirm ? 'Masquer' : 'Afficher'} disabled={loading}>
                                            {showConfirm ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
                                        </button>
                                    </div>
                                    {fieldErrors.confirm && <span className="forgotPage-fieldError">{fieldErrors.confirm}</span>}
                                </div>

                                {globalError && (
                                    <p className="forgotPage-globalError" role="alert">
                                        {globalError}
                                    </p>
                                )}

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
            </div>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
