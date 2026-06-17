import { Link, useNavigate } from 'react-router-dom';

import { useAdmin } from '../../context/AdminContext';

import '../../assets/styles/components/admin/navBar.css';

export const ADMIN_PRODUITS   = 'produits';
export const ADMIN_ENTREPRISE = 'entreprise';
export const ADMIN_EMPLOYE    = 'employe';
export const ADMIN_ADMIN      = 'gestionAdmin';
export const ADMIN_PARAMETRES = 'parametres';

const NAV_ITEMS = [
    {
        value: ADMIN_PRODUITS,
        label: 'Produits',
        path: '/admin/application/produit',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
        ),
    },
    {
        value: ADMIN_ENTREPRISE,
        label: 'Paramètres entreprise',
        path: '/admin/application/entreprise',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
        ),
    },
    {
        value: ADMIN_EMPLOYE,
        label: 'Employés',
        path: '/admin/application/employe',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
        ),
    },
];

function NavBarAdmin({ id, onglet, isOpen, onClose }) {
    const { admin, logoutAdmin } = useAdmin();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logoutAdmin();
    };

    const handleParametres = () => {
        navigate('/admin/application/parametres');
        onClose?.();
    };

    return (
        <aside
            id={id}
            className={`adminNavBar-root${isOpen ? ' adminNavBar-root--open' : ''}`}
            aria-label="Menu principal admin"
        >
            <div className="adminNavBar-header">
                <div className="adminNavBar-logo" aria-hidden="true">A</div>
                <span className="adminNavBar-brand">AGORA</span>
                <button
                    type="button"
                    className="adminNavBar-closeBtn"
                    onClick={onClose}
                    aria-label="Fermer le menu"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>

            <nav className="adminNavBar-nav">
                <ul className="adminNavBar-nav__list" role="list">
                    {NAV_ITEMS.map(item => (
                        <li key={item.value} className="adminNavBar-nav__item">
                            <Link
                                to={item.path}
                                className={`adminNavBar-nav__link${onglet === item.value ? ' adminNavBar-nav__link--active' : ''}`}
                                onClick={onClose}
                                aria-current={onglet === item.value ? 'page' : undefined}
                            >
                                <span className="adminNavBar-nav__icon">{item.icon}</span>
                                <span className="adminNavBar-nav__label">{item.label}</span>
                            </Link>
                        </li>
                    ))}

                    {admin?.originel && (
                        <li className="adminNavBar-nav__item">
                            <Link
                                to="/admin/application/gestionAdmin"
                                className={`adminNavBar-nav__link${onglet === ADMIN_ADMIN ? ' adminNavBar-nav__link--active' : ''}`}
                                onClick={onClose}
                                aria-current={onglet === ADMIN_ADMIN ? 'page' : undefined}
                            >
                                <span className="adminNavBar-nav__icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                    </svg>
                                </span>
                                <span className="adminNavBar-nav__label">Admins</span>
                            </Link>
                        </li>
                    )}
                </ul>
            </nav>

            <div className="adminNavBar-footer">
                <button
                    type="button"
                    className={`adminNavBar-footer__parametresBtn${onglet === ADMIN_PARAMETRES ? ' adminNavBar-footer__parametresBtn--active' : ''}`}
                    onClick={handleParametres}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    <span>Paramètres</span>
                </button>

                <div className="adminNavBar-footer__adminInfo">
                    <div className="adminNavBar-footer__avatar" aria-hidden="true">
                        {admin?.email?.charAt(0).toUpperCase() ?? 'A'}
                    </div>
                    <div className="adminNavBar-footer__details">
                        <span className="adminNavBar-footer__email">{admin?.email}</span>
                        {admin?.originel && <span className="adminNavBar-footer__badge">Principal</span>}
                    </div>
                    <button
                        type="button"
                        className="adminNavBar-footer__logoutBtn"
                        onClick={handleLogout}
                        aria-label="Se déconnecter"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default NavBarAdmin;
