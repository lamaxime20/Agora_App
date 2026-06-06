import { useState } from "react";
import { Download, ChevronDown, Truck } from "lucide-react";
import ReapprovisionnementPane from "./ReapprovisionnementPane.jsx";

const MOCK_REAPPROS = [
    {
        id: "REAPP-001",
        date: "2026-05-20",
        montantTotal: 1450000,
        statut: "Livré et stocké",
        fournisseur: { id: "FOURN-01", nom: "Papeterie Centrale de l'Est", contact: "contact@papet-est.com" },
        articles: [
            { nom: "Rames de papier A4",    quantite: 200,  prixUnitaire: 4500 },
            { nom: "Enveloppes cartonnées", quantite: 1000, prixUnitaire:  550 },
        ],
    },
    {
        id: "REAPP-002",
        date: "2026-06-02",
        montantTotal: 850000,
        statut: "En cours d'acheminement",
        fournisseur: { id: "FOURN-02", nom: "LogiTech Distribution", contact: "commercial@logitech-dist.com" },
        articles: [
            { nom: "Écrans 24 pouces", quantite: 5, prixUnitaire: 170000 },
        ],
    },
    {
        id: "REAPP-003",
        date: "2026-06-05",
        montantTotal: 320000,
        statut: "En attente de confirmation",
        fournisseur: { id: "FOURN-04", nom: "AfriPack Solutions", contact: "info@afripack.cm" },
        articles: [
            { nom: "Cartons d'emballage 50×40", quantite: 400, prixUnitaire: 800 },
        ],
    },
];

const STATUTS = ["tous", "Livré et stocké", "En cours d'acheminement", "En attente de confirmation"];

const BADGE_MAP = {
    "Livré et stocké":               "fin-badge--success",
    "En cours d'acheminement":       "fin-badge--info",
    "En attente de confirmation":    "fin-badge--warning",
};

function HistoriqueReapprovisionnements() {
    const [selectedReappro, setSelectedReappro] = useState(null);
    const [filtreStatut, setFiltreStatut]       = useState("tous");
    const [exportOpen, setExportOpen]           = useState(false);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

    const filtres = MOCK_REAPPROS.filter(r =>
        filtreStatut === "tous" ? true : r.statut === filtreStatut
    );

    return (
        <>
            {/* Toolbar */}
            <div className="finReapp-toolbar">
                <div className="finReapp-toolbar__row">
                    <select
                        className="finReapp-filter-select"
                        value={filtreStatut}
                        onChange={e => setFiltreStatut(e.target.value)}
                        aria-label="Filtrer par statut"
                    >
                        {STATUTS.map(s => (
                            <option key={s} value={s}>{s === "tous" ? "Tous les statuts" : s}</option>
                        ))}
                    </select>

                    <div style={{ position: "relative", marginLeft: "auto" }}>
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
            <div className="finReapp-tableWrap">
                <table className="finReapp-table" aria-label="Historique des réapprovisionnements">
                    <thead className="finReapp-table__head">
                        <tr>
                            <th scope="col">Code</th>
                            <th scope="col">Fournisseur</th>
                            <th scope="col">Date</th>
                            <th scope="col">Montant total</th>
                            <th scope="col">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtres.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="finReapp-empty">
                                        <div className="finReapp-empty__icon">
                                            <Truck size={32} aria-hidden="true" />
                                        </div>
                                        <p className="finReapp-empty__title">Aucune commande trouvée</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtres.map(r => (
                                <tr key={r.id} className="finReapp-table__row" onClick={() => setSelectedReappro(r)}>
                                    <td className="finReapp-table__id">{r.id}</td>
                                    <td style={{ fontWeight: "var(--weight-medium)", fontSize: "var(--text-sm)" }}>{r.fournisseur.nom}</td>
                                    <td className="finReapp-table__date">{formatDate(r.date)}</td>
                                    <td className="finReapp-table__amount">{formatMontant(r.montantTotal)}</td>
                                    <td>
                                        <span className={`fin-badge ${BADGE_MAP[r.statut] || "fin-badge--neutral"}`}>
                                            {r.statut}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cartes mobile */}
            <div className="finReapp-cards">
                {filtres.map(r => (
                    <article key={r.id} className="finReapp-card" onClick={() => setSelectedReappro(r)}>
                        <div className="finReapp-card__top">
                            <span className="finReapp-card__id">{r.id}</span>
                            <span className={`fin-badge ${BADGE_MAP[r.statut] || "fin-badge--neutral"}`}>{r.statut}</span>
                        </div>
                        <p className="finReapp-card__name">{r.fournisseur.nom}</p>
                        <div className="finReapp-card__meta">
                            <span className="finReapp-card__amount">{formatMontant(r.montantTotal)}</span>
                            <span className="finReapp-card__date">{formatDate(r.date)}</span>
                        </div>
                    </article>
                ))}
            </div>

            {selectedReappro && (
                <ReapprovisionnementPane
                    reappro={selectedReappro}
                    onClose={() => setSelectedReappro(null)}
                />
            )}
        </>
    );
}

export default HistoriqueReapprovisionnements;
