import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    Clock3,
    LoaderCircle,
    LogOut,
    ShieldCheck,
    UserCircle,
} from 'lucide-react';

import { useAuthorization } from '../hooks/useAuthorization';
import agoraLogo from '../assets/images/logo_sans_background.svg';
import '../assets/styles/pages/ApplicationPage.css';

const formatDateTime = (value) => {
    if (!value) {
        return 'Non renseignée';
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return 'Non renseignée';
    }

    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'long',
        timeStyle: 'medium',
    }).format(parsedDate);
};

const ApplicationPage = () => {
    const navigate = useNavigate();
    const { user, logoutAuthorization, isLoading } = useAuthorization();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const identity = useMemo(() => ({
        fullName: [user?.prenom, user?.nom].filter(Boolean).join(' ') || 'Utilisateur',
        email: user?.email || 'Adresse e-mail non renseignée',
        company: user?.entreprise?.nom || 'Entreprise non renseignée',
        role: user?.role || 'Rôle non renseigné',
        expiration: formatDateTime(user?.expires_at),
    }), [user]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const ok = await logoutAuthorization();
            if (ok) {
                navigate('/login', { replace: true });
            }
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <main className="applicationPage-root" aria-busy={isLoading || isLoggingOut}>
            {(isLoading || isLoggingOut) && (
                <div className="applicationPage-overlay" role="status" aria-live="polite">
                    <div className="applicationPage-overlayCard">
                        <LoaderCircle size={28} className="applicationPage-overlaySpinner" />
                        <p className="applicationPage-overlayText">
                            {isLoggingOut ? 'Déconnexion en cours…' : 'Chargement de votre espace…'}
                        </p>
                    </div>
                </div>
            )}

            <div className="applicationPage-shell">
                <header className="applicationPage-header">
                    <div className="applicationPage-brand">
                        <img src={agoraLogo} alt="AGORA" className="applicationPage-brand__logo" />
                        <div className="applicationPage-brand__copy">
                            <p className="applicationPage-kicker">Votre espace</p>
                            <h1 className="applicationPage-title">Bienvenue dans votre application</h1>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="applicationPage-logoutBtn"
                        onClick={handleLogout}
                        disabled={isLoading || isLoggingOut}
                    >
                        <LogOut size={16} />
                        <span>Déconnexion</span>
                    </button>
                </header>

                <section className="applicationPage-hero">
                    <div className="applicationPage-hero__icon" aria-hidden="true">
                        <ShieldCheck size={30} strokeWidth={1.6} />
                    </div>
                    <div className="applicationPage-hero__content">
                        <p className="applicationPage-hero__eyebrow">Session active</p>
                        <h2 className="applicationPage-hero__title">
                            Bonjour, {identity.fullName}
                        </h2>
                        <p className="applicationPage-hero__desc">
                            Vous êtes connecté sur l'entreprise <strong>{identity.company}</strong> en tant que <strong>{identity.role}</strong>.
                        </p>
                    </div>
                </section>

                <section className="applicationPage-grid" aria-label="Informations de session">
                    <article className="applicationPage-card">
                        <div className="applicationPage-card__icon" aria-hidden="true">
                            <UserCircle size={20} />
                        </div>
                        <div className="applicationPage-card__content">
                            <p className="applicationPage-card__label">Utilisateur</p>
                            <p className="applicationPage-card__value">{identity.fullName}</p>
                            <p className="applicationPage-card__meta">{identity.email}</p>
                        </div>
                    </article>

                    <article className="applicationPage-card">
                        <div className="applicationPage-card__icon" aria-hidden="true">
                            <Building2 size={20} />
                        </div>
                        <div className="applicationPage-card__content">
                            <p className="applicationPage-card__label">Entreprise</p>
                            <p className="applicationPage-card__value">{identity.company}</p>
                            <p className="applicationPage-card__meta">Espace de travail actif</p>
                        </div>
                    </article>

                    <article className="applicationPage-card">
                        <div className="applicationPage-card__icon" aria-hidden="true">
                            <ShieldCheck size={20} />
                        </div>
                        <div className="applicationPage-card__content">
                            <p className="applicationPage-card__label">Rôle</p>
                            <p className="applicationPage-card__value">{identity.role}</p>
                            <p className="applicationPage-card__meta">Accès en cours</p>
                        </div>
                    </article>

                    <article className="applicationPage-card">
                        <div className="applicationPage-card__icon" aria-hidden="true">
                            <Clock3 size={20} />
                        </div>
                        <div className="applicationPage-card__content">
                            <p className="applicationPage-card__label">Expiration</p>
                            <p className="applicationPage-card__value">{identity.expiration}</p>
                            <p className="applicationPage-card__meta">Fin de session côté serveur</p>
                        </div>
                    </article>
                </section>
            </div>
        </main>
    );
};

export default ApplicationPage;
