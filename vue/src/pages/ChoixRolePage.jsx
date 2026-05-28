import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronRight, Plus, LayoutDashboard, Wallet,
    ShoppingCart, Package, Users, LoaderCircle,
    AlertCircle, ArrowLeft, Building2,
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import { useAuthorization } from '../hooks/useAuthorization';
import { getEntreprises } from '../services/entreprises';
import agoraLogo from '../assets/images/logo_sans_background.svg';
import '../assets/styles/pages/ChoixRolePage.css';

const ROLE_ICONS = {
    manager:    LayoutDashboard,
    comptable:  Wallet,
    vendeur:    ShoppingCart,
    stock:      Package,
    rh:         Users,
};

const RoleIcon = ({ icone, size = 22 }) => {
    const Icon = ROLE_ICONS[icone] || LayoutDashboard;
    return <Icon size={size} strokeWidth={1.8} />;
};

const STEPS = { COMPANY: 'company', ROLE: 'role' };

const ChoixRolePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { selectRole } = useAuthorization();

    const [step, setStep]               = useState(STEPS.COMPANY);
    const [entreprises, setEntreprises] = useState([]);
    const [fetching, setFetching]       = useState(true);
    const [fetchError, setFetchError]   = useState('');

    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedRole, setSelectedRole]       = useState(null);
    const [submitting, setSubmitting]           = useState(false);
    const [submitError, setSubmitError]         = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getEntreprises();
                if (!cancelled) setEntreprises(data);
            } catch (err) {
                if (!cancelled) setFetchError(err.message);
            } finally {
                if (!cancelled) setFetching(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleSelectCompany = (company) => {
        setSelectedCompany(company);
        setSelectedRole(null);
        setSubmitError('');
        setStep(STEPS.ROLE);
    };

    const handleSelectRole = async (role) => {
        setSelectedRole(role);
        setSubmitError('');
        setSubmitting(true);
        try {
            const ok = await selectRole({ entrepriseId: selectedCompany.id, roleId: role.id });
            if (ok) {
                navigate('/application', { replace: true });
            } else {
                setSubmitError('Impossible de rejoindre cet espace. Réessayez.');
                setSelectedRole(null);
            }
        } catch {
            setSubmitError('Une erreur est survenue. Vérifiez votre connexion.');
            setSelectedRole(null);
        } finally {
            setSubmitting(false);
        }
    };

    const prenom = user?.prenom ?? 'vous';

    return (
        <div className="choixRolePage-root">
            <div className="choixRolePage-bg">
                <div className="choixRolePage-bg__blob choixRolePage-bg__blob--1" />
                <div className="choixRolePage-bg__blob choixRolePage-bg__blob--2" />
            </div>

            <div className="choixRolePage-shell">

                {/* ── Header ──────────────────────────────────────────────── */}
                <header className="choixRolePage-header">
                    <div className="choixRolePage-logo">
                        <img src={agoraLogo} alt="AGORA" className="choixRolePage-logo__img" />
                    </div>
                </header>

                {/* ── STEP 1 : Company selection ──────────────────────────── */}
                {step === STEPS.COMPANY && (
                    <div className="choixRolePage-step" key="company">
                        <div className="choixRolePage-headline">
                            <p className="choixRolePage-greeting">Bonjour, {prenom}</p>
                            <h1 className="choixRolePage-title">Choisissez votre espace</h1>
                            <p className="choixRolePage-desc">
                                Sélectionnez l'entreprise dans laquelle vous souhaitez travailler.
                            </p>
                        </div>

                        {fetching && (
                            <div className="choixRolePage-loader">
                                <LoaderCircle size={24} className="choixRolePage-spinner" />
                                <span>Chargement de vos espaces…</span>
                            </div>
                        )}

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
                                        >
                                            <div
                                                className="choixRolePage-companyAvatar"
                                                style={{ background: company.couleur }}
                                                aria-hidden="true"
                                            >
                                                {company.initiales}
                                            </div>

                                            <div className="choixRolePage-companyInfo">
                                                <span className="choixRolePage-companyName">{company.nom}</span>
                                                <span className="choixRolePage-companySector">{company.secteur}</span>
                                            </div>

                                            <div className="choixRolePage-companyRoles">
                                                {company.roles.map(r => (
                                                    <span key={r.id} className="choixRolePage-roleBadge">
                                                        {r.nom}
                                                    </span>
                                                ))}
                                            </div>

                                            <ChevronRight size={18} strokeWidth={2} className="choixRolePage-chevron" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="choixRolePage-createRow">
                            <Link to="/create-entreprise" className="choixRolePage-createBtn">
                                <Plus size={16} strokeWidth={2.5} />
                                Créer une entreprise
                            </Link>
                        </div>
                    </div>
                )}

                {/* ── STEP 2 : Role selection ─────────────────────────────── */}
                {step === STEPS.ROLE && selectedCompany && (
                    <div className="choixRolePage-step" key="role">
                        <button
                            type="button"
                            className="choixRolePage-backBtn"
                            onClick={() => { setStep(STEPS.COMPANY); setSelectedRole(null); setSubmitError(''); }}
                            aria-label="Retour à la sélection d'entreprise"
                        >
                            <ArrowLeft size={18} strokeWidth={2} />
                        </button>

                        <div className="choixRolePage-headline">
                            <div className="choixRolePage-companyContext">
                                <div
                                    className="choixRolePage-companyContext__avatar"
                                    style={{ background: selectedCompany.couleur }}
                                    aria-hidden="true"
                                >
                                    {selectedCompany.initiales}
                                </div>
                                <span className="choixRolePage-companyContext__name">{selectedCompany.nom}</span>
                            </div>
                            <h1 className="choixRolePage-title">Choisissez votre rôle</h1>
                            <p className="choixRolePage-desc">
                                Sélectionnez la mission dans laquelle vous intervenez.
                            </p>
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
                                            <div className="choixRolePage-roleIcon">
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
                            <Link to="/create-entreprise" className="choixRolePage-createBtn">
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
