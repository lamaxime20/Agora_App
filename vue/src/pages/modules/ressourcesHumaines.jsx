import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronRight, Menu, User } from "lucide-react";

import { RH_DASHBOARD, RH_EMPLOYEES, RH_STATISTICS } from "../../services/rh.js";

import RhSidebar    from "../../components/modules/ressourcesHumaines/RhSidebar.jsx";
import RhBottomNav  from "../../components/modules/ressourcesHumaines/RhBottomNav.jsx";
import RhDashboard  from "../../components/modules/ressourcesHumaines/rhDashboard.jsx";
import RhEmployees  from "../../components/modules/ressourcesHumaines/rhEmployees.jsx";
import RhStatistics from "../../components/modules/ressourcesHumaines/rhStatistics.jsx";
import RhExportModal from "../../components/modules/ressourcesHumaines/rhExportModal.jsx";

import "../../assets/styles/pages/ressourcesHumaines.css";

const ONGLET_LABELS = {
    [RH_DASHBOARD]:  "Dashboard",
    [RH_EMPLOYEES]:  "Employés",
    [RH_STATISTICS]: "Statistiques",
};

function RessourcesHumaines({ onglet = RH_DASHBOARD, showAdd = false }) {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [exportOpen,  setExportOpen]  = useState(false);

    const ongletLabel = onglet ?? RH_DASHBOARD;
    const label = ONGLET_LABELS[ongletLabel] ?? "RH";

    const handleCloseAdd = () => {
        navigate("/application/ressources-humaines/employees", { replace: true });
    };

    const renderContent = () => {
        switch (ongletLabel) {
            case RH_DASHBOARD:
                return (
                    <RhDashboard
                        key="rh-dashboard"
                        onExport={() => setExportOpen(true)}
                    />
                );
            case RH_EMPLOYEES:
                return (
                    <RhEmployees
                        key="rh-employees"
                        showAdd={showAdd}
                        onCloseAdd={handleCloseAdd}
                        onExport={() => setExportOpen(true)}
                    />
                );
            case RH_STATISTICS:
                return (
                    <RhStatistics
                        key="rh-statistics"
                        onExport={() => setExportOpen(true)}
                    />
                );
            default:
                return (
                    <div className="rh-notFound">
                        <p className="rh-notFound__text">Page introuvable.</p>
                    </div>
                );
        }
    };

    return (
        <div className="rh-root">
            {/* ── Sidebar ── */}
            <RhSidebar
                onglet={ongletLabel}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* ── Corps principal ── */}
            <div className="rh-body">

                {/* Header sticky */}
                <header className="rh-header">
                    <button
                        className="rh-header__burger"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Ouvrir la navigation"
                        aria-expanded={sidebarOpen}
                        aria-controls="rh-sidebar"
                        type="button"
                    >
                        <Menu size={22} aria-hidden="true" />
                    </button>

                    <span className="rh-header__title" aria-hidden="true">
                        Ressources Humaines
                    </span>

                    <nav className="rh-header__breadcrumb" aria-label="Fil d'Ariane">
                        <Link to="/application" className="rh-header__breadcrumb-root">
                            Ressources Humaines
                        </Link>
                        <ChevronRight size={14} className="rh-header__breadcrumb-sep" aria-hidden="true" />
                        <span className="rh-header__breadcrumb-current">{label}</span>
                    </nav>

                    <div className="rh-header__actions">
                        <button
                            className="rh-header__action-btn"
                            aria-label="Notifications"
                            type="button"
                        >
                            <Bell size={20} aria-hidden="true" />
                        </button>
                        <button
                            className="rh-header__action-btn"
                            aria-label="Profil utilisateur"
                            type="button"
                        >
                            <User size={20} aria-hidden="true" />
                        </button>
                    </div>
                </header>

                {/* Contenu de l'onglet actif */}
                <main className="rh-content">
                    {renderContent()}
                </main>
            </div>

            {/* ── Bottom Navigation (mobile) ── */}
            <RhBottomNav onglet={ongletLabel} />

            {/* ── Export Modal ── */}
            {exportOpen && (
                <RhExportModal
                    onClose={() => setExportOpen(false)}
                    context={ongletLabel.toLowerCase()}
                />
            )}
        </div>
    );
}

export default RessourcesHumaines;
