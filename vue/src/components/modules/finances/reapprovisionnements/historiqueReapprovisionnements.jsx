import { useState, useEffect, useCallback } from "react";
import { Download, ChevronDown, ChevronLeft, ChevronRight, History } from "lucide-react";
import { fetchReapprosHistorique } from "../../../../services/financesP4.js";
import { exportReapprovisionnements } from "../../../../services/exportService.js";
import ReapprovisionnementPane from "./reapprovisionnementPane.jsx";
import { readCache } from "../../../../services/financesCache.js";

const PRIORITY_LABEL = { faible: "Faible", normale: "Normale", haute: "Haute", critique: "Critique" };

const STATUT_CONFIG = {
    valide:     { label: "Validé",     badge: "success" },
    refuse:     { label: "Refusé",     badge: "error"   },
    en_attente: { label: "En attente", badge: "warning" },
    en_cours:   { label: "En cours",   badge: "info"    },
    annule:     { label: "Annulé",     badge: "error"   },
};

function TableSkeleton() {
    return Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="finReapp-table__row--skeleton">
            <td><div className="finReapp-skeleton finReapp-skeleton--sm" /></td>
            <td><div className="finReapp-skeleton finReapp-skeleton--md" /></td>
            <td><div className="finReapp-skeleton finReapp-skeleton--sm" /></td>
            <td><div className="finReapp-skeleton finReapp-skeleton--md" /></td>
            <td><div className="finReapp-skeleton finReapp-skeleton--sm" /></td>
            <td><div className="finReapp-skeleton finReapp-skeleton--sm" /></td>
            <td><div className="finReapp-skeleton finReapp-skeleton--md" /></td>
        </tr>
    ));
}

