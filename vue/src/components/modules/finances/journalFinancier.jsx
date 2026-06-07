import { useState, useEffect, useCallback } from "react";
import {
    Search, Download, ChevronDown, ChevronLeft, ChevronRight,
    ArrowUpRight, ArrowDownLeft, BookOpen,
} from "lucide-react";
import { fetchJournalFinancier } from "../../../services/financesP5.js";
import MouvementPane from "./journalFinancier/mouvementPane.jsx";
import "../../../assets/styles/components/modules/finances/journalFinancier.css";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
    d ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d)) : "—";

const TYPES = ["tous", "Paiement commande", "Dépense", "Abonnement", "Réapprovisionnement", "Entrée", "Salaire", "Remboursement"];
const SENS  = ["tous", "entree", "sortie"];

function KpiSkeleton() {
    return (
        <div className="finJrn-kpis">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="finJrn-kpi">
                    <div className="finJrn-skeleton finJrn-skeleton--sm" />
                    <div className="finJrn-skeleton finJrn-skeleton--md" style={{ marginTop: 4 }} />
                </div>
            ))}
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="finJrn-tableWrap">
            <table className="finJrn-table">
                <thead className="finJrn-table__head">
                    <tr>
                        <th>Date</th><th>Type</th><th>Montant</th>
                        <th>Sens</th><th>Description</th><th>Référence</th>
                    </tr>
                </thead>
                <tbody>
                    {[1, 2, 3, 4, 5].map(i => (
                        <tr key={i} className="finJrn-table__row--skeleton">
                            <td><div className="finJrn-skeleton finJrn-skeleton--sm" /></td>
                            <td><div className="finJrn-skeleton finJrn-skeleton--md" /></td>
                            <td><div className="finJrn-skeleton finJrn-skeleton--sm" /></td>
                            <td><div className="finJrn-skeleton finJrn-skeleton--sm" /></td>
                            <td><div className="finJrn-skeleton finJrn-skeleton--lg" /></td>
                            <td><div className="finJrn-skeleton finJrn-skeleton--sm" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function JournalFinancier() {
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);
    const [data, setData]             = useState([]);
    const [kpis, setKpis]             = useState(null);
    const [meta, setMeta]             = useState(null);
    const [page, setPage]             = useState(1);
    const [exportOpen, setExportOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const [recherche, setRecherche]   = useState("");
    const [type, setType]             = useState("tous");
    const [sens, setSens]             = useState("tous");
    const [dateDebut, setDateDebut]   = useState("");
    const [dateFin, setDateFin]       = useState("");

    const filters = { recherche, type, sens, dateDebut, dateFin };

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchJournalFinancier(page, filters);
            setData(res.data ?? []);
            setMeta(res.meta ?? null);
            if (res.kpis) setKpis(res.kpis);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, recherche, type, sens, dateDebut, dateFin]);

    useEffect(() => { load(); }, [load]);

    const totalPages = meta ? Math.ceil(meta.total / (meta.per_page ?? 20)) : 1;

    return (
        <section className="finJrn-root" aria-label="Journal financier">
            <header className="finJrn-header">
                <h1 className="finJrn-header__title">Journal financier</h1>
            </header>

            {/* KPIs */}
            {loading && !kpis ? (
                <KpiSkeleton />
            ) : kpis ? (
                <div className="finJrn-kpis">
                    <div className="finJrn-kpi">
                        <p className="finJrn-kpi__label">Total mouvements</p>
                        <p className="finJrn-kpi__value">{kpis.totalMouvements}</p>
                    </div>
                    <div className="finJrn-kpi">
                        <p className="finJrn-kpi__label">Entrées totales</p>
                        <p className="finJrn-kpi__value finJrn-kpi__value--success">{fmt(kpis.totalEntrees)}</p>
                    </div>
                    <div className="finJrn-kpi">
                        <p className="finJrn-kpi__label">Sorties totales</p>
                        <p className="finJrn-kpi__value finJrn-kpi__value--error">{fmt(kpis.totalSorties)}</p>
                    </div>
                    <div className="finJrn-kpi">
                        <p className="finJrn-kpi__label">Solde net</p>
                        <p className={`finJrn-kpi__value ${kpis.soldeNet >= 0 ? "finJrn-kpi__value--primary" : "finJrn-kpi__value--error"}`}>
                            {fmt(kpis.soldeNet)}
                        </p>
                    </div>
                </div>
            ) : null}

            {/* Filtres */}
            <div className="finJrn-filters">
                <div className="finJrn-search">
                    <Search size={16} className="finJrn-search__icon" aria-hidden="true" />
                    <input
                        type="search"
                        className="app-input finJrn-search__input"
                        placeholder="Rechercher description, référence…"
                        value={recherche}
                        onChange={e => { setRecherche(e.target.value); setPage(1); }}
                        aria-label="Rechercher dans le journal"
                    />
                </div>

                <div className="finJrn-filters__row">
                    <select
                        className="finJrn-filter-select"
                        value={type}
                        onChange={e => { setType(e.target.value); setPage(1); }}
                        aria-label="Filtrer par type"
                    >
                        {TYPES.map(t => (
                            <option key={t} value={t}>
                                {t === "tous" ? "Tous les types" : t}
                            </option>
                        ))}
                    </select>

                    <select
                        className="finJrn-filter-select"
                        value={sens}
                        onChange={e => { setSens(e.target.value); setPage(1); }}
                        aria-label="Filtrer par sens"
                    >
                        {SENS.map(s => (
                            <option key={s} value={s}>
                                {s === "tous" ? "Entrées & Sorties" : s === "entree" ? "Entrées" : "Sorties"}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        className="finJrn-filter-select"
                        value={dateDebut}
                        onChange={e => { setDateDebut(e.target.value); setPage(1); }}
                        aria-label="Date de début"
                    />

                    <input
                        type="date"
                        className="finJrn-filter-select"
                        value={dateFin}
                        onChange={e => { setDateFin(e.target.value); setPage(1); }}
                        aria-label="Date de fin"
                    />

                    <div className="finJrn-export-wrap" style={{ marginLeft: "auto" }}>
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
                            <div className="finJrn-export-menu" role="menu">
                                {[".csv", ".pdf", ".xlsx"].map(f => (
                                    <button
                                        key={f}
                                        className="finJrn-export-menu__item"
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

            {loading ? (
                <TableSkeleton />
            ) : error ? (
                <div className="finJrn-error">
                    <p style={{ margin: "0 0 var(--space-3)", color: "var(--color-error)", fontSize: "var(--text-sm)" }}>{error}</p>
                    <button className="app-button app-button--sm" onClick={load} type="button">Réessayer</button>
                </div>
            ) : (
                <>
                    {/* Table desktop */}
                    <div className="finJrn-tableWrap">
                        <table className="finJrn-table" aria-label="Journal financier">
                            <thead className="finJrn-table__head">
                                <tr>
                                    <th scope="col">Date</th>
                                    <th scope="col">Type</th>
                                    <th scope="col">Montant</th>
                                    <th scope="col">Sens</th>
                                    <th scope="col">Description</th>
                                    <th scope="col">Référence</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="finJrn-empty">
                                                <div className="finJrn-empty__icon">
                                                    <BookOpen size={32} aria-hidden="true" />
                                                </div>
                                                <p className="finJrn-empty__title">Aucun mouvement trouvé</p>
                                                <p className="finJrn-empty__desc">Modifiez vos filtres pour voir plus de résultats.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : data.map(m => {
                                    const isEntree = m.sens === "entree";
                                    return (
                                        <tr
                                            key={m.id}
                                            className="finJrn-table__row"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setSelectedId(m.id)}
                                        >
                                            <td className="finJrn-table__date">{fmtDate(m.date)}</td>
                                            <td>
                                                <span className="finJrn-type-badge">{m.type}</span>
                                            </td>
                                            <td className={isEntree ? "finJrn-table__amount--entree" : "finJrn-table__amount--sortie"}>
                                                {isEntree ? "+" : "−"}{fmt(m.montant)}
                                            </td>
                                            <td>
                                                <span className={`finJrn-sens-badge ${isEntree ? "finJrn-sens-badge--entree" : "finJrn-sens-badge--sortie"}`}>
                                                    {isEntree
                                                        ? <><ArrowUpRight size={12} aria-hidden="true" /> Entrée</>
                                                        : <><ArrowDownLeft size={12} aria-hidden="true" /> Sortie</>
                                                    }
                                                </span>
                                            </td>
                                            <td className="finJrn-table__desc">{m.description}</td>
                                            <td className="finJrn-table__ref">{m.reference}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="finJrn-cards">
                        {data.length === 0 ? (
                            <div className="finJrn-empty">
                                <div className="finJrn-empty__icon">
                                    <BookOpen size={32} aria-hidden="true" />
                                </div>
                                <p className="finJrn-empty__title">Aucun mouvement trouvé</p>
                            </div>
                        ) : data.map(m => {
                            const isEntree = m.sens === "entree";
                            return (
                                <article
                                    key={m.id}
                                    className="finJrn-card"
                                    onClick={() => setSelectedId(m.id)}
                                >
                                    <div className="finJrn-card__top">
                                        <span className="finJrn-type-badge">{m.type}</span>
                                        <span className={`finJrn-sens-badge ${isEntree ? "finJrn-sens-badge--entree" : "finJrn-sens-badge--sortie"}`}>
                                            {isEntree
                                                ? <><ArrowUpRight size={12} aria-hidden="true" /> Entrée</>
                                                : <><ArrowDownLeft size={12} aria-hidden="true" /> Sortie</>
                                            }
                                        </span>
                                    </div>
                                    <p className="finJrn-card__desc">{m.description}</p>
                                    <div className="finJrn-card__meta">
                                        <span className={isEntree ? "finJrn-table__amount--entree" : "finJrn-table__amount--sortie"} style={{ fontWeight: "var(--weight-bold)" }}>
                                            {isEntree ? "+" : "−"}{fmt(m.montant)}
                                        </span>
                                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{fmtDate(m.date)}</span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="finJrn-pagination">
                            <button
                                className="finJrn-pagination__btn"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                type="button"
                                aria-label="Page précédente"
                            >
                                <ChevronLeft size={16} aria-hidden="true" />
                            </button>
                            <span className="finJrn-pagination__info">
                                Page {page} / {totalPages} — {meta?.total} mouvements
                            </span>
                            <button
                                className="finJrn-pagination__btn"
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

            {selectedId && (
                <MouvementPane
                    mouvementId={selectedId}
                    onClose={() => setSelectedId(null)}
                />
            )}
        </section>
    );
}

export default JournalFinancier;
