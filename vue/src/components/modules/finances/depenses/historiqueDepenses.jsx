import { useState, useEffect } from "react";
import { Search, Download, ChevronDown, ChevronLeft, ChevronRight, TrendingDown, AlertTriangle } from "lucide-react";
import DepensePane from "./depensePane.jsx";
import { fetchDepenses } from "../../../../services/financesP3.js";
import { readCache } from "../../../../services/financesCache.js";
import { exportDepenses } from "../../../../services/exportService.js";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) {
        return ""; // Retourne une chaîne vide si la date est invalide
    }
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const SKELETON_ROWS = Array.from({ length: 5 });

function HistoriqueDepenses() {
    const [data, setData]             = useState([]);
    const [meta, setMeta]             = useState({ page: 1, total: 0, per_page: 20 });
    const [page, setPage]             = useState(1);
    const [loading, setLoading]       = useState(true);
    const [erreur, setErreur]         = useState(null);
    const [selectedDep, setSelectedDep] = useState(null);
    const [recherche, setRecherche]   = useState("");
    const [filtreDate, setFiltreDate] = useState("");
    const [exportOpen, setExportOpen] = useState(false);
    const [exporting, setExporting]   = useState(null);

    useEffect(() => {
        const cacheKey = `depenses_${page}`;
        const cached = readCache(cacheKey);

        if (cached) {
            setData(cached.data);
            setMeta(cached.meta);
            setLoading(false);
        } else {
            setLoading(true);
        }

        setErreur(null);
        fetchDepenses(page)
            .then(res => { setData(res.data); setMeta(res.meta); setLoading(false); })
            .catch(() => { setErreur("Impossible de charger l'historique."); setLoading(false); });
    }, [page]); // Le cache est lu à chaque changement de page.

    const filtres = data.filter(d => {
        const matchDate   = filtreDate ? d.date_depense === filtreDate : true;
        const q           = recherche.toLowerCase();
        const matchSearch = recherche
            ? d.id.toLowerCase().includes(q) ||
              d.raison.toLowerCase().includes(q) ||
              d.enregistre_par?.toLowerCase().includes(q)
            : true;
        return matchDate && matchSearch;
    });

    const totalDepenses = filtres.reduce((s, d) => s + d.montant, 0);
    const totalPages    = Math.ceil(meta.total / meta.per_page);

    const handleExport = async (fmtKey) => {
        if (exporting === fmtKey) return;
        setExporting(fmtKey);
        setExportOpen(false);
        try {
            await exportDepenses(fmtKey, { recherche, date: filtreDate });
        } catch { /* silencieux */ } finally {
            setExporting(null);
        }
    };

    return (
        <>
            {/* KPIs */}
            <div className="finDep-kpis">
                <div className="finDep-kpi">
                    <p className="finDep-kpi__label">Opérations</p>
                    <p className="finDep-kpi__value">{loading ? "—" : filtres.length}</p>
                </div>
                <div className="finDep-kpi">
                    <p className="finDep-kpi__label">Total dépensé</p>
                    <p className="finDep-kpi__value finDep-kpi__value--error">
                        {loading ? "—" : fmt(totalDepenses)}
                    </p>
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
                            placeholder="Description, utilisateur…"
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
                            onClick={() => setExportOpen(v => !v)}
                            type="button"
                            aria-expanded={exportOpen}
                            aria-haspopup="menu"
                        >
                            <Download size={16} aria-hidden="true" />
                            Exporter
                            <ChevronDown size={14} aria-hidden="true" />
                        </button>
                        {exportOpen && (
                            <div className="finCommandes-export-menu" role="menu">
                                {["pdf", "csv", "docx"].map(f => (
                                    <button
                                        key={f}
                                        className="finCommandes-export-menu__item"
                                        onClick={() => handleExport(f)}
                                        disabled={exporting === f}
                                        role="menuitem"
                                        type="button"
                                    >
                                        {f.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {erreur && (
                <div className="finDep-empty">
                    <div className="finDep-empty__icon">
                        <AlertTriangle size={28} aria-hidden="true" />
                    </div>
                    <p className="finDep-empty__title">{erreur}</p>
                </div>
            )}

            {/* Tableau desktop */}
            {!erreur && (
                <div className="finDep-tableWrap">
                    <table className="finDep-table" aria-label="Historique des dépenses">
                        <thead className="finDep-table__head">
                            <tr>
                                <th scope="col">Date</th>
                                <th scope="col">Description</th>
                                <th scope="col">Montant</th>
                                <th scope="col">Enregistré par</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? SKELETON_ROWS.map((_, i) => (
                                    <tr key={i} className="finDep-table__row--skeleton">
                                        <td><span className="finDep-skeleton finDep-skeleton--sm" /></td>
                                        <td><span className="finDep-skeleton finDep-skeleton--lg" /></td>
                                        <td><span className="finDep-skeleton finDep-skeleton--md" /></td>
                                        <td><span className="finDep-skeleton finDep-skeleton--md" /></td>
                                    </tr>
                                ))
                                : filtres.length === 0
                                    ? (
                                        <tr>
                                            <td colSpan={4}>
                                                <div className="finDep-empty">
                                                    <div className="finDep-empty__icon">
                                                        <TrendingDown size={28} aria-hidden="true" />
                                                    </div>
                                                    <p className="finDep-empty__title">Aucune dépense trouvée</p>
                                                    <p className="finDep-empty__desc">Modifiez les filtres pour afficher des résultats.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                    : filtres.map(d => (
                                        <tr
                                            key={d.id}
                                            className="finDep-table__row"
                                            onClick={() => setSelectedDep(d)}
                                        >
                                            <td className="finDep-table__date">{fmtDate(d.date_depense)}</td>
                                            <td className="finDep-table__desc">{d.raison}</td>
                                            <td className="finDep-table__amount">{fmt(d.montant)}</td>
                                            <td style={{ fontSize: "var(--text-sm)" }}>{d.enregistre_par ?? "—"}</td>
                                        </tr>
                                    ))
                            }
                        </tbody>
                    </table>
                </div>
            )}

            {/* Cartes mobile */}
            {!erreur && (
                <div className="finDep-cards">
                    {loading
                        ? SKELETON_ROWS.map((_, i) => (
                            <div key={i} className="finDep-card">
                                <span className="finDep-skeleton finDep-skeleton--sm" />
                                <span className="finDep-skeleton finDep-skeleton--lg" style={{ marginTop: "var(--space-2)", display: "block" }} />
                                <span className="finDep-skeleton finDep-skeleton--md" style={{ marginTop: "var(--space-2)", display: "block" }} />
                            </div>
                        ))
                        : filtres.length === 0
                            ? (
                                <div className="finDep-empty">
                                    <div className="finDep-empty__icon">
                                        <TrendingDown size={28} aria-hidden="true" />
                                    </div>
                                    <p className="finDep-empty__title">Aucune dépense trouvée</p>
                                </div>
                            )
                            : filtres.map(d => (
                                <article
                                    key={d.id}
                                    className="finDep-card"
                                    onClick={() => setSelectedDep(d)}
                                >
                                    <div className="finDep-card__top">
                                        <span className="finDep-card__id">{fmtDate(d.date_depense)}</span>
                                        <span className="fin-badge fin-badge--neutral">{d.enregistre_par ?? "—"}</span>
                                    </div>
                                    <p className="finDep-card__desc">{d.raison}</p>
                                    <div className="finDep-card__meta">
                                        <span className="finDep-card__amount">{fmt(d.montant)}</span>
                                    </div>
                                </article>
                            ))
                    }
                </div>
            )}

            {/* Pagination */}
            {!loading && !erreur && totalPages > 1 && (
                <div className="finDep-pagination">
                    <span className="finDep-pagination__info">
                        Page {page} sur {totalPages} — {meta.total} résultat{meta.total > 1 ? "s" : ""}
                    </span>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <button
                            className="finDep-pagination__btn"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            type="button"
                            aria-label="Page précédente"
                        >
                            <ChevronLeft size={16} aria-hidden="true" />
                        </button>
                        <button
                            className="finDep-pagination__btn"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            type="button"
                            aria-label="Page suivante"
                        >
                            <ChevronRight size={16} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            )}

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
