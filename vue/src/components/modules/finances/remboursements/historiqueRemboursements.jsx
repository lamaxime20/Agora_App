import { useState } from "react";
import { Search, Download, ChevronDown, RotateCcw } from "lucide-react";
import RemboursementPane from "./RemboursementPane.jsx";

const MOCK_REMBOURSEMENTS = [
    {
        id: "REM-001",
        montant: 300000,
        cause: "Rupture de stock sur l'article principal",
        date: "2026-06-03",
        utilisateur: "Alice Caisse",
        commandeAssociee: { id: "CMD-201", nom: "Commande Durand Jean — réf. 2026-201", totalFacture: 1200000, totalPaye: 1200000 },
    },
    {
        id: "REM-002",
        montant: 150000,
        cause: "Geste commercial suite à un retard d'expédition",
        date: "2026-06-04",
        utilisateur: "Jean Comptable",
        commandeAssociee: { id: "CMD-202", nom: "Commande Moreau Sophie — réf. 2026-202", totalFacture: 450000, totalPaye: 450000 },
    },
    {
        id: "REM-003",
        montant: 85000,
        cause: "Erreur de facturation — doublon de ligne",
        date: "2026-06-07",
        utilisateur: "Marie Finance",
        commandeAssociee: { id: "CMD-203", nom: "Commande Lefevre Paul — réf. 2026-203", totalFacture: 900000, totalPaye: 900000 },
    },
    {
        id: "REM-004",
        montant: 500000,
        cause: "Annulation partielle avant livraison",
        date: "2026-06-10",
        utilisateur: "Alice Caisse",
        commandeAssociee: { id: "CMD-204", nom: "Commande Ngo Essomba — réf. 2026-204", totalFacture: 3200000, totalPaye: 3200000 },
    },
];

function HistoriqueRemboursements() {
    const [selectedRemb, setSelectedRemb] = useState(null);
    const [filtreDate, setFiltreDate]     = useState("");
    const [recherche, setRecherche]       = useState("");
    const [exportOpen, setExportOpen]     = useState(false);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

    const filtres = MOCK_REMBOURSEMENTS.filter(r => {
        const matchDate = filtreDate ? r.date === filtreDate : true;
        const q = recherche.toLowerCase();
        const matchSearch = recherche
            ? r.id.toLowerCase().includes(q) ||
              r.utilisateur.toLowerCase().includes(q) ||
              r.cause.toLowerCase().includes(q) ||
              r.commandeAssociee.nom.toLowerCase().includes(q)
            : true;
        return matchDate && matchSearch;
    });

    const totalRembourse = filtres.reduce((s, r) => s + r.montant, 0);

    return (
        <>
            {/* KPI résumé */}
            <div className="finRemb-kpis" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: "var(--space-4)" }}>
                <div className="finRemb-kpi">
                    <p className="finRemb-kpi__label">Nombre</p>
                    <p className="finRemb-kpi__value">{filtres.length}</p>
                </div>
                <div className="finRemb-kpi">
                    <p className="finRemb-kpi__label">Total remboursé</p>
                    <p className="finRemb-kpi__value finRemb-kpi__value--error">{formatMontant(totalRembourse)}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="finRemb-toolbar">
                <div className="finRemb-toolbar__row">
                    <div className="finRemb-search">
                        <Search size={16} className="finRemb-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="app-input finRemb-search__input"
                            placeholder="Rechercher par référence, cause, utilisateur…"
                            value={recherche}
                            onChange={e => setRecherche(e.target.value)}
                            aria-label="Rechercher un remboursement"
                        />
                    </div>

                    <input
                        type="date"
                        className="finRemb-filter-select"
                        value={filtreDate}
                        onChange={e => setFiltreDate(e.target.value)}
                        aria-label="Filtrer par date"
                    />

                    <div style={{ position: "relative" }}>
                        <button
                            className="app-button app-button--ghost app-button--sm"
                            onClick={() => setExportOpen(!exportOpen)}
                            type="button"
                            aria-expanded={exportOpen}
                        >
                            <Download size={16} aria-hidden="true" />
                            Exporter
                            <ChevronDown size={14} aria-hidden="true" />
                        </button>
                        {exportOpen && (
                            <div className="finCommandes-export-menu" role="menu">
                                {[".csv", ".pdf", ".docx"].map(fmt => (
                                    <button
                                        key={fmt}
                                        className="finCommandes-export-menu__item"
                                        onClick={() => { setExportOpen(false); }}
                                        role="menuitem"
                                        type="button"
                                    >
                                        {fmt.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tableau desktop */}
            <div className="finRemb-tableWrap">
                <table className="finRemb-table" aria-label="Historique des remboursements">
                    <thead className="finRemb-table__head">
                        <tr>
                            <th scope="col">Référence</th>
                            <th scope="col">Commande associée</th>
                            <th scope="col">Montant remboursé</th>
                            <th scope="col">Cause</th>
                            <th scope="col">Date</th>
                            <th scope="col">Enregistré par</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtres.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="finRemb-empty">
                                        <div className="finRemb-empty__icon">
                                            <RotateCcw size={32} aria-hidden="true" />
                                        </div>
                                        <p className="finRemb-empty__title">Aucun remboursement trouvé</p>
                                        <p className="finRemb-empty__desc">Modifiez les filtres pour afficher des résultats.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtres.map(r => (
                                <tr key={r.id} className="finRemb-table__row" onClick={() => setSelectedRemb(r)}>
                                    <td className="finRemb-table__id">{r.id}</td>
                                    <td className="finRemb-table__name">{r.commandeAssociee.nom}</td>
                                    <td className="finRemb-table__amount" style={{ color: "var(--color-error)" }}>{formatMontant(r.montant)}</td>
                                    <td style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{r.cause}</td>
                                    <td className="finRemb-table__date">{formatDate(r.date)}</td>
                                    <td style={{ fontSize: "var(--text-sm)" }}>{r.utilisateur}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cartes mobile */}
            <div className="finRemb-cards">
                {filtres.length === 0 ? (
                    <div className="finRemb-empty">
                        <div className="finRemb-empty__icon">
                            <RotateCcw size={32} aria-hidden="true" />
                        </div>
                        <p className="finRemb-empty__title">Aucun remboursement trouvé</p>
                    </div>
                ) : (
                    filtres.map(r => (
                        <article key={r.id} className="finRemb-card" onClick={() => setSelectedRemb(r)}>
                            <div className="finRemb-card__top">
                                <span className="finRemb-card__id">{r.id}</span>
                                <span className="fin-badge fin-badge--warning">Remboursé</span>
                            </div>
                            <p className="finRemb-card__name">{r.commandeAssociee.nom}</p>
                            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>{r.cause}</p>
                            <div className="finRemb-card__meta">
                                <span className="finRemb-card__amount" style={{ color: "var(--color-error)" }}>{formatMontant(r.montant)}</span>
                                <span className="finRemb-card__date">{formatDate(r.date)}</span>
                            </div>
                        </article>
                    ))
                )}
            </div>

            {selectedRemb && (
                <RemboursementPane
                    remboursement={selectedRemb}
                    onClose={() => setSelectedRemb(null)}
                />
            )}
        </>
    );
}

export default HistoriqueRemboursements;
