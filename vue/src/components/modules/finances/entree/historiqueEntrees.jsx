import { useState } from "react";
import { Search, Download, ChevronDown, TrendingUp } from "lucide-react";
import EntreePane from "./EntreePane.jsx";

const MOCK_ENTREES = [
    { id: "ENT-2026-001", date: "2026-06-02", montant: 5000000, origine: "Apport de capital",              description: "Apport externe de capital — investisseur Fouda & Associés" },
    { id: "ENT-2026-002", date: "2026-06-04", montant:  150000, origine: "Remboursement reçu",             description: "Remboursement suite à un trop-perçu par le prestataire LogiTrans" },
    { id: "ENT-2026-003", date: "2026-06-06", montant:  800000, origine: "Subvention ou aide publique",    description: "Subvention PME — Ministère du Commerce — tranche juin 2026" },
    { id: "ENT-2026-004", date: "2026-06-08", montant:  320000, origine: "Vente de produits ou services",  description: "Vente de matériel de bureau reconditionné — lot juin" },
    { id: "ENT-2026-005", date: "2026-06-11", montant: 1200000, origine: "Prêt bancaire reçu",             description: "Déblocage crédit revolving — Banque Atlantique Cameroun" },
];

function HistoriqueEntrees() {
    const [selectedEnt, setSelectedEnt] = useState(null);
    const [filtreDate, setFiltreDate]   = useState("");
    const [recherche, setRecherche]     = useState("");
    const [exportOpen, setExportOpen]   = useState(false);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

    const filtrees = MOCK_ENTREES.filter(e => {
        const matchDate = filtreDate ? e.date === filtreDate : true;
        const q = recherche.toLowerCase();
        const matchSearch = recherche
            ? e.id.toLowerCase().includes(q) ||
              e.description.toLowerCase().includes(q) ||
              e.origine.toLowerCase().includes(q)
            : true;
        return matchDate && matchSearch;
    });

    const totalEntrees = filtrees.reduce((s, e) => s + e.montant, 0);

    return (
        <>
            {/* KPI résumé */}
            <div className="finEnt-kpis" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: "var(--space-4)" }}>
                <div className="finEnt-kpi">
                    <p className="finEnt-kpi__label">Nombre</p>
                    <p className="finEnt-kpi__value">{filtrees.length}</p>
                </div>
                <div className="finEnt-kpi">
                    <p className="finEnt-kpi__label">Total encaissé</p>
                    <p className="finEnt-kpi__value finEnt-kpi__value--success">{formatMontant(totalEntrees)}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="finEnt-toolbar">
                <div className="finEnt-toolbar__row">
                    <div className="finEnt-search">
                        <Search size={16} className="finEnt-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="app-input finEnt-search__input"
                            placeholder="Rechercher par description, origine…"
                            value={recherche}
                            onChange={e => setRecherche(e.target.value)}
                            aria-label="Rechercher une entrée"
                        />
                    </div>

                    <input
                        type="date"
                        className="finEnt-filter-select"
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
                                        onClick={() => setExportOpen(false)}
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
            <div className="finEnt-tableWrap">
                <table className="finEnt-table" aria-label="Historique des entrées financières">
                    <thead className="finEnt-table__head">
                        <tr>
                            <th scope="col">Référence</th>
                            <th scope="col">Date</th>
                            <th scope="col">Origine</th>
                            <th scope="col">Montant</th>
                            <th scope="col">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrees.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="finEnt-empty">
                                        <div className="finEnt-empty__icon">
                                            <TrendingUp size={32} aria-hidden="true" />
                                        </div>
                                        <p className="finEnt-empty__title">Aucune entrée trouvée</p>
                                        <p className="finEnt-empty__desc">Modifiez les filtres pour afficher des résultats.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtrees.map(e => (
                                <tr key={e.id} className="finEnt-table__row" onClick={() => setSelectedEnt(e)}>
                                    <td className="finEnt-table__id">{e.id}</td>
                                    <td className="finEnt-table__date">{formatDate(e.date)}</td>
                                    <td>
                                        <span className="fin-badge fin-badge--success">{e.origine}</span>
                                    </td>
                                    <td className="finEnt-table__amount">{formatMontant(e.montant)}</td>
                                    <td className="finEnt-table__desc">{e.description}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cartes mobile */}
            <div className="finEnt-cards">
                {filtrees.length === 0 ? (
                    <div className="finEnt-empty">
                        <div className="finEnt-empty__icon">
                            <TrendingUp size={32} aria-hidden="true" />
                        </div>
                        <p className="finEnt-empty__title">Aucune entrée trouvée</p>
                    </div>
                ) : (
                    filtrees.map(e => (
                        <article key={e.id} className="finEnt-card" onClick={() => setSelectedEnt(e)}>
                            <div className="finEnt-card__top">
                                <span className="finEnt-card__id">{e.id}</span>
                                <span className="fin-badge fin-badge--success">{e.origine}</span>
                            </div>
                            <p className="finEnt-card__desc">{e.description}</p>
                            <div className="finEnt-card__meta">
                                <span className="finEnt-card__amount">{formatMontant(e.montant)}</span>
                                <span className="finEnt-card__date">{formatDate(e.date)}</span>
                            </div>
                        </article>
                    ))
                )}
            </div>

            {selectedEnt && (
                <EntreePane
                    entree={selectedEnt}
                    onClose={() => setSelectedEnt(null)}
                />
            )}
        </>
    );
}

export default HistoriqueEntrees;
