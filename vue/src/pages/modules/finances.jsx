import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, ChevronRight, Menu, User } from "lucide-react";

import {
    FINANCES_DASHBOARD,
    FINANCES_COMMANDES,
    FINANCES_REMBOURSEMENTS,
    FINANCES_DEPENSES,
    FINANCES_ENTREES,
    FINANCES_ABONNEMENTS,
    FINANCES_REAPPROVISIONNEMENTS,
    FINANCES_SALAIRES,
    FINANCES_JOURNAL_FINANCIER,
    FINANCES_STATISTIQUES,
} from "../../services/finances.js";

import Sidebar           from "../../components/modules/finances/Sidebar.jsx";
import FinancesBottomNav from "../../components/modules/finances/FinancesBottomNav.jsx";
import Dashboard         from "../../components/modules/finances/dashboard.jsx";
import Commandes         from "../../components/modules/finances/commandes.jsx";
import Remboursements    from "../../components/modules/finances/remboursements.jsx";
import Depenses          from "../../components/modules/finances/depenses.jsx";
import Entree            from "../../components/modules/finances/entree.jsx";
import Abonnements       from "../../components/modules/finances/abonnements.jsx";
import Reapprovisionnements from "../../components/modules/finances/reapprovisionnements.jsx";
import Salaires          from "../../components/modules/finances/salaires.jsx";
import JournalFinancier  from "../../components/modules/finances/journalFinancier.jsx";
import Statistiques      from "../../components/modules/finances/statistiques.jsx";

import "../../assets/styles/pages/finances.css";

const ONGLET_LABELS = {
    [FINANCES_DASHBOARD]:            "Dashboard",
    [FINANCES_COMMANDES]:            "Commandes",
    [FINANCES_REMBOURSEMENTS]:       "Remboursements",
    [FINANCES_DEPENSES]:             "Dépenses",
    [FINANCES_ENTREES]:              "Entrées",
    [FINANCES_ABONNEMENTS]:          "Abonnements",
    [FINANCES_REAPPROVISIONNEMENTS]: "Réapprovisionnements",
    [FINANCES_SALAIRES]:             "Salaires",
    [FINANCES_JOURNAL_FINANCIER]:    "Journal financier",
    [FINANCES_STATISTIQUES]:         "Statistiques",
};

const ONGLET_CONTENT = {
    [FINANCES_DASHBOARD]:            <Dashboard />,
    [FINANCES_COMMANDES]:            <Commandes />,
    [FINANCES_REMBOURSEMENTS]:       <Remboursements />,
    [FINANCES_DEPENSES]:             <Depenses />,
    [FINANCES_ENTREES]:              <Entree />,
    [FINANCES_ABONNEMENTS]:          <Abonnements />,
    [FINANCES_REAPPROVISIONNEMENTS]: <Reapprovisionnements />,
    [FINANCES_SALAIRES]:             <Salaires />,
    [FINANCES_JOURNAL_FINANCIER]:    <JournalFinancier />,
    [FINANCES_STATISTIQUES]:         <Statistiques />,
};

function Finances({ onglet }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const ongletLabel = onglet ?? FINANCES_DASHBOARD;
    const label = ONGLET_LABELS[ongletLabel] ?? "Finance";

    return (
        <div className="finances-root">
            {/* ── Sidebar ── */}
            <Sidebar
                onglet={ongletLabel}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* ── Corps principal ── */}
            <div className="finances-body">

                {/* Header sticky 64px */}
                <header className="finances-header">
                    <button
                        className="finances-header__burger"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Ouvrir la navigation"
                        aria-expanded={sidebarOpen}
                        aria-controls="finances-sidebar"
                        type="button"
                    >
                        <Menu size={22} aria-hidden="true" />
                    </button>

                    <span className="finances-header__title" aria-hidden="true">
                        Finance
                    </span>

                    <nav className="finances-header__breadcrumb" aria-label="Fil d'Ariane">
                        <Link to="/application" className="finances-header__breadcrumb-root">
                            Finance
                        </Link>
                        <ChevronRight
                            size={14}
                            className="finances-header__breadcrumb-sep"
                            aria-hidden="true"
                        />
                        <span className="finances-header__breadcrumb-current">{label}</span>
                    </nav>

                    <div className="finances-header__actions">
                        <button
                            className="finances-header__action-btn"
                            aria-label="Notifications"
                            type="button"
                        >
                            <Bell size={20} aria-hidden="true" />
                        </button>
                        <button
                            className="finances-header__action-btn"
                            aria-label="Profil utilisateur"
                            type="button"
                        >
                            <User size={20} aria-hidden="true" />
                        </button>
                    </div>
                </header>

                {/* Contenu de l'onglet actif */}
                <main className="finances-content">
                    {ONGLET_CONTENT[ongletLabel] ?? (
                        <div className="finances-notFound">
                            <p className="finances-notFound__text">Page introuvable.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* ── Bottom Navigation (mobile) ── */}
            <FinancesBottomNav onglet={ongletLabel} />
        </div>
    );
}

export default Finances;
