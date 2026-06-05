import { Link } from "react-router-dom";
import { Bell, ChevronRight, User } from "lucide-react";

import {
    VENTES_DASHBOARD,
    VENTES_COMMANDES,
    VENTES_RESERVATIONS,
    VENTES_CLIENTS,
    VENTES_STATISTIQUES,
} from "../../services/ventes.js";

import Sidebar      from "../../components/modules/ventes/Sidebar.jsx";
import BottomNav    from "../../components/modules/ventes/BottomNav.jsx";
import Dashboard    from "../../components/modules/ventes/dashboard.jsx";
import Commandes    from "../../components/modules/ventes/commandes.jsx";
import Reservations from "../../components/modules/ventes/reservations.jsx";
import Clients      from "../../components/modules/ventes/clients.jsx";
import Statistiques from "../../components/modules/ventes/statistiques.jsx";

import "../../assets/styles/pages/ventes.css";

const ONGLET_CONTENT = {
    [VENTES_DASHBOARD]:    <Dashboard />,
    [VENTES_COMMANDES]:    <Commandes />,
    [VENTES_RESERVATIONS]: <Reservations />,
    [VENTES_CLIENTS]:      <Clients />,
    [VENTES_STATISTIQUES]: <Statistiques />,
};

function Ventes({ onglet }) {
    const ongletLabel = onglet ?? VENTES_DASHBOARD;

    return (
        <div className="ventes-root">
            {/* ── Sidebar (desktop uniquement via CSS) ── */}
            <Sidebar onglet={ongletLabel} />

            {/* ── Corps principal ── */}
            <div className="ventes-body">

                {/* Header sticky 64px */}
                <header className="ventes-header">
                    {/* Mobile : titre du module */}
                    <span className="ventes-header__title" aria-hidden="true">
                        Ventes
                    </span>

                    {/* Desktop : breadcrumb */}
                    <nav className="ventes-header__breadcrumb" aria-label="Fil d'Ariane">
                        <Link to="/application" className="ventes-header__breadcrumb-root">
                            Ventes
                        </Link>
                        <ChevronRight
                            size={14}
                            className="ventes-header__breadcrumb-sep"
                            aria-hidden="true"
                        />
                        <span className="ventes-header__breadcrumb-current">{ongletLabel}</span>
                    </nav>

                    {/* Actions : notifications + profil */}
                    <div className="ventes-header__actions">
                        <button
                            className="ventes-header__action-btn"
                            aria-label="Notifications"
                            type="button"
                        >
                            <Bell size={20} aria-hidden="true" />
                        </button>
                        <button
                            className="ventes-header__action-btn"
                            aria-label="Profil utilisateur"
                            type="button"
                        >
                            <User size={20} aria-hidden="true" />
                        </button>
                    </div>
                </header>

                {/* Contenu de l'onglet actif */}
                <main className="ventes-content">
                    {ONGLET_CONTENT[ongletLabel] ?? (
                        <div className="ventes-notFound">
                            <p className="ventes-notFound__text">Page introuvable.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* ── Bottom Navigation (mobile uniquement via CSS) ── */}
            <BottomNav onglet={ongletLabel} />
        </div>
    );
}

export default Ventes;
