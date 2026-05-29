import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import CreateEntrepriseHeader  from '../components/create_entreprise/CreateEntrepriseHeader';
import StepIdentite            from '../components/create_entreprise/StepIdentite';
import StepLogo                from '../components/create_entreprise/StepLogo';
import StepCouleurs            from '../components/create_entreprise/StepCouleurs';
import StepContact             from '../components/create_entreprise/StepContact';
import StepLocalisation        from '../components/create_entreprise/StepLocalisation';
import StepPolitique           from '../components/create_entreprise/StepPolitique';
import CreateEntrepriseLoading from '../components/create_entreprise/CreateEntrepriseLoading';
import CreateEntrepriseSuccess from '../components/create_entreprise/CreateEntrepriseSuccess';

import {
    getDraft,
    saveDraft,
    clearDraft,
    validateStep,
    submitCreateEntreprise,
} from '../services/createEntreprise';

import { getApiErrorMessage } from '../utils/mockApi';
import { resetBrowserStorage } from '../utils/session';

import agoraLogo from '../assets/images/logo_sans_background.svg';
import '../assets/styles/pages/createEntreprise.css';

// ─── Panneau branding gauche (desktop) ────────────────────────────────────────

const STEP_BRANDING = [
    { heading: 'Posez les premières pierres.', sub: 'Chaque grande entreprise commence par un nom.' },
    { heading: 'Donnez un visage à votre entreprise.', sub: 'Une identité visuelle forte renforce la confiance.' },
    { heading: 'Les couleurs parlent pour vous.', sub: 'Choisissez les teintes qui représentent votre marque.' },
    { heading: 'Restez accessible à vos clients.', sub: 'Un contact clair, une relation solide.' },
    { heading: 'Ancrez-vous dans votre territoire.', sub: 'Votre localisation construit votre crédibilité locale.' },
    { heading: 'La touche finale.', sub: 'Votre mission, vos valeurs — l\'âme de votre entreprise.' },
];

const BrandingPanel = ({ step }) => {
    const { heading, sub } = STEP_BRANDING[step - 1] || STEP_BRANDING[0];
    return (
        <div className="ceBranding-root">
            <div className="ceBranding-glow ceBranding-glow--1" />
            <div className="ceBranding-glow ceBranding-glow--2" />
            <div className="ceBranding-glow ceBranding-glow--3" />

            <div className="ceBranding-content">
                <div className="ceBranding-logo">
                    <img src={agoraLogo} alt="AGORA" className="ceBranding-logo__img" />
                </div>

                <div className="ceBranding-headline" key={step}>
                    <h2 className="ceBranding-heading">{heading}</h2>
                    <p className="ceBranding-sub">{sub}</p>
                </div>

                <div className="ceBranding-abstract" aria-hidden="true">
                    <div className="ceBranding-abstract__card ceBranding-abstract__card--1">
                        <div className="ceBranding-abstract__bar" style={{ width: '70%' }} />
                        <div className="ceBranding-abstract__bar" style={{ width: '50%' }} />
                        <div className="ceBranding-abstract__bar" style={{ width: '85%' }} />
                    </div>
                    <div className="ceBranding-abstract__card ceBranding-abstract__card--2">
                        <div className="ceBranding-abstract__dot ceBranding-abstract__dot--orange" />
                        <div className="ceBranding-abstract__dotLabel">
                            <div className="ceBranding-abstract__bar" style={{ width: '80%' }} />
                            <div className="ceBranding-abstract__bar" style={{ width: '55%' }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="ceBranding-footer">
                <p className="ceBranding-footer__text">
                    Votre entreprise se construit ici.
                </p>
            </div>
        </div>
    );
};

// ─── Page principale ──────────────────────────────────────────────────────────

const TOTAL_STEPS = 6;

const CreateEntreprisePage = () => {
    const navigate = useNavigate();

    const draft        = useRef(getDraft());
    const logoFileRef  = useRef(null);

    const [formData, setFormData]   = useState(() => draft.current);
    const [currentStep, setStep]    = useState(() => draft.current.step || 1);
    const [direction, setDirection] = useState('forward');
    const [status, setStatus]       = useState('form');
    const [errors, setErrors]       = useState({});
    const [autoSaved, setAutoSaved] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Auto-save to localStorage on every formData or step change
    useEffect(() => {
        saveDraft({ ...formData, step: currentStep });
        setAutoSaved(true);
        const timer = setTimeout(() => setAutoSaved(false), 2000);
        return () => clearTimeout(timer);
    }, [formData, currentStep]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleLogoFile = (file) => {
        logoFileRef.current = file;
    };

    const handleNext = () => {
        const errs = validateStep(currentStep, formData);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setErrors({});
        setDirection('forward');
        setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    };

    const handlePrev = () => {
        setErrors({});
        setDirection('back');
        setStep(prev => Math.max(prev - 1, 1));
    };

    const handleCancel = () => {
        navigate(-1);
    };

    const handleSubmit = async () => {
        const errs = validateStep(6, formData);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setErrors({});
        setSubmitError('');
        setStatus('loading');

        try {
            await submitCreateEntreprise({ ...formData, logoFile: logoFileRef.current });

            // Clear localStorage as per flow spec (cookie-based new token set by server)
            clearDraft();
            // resetBrowserStorage() — uncomment in production after real API is wired

            setStatus('success');
        } catch (err) {
            setStatus('form');
            setSubmitError(getApiErrorMessage(err, 'Une erreur est survenue. Réessayez.'));
        }
    };

    const handleGoToDashboard = () => {
        navigate('/application', { replace: true });
    };

    if (status === 'loading') {
        return <CreateEntrepriseLoading />;
    }

    if (status === 'success') {
        return <CreateEntrepriseSuccess onGoToDashboard={handleGoToDashboard} />;
    }

    const stepProps = {
        formData,
        onChange: handleChange,
        onNext:   handleNext,
        onPrev:   handlePrev,
        errors,
    };

    return (
        <div className="cePage-root">
            {/* Panneau branding — visible uniquement en desktop */}
            <aside className="cePage-branding" aria-hidden="true">
                <BrandingPanel step={currentStep} />
            </aside>

            {/* Zone formulaire principale */}
            <main className="cePage-main">
                <div className="cePage-shell">
                    <CreateEntrepriseHeader
                        currentStep={currentStep}
                        onCancel={handleCancel}
                        autoSaved={autoSaved}
                    />

                    {submitError && (
                        <div className="cePage-submitError" role="alert">
                            {submitError}
                        </div>
                    )}

                    <div
                        className={`cePage-stepWrap cePage-stepWrap--${direction}`}
                        key={`${currentStep}-${direction}`}
                    >
                        {currentStep === 1 && <StepIdentite {...stepProps} />}
                        {currentStep === 2 && (
                            <StepLogo {...stepProps} onLogoFile={handleLogoFile} />
                        )}
                        {currentStep === 3 && <StepCouleurs {...stepProps} />}
                        {currentStep === 4 && <StepContact {...stepProps} />}
                        {currentStep === 5 && <StepLocalisation {...stepProps} />}
                        {currentStep === 6 && (
                            <StepPolitique {...stepProps} onNext={handleSubmit} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CreateEntreprisePage;
