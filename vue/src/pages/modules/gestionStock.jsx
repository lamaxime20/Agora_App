import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, Bell, ChevronRight, Search, User, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import {
    GESTION_STOCK_DASHBOARD,
    GESTION_STOCK_PRODUITS,
    GESTION_STOCK_REAPPROVISIONNEMENT,
    GESTION_STOCK_RESERVATIONS,
    GESTION_STOCK_PERTES,
    GESTION_STOCK_STATISTIQUES
} from "../../services/gestionStock.js";

import Sidebar from "../../components/modules/gestionStocks/sidebar.jsx";
import Dashboard from "../../components/modules/gestionStocks/dashboard.jsx";
import Produits from "../../components/modules/gestionStocks/produits.jsx";
import Reapprovisionnement from "../../components/modules/gestionStocks/reapprovisionnement.jsx";
import Reservations from "../../components/modules/gestionStocks/reservations.jsx";
import Pertes from "../../components/modules/gestionStocks/pertes.jsx";
import Statistiques from "../../components/modules/gestionStocks/statistiques.jsx";

import "../../assets/styles/pages/gestionStock.css";

const ongletContent = {
    [GESTION_STOCK_DASHBOARD]:          <Dashboard />,
    [GESTION_STOCK_PRODUITS]:            <Produits />,
    [GESTION_STOCK_REAPPROVISIONNEMENT]: <Reapprovisionnement />,
    [GESTION_STOCK_RESERVATIONS]:        <Reservations />,
    [GESTION_STOCK_PERTES]:              <Pertes />,
    [GESTION_STOCK_STATISTIQUES]:        <Statistiques />,
};

function GestionStock({ onglet }) {
    const [sidebarOpen, setSidebarOpen]           = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        setSidebarOpen(false);
    }, [onglet]);

    return (
        <div className={`gestionStock-root${sidebarCollapsed ? " gestionStock-root--collapsed" : ""}`}>
            <div
                className={`gestionStock-overlay${sidebarOpen ? " gestionStock-overlay--visible" : ""}`}
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
            />

            <Sidebar
                onglet={onglet}
                isOpen={sidebarOpen}
                isCollapsed={sidebarCollapsed}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="gestionStock-body">
                <header className="gestionStock-header">
                    <button
                        className="gestionStock-header__burger"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Ouvrir la navigation"
                        aria-expanded={sidebarOpen}
                        aria-controls="gestionStock-sidebar"
                        type="button"
                    >
                        <Menu size={20} aria-hidden="true" />
                    </button>

                    <button
                        className="gestionStock-header__collapse"
                        onClick={() => setSidebarCollapsed(prev => !prev)}
                        aria-label={sidebarCollapsed ? "Développer la navigation" : "Réduire la navigation"}
                        type="button"
                    >
                        {sidebarCollapsed
                            ? <PanelLeftOpen  size={20} aria-hidden="true" />
                            : <PanelLeftClose size={20} aria-hidden="true" />
                        }
                    </button>

                    <nav className="gestionStock-header__breadcrumb" aria-label="Fil d'Ariane">
                        <Link to="/application" className="gestionStock-header__breadcrumb-root">
                            Stock
                        </Link>
                        <ChevronRight
                            size={14}
                            className="gestionStock-header__breadcrumb-sep"
                            aria-hidden="true"
                        />
                        <span className="gestionStock-header__breadcrumb-current">{onglet}</span>
                    </nav>

                    <div className="gestionStock-header__search" role="search">
                        <Search size={16} className="gestionStock-header__search-icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="gestionStock-header__search-input"
                            placeholder="Rechercher dans le stock…"
                            aria-label="Recherche dans le stock"
                        />
                    </div>

                    <div className="gestionStock-header__actions">
                        <button
                            className="gestionStock-header__notif"
                            aria-label="Notifications — 3 non lues"
                            type="button"
                        >
                            <Bell size={20} aria-hidden="true" />
                            <span className="gestionStock-header__notif-badge" aria-hidden="true">3</span>
                        </button>

                        <button
                            className="gestionStock-header__profile"
                            aria-label="Mon profil"
                            type="button"
                        >
                            <User size={18} aria-hidden="true" />
                        </button>
                    </div>
                </header>

                <main className="gestionStock-content">
                    {ongletContent[onglet] ?? (
                        <div className="gestionStock-notfound">
                            <p>Page introuvable.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default GestionStock;
