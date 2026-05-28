import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    ChevronRight,
    LayoutDashboard,
    LoaderCircle,
    Package,
    Plus,
    ShoppingCart,
    Truck,
    Users,
    Wallet,
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { useAuthorization } from '../hooks/useAuthorization';
import { getEntreprisesFromApi } from '../utils/authorization';
import { getApiErrorMessage, isUnauthorizedError } from '../utils/mockApi';
import { resetBrowserStorage } from '../utils/session';
import agoraLogo from '../assets/images/logo_sans_background.svg';
import '../assets/styles/pages/ChoixRolePage.css';

const ROLE_ICONS = {
    manager:    LayoutDashboard,
    comptable:  Wallet,
    vendeur:    ShoppingCart,
    stock:      Package,
    rh:         Users,
    livreur:    Truck,
};

const RoleIcon = ({ icone, size = 22 }) => {
    const Icon = ROLE_ICONS[icone?.toLowerCase()] || LayoutDashboard;
    return <Icon size={size} strokeWidth={1.8} />;
};

const getCompanyInitials = (nom) => {
    const words = String(nom || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const CompanyAvatar = ({ company, size = 'md' }) => {
    const bg = company.logo ? 'transparent' : (company.couleur_primaire || '#F39C12');

    return (
        <div
            className={`choixRolePage-companyAvatar choixRolePage-companyAvatar--${size}`}
            style={{ background: bg }}
            aria-hidden="true"
        >
            {company.logo
                ? (
                    <img
                        src={company.logo}
                        alt={company.nom}
                        className="choixRolePage-companyAvatar__img"
                    />
                )
                : getCompanyInitials(company.nom)
            }
        </div>
    );
};

const STEPS = { COMPANY: 'company', ROLE: 'role' };

const ChoixRolePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { selectRole, isLoading: contextLoading } = useAuthorization();

    const [step, setStep] = useState(STEPS.COMPANY);
    const [entreprises, setEntreprises] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [fetchError, setFetchError] = useState('');

    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const data = await getEntreprisesFromApi();
                if (!cancelled) {
                    setEntreprises(data);
                }
            } catch (error) {
                if (cancelled) return;

                if (isUnauthorizedError(error)) {
                    resetBrowserStorage();
                    navigate('/login', { replace: true });
                    return;
                }

                setFetchError(getApiErrorMessage(error, 'Impossible de charger vos entreprises.'));
            } finally {
                if (!cancelled) setFetching(false);
            }
        })();

        return () => { cancelled = true; };
    }, [navigate]);

    const handleSelectCompany = (company) => {
        setSelectedCompany(company);
        setSelectedRole(null);
        setSubmitError('');
        setStep(STEPS.ROLE);
    };

    const handleChangeEmail = () => {
        resetBrowserStorage();
        navigate('/login', { replace: true });
    };

    const handleSelectRole = async (role) => {
        setSelectedRole(role);
        setSubmitError('');
        setSubmitting(true);

        try {
            const session = await selectRole({ entrepriseId: selectedCompany.id, roleId: role.id });
            if (session) {
                navigate('/application', { replace: true });
            }
        } catch (error) {
            if (isUnauthorizedError(error)) {
                resetBrowserStorage();
                navigate('/login', { replace: true });
                return;
            }

            setSubmitError(getApiErrorMessage(error, 'Impossible de rejoindre cet espace. Réessayez.'));
            setSelectedRole(null);
        } finally {
            setSubmitting(false);
        }
    };

    const prenom = user?.prenom ?? 'vous';

    return (
        <div className="choixRolePage-root" aria-busy={fetching || submitting || contextLoading}>
            {(fetching || submitting || contextLoading) && (
                <div className="choixRolePage-overlay" role="status" aria-live="polite">
                    <div className="choixRolePage-overlayCard">
                        <LoaderCircle size={26} className="choixRolePage-overlaySpinner" />
                        <p className="choixRolePage-overlayText">
                            {fetching ? 'Chargement de vos espaces…' : 'Validation du rôle…'}
                        </p>
                    </div>
                </div>
            )}

            <div className="choixRolePage-bg">
                <div className="choixRolePage-bg__blob choixRolePage-bg__blob--1" />
                <div className="choixRolePage-bg__blob choixRolePage-bg__blob--2" />
            </div>

            <div className="choixRolePage-shell">
                <header className="choixRolePage-header">
                    <div className="choixRolePage-logo">
                        <img src={agoraLogo} alt="AGORA" className="choixRolePage-logo__img" />
                    </div>
                </header>

                {/* ── STEP 1 : Sélection d'entreprise ─────────────────────── */}
                {step === STEPS.COMPANY && (
                    <div className="choixRolePage-step" key="company">
                        <div className="choixRolePage-headline">
                            <p className="choixRolePage-greeting">Bonjour, {prenom}</p>
                            <h1 className="choixRolePage-title">Choisissez votre espace</h1>
                            <p className="choixRolePage-desc">
                                Sélectionnez l'entreprise dans laquelle vous souhaitez travailler.
                            </p>
                        </div>

                        <div className="choixRolePage-actionRow">
                            <button
                                type="button"
                                className="choixRolePage-changeEmailBtn"
                                onClick={handleChangeEmail}
                                disabled={fetching || submitting}
                            >
                                Changer d'e-mail
                            </button>
                        </div>

                        {fetchError && !fetching && (
                            <div className="choixRolePage-error" role="alert">
                                <AlertCircle size={16} strokeWidth={2} />
                                <span>{fetchError}</span>
                            </div>
                        )}

                        {!fetching && !fetchError && (
                            <ul className="choixRolePage-list" aria-label="Liste des entreprises">
                                {entreprises.map((company) => (
                                    <li key={company.id}>
                                        <button
                                            type="button"
                                            className="choixRolePage-companyRow"
                                            onClick={() => handleSelectCompany(company)}
                                            aria-label={`Accéder à ${company.nom}`}
                                            disabled={fetching || submitting}
                                        >
                                            <CompanyAvatar company={company} size="md" />

                                            <div className="choixRolePage-companyInfo">
                                                <span className="choixRolePage-companyName">{company.nom}</span>
                                                <div className="choixRolePage-companyRoles">
                                                    {company.roles.map(r => (
                                                        <span key={r.id} className="choixRolePage-roleBadge">
                                                            {r.nom}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <ChevronRight size={18} strokeWidth={2} className="choixRolePage-chevron" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="choixRolePage-createRow">
                            <Link
                                to="/create-entreprise"
                                className="choixRolePage-createBtn"
                                aria-disabled={fetching || submitting}
                            >
                                <Plus size={16} strokeWidth={2.5} />
                                Créer une entreprise
                            </Link>
                        </div>
                    </div>
                )}

                {/* ── STEP 2 : Sélection du rôle ───────────────────────────── */}
                {step === STEPS.ROLE && selectedCompany && (
                    <div className="choixRolePage-step" key="role">
                        <button
                            type="button"
                            className="choixRolePage-backBtn"
                            onClick={() => { setStep(STEPS.COMPANY); setSelectedRole(null); setSubmitError(''); }}
                            aria-label="Retour à la sélection d'entreprise"
                            disabled={submitting}
                        >
                            <ArrowLeft size={18} strokeWidth={2} />
                        </button>

                        <div className="choixRolePage-headline">
                            <div className="choixRolePage-companyContext">
                                <CompanyAvatar company={selectedCompany} size="sm" />
                                <span className="choixRolePage-companyContext__name">{selectedCompany.nom}</span>
                            </div>
                            <h1 className="choixRolePage-title">Choisissez votre rôle</h1>
                            <p className="choixRolePage-desc">
                                Sélectionnez la mission dans laquelle vous intervenez.
                            </p>
                        </div>

                        <div className="choixRolePage-actionRow">
                            <button
                                type="button"
                                className="choixRolePage-changeEmailBtn"
                                onClick={handleChangeEmail}
                                disabled={submitting}
                            >
                                Changer d'e-mail
                            </button>
                        </div>

                        {submitError && (
                            <div className="choixRolePage-error" role="alert">
                                <AlertCircle size={15} strokeWidth={2} />
                                <span>{submitError}</span>
                            </div>
                        )}

                        <ul className="choixRolePage-list choixRolePage-list--roles" aria-label="Liste des rôles disponibles">
                            {selectedCompany.roles.map((role) => {
                                const isSelected = selectedRole?.id === role.id;
                                return (
                                    <li key={role.id}>
                                        <button
                                            type="button"
                                            className={`choixRolePage-roleRow${isSelected ? ' choixRolePage-roleRow--active' : ''}`}
                                            onClick={() => handleSelectRole(role)}
                                            disabled={submitting}
                                            aria-label={`Rejoindre en tant que ${role.nom}`}
                                        >
                                            <div
                                                className="choixRolePage-roleIcon"
                                                style={{ background: selectedCompany.couleur_primaire || 'var(--color-primary)' }}
                                            >
                                                {isSelected && submitting
                                                    ? <LoaderCircle size={22} className="choixRolePage-spinner" />
                                                    : <RoleIcon icone={role.id} size={22} />
                                                }
                                            </div>

                                            <div className="choixRolePage-roleInfo">
                                                <span className="choixRolePage-roleName">{role.nom}</span>
                                                <span className="choixRolePage-roleDesc">{role.description}</span>
                                            </div>

                                            <ChevronRight size={18} strokeWidth={2} className="choixRolePage-chevron" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="choixRolePage-createRow">
                            <Link
                                to="/create-entreprise"
                                className="choixRolePage-createBtn"
                                aria-disabled={submitting}
                            >
                                <Building2 size={15} strokeWidth={2} />
                                Ajouter une autre entreprise
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChoixRolePage;
