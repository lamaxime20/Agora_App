import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAdmin } from '../../context/AdminContext';
import { setAdminEntrepriseId } from '../../utils/adminAuth';
import { getCompanyListMock } from '../../services/admin/api';
import CreateEntrepriseAdmin from '../../components/admin/createEntreprise/CreateEntrepriseAdmin';

import '../../assets/styles/pages/admin/choixEntreprise.css';

function ChoixEntrepriseAdmin() {
    const [companies, setCompanies]           = useState([]);
    const [isLoading, setIsLoading]           = useState(true);
    const [error, setError]                   = useState('');
    const [showCreateFlow, setShowCreateFlow] = useState(false);
    const { logoutAdmin, admin }              = useAdmin();
    const navigate                            = useNavigate();

    const loadCompanies = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await getCompanyListMock();
            setCompanies(res?.data ?? []);
        } catch {
            setError('Impossible de charger les entreprises. Vérifiez votre connexion.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCompanies();
    }, [loadCompanies]);

    const handleSelectCompany = (company) => {
        setAdminEntrepriseId(company.id);
        navigate('/admin/application', { replace: true });
    };

    const handleCreateDone = () => {
        navigate('/admin/application', { replace: true });
    };

    if (showCreateFlow) {
        return (
            <CreateEntrepriseAdmin
                onDone={handleCreateDone}
                onCancel={() => setShowCreateFlow(false)}
            />
        );
    }

    return (
        <div className="adminChoixEntreprise-root">
            <header className="adminChoixEntreprise-header">
                <div className="adminChoixEntreprise-header__brand">
                    <div className="adminChoixEntreprise-logo" aria-hidden="true">A</div>
                    <span className="adminChoixEntreprise-header__name">AGORA</span>
                </div>
                <div className="adminChoixEntreprise-header__adminInfo">
                    <span className="adminChoixEntreprise-header__adminEmail">{admin?.email}</span>
                    <button
                        type="button"
                        className="adminChoixEntreprise-header__logoutBtn"
                        onClick={logoutAdmin}
                    >
                        Déconnexion
                    </button>
                </div>
            </header>

            <main className="adminChoixEntreprise-main">
                <div className="adminChoixEntreprise-content">
                    <h1 className="adminChoixEntreprise-title">
                        {isLoading ? 'Chargement...' : companies.length > 0 ? 'Choisissez une entreprise' : 'Aucune entreprise enregistrée'}
                    </h1>

                    {!isLoading && companies.length > 0 && (
                        <p className="adminChoixEntreprise-subtitle">
                            Sélectionnez l'entreprise à gérer depuis ce centre de contrôle.
                        </p>
                    )}

                    {isLoading && (
                        <div className="adminChoixEntreprise-skeleton" aria-label="Chargement">
                            {[1, 2].map(i => (
                                <div key={i} className="adminChoixEntreprise-skeleton__card" />
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="adminChoixEntreprise-error" role="alert">
                            <p className="adminChoixEntreprise-error__message">{error}</p>
                            <button
                                type="button"
                                className="adminChoixEntreprise-error__retry"
                                onClick={loadCompanies}
                            >
                                Réessayer
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && companies.length > 0 && (
                        <ul className="adminChoixEntreprise-list" role="list">
                            {companies.map(company => (
                                <li key={company.id} className="adminChoixEntreprise-list__item">
                                    <button
                                        type="button"
                                        className="adminChoixEntreprise-companyCard"
                                        onClick={() => handleSelectCompany(company)}
                                    >
                                        <div className="adminChoixEntreprise-companyCard__logoWrap">
                                            {company.logo ? (
                                                <img
                                                    src={company.logo}
                                                    alt={`Logo ${company.name}`}
                                                    className="adminChoixEntreprise-companyCard__logo"
                                                />
                                            ) : (
                                                <div className="adminChoixEntreprise-companyCard__logoPlaceholder" aria-hidden="true">
                                                    {company.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="adminChoixEntreprise-companyCard__info">
                                            <span className="adminChoixEntreprise-companyCard__name">{company.name}</span>
                                            <span className="adminChoixEntreprise-companyCard__secteur">{company.secteur}</span>
                                        </div>
                                        <div className="adminChoixEntreprise-companyCard__chevron" aria-hidden="true">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {!isLoading && !error && companies.length === 0 && (
                        <div className="adminChoixEntreprise-empty">
                            <div className="adminChoixEntreprise-empty__illustration" aria-hidden="true">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                            </div>
                            <p className="adminChoixEntreprise-empty__text">
                                Aucune entreprise n'est encore enregistrée sur la plateforme.
                            </p>
                            <button
                                type="button"
                                className="adminChoixEntreprise-empty__createBtn"
                                onClick={() => setShowCreateFlow(true)}
                            >
                                Créer une entreprise
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default ChoixEntrepriseAdmin;
