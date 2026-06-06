import { useState } from "react";
import { Search, Download, ChevronDown, TrendingDown } from "lucide-react";
import DepensePane from "./DepensePane.jsx";

const MOCK_DEPENSES = [
    { id: "DEP-2026-001", date: "2026-06-01", montant:  89000, categorie: "Fournitures de bureau",     description: "Achat de rames de papier A4 et fournitures de bureau" },
    { id: "DEP-2026-002", date: "2026-06-03", montant: 120000, categorie: "Électricité / eau",          description: "Paiement de la facture d'électricité du siège social" },
    { id: "DEP-2026-003", date: "2026-06-05", montant:  35000, categorie: "Maintenance et réparation",  description: "Maintenance informatique sur le serveur local" },
    { id: "DEP-2026-004", date: "2026-06-07", montant: 250000, categorie: "Transport et carburant",     description: "Carburant flotte de livraison — juin 2026" },
    { id: "DEP-2026-005", date: "2026-06-10", montant:  45000, categorie: "Communication et internet",  description: "Abonnement fibre optique bureau — juillet 2026" },
];

function HistoriqueDepenses() {
    const [selectedDep, setSelectedDep] = useState(null);
    const [filtreDate, setFiltreDate]   = useState("");
    const [recherche, setRecherche]     = useState("");
    const [exportOpen, setExportOpen]   = useState(false);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

    const filtrees = MOCK_DEPENSES.filter(d => {
        const matchDate = filtreDate ? d.date === filtreDate : true;
        const q = recherche.toLowerCase();
        const matchSearch = recherche
            ? d.id.toLowerCase().includes(q) ||
              d.description.toLowerCase().includes(q) ||
              d.categorie.toLowerCase().includes(q)
            : true;
        return matchDate && matchSearch;
    });

    const totalDepenses = filtrees.reduce((s, d) => s + d.montant, 0);

    return (
        <>
            {/* KPI résumé */}
            <div className="finDep-kpis" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: "var(--space-4)" }}>
                <div className="finDep-kpi">
                    <p className="finDep-kpi__label">Nombre</p>
                    <p className="finDep-kpi__value">{filtrees.length}</p>
                </div>
                <div className="finDep-kpi">
                    <p className="finDep-kpi__label">Total dépensé</p>
                    <p className="finDep-kpi__value finDep-kpi__value--error">{formatMontant(totalDepenses)}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="finDep-toolbar">
                <div className="finDep-toolbar__row">
                    <div className="finDep-search">
                        <Search size={16} className="finDep-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="app-input finDep-search__input"
                            placeholder="Rechercher par description, catégorie…"
                            value={recherche}
                            onChange={e => setRecherche(e.target.value)}
                            aria-label="Rechercher une dépense"
                        />
                    </div>

                    <input
                        type="date"
                        className="finDep-filter-select"
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
            <div className="finDep-tableWrap">
                <table className="finDep-table" aria-label="Historique des dépenses">
                    <thead className="finDep-table__head">
                        <tr>
                            <th scope="col">Référence</th>
                            <th scope="col">Date</th>
                            <th scope="col">Catégorie</th>
                            <th scope="col">Montant</th>
                            <th scope="col">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrees.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="finDep-empty">
                                        <div className="finDep-empty__icon">
                                            <TrendingDown size={32} aria-hidden="true" />
                                        </div>
                                        <p className="finDep-empty__title">Aucune dépense trouvée</p>
                                        <p className="finDep-empty__desc">Modifiez les filtres pour afficher des résultats.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtrees.map(d => (
                                <tr key={d.id} className="finDep-table__row" onClick={() => setSelectedDep(d)}>
                                    <td className="finDep-table__id">{d.id}</td>
                                    <td className="finDep-table__date">{formatDate(d.date)}</td>
                                    <td>
                                        <span className="fin-badge fin-badge--neutral">{d.categorie}</span>
                                    </td>
                                    <td className="finDep-table__amount">{formatMontant(d.montant)}</td>
                                    <td className="finDep-table__desc">{d.description}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cartes mobile */}
            <div className="finDep-cards">
                {filtrees.length === 0 ? (
                    <div className="finDep-empty">
                        <div className="finDep-empty__icon">
                            <TrendingDown size={32} aria-hidden="true" />
                        </div>
                        <p className="finDep-empty__title">Aucune dépense trouvée</p>
                    </div>
                ) : (
                    filtrees.map(d => (
                        <article key={d.id} className="finDep-card" onClick={() => setSelectedDep(d)}>
                            <div className="finDep-card__top">
                                <span className="finDep-card__id">{d.id}</span>
                                <span className="fin-badge fin-badge--neutral">{d.categorie}</span>
                            </div>
                            <p className="finDep-card__desc">{d.description}</p>
                            <div className="finDep-card__meta">
                                <span className="finDep-card__amount">{formatMontant(d.montant)}</span>
                                <span className="finDep-card__date">{formatDate(d.date)}</span>
                            </div>
                        </article>
                    ))
                )}
            </div>

            {selectedDep && (
                <DepensePane
                    depense={selectedDep}
                    onClose={() => setSelectedDep(null)}
                />
            )}
        </>
    );
}

export default HistoriqueDepenses;