function HistoriqueReapprovisionnements() {
    const [data, setData]           = useState([]);
    const [meta, setMeta]           = useState(null);
    const [page, setPage]           = useState(1);
    const [loading, setLoading]     = useState(true);
    const [erreur, setErreur]       = useState("");
    const [filtreStatut, setFiltreStatut] = useState("tous");
    const [exportOpen, setExportOpen]     = useState(false);
    const [exporting, setExporting]       = useState(null);
    const [selectedR, setSelectedR]       = useState(null);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

    const load = useCallback(async (p) => {
        setLoading(true);
        setErreur("");

        const cacheKey = `reappros_historique_${p}`;
        const stale = readCache(cacheKey);
        if (stale) {
            setData(stale.data);
            setMeta(stale.meta);
            setLoading(false); // On a du cache, on peut arrêter le spinner principal
        }

        try {
            const res = await fetchReapprosHistorique(p);
            setData(res.data);
            setMeta(res.meta);
        } catch {
            // Si le fetch échoue mais qu'on a du cache, on n'affiche pas d'erreur pour ne pas perturber l'utilisateur
            if (!stale) {
                setErreur("Impossible de charger l'historique des réapprovisionnements.");
            }
        } finally {
            if (!stale) setLoading(false); // On arrête le loading seulement s'il n'y avait pas de cache au départ
        }
    }, []);

    useEffect(() => { load(page); }, [page, load]);

    const filtered = data.filter(r =>
        filtreStatut === "tous" ? true : r.statut === filtreStatut
    );

    const totalPages = meta ? Math.ceil(meta.total / meta.per_page) : 1;

    const handleExport = async (fmtKey) => {
        if (exporting === fmtKey) return;
        setExporting(fmtKey);
        setExportOpen(false);
        try {
            await exportReapprovisionnements(fmtKey, { statut: filtreStatut !== "tous" ? filtreStatut : undefined });
        } catch { /* silencieux */ } finally {
            setExporting(null);
        }
    };

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
                        <option value="tous">Tous les statuts</option>
                        <option value="valide">Validé</option>
                        <option value="refuse">Refusé</option>
                        <option value="en_attente">En attente</option>
                        <option value="en_cours">En cours</option>
                    </select>

                    <div style={{ position: "relative", marginLeft: "auto" }}>
                        <button
                            className="app-button app-button--ghost app-button--sm"
                            onClick={() => setExportOpen(v => !v)}
                            type="button"
                            aria-expanded={exportOpen}
                        >
                            <Download size={16} aria-hidden="true" />
                            Exporter
                            <ChevronDown size={14} aria-hidden="true" />
                        </button>
                        {exportOpen && (
                            <div className="finCommandes-export-menu" role="menu">
                                {["pdf", "csv", "docx"].map(fmt => (
                                    <button
                                        key={fmt}
                                        className="finCommandes-export-menu__item"
                                        onClick={() => handleExport(fmt)}
                                        disabled={exporting === fmt}
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

            {erreur && (
                <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", background: "rgba(231,76,60,0.07)", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(231,76,60,0.2)" }}>
                    {erreur}
                </p>
            )}

            {/* Desktop table */}
            <div className="finReapp-tableWrap">
                <table className="finReapp-table" aria-label="Historique des réapprovisionnements">
                    <thead className="finReapp-table__head">
                        <tr>
                            <th scope="col">ID</th>
                            <th scope="col">Produit</th>
                            <th scope="col">Qté</th>
                            <th scope="col">Montant</th>
                            <th scope="col">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <TableSkeleton /> : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="finReapp-empty">
                                        <div className="finReapp-empty__icon"><History size={32} aria-hidden="true" /></div>
                                        <p className="finReapp-empty__title">Aucun réapprovisionnement trouvé</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(r => (
                                <tr key={r.id} className="finReapp-table__row" onClick={() => setSelectedR(r)}>
                                    <td className="finReapp-table__id">{r.id}</td>
                                    <td>
                                        <p style={{ fontWeight: "var(--weight-medium)", margin: 0, fontSize: "var(--text-sm)" }}>{r.produit.nom}</p>
                                        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>{r.produit.sku}</p>
                                    </td>
                                    <td style={{ fontSize: "var(--text-sm)" }}>{r.quantiteDemandee}</td>
                                    <td className="finReapp-table__amount">{formatMontant(r.montantTotal)}</td>
                                    <td>
                                        <span className={`fin-badge fin-badge--${STATUT_CONFIG[r.statut]?.badge ?? 'default'}`}>
                                            {STATUT_CONFIG[r.statut]?.label ?? r.statut}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="finReapp-cards">
                {loading ? (
                    [0,1,2].map(i => (
                        <div key={i} className="finReapp-card">
                            <div className="finReapp-skeleton finReapp-skeleton--sm" style={{ marginBottom: "var(--space-2)" }} />
                            <div className="finReapp-skeleton finReapp-skeleton--lg" style={{ marginBottom: "var(--space-2)" }} />
                            <div className="finReapp-skeleton finReapp-skeleton--md" />
                        </div>
                    ))
                ) : filtered.map(r => (
                    <article key={r.id} className="finReapp-card" onClick={() => setSelectedR(r)}>
                        <div className="finReapp-card__top">
                            <span className="finReapp-card__id">{r.id}</span>
                            <span className={`fin-badge fin-badge--${STATUT_CONFIG[r.statut]?.badge ?? 'default'}`}>
                                {STATUT_CONFIG[r.statut]?.label ?? r.statut}
                            </span>
                        </div>
                        <p className="finReapp-card__name">{r.produit.nom}</p>
                        <div className="finReapp-card__meta">
                            <span className="finReapp-card__amount">{formatMontant(r.montantTotal)}</span>
                            <span className="finReapp-card__date">{r.dateDecision ? formatDate(r.dateDecision) : "—"}</span>
                        </div>
                    </article>
                ))}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="finReapp-pagination">
                    <button
                        className="finReapp-pagination__btn"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Page précédente"
                        type="button"
                    >
                        <ChevronLeft size={16} aria-hidden="true" />
                    </button>
                    <span className="finReapp-pagination__info">Page {page} / {totalPages}</span>
                    <button
                        className="finReapp-pagination__btn"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        aria-label="Page suivante"
                        type="button"
                    >
                        <ChevronRight size={16} aria-hidden="true" />
                    </button>
                </div>
            )}

            {selectedR && (
                <ReapprovisionnementPane
                    reappro={selectedR}
                    mode="historique"
                    onClose={() => setSelectedR(null)}
                />
            )}
        </>
    );
}

export default HistoriqueReapprovisionnements;
