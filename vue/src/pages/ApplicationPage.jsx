import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, LogOut } from 'lucide-react';

import CarteModule from '../components/carteModule';
import { useAuthorization } from '../hooks/useAuthorization';
import { modules } from '../services/choixModule';
import agoraLogo from '../assets/images/logo_sans_background.svg';
import '../assets/styles/pages/ApplicationPage.css';

const ApplicationPage = () => {
    const navigate = useNavigate();
    const { user, logoutAuthorization, isLoading } = useAuthorization();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const accessibleModules = useMemo(
        () => modules.filter((m) => m.roles.includes(user?.role)),
        [user?.role]
    );

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const ok = await logoutAuthorization();
            if (ok) navigate('/login', { replace: true });
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <main className="applicationPage-root" aria-busy={isLoading || isLoggingOut}>
            <div className="applicationPage-bg" aria-hidden="true">
                <div className="applicationPage-bg__blob applicationPage-bg__blob--1" />
                <div className="applicationPage-bg__blob applicationPage-bg__blob--2" />
            </div>

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
                    <img src={agoraLogo} alt="AGORA" className="applicationPage-logo" />
                    <button
                        type="button"
                        className="applicationPage-logoutBtn"
                        onClick={handleLogout}
                        disabled={isLoading || isLoggingOut}
                    >
                        <LogOut size={14} aria-hidden="true" />
                        <span>Déconnexion</span>
                    </button>
                </header>

                <section className="applicationPage-launcher" aria-label="Sélection du module">
                    <div className="applicationPage-headline">
                        <h1 className="applicationPage-title">
                            Sur quel module souhaitez-vous travailler ?
                        </h1>
                        <p className="applicationPage-subtitle">
                            Sélectionnez un espace pour commencer votre journée.
                        </p>
                    </div>

                    <div
                        className="applicationPage-modules"
                        style={{ '--col-count': Math.min(accessibleModules.length, 4) }}
                    >
                        {accessibleModules.map((module, index) => (
                            <CarteModule key={module.name} module={module} index={index} />
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
};

export default ApplicationPage;
