import { useState, useEffect } from "react";
import { Search, Download, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, AlertTriangle } from "lucide-react";
import RemboursementPane from "./remboursementPane.jsx";
import { fetchRemboursements } from "../../../../services/financesP3.js";
import { readCache } from "../../../../services/financesCache.js";
import { exportRemboursements } from "../../../../services/exportService.js";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) => {
    // Si la date est invalide (null, undefined, ou chaîne invalide), ne rien afficher pour éviter une erreur.
    if (!d || isNaN(new Date(d))) return "";
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
};

const SKELETON_ROWS = Array.from({ length: 5 });

function HistoriqueRemboursements() {
    const [data, setData]             = useState([]);
    const [meta, setMeta]             = useState({ page: 1, total: 0, per_page: 20 });
    const [page, setPage]             = useState(1);
    const [loading, setLoading]       = useState(true);
    const [erreur, setErreur]         = useState(null);
    const [selectedRemb, setSelectedRemb] = useState(null);
    const [recherche, setRecherche]   = useState("");
    const [filtreDate, setFiltreDate] = useState("");
    const [exportOpen, setExportOpen] = useState(false);
    const [exporting, setExporting]   = useState(null);

    useEffect(() => {
        const cacheKey = `remboursements_${page}`;
        const cached = readCache(cacheKey);

        if (cached) {
            setData(cached.data);
            setMeta(cached.meta);
            setLoading(false); // On a des données (même si elles sont "périmées"), on peut donc cacher le skeleton
        } else {
            setLoading(true); // Pas de cache, on affiche le skeleton
        }

        setErreur(null);
        fetchRemboursements(page)
            .then(res => { setData(res.data); setMeta(res.meta); setLoading(false); })
            .catch(() => { setErreur("Impossible de charger l'historique."); setLoading(false); });
    }, [page]);

    const filtres = data.filter(r => {
        const matchDate   = filtreDate ? r.date_remboursement === filtreDate : true;
        const q           = recherche.toLowerCase();
        const matchSearch = recherche
            ? r.id.toLowerCase().includes(q) ||
              r.enregistre_par?.toLowerCase().includes(q) ||
              r.cause.toLowerCase().includes(q) ||
              r.client?.toLowerCase().includes(q) ||
              r.commande_numero?.toLowerCase().includes(q)
            : true;
        return matchDate && matchSearch;
    });

    const totalRembourse = filtres.reduce((s, r) => s + r.montant, 0);
    const totalPages     = Math.ceil(meta.total / meta.per_page);

    const handleExport = async (fmtKey) => {
        if (exporting === fmtKey) return;
        setExporting(fmtKey);
        setExportOpen(false);
        try {
            await exportRemboursements(fmtKey, { recherche, date: filtreDate });
        } catch { /* silencieux */ } finally {
            setExporting(null);
        }
    };

    return (
        <>
            {/* KPIs */}
            <div className="finRemb-kpis">
                <div className="finRemb-kpi">
                    <p className="finRemb-kpi__label">Opérations</p>
                    <p className="finRemb-kpi__value">{loading ? "—" : filtres.length}</p>
                </div>
                <div className="finRemb-kpi">
                    <p className="finRemb-kpi__label">Total remboursé</p>
                    <p className="finRemb-kpi__value finRemb-kpi__value--error">
                        {loading ? "—" : fmt(totalRembourse)}
                    </p>
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
                            placeholder="Référence, cause, client, utilisateur…"
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

            {/* Erreur globale */}
            {erreur && (
                <div className="finRemb-empty">
                    <div className="finRemb-empty__icon">
                        <AlertTriangle size={28} aria-hidden="true" />
                    </div>
                    <p className="finRemb-empty__title">{erreur}</p>
                </div>
            )}

            {/* Tableau desktop */}
            {!erreur && (
                <div className="finRemb-tableWrap">
                    <table className="finRemb-table" aria-label="Historique des remboursements">
                        <thead className="finRemb-table__head">
                            <tr>
                                <th scope="col">Référence</th>
                                <th scope="col">Commande / Client</th>
                                <th scope="col">Montant</th>
                                <th scope="col">Cause</th>
                                <th scope="col">Date</th>
                                <th scope="col">Enregistré par</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? SKELETON_ROWS.map((_, i) => (
                                    <tr key={i} className="finRemb-table__row--skeleton">
                                        <td><span className="finRemb-skeleton finRemb-skeleton--sm" /></td>
                                        <td>
                                            <span className="finRemb-skeleton finRemb-skeleton--lg" style={{ marginBottom: "var(--space-1)", display: "block" }} />
                                            <span className="finRemb-skeleton finRemb-skeleton--md" />
                                        </td>
                                        <td><span className="finRemb-skeleton finRemb-skeleton--md" /></td>
                                        <td><span className="finRemb-skeleton finRemb-skeleton--lg" /></td>
                                        <td><span className="finRemb-skeleton finRemb-skeleton--sm" /></td>
                                        <td><span className="finRemb-skeleton finRemb-skeleton--md" /></td>
                                    </tr>
                                ))
                                : filtres.length === 0
                                    ? (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className="finRemb-empty">
                                                    <div className="finRemb-empty__icon">
                                                        <RotateCcw size={28} aria-hidden="true" />
                                                    </div>
                                                    <p className="finRemb-empty__title">Aucun remboursement trouvé</p>
                                                    <p className="finRemb-empty__desc">Modifiez les filtres pour afficher des résultats.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                    : filtres.map(r => (
                                        <tr
                                            key={r.id}
                                            className="finRemb-table__row"
                                            onClick={() => setSelectedRemb(r)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <td className="finRemb-table__id">{r.id}</td>
                                            <td>
                                                <p style={{ margin: "0 0 2px", fontWeight: "var(--weight-medium)", fontSize: "var(--text-sm)" }}>
                                                    {r.client ?? "—"}
                                                </p>
                                                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                                                    {r.commande_numero ?? ""}
                                                </p>
                                            </td>
                                            <td
                                                className="finRemb-table__amount"
                                                style={{ color: "var(--color-error)" }}
                                            >
                                                {fmt(r.montant)}
                                            </td>
                                            <td style={{
                                                maxWidth: "200px",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                fontSize: "var(--text-sm)",
                                                color: "var(--color-text-muted)",
                                            }}>
                                                {r.cause}
                                            </td>
                                            <td className="finRemb-table__date">{fmtDate(r.date_remboursement)}</td>
                                            <td style={{ fontSize: "var(--text-sm)" }}>{r.enregistre_par}</td>
                                        </tr>
                                    ))
                            }
                        </tbody>
                    </table>
                </div>
            )}

            {/* Cartes mobile */}
            {!erreur && (
                <div className="finRemb-cards">
                    {loading
                        ? SKELETON_ROWS.map((_, i) => (
                            <div key={i} className="finRemb-card">
                                <span className="finRemb-skeleton finRemb-skeleton--sm" />
                                <span className="finRemb-skeleton finRemb-skeleton--lg" style={{ marginTop: "var(--space-2)", display: "block" }} />
                                <span className="finRemb-skeleton finRemb-skeleton--md" style={{ marginTop: "var(--space-2)", display: "block" }} />
                            </div>
                        ))
                        : filtres.length === 0
                            ? (
                                <div className="finRemb-empty">
                                    <div className="finRemb-empty__icon">
                                        <RotateCcw size={28} aria-hidden="true" />
                                    </div>
                                    <p className="finRemb-empty__title">Aucun remboursement trouvé</p>
                                </div>
                            )
                            : filtres.map(r => (
                                <article
                                    key={r.id}
                                    className="finRemb-card"
                                    onClick={() => setSelectedRemb(r)}
                                >
                                    <div className="finRemb-card__top">
                                        <span className="finRemb-card__id">{r.id}</span>
                                        <span className="fin-badge fin-badge--warning">Remboursé</span>
                                    </div>
                                    <p className="finRemb-card__name">
                                        {r.client ?? "—"} — {r.commande_numero ?? ""}
                                    </p>
                                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                                        {r.cause}
                                    </p>
                                    <div className="finRemb-card__meta">
                                        <span
                                            className="finRemb-card__amount"
                                            style={{ color: "var(--color-error)" }}
                                        >
                                            {fmt(r.montant)}
                                        </span>
                                        <span className="finRemb-card__date">{fmtDate(r.date_remboursement)}</span>
                                    </div>
                                </article>
                            ))
                    }
                </div>
            )}

            {/* Pagination */}
            {!loading && !erreur && totalPages > 1 && (
                <div className="finRemb-pagination">
                    <span className="finRemb-pagination__info">
                        Page {page} sur {totalPages} — {meta.total} résultat{meta.total > 1 ? "s" : ""}
                    </span>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <button
                            className="finRemb-pagination__btn"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            type="button"
                            aria-label="Page précédente"
                        >
                            <ChevronLeft size={16} aria-hidden="true" />
                        </button>
                        <button
                            className="finRemb-pagination__btn"
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
