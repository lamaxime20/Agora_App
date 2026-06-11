import { useState, useEffect, useCallback } from "react";
import { Search, Download, ChevronDown, ChevronLeft, ChevronRight, Truck } from "lucide-react";
import { fetchReapprosEnAttente } from "../../../../services/financesP4.js";
import { readCache } from "../../../../services/financesCache.js";
import ReapprovisionnementPane from "./reapprovisionnementPane.jsx";
import ValiderReapprovisionnementModal from "./validerReapprovisionnementModal.jsx";
import RefuserReapprovisionnementModal from "./refuserReapprovisionnementModal.jsx";

function KpiSkeleton() {
    return (
        <div className="finReapp-kpis">
            {[0,1,2,3].map(i => (
                <div key={i} className="finReapp-kpi">
                    <div className="finReapp-skeleton finReapp-skeleton--sm" style={{ marginBottom: "var(--space-2)" }} />
                    <div className="finReapp-skeleton finReapp-skeleton--lg" />
                </div>
            ))}
        </div>
    );
}

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

function EnAttenteReapprovisionnements() {
    const [data, setData]                 = useState([]);
    const [meta, setMeta]                 = useState(null);
    const [kpis, setKpis]                 = useState(null);
    const [page, setPage]                 = useState(1);
    const [loading, setLoading]           = useState(true);
    const [erreur, setErreur]             = useState("");
    const [recherche, setRecherche]       = useState("");
    const [exportOpen, setExportOpen]     = useState(false);
    const [selectedR, setSelectedR]       = useState(null);
    const [toValider, setToValider]       = useState(null);
    const [toRefuser, setToRefuser]       = useState(null);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        d ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d)) : "—";

    const load = useCallback(async (p) => {
        setLoading(true);
        setErreur("");

        const cacheKey = `reappros_en_attente_${p}`;
        const stale = readCache(cacheKey);
        if (stale) {
            setData(stale.data);
            setMeta(stale.meta);
            const all = stale.all ?? stale.data;
            const montantTotal = all.reduce((s, r) => s + r.montant_a_depenser, 0);
            setKpis({ count: stale.meta.total, montantTotal, montantPotentiel: montantTotal });
            setLoading(false); // On affiche le cache, donc on arrête le chargement principal
        }

        try {
            const res = await fetchReapprosEnAttente(p);
            setData(res.data);
            setMeta(res.meta);
            const all = res.all ?? res.data;
            const montantTotal = all.reduce((s, r) => s + r.montant_a_depenser, 0);
            setKpis({
                count: res.meta.total,
                montantTotal,
                montantPotentiel: montantTotal,
            });
        } catch {
            setErreur("Impossible de charger les réapprovisionnements en attente.");
        } finally {
            if (!stale) setLoading(false);
        }
    }, []);

    useEffect(() => { load(page); }, [page, load]);

    const filtered = data.filter(r => {
        const q = recherche.toLowerCase();
        return !q || r.produit.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    });

    const totalPages = meta ? Math.ceil(meta.total / meta.per_page) : 1;

    const handleActionSuccess = () => {
        setToValider(null);
        setToRefuser(null);
        load(page);
    };

    return (
        <>
            {/* KPIs */}
            {loading ? <KpiSkeleton /> : kpis ? (
                <div className="finReapp-kpis">
                    <div className="finReapp-kpi">
                        <p className="finReapp-kpi__label">Demandes en attente</p>
                        <p className="finReapp-kpi__value">{kpis.count}</p>
                    </div>
                    <div className="finReapp-kpi">
                        <p className="finReapp-kpi__label">Montant total</p>
                        <p className="finReapp-kpi__value finReapp-kpi__value--amount">{formatMontant(kpis.montantTotal)}</p>
                    </div>
                    <div className="finReapp-kpi">
                        <p className="finReapp-kpi__label">Engagements potentiels</p>
                        <p className="finReapp-kpi__value finReapp-kpi__value--warning">{formatMontant(kpis.montantPotentiel)}</p>
                    </div>
                </div>
            ) : null}

            {/* Toolbar */}
            <div className="finReapp-toolbar">
                <div className="finReapp-toolbar__row">
                    <div className="finReapp-search">
                        <Search size={16} className="finReapp-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="finReapp-search__input"
                            placeholder="Rechercher un produit, un ID…"
                            value={recherche}
                            onChange={e => setRecherche(e.target.value)}
                            aria-label="Rechercher"
                        />
                    </div>

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

            {erreur && (
                <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", background: "rgba(231,76,60,0.07)", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(231,76,60,0.2)" }}>
                    {erreur}
                </p>
            )}

            {/* Desktop table */}
            <div className="finReapp-tableWrap">
                <table className="finReapp-table" aria-label="Réapprovisionnements en attente">
                    <thead className="finReapp-table__head">
                        <tr>
                            <th scope="col">ID</th>
                            <th scope="col">Produit</th>
                            <th scope="col">Qté</th>
                            <th scope="col">Montant</th>
                            <th scope="col">Date</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <TableSkeleton /> : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="finReapp-empty">
                                        <div className="finReapp-empty__icon"><Truck size={32} aria-hidden="true" /></div>
                                        <p className="finReapp-empty__title">Aucune demande en attente</p>
                                        <p className="finReapp-empty__desc">Toutes les demandes ont été traitées.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(r => (
                                <tr key={r.id} className="finReapp-table__row">
                                    <td className="finReapp-table__id" onClick={() => setSelectedR(r)} style={{ cursor: "pointer" }}>{r.id}</td>
                                    <td onClick={() => setSelectedR(r)} style={{ cursor: "pointer" }}>
                                        <p style={{ fontWeight: "var(--weight-medium)", margin: 0, fontSize: "var(--text-sm)" }}>{r.produit}</p>
                                    </td>
                                    <td style={{ fontSize: "var(--text-sm)" }}>{r.quantite}</td>
                                    <td className="finReapp-table__amount">{formatMontant(r.montant_a_depenser)}</td>
                                    <td className="finReapp-table__date">{formatDate(r.date_creation)}</td>
                                    <td>
                                        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                                            <button
                                                className="app-button app-button--ghost app-button--sm"
                                                onClick={() => setSelectedR(r)}
                                                type="button"
                                            >
                                                Voir
                                            </button>
                                            <button
                                                className="app-button app-button--sm"
                                                style={{ background: "var(--color-success)", color: "#fff", border: "none" }}
                                                onClick={() => setToValider(r)}
                                                type="button"
                                            >
                                                Valider
                                            </button>
                                            <button
                                                className="app-button app-button--sm"
                                                style={{ background: "var(--color-error)", color: "#fff", border: "none" }}
                                                onClick={() => setToRefuser(r)}
                                                type="button"
                                            >
                                                Refuser
                                            </button>
                                        </div>
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
                        </div>
                        <p className="finReapp-card__name">{r.produit}</p>
                        <div className="finReapp-card__meta">
                            <span className="finReapp-card__amount">{formatMontant(r.montant_a_depenser)}</span>
                            <span className="finReapp-card__date">{formatDate(r.date_creation)}</span>
                        </div>
                        <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }} onClick={e => e.stopPropagation()}>
                            <button
                                className="app-button app-button--sm"
                                style={{ flex: 1, background: "var(--color-success)", color: "#fff", border: "none" }}
                                onClick={() => setToValider(r)}
                                type="button"
                            >
                                Valider
                            </button>
                            <button
                                className="app-button app-button--sm"
                                style={{ flex: 1, background: "var(--color-error)", color: "#fff", border: "none" }}
                                onClick={() => setToRefuser(r)}
                                type="button"
                            >
                                Refuser
                            </button>
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
                    mode="attente"
                    onClose={() => setSelectedR(null)}
                    onValider={() => { setSelectedR(null); setToValider(selectedR); }}
                    onRefuser={() => { setSelectedR(null); setToRefuser(selectedR); }}
                />
            )}

            {toValider && (
                <ValiderReapprovisionnementModal
                    reappro={toValider}
                    onClose={() => setToValider(null)}
                    onSuccess={handleActionSuccess}
                />
            )}

            {toRefuser && (
                <RefuserReapprovisionnementModal
                    reappro={toRefuser}
                    onClose={() => setToRefuser(null)}
                    onSuccess={handleActionSuccess}
                />
            )}
        </>
    );
}

export default EnAttenteReapprovisionnements;
