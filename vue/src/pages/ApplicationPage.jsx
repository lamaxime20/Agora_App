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

import CarteModule from '../components/carteModule';
import { useAuthorization } from '../hooks/useAuthorization';
import { modules } from '../services/choixModule';
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

                <section className="applicationPage-choixModule">
                    <h2 className="applicationPage-choixModuleTitle">
                        Sur quel module souhaitez-vous travailler aujourd'hui ?
                    </h2>
                    <div className="applicationPage-choixModuleList">
                        {modules.map((module) => (
                            <CarteModule key={module.name} module={module} />
                        ))}
                        {user?.role === 'directeur' && (
                            <a 
                                href="/application/parametres-entreprise"
                                className="applicationPage-parametresEntreprise"
                            >
                                <div className="applicationPage-parametresEntrepriseIcon">
                                    <ShieldCheck size={24} />
                                </div>
                                <h3 className="applicationPage-parametresEntrepriseTitle">
                                    Paramètres de l'entreprise
                                </h3>
                            </a>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
};

export default ApplicationPage;
