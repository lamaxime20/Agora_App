import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAdmin } from '../../context/AdminContext';
import { getAdminEntrepriseId } from '../../utils/adminAuth';

import NavBarAdmin, {
    ADMIN_PRODUITS,
    ADMIN_ENTREPRISE,
    ADMIN_EMPLOYE,
    ADMIN_ADMIN,
    ADMIN_PARAMETRES,
} from '../../components/admin/navBar';

import ProduitsAdmin     from './produits';
import EntrepriseAdmin   from './entreprise';
import EmployesAdmin     from './employes';
import AdminGestion      from './admin';
import ParametresAdmin   from './parametresAdmin';

import '../../assets/styles/pages/admin/applicationPage.css';

function ApplicationPageAdmin({ onglet }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { admin }    = useAdmin();
    const navigate     = useNavigate();

    useEffect(() => {
        const entrepriseId = getAdminEntrepriseId();
        if (!entrepriseId) {
            navigate('/admin/choix-entreprise', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        setSidebarOpen(false);
    }, [onglet]);

    const getPageTitle = () => {
        switch (onglet) {
            case ADMIN_PRODUITS:   return 'Produits';
            case ADMIN_ENTREPRISE: return 'Paramètres entreprise';
            case ADMIN_EMPLOYE:    return 'Employés';
            case ADMIN_ADMIN:      return 'Admins';
            case ADMIN_PARAMETRES: return 'Mes paramètres';
            default:               return 'Administration';
        }
    };

    return (
        <div className="adminApp-root">
            <header className="adminApp-header">
                <button
                    type="button"
                    className="adminApp-header__hamburger"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Ouvrir le menu"
                    aria-expanded={sidebarOpen}
                    aria-controls="adminSidebar"
                >
                    <span className="adminApp-header__hamburgerLine" aria-hidden="true" />
                    <span className="adminApp-header__hamburgerLine" aria-hidden="true" />
                    <span className="adminApp-header__hamburgerLine" aria-hidden="true" />
                </button>

                <h1 className="adminApp-header__title">{getPageTitle()}</h1>

                <div className="adminApp-header__avatar" aria-label={`Connecté en tant que ${admin?.email}`}>
                    <span className="adminApp-header__avatarLetter" aria-hidden="true">
                        {admin?.email?.charAt(0).toUpperCase() ?? 'A'}
                    </span>
                </div>
            </header>

            {sidebarOpen && (
                <div
                    className="adminApp-overlay"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            <div className="adminApp-layout">
                <NavBarAdmin
                    id="adminSidebar"
                    onglet={onglet}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <main className="adminApp-content">
                    {onglet === ADMIN_PRODUITS   && <ProduitsAdmin />}
                    {onglet === ADMIN_ENTREPRISE && <EntrepriseAdmin />}
                    {onglet === ADMIN_EMPLOYE    && <EmployesAdmin />}
                    {onglet === ADMIN_ADMIN      && <AdminGestion />}
                    {onglet === ADMIN_PARAMETRES && <ParametresAdmin />}
                </main>
            </div>
        </div>
    );
}

export default ApplicationPageAdmin;
