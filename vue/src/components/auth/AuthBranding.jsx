import agoraLogo from '../../assets/images/logo_sans_background.svg';
import '../../assets/styles/components/auth/AuthBranding.css';

const AuthBranding = () => {
    return (
        <div className="authBranding-root">
            <div className="authBranding-glow authBranding-glow--1" />
            <div className="authBranding-glow authBranding-glow--2" />
            <div className="authBranding-glow authBranding-glow--3" />

            <div className="authBranding-content">
                <div className="authBranding-logo">
                    <img src={agoraLogo} alt="AGORA" className="authBranding-logo__img" />
                </div>

                <div className="authBranding-headline">
                    <h1 className="authBranding-title">
                        Gérez votre activité<br />
                        <span className="authBranding-title__accent">avec clarté.</span>
                    </h1>
                    <p className="authBranding-sub">
                        La plateforme de gestion tout-en-un conçue pour les PME modernes.
                    </p>
                </div>

                <div className="authBranding-widgets" aria-hidden="true">
                    <div className="authBranding-widget authBranding-widget--revenue">
                        <div className="authBranding-widget__icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                <polyline points="17 6 23 6 23 12" />
                            </svg>
                        </div>
                        <div className="authBranding-widget__body">
                            <span className="authBranding-widget__value">+24 ventes</span>
                            <span className="authBranding-widget__label">ce mois</span>
                        </div>
                    </div>

                    <div className="authBranding-widget authBranding-widget--payment">
                        <div className="authBranding-widget__dot" />
                        <div className="authBranding-widget__body">
                            <span className="authBranding-widget__value">Paiement reçu</span>
                            <span className="authBranding-widget__label">125 000 FCFA · il y a 2 min</span>
                        </div>
                    </div>

                    <div className="authBranding-widget authBranding-widget--chart">
                        <span className="authBranding-widget__label">Ventes — 7 derniers jours</span>
                        <div className="authBranding-chart">
                            {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
                                <div
                                    key={i}
                                    className="authBranding-chart__bar"
                                    style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="authBranding-footer">
                <p className="authBranding-footer__copy">
                    Rejoignez les PME qui font confiance à AGORA.
                </p>
            </div>
        </div>
    );
};

export default AuthBranding;
