import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, ChevronRight, Bell } from "lucide-react";

import {
    VENTES_DASHBOARD,
    VENTES_COMMANDES,
    VENTES_RESERVATIONS,
    VENTES_CLIENTS,
    VENTES_STATISTIQUES,
} from "../../services/ventes.js";

import Sidebar     from "../../components/modules/ventes/Sidebar.jsx";
import Commandes   from "../../components/modules/ventes/commandes.jsx";
import Reservations from "../../components/modules/ventes/reservations.jsx";
import Clients     from "../../components/modules/ventes/clients.jsx";
import Statistiques from "../../components/modules/ventes/statistiques.jsx";

import "../../assets/styles/pages/ventes.css";

const ongletContent = {
    [VENTES_DASHBOARD]:    <VentesDashboardPlaceholder />,
    [VENTES_COMMANDES]:    <Commandes />,
    [VENTES_RESERVATIONS]: <Reservations />,
    [VENTES_CLIENTS]:      <Clients />,
    [VENTES_STATISTIQUES]: <Statistiques />,
};

function Ventes({ onglet }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setSidebarOpen(false);
    }, [onglet]);

    return (
        <div className="ventes-root">
            <div
                className={`ventes-overlay${sidebarOpen ? " ventes-overlay--visible" : ""}`}
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
            />

            <Sidebar
                onglet={onglet}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="ventes-body">
                <header className="ventes-header">
                    <button
                        className="ventes-header__burger"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Ouvrir la navigation"
                        aria-expanded={sidebarOpen}
                        aria-controls="ventes-sidebar"
                        type="button"
                    >
                        <Menu size={20} aria-hidden="true" />
                    </button>

                    <nav className="ventes-header__breadcrumb" aria-label="Fil d'Ariane">
                        <Link to="/application" className="ventes-header__breadcrumb-root">
                            Ventes
                        </Link>
                        <ChevronRight
                            size={14}
                            className="ventes-header__breadcrumb-sep"
                            aria-hidden="true"
                        />
                        <span className="ventes-header__breadcrumb-current">{onglet}</span>
                    </nav>

                    <div className="ventes-header__actions">
                        <button
                            className="ventes-header__action-btn"
                            aria-label="Notifications"
                            type="button"
                        >
                            <Bell size={20} aria-hidden="true" />
                        </button>
                    </div>
                </header>

                <main className="ventes-content">
                    {ongletContent[onglet] ?? (
                        <div className="ventes-notFound">
                            <p className="ventes-notFound__text">Page introuvable.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

function VentesDashboardPlaceholder() {
    return (
        <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "var(--space-2)" }}>
                Tableau de bord
            </h2>
            <p>Le dashboard Ventes arrive bientôt.</p>
        </div>
    );
}

export default Ventes;
