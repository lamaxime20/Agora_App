import { useState, useEffect, useCallback } from "react";
import { Search, Users, Download, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchSalaires } from "../../../../services/financesP5.js";
import { readCache } from "../../../../services/financesCache.js";
import { exportSalaires } from "../../../../services/exportService.js";
import SalariePane from "./salariePane.jsx";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
    d ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d)) : "—";

function getInitiales(prenom, nom) {
    return [(prenom?.[0] ?? ""), (nom?.[0] ?? "")].join("").toUpperCase();
}

const STATUT_MAP = {
    actif:   { label: "Actif",    cls: "fin-badge--success" },
    archive: { label: "Archivé",  cls: "fin-badge--neutral" },
};

function KpiSkeleton() {
    return (
        <div className="finSal-kpis">
            {[1, 2, 3].map(i => (
                <div key={i} className="finSal-kpi">
                    <div className="finSal-skeleton finSal-skeleton--sm" />
                    <div className="finSal-skeleton finSal-skeleton--md" style={{ marginTop: 4 }} />
                </div>
            ))}
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="finSal-tableWrap">
            <table className="finSal-table">
                <thead className="finSal-table__head">
                    <tr>
                        <th>Salarié</th><th>Poste</th><th>Salaire net</th>
                        <th>Prochain paiement</th><th>Statut</th><th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {[1, 2, 3, 4, 5].map(i => (
                        <tr key={i} className="finSal-table__row--skeleton">
                            <td><div className="finSal-skeleton finSal-skeleton--lg" /></td>
                            <td><div className="finSal-skeleton finSal-skeleton--md" /></td>
                            <td><div className="finSal-skeleton finSal-skeleton--sm" /></td>
                            <td><div className="finSal-skeleton finSal-skeleton--sm" /></td>
                            <td><div className="finSal-skeleton finSal-skeleton--sm" /></td>
                            <td><div className="finSal-skeleton finSal-skeleton--sm" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ListeSalaries() {
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);
    const [data, setData]         = useState([]);
    const [meta, setMeta]         = useState(null);
    const [page, setPage]         = useState(1);
    const [recherche, setRecherche] = useState("");
    const [exportOpen, setExportOpen] = useState(false);
    const [exporting, setExporting]   = useState(null);
    const [selectedSalarie, setSelectedSalarie] = useState(null);

    const load = useCallback(async () => {
        setLoading(true); // Always set loading to true initially

        const cacheKey = `salaires_${page}_tous`; // As per financesP5.js, default filtreStatut is 'tous'
        const staleData = readCache(cacheKey);

        if (staleData) {
            setData(staleData.data ?? []);
            setMeta(staleData.meta ?? null);
            setLoading(false); // Display stale data immediately
        }

        try {
            const res = await fetchSalaires(page);
            setData(res.data ?? []);
            setMeta(res.meta ?? null);
            setError(null); // Clear any previous error if fetch is successful
        } catch (e) {
            if (!staleData) { // Only set error if no stale data was available to display
                setError(e.message);
            }
        }
        setLoading(false); // Ensure loading is false after fetch attempt
    }, [page]);

    useEffect(() => { load(); }, [load]);

    const filtered = recherche
        ? data.filter(e =>
            `${e.utilisateur?.prenom ?? ''} ${e.utilisateur?.nom ?? ''}`.toLowerCase().includes(recherche.toLowerCase()) ||
            (e.poste ?? '').toLowerCase().includes(recherche.toLowerCase())
          )
        : data;

    const totalPages = meta ? Math.ceil(meta.total / (meta.per_page ?? 20)) : 1;

    const handleExport = async (fmtKey) => {
        if (exporting === fmtKey) return;
        setExporting(fmtKey);
        setExportOpen(false);
        try {
            await exportSalaires(fmtKey, { recherche });
        } catch { /* silencieux */ } finally {
            setExporting(null);
        }
    };

    return (
        <>
            <header className="finSal-header">
                <h1 className="finSal-header__title">Salariés</h1>
            </header>

            {loading ? (
                <>
                    <KpiSkeleton />
                    <TableSkeleton />
                </>
            ) : error ? (
                <div className="finSal-error">
                    <p style={{ margin: "0 0 var(--space-3)", color: "var(--color-error)", fontSize: "var(--text-sm)" }}>{error}</p>
                    <button className="app-button app-button--sm" onClick={load} type="button">Réessayer</button>
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="finSal-kpis">
                        <div className="finSal-kpi">
                            <p className="finSal-kpi__label">Effectif total</p>
                            <p className="finSal-kpi__value">{meta?.total ?? data.length}</p>
                        </div>
                        <div className="finSal-kpi">
                            <p className="finSal-kpi__label">Masse salariale</p>
                            <p className="finSal-kpi__value finSal-kpi__value--error">{fmt(meta?.masseSalariale ?? 0)}/mois</p>
                        </div>
                        <div className="finSal-kpi">
                            <p className="finSal-kpi__label">Dernier versement</p>
                            <p className="finSal-kpi__value">{fmtDate(meta?.dernierPaiement)}</p>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="finSal-toolbar">
                        <div className="finSal-toolbar__row">
                            <div className="finSal-search">
                                <Search size={16} className="finSal-search__icon" aria-hidden="true" />
                                <input
                                    type="search"
                                    className="app-input finSal-search__input"
                                    placeholder="Rechercher par nom, poste…"
                                    value={recherche}
                                    onChange={e => setRecherche(e.target.value)}
                                    aria-label="Rechercher un salarié"
                                />
                            </div>
                            <div className="finSal-export-wrap">
                                <button
                                    className="app-button app-button--ghost app-button--sm"
                                    onClick={() => setExportOpen(o => !o)}
                                    type="button"
                                    aria-expanded={exportOpen}
                                >
                                    <Download size={16} aria-hidden="true" />
                                    Exporter
                                    <ChevronDown size={14} aria-hidden="true" />
                                </button>
                                {exportOpen && (
                                    <div className="finSal-export-menu" role="menu">
                                        {["pdf", "csv", "docx"].map(f => (
                                            <button
                                                key={f}
                                                className="finSal-export-menu__item"
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

                    {/* Table desktop */}
                    <div className="finSal-tableWrap">
                        <table className="finSal-table" aria-label="Liste des salariés">
                            <thead className="finSal-table__head">
                                <tr>
                                    <th scope="col">Salarié</th>
                                    <th scope="col">Poste</th>
                                    <th scope="col">Salaire net</th>
                                    <th scope="col">Prochain paiement</th>
                                    <th scope="col">Statut</th>
                                    <th scope="col">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="finSal-empty">
                                                <div className="finSal-empty__icon">
                                                    <Users size={32} aria-hidden="true" />
                                                </div>
                                                <p className="finSal-empty__title">Aucun salarié trouvé</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.map(emp => {
                                    const st = STATUT_MAP[emp.statut] ?? { label: emp.statut, cls: "fin-badge--neutral" };
                                    return (
                                        <tr
                                            key={emp.id}
                                            className="finSal-table__row"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setSelectedSalarie(emp)}
                                        >
                                            <td>
                                                <div className="finSal-employee-cell">
                                                    <div className="finSal-avatar" aria-hidden="true">
                                                        {getInitiales(emp.utilisateur?.prenom, emp.utilisateur?.nom)}
                                                    </div>
                                                    <div className="finSal-employee-cell__info">
                                                        <span className="finSal-employee-cell__name">{emp.utilisateur?.prenom} {emp.utilisateur?.nom}</span>
                                                        <span className="finSal-employee-cell__role">{emp.poste ?? "—"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{emp.poste ?? "—"}</td>
                                            <td className="finSal-table__amount">{fmt(emp.montant)}</td>
                                            <td className="finSal-table__date">{fmtDate(emp.date_fin)}</td>
                                            <td><span className={`fin-badge ${st.cls}`}>{st.label}</span></td>
                                            <td>
                                                <button
                                                    className="app-button app-button--ghost app-button--sm"
                                                    onClick={ev => { ev.stopPropagation(); setSelectedSalarie(emp); }}
                                                    type="button"
                                                >
                                                    Voir
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="finSal-cards">
                        {filtered.length === 0 ? (
                            <div className="finSal-empty">
                                <div className="finSal-empty__icon">
                                    <Users size={32} aria-hidden="true" />
                                </div>
                                <p className="finSal-empty__title">Aucun salarié trouvé</p>
                            </div>
                        ) : filtered.map(emp => {
                            const st = STATUT_MAP[emp.statut] ?? { label: emp.statut, cls: "fin-badge--neutral" };
                            return (
                                <article
                                    key={emp.id}
                                    className="finSal-card"
                                    onClick={() => setSelectedSalarie(emp)}
                                >
                                    <div className="finSal-card__top">
                                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                                            <div className="finSal-avatar finSal-avatar--sm" aria-hidden="true">
                                                {getInitiales(emp.utilisateur?.prenom, emp.utilisateur?.nom)}
                                            </div>
                                            <span className="finSal-card__name">{emp.utilisateur?.prenom} {emp.utilisateur?.nom}</span>
                                        </div>
                                        <span className={`fin-badge ${st.cls}`}>{st.label}</span>
                                    </div>
                                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{emp.poste ?? "—"}</div>
                                    <div className="finSal-card__meta">
                                        <span className="finSal-card__amount">{fmt(emp.montant)}/mois</span>
                                        <span className="finSal-card__id">{emp.utilisateur?.id}</span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="finSal-pagination">
                            <button
                                className="finSal-pagination__btn"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                type="button"
                                aria-label="Page précédente"
                            >
                                <ChevronLeft size={16} aria-hidden="true" />
                            </button>
                            <span className="finSal-pagination__info">Page {page} / {totalPages}</span>
                            <button
                                className="finSal-pagination__btn"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                type="button"
                                aria-label="Page suivante"
                            >
                                <ChevronRight size={16} aria-hidden="true" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {selectedSalarie && (
                <SalariePane
                    salarieId={selectedSalarie.id}
                    onClose={() => setSelectedSalarie(null)}
                />
            )}
        </>
    );
}

export default ListeSalaries;
