import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import UserProfileDropdown from "../../components/shared/UserProfileDropdown";
import NotificationBell from "../../components/shared/NotificationBell";

import {
    LIVRAISON_DASHBOARD,
    LIVRAISON_COMMANDES,
    LIVRAISON_MES_LIVRAISONS,
    LIVRAISON_STATISTIQUES,
} from "../../services/livraison.js";

import Sidebar      from "../../components/modules/livraison/Sidebar.jsx";
import BottomNav    from "../../components/modules/livraison/BottomNav.jsx";
import Dashboard    from "../../components/modules/livraison/Dashboard.jsx";
import CommandesALivrer  from "../../components/modules/livraison/CommandesALivrer.jsx";
import ListeLivraisons   from "../../components/modules/livraison/ListeLivraisons.jsx";
import Statistiques from "../../components/modules/livraison/Statistiques.jsx";

import "../../assets/styles/pages/livraison.css";

const ONGLET_CONTENT = {
    [LIVRAISON_DASHBOARD]:      <Dashboard />,
    [LIVRAISON_COMMANDES]:      <CommandesALivrer />,
    [LIVRAISON_MES_LIVRAISONS]: <ListeLivraisons />,
    [LIVRAISON_STATISTIQUES]:   <Statistiques />,
};

function Livraison({ onglet }) {
    const ongletLabel = onglet ?? LIVRAISON_DASHBOARD;

    return (
        <div className="livraison-root">
            <Sidebar onglet={ongletLabel} />

            <div className="livraison-body">
                <header className="livraison-header">
                    <span className="livraison-header__title" aria-hidden="true">
                        Livraison
                    </span>

                    <nav className="livraison-header__breadcrumb" aria-label="Fil d'Ariane">
                        <Link to="/application" className="livraison-header__breadcrumb-root">
                            Livraison
                        </Link>
                        <ChevronRight size={14} className="livraison-header__breadcrumb-sep" aria-hidden="true" />
                        <span className="livraison-header__breadcrumb-current">{ongletLabel}</span>
                    </nav>

                    <div className="livraison-header__actions">
                        <NotificationBell btnClassName="livraison-header__action-btn" />
                        <UserProfileDropdown btnClassName="livraison-header__action-btn" />
                    </div>
                </header>

                <main className="livraison-content">
                    {ONGLET_CONTENT[ongletLabel] ?? (
                        <div className="livraison-notFound">
                            <p className="livraison-notFound__text">Page introuvable.</p>
                        </div>
                    )}
                </main>
            </div>

            <BottomNav onglet={ongletLabel} />
        </div>
    );
}

export default Livraison;
