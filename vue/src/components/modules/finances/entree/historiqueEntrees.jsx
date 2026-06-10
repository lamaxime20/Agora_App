import { useState, useEffect } from "react";
import { Search, Download, ChevronDown, ChevronLeft, ChevronRight, TrendingUp, AlertTriangle } from "lucide-react";
import EntreePane from "./entreePane.jsx";
import { fetchEntrees } from "../../../../services/financesP3.js";
import { readCache } from "../../../../services/financesCache.js";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return ""; // Retourne une chaîne vide si la date est invalide
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const SKELETON_ROWS = Array.from({ length: 5 });

function HistoriqueEntrees() {
    const [data, setData]             = useState([]);
    const [meta, setMeta]             = useState({ page: 1, total: 0, per_page: 20 });
    const [page, setPage]             = useState(1);
    const [loading, setLoading]       = useState(true);
    const [erreur, setErreur]         = useState(null);
    const [selectedEnt, setSelectedEnt] = useState(null);
    const [recherche, setRecherche]   = useState("");
    const [filtreDate, setFiltreDate] = useState("");
    const [exportOpen, setExportOpen] = useState(false);

    useEffect(() => {
        const cacheKey = `entrees_${page}`;
        const cached = readCache(cacheKey);

        if (cached) {
            setData(cached.data);
            setMeta(cached.meta);
            setLoading(false);
        } else {
            setLoading(true);
        }

        setErreur(null);
        fetchEntrees(page)
            .then(res => { setData(res.data); setMeta(res.meta); setLoading(false); })
            .catch(() => { setErreur("Impossible de charger l'historique."); setLoading(false); });
    }, [page]); // Le cache est lu à chaque changement de page.

    const filtres = data.filter(e => {
        const matchDate   = filtreDate ? e.date === filtreDate : true;
        const q           = recherche.toLowerCase();
        const matchSearch = recherche
            ? e.id.toLowerCase().includes(q) ||
              e.description.toLowerCase().includes(q) ||
              e.utilisateur?.toLowerCase().includes(q)
            : true;
        return matchDate && matchSearch;
    });

    const totalEntrees = filtres.reduce((s, e) => s + e.montant, 0);
    const totalPages   = Math.ceil(meta.total / meta.per_page);

    return (
        <>
            {/* KPIs */}
            <div className="finEnt-kpis">
                <div className="finEnt-kpi">
                    <p className="finEnt-kpi__label">Opérations</p>
                    <p className="finEnt-kpi__value">{loading ? "—" : filtres.length}</p>
                </div>
                <div className="finEnt-kpi">
                    <p className="finEnt-kpi__label">Total encaissé</p>
                    <p className="finEnt-kpi__value finEnt-kpi__value--success">
                        {loading ? "—" : fmt(totalEntrees)}
                    </p>
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
                            placeholder="Description, utilisateur…"
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
                                {[".csv", ".pdf", ".xlsx"].map(f => (
                                    <button
                                        key={f}
                                        className="finCommandes-export-menu__item"
                                        onClick={() => setExportOpen(false)}
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
                <div className="finEnt-empty">
                    <div className="finEnt-empty__icon">
                        <AlertTriangle size={28} aria-hidden="true" />
                    </div>
                    <p className="finEnt-empty__title">{erreur}</p>
                </div>
            )}

            {/* Tableau desktop */}
            {!erreur && (
                <div className="finEnt-tableWrap">
                    <table className="finEnt-table" aria-label="Historique des entrées financières">
                        <thead className="finEnt-table__head">
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
                                    <tr key={i} className="finEnt-table__row--skeleton">
                                        <td><span className="finEnt-skeleton finEnt-skeleton--sm" /></td>
                                        <td><span className="finEnt-skeleton finEnt-skeleton--lg" /></td>
                                        <td><span className="finEnt-skeleton finEnt-skeleton--md" /></td>
                                        <td><span className="finEnt-skeleton finEnt-skeleton--md" /></td>
                                    </tr>
                                ))
                                : filtres.length === 0
                                    ? (
                                        <tr>
                                            <td colSpan={4}>
                                                <div className="finEnt-empty">
                                                    <div className="finEnt-empty__icon">
                                                        <TrendingUp size={28} aria-hidden="true" />
                                                    </div>
                                                    <p className="finEnt-empty__title">Aucune entrée trouvée</p>
                                                    <p className="finEnt-empty__desc">Modifiez les filtres pour afficher des résultats.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                    : filtres.map(e => (
                                        <tr
                                            key={e.id}
                                            className="finEnt-table__row"
                                            onClick={() => setSelectedEnt(e)}
                                        >
                                            <td className="finEnt-table__date">{fmtDate(e.date)}</td>
                                            <td className="finEnt-table__desc">{e.description}</td>
                                            <td className="finEnt-table__amount">{fmt(e.montant)}</td>
                                            <td style={{ fontSize: "var(--text-sm)" }}>{e.utilisateur ?? "—"}</td>
                                        </tr>
                                    ))
                            }
                        </tbody>
                    </table>
                </div>
            )}

            {/* Cartes mobile */}
            {!erreur && (
                <div className="finEnt-cards">
                    {loading
                        ? SKELETON_ROWS.map((_, i) => (
                            <div key={i} className="finEnt-card">
                                <span className="finEnt-skeleton finEnt-skeleton--sm" />
                                <span className="finEnt-skeleton finEnt-skeleton--lg" style={{ marginTop: "var(--space-2)", display: "block" }} />
                                <span className="finEnt-skeleton finEnt-skeleton--md" style={{ marginTop: "var(--space-2)", display: "block" }} />
                            </div>
                        ))
                        : filtres.length === 0
                            ? (
                                <div className="finEnt-empty">
                                    <div className="finEnt-empty__icon">
                                        <TrendingUp size={28} aria-hidden="true" />
                                    </div>
                                    <p className="finEnt-empty__title">Aucune entrée trouvée</p>
                                </div>
                            )
                            : filtres.map(e => (
                                <article
                                    key={e.id}
                                    className="finEnt-card"
                                    onClick={() => setSelectedEnt(e)}
                                >
                                    <div className="finEnt-card__top">
                                        <span className="finEnt-card__id">{fmtDate(e.date)}</span>
                                        <span className="fin-badge fin-badge--success">{e.utilisateur ?? "—"}</span>
                                    </div>
                                    <p className="finEnt-card__desc">{e.description}</p>
                                    <div className="finEnt-card__meta">
                                        <span className="finEnt-card__amount">{fmt(e.montant)}</span>
                                    </div>
                                </article>
                            ))
                    }
                </div>
            )}

            {/* Pagination */}
            {!loading && !erreur && totalPages > 1 && (
                <div className="finEnt-pagination">
                    <span className="finEnt-pagination__info">
                        Page {page} sur {totalPages} — {meta.total} résultat{meta.total > 1 ? "s" : ""}
                    </span>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <button
                            className="finEnt-pagination__btn"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            type="button"
                            aria-label="Page précédente"
                        >
                            <ChevronLeft size={16} aria-hidden="true" />
                        </button>
                        <button
                            className="finEnt-pagination__btn"
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
