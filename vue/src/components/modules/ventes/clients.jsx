import { useState, useEffect } from "react";
import { Users, Search, X, Download, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { getBadgeConfig, formatMontant, formatDate } from "../../../services/ventes.js";
import "../../../assets/styles/components/modules/ventes/clients.css";

const INITIAL_CLIENTS = [
    { id: 1, nom: "Dupont",  prenom: "Jean",   email: "jean.dupont@email.com",   telephone: "0601020304" },
    { id: 2, nom: "Martin",  prenom: "Sophie",  email: "sophie.martin@email.com", telephone: "0605060708" },
    { id: 3, nom: "Durand",  prenom: "Pierre",  email: "pierre.durand@email.com", telephone: "0609101112" },
];

const INITIAL_ORDERS = [
    { id: 101, client_id: 1, montant: 150, statut: "reçu",                  date: "2026-06-01" },
    { id: 102, client_id: 1, montant: 85,  statut: "en cours de livraison", date: "2026-06-04" },
    { id: 103, client_id: 2, montant: 210, statut: "validé",                date: "2026-06-02" },
    { id: 104, client_id: 2, montant: 45,  statut: "livré",                 date: "2026-06-05" },
    { id: 105, client_id: 3, montant: 300, statut: "annulé",                date: "2026-05-28" },
];

const PER_PAGE_OPTIONS = [20, 50, 100];

function getInitials(nom, prenom) {
    return `${(prenom?.[0] ?? "").toUpperCase()}${(nom?.[0] ?? "").toUpperCase()}`;
}

function Clients() {
    const [clients]                             = useState(INITIAL_CLIENTS);
    const [orders]                              = useState(INITIAL_ORDERS);
    const [selectedClient, setSelectedClient]   = useState(null);
    const [showOrders, setShowOrders]           = useState(false);

    const [searchQuery,    setSearchQuery]    = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [perPage,        setPerPage]        = useState(20);
    const [page,           setPage]           = useState(1);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => { setPage(1); }, [debouncedQuery]);

    const getClientOrders = (clientId) => orders.filter((o) => o.client_id === clientId);

    const filteredClients = clients.filter((c) => {
        const q = debouncedQuery.toLowerCase();
        return (
            !q ||
            c.nom.toLowerCase().includes(q) ||
            c.prenom.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.telephone.includes(q)
        );
    });

    const totalPages      = Math.ceil(filteredClients.length / perPage);
    const paginatedClients = filteredClients.slice((page - 1) * perPage, page * perPage);

    const openClient = (client) => {
        setSelectedClient(client);
        setShowOrders(false);
    };

    const closeDrawer = () => {
        setSelectedClient(null);
        setShowOrders(false);
    };

    return (
        <section className="clients-root" aria-label="Gestion des clients">

            {/* Header */}
            <header className="clients-header">
                <div className="clients-header__left">
                    <h1 className="clients-header__title">Clients</h1>
                    <p className="clients-header__subtitle">
                        Consultez le portefeuille clients et l'historique des achats.
                    </p>
                </div>
            </header>

            {/* Barre d'outils */}
            <div className="clients-toolbar">
                <div className="clients-search">
                    <Search size={16} className="clients-search__icon" aria-hidden="true" />
                    <input
                        type="search"
                        className="app-input clients-search__input"
                        placeholder="Rechercher par nom, email ou téléphone…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Rechercher un client"
                    />
                </div>
                <select
                    className="clients-perpage-select"
                    value={perPage}
                    onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                    aria-label="Lignes par page"
                >
                    {PER_PAGE_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n} / page</option>
                    ))}
                </select>
                <div className="clients-export-group">
                    <button
                        className="app-button app-button--ghost app-button--sm"
                        onClick={() => alert("Export CSV")}
                        type="button"
                    >
                        <Download size={16} aria-hidden="true" />
                        CSV
                    </button>
                </div>
            </div>

            {/* Liste */}
            {filteredClients.length === 0 ? (
                <EmptyState
                    icon={<Users size={36} />}
                    title="Aucun client trouvé"
                    desc={debouncedQuery
                        ? "Essayez de modifier votre recherche."
                        : "Aucun client enregistré pour l'instant."
                    }
                />
            ) : (
                <>
                    {/* Desktop : tableau */}
                    <div className="clients-tableWrap" role="region" aria-label="Liste des clients">
                        <table className="clients-table" aria-label="Clients">
                            <thead className="clients-table__head">
                                <tr>
                                    <th scope="col">Client</th>
                                    <th scope="col">Email</th>
                                    <th scope="col">Téléphone</th>
                                    <th scope="col">Commandes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedClients.map((client) => {
                                    const clientOrders = getClientOrders(client.id);
                                    return (
                                        <tr
                                            key={client.id}
                                            className="clients-table__row"
                                            onClick={() => openClient(client)}
                                        >
                                            <td className="clients-table__client">
                                                <div className="clients-avatar">{getInitials(client.nom, client.prenom)}</div>
                                                <span className="clients-table__name">{client.prenom} {client.nom}</span>
                                            </td>
                                            <td className="clients-table__email">{client.email}</td>
                                            <td className="clients-table__phone">{client.telephone}</td>
                                            <td className="clients-table__orders">
                                                <span className="ventes-badge ventes-badge--neutral">
                                                    {clientOrders.length} commande{clientOrders.length !== 1 ? "s" : ""}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile : cartes */}
                    <div className="clients-cards" aria-label="Clients">
                        {paginatedClients.map((client) => {
                            const cnt = getClientOrders(client.id).length;
                            return (
                                <article
                                    key={client.id}
                                    className="clients-card"
                                    onClick={() => openClient(client)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Client ${client.prenom} ${client.nom}`}
                                    onKeyDown={(e) => e.key === "Enter" && openClient(client)}
                                >
                                    <div className="clients-card__header">
                                        <div className="clients-avatar clients-avatar--lg">{getInitials(client.nom, client.prenom)}</div>
                                        <div className="clients-card__info">
                                            <p className="clients-card__name">{client.prenom} {client.nom}</p>
                                            <p className="clients-card__email">{client.email}</p>
                                        </div>
                                    </div>
                                    <div className="clients-card__meta">
                                        <span className="clients-card__phone">{client.telephone}</span>
                                        <span className="ventes-badge ventes-badge--neutral">
                                            {cnt} commande{cnt !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="clients-pagination">
                            <span className="clients-pagination__info">
                                {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredClients.length)} sur {filteredClients.length}
                            </span>
                            <div className="clients-pagination__controls">
                                <button
                                    className="clients-pagination__btn"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    aria-label="Page précédente"
                                    type="button"
                                >
                                    <ChevronLeft size={16} aria-hidden="true" />
                                </button>
                                <span className="clients-pagination__page">{page} / {totalPages}</span>
                                <button
                                    className="clients-pagination__btn"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    aria-label="Page suivante"
                                    type="button"
                                >
                                    <ChevronRight size={16} aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Drawer fiche client ── */}
            {selectedClient && (
                <>
                    <div
                        className="clients-drawer__overlay"
                        onClick={closeDrawer}
                        aria-hidden="true"
                    />
                    <aside className="clients-drawer" aria-label={`Fiche ${selectedClient.prenom} ${selectedClient.nom}`}>
                        <div className="clients-drawer__handle" aria-hidden="true">
                            <span className="clients-drawer__handle-bar" />
                        </div>
                        <div className="clients-drawer__header">
                            <h2 className="clients-drawer__title">Fiche client</h2>
                            <button
                                className="clients-drawer__close"
                                onClick={closeDrawer}
                                aria-label="Fermer"
                                type="button"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="clients-drawer__body">
                            {/* Profil */}
                            <div className="clients-profile">
                                <div className="clients-avatar clients-avatar--xl">
                                    {getInitials(selectedClient.nom, selectedClient.prenom)}
                                </div>
                                <div className="clients-profile__info">
                                    <p className="clients-profile__name">{selectedClient.prenom} {selectedClient.nom}</p>
                                    <p className="clients-profile__email">{selectedClient.email}</p>
                                </div>
                            </div>

                            {/* Détails */}
                            <div className="clients-detail__block">
                                <span className="clients-detail__block-label">Coordonnées</span>
                                <div className="clients-detail__row">
                                    <span className="clients-detail__key">Nom</span>
                                    <span className="clients-detail__val">{selectedClient.nom}</span>
                                </div>
                                <div className="clients-detail__row">
                                    <span className="clients-detail__key">Prénom</span>
                                    <span className="clients-detail__val">{selectedClient.prenom}</span>
                                </div>
                                <div className="clients-detail__row">
                                    <span className="clients-detail__key">Email</span>
                                    <span className="clients-detail__val">{selectedClient.email}</span>
                                </div>
                                <div className="clients-detail__row">
                                    <span className="clients-detail__key">Téléphone</span>
                                    <span className="clients-detail__val">{selectedClient.telephone}</span>
                                </div>
                            </div>

                            {/* Toggle historique */}
                            <button
                                className={`clients-orders__toggle${showOrders ? " clients-orders__toggle--active" : ""}`}
                                onClick={() => setShowOrders((v) => !v)}
                                type="button"
                            >
                                <ShoppingBag size={16} aria-hidden="true" />
                                {showOrders ? "Masquer" : "Voir"} l'historique des commandes
                            </button>

                            {/* Historique */}
                            {showOrders && (
                                <div className="clients-orders__list">
                                    {getClientOrders(selectedClient.id).length === 0 ? (
                                        <p className="clients-orders__empty">Aucune commande pour ce client.</p>
                                    ) : (
                                        getClientOrders(selectedClient.id).map((o) => {
                                            const badge = getBadgeConfig(o.statut);
                                            return (
                                                <div key={o.id} className="clients-orders__item">
                                                    <div className="clients-orders__item-top">
                                                        <span className="clients-orders__item-id">#{o.id}</span>
                                                        <span className={`ventes-badge ventes-badge--${badge.variant}`}>{badge.label}</span>
                                                    </div>
                                                    <div className="clients-orders__item-meta">
                                                        <span className="clients-orders__item-amount">{formatMontant(o.montant)}</span>
                                                        <span className="clients-orders__item-date">{formatDate(o.date)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>
                </>
            )}
        </section>
    );
}

function EmptyState({ icon, title, desc }) {
    return (
        <div className="clients-empty" role="status">
            <div className="clients-empty__icon" aria-hidden="true">{icon}</div>
            <h3 className="clients-empty__title">{title}</h3>
            <p className="clients-empty__desc">{desc}</p>
        </div>
    );
}

export default Clients;
