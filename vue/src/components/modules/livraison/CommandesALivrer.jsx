import { useState, useEffect, useMemo, useCallback } from "react";
import { PackageCheck, Clock, Search, Download } from "lucide-react";
import {
    fetchCommandesALivrer, fetchHistoriqueLivraisons, fetchLivraisonDetail,
    exportLivraisons, formatMontant, formatDate, getStatutBadge, CACHE,
} from "../../../services/livraison.js";
import AssignDriverModal from "./AssignDriverModal.jsx";
import DeliveryDrawer    from "./DeliveryDrawer.jsx";
import "../../../assets/styles/components/modules/livraison/CommandesALivrer.css";

const TABS    = ["Commandes à livrer", "Historique des livraisons"];
const PER_PAGE = 20;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
    return (
        <div className="cmdLiv-card cmdLiv-card--skeleton">
            <div className="liv-skeleton" style={{ width: "40%", height: 14 }} />
            <div className="liv-skeleton" style={{ width: "60%", height: 18, marginTop: 8 }} />
            <div className="liv-skeleton" style={{ width: "30%", height: 12, marginTop: 6 }} />
            <div className="liv-skeleton" style={{ width: "100%", height: 40, marginTop: 12, borderRadius: 12 }} />
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="cmdLiv-table-wrap">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="cmdLiv-table-row cmdLiv-table-row--skeleton">
                    <div className="liv-skeleton" style={{ width: "15%", height: 14 }} />
                    <div className="liv-skeleton" style={{ width: "20%", height: 14 }} />
                    <div className="liv-skeleton" style={{ width: "15%", height: 14 }} />
                    <div className="liv-skeleton" style={{ width: "12%", height: 14 }} />
                    <div className="liv-skeleton" style={{ width: "10%", height: 24, borderRadius: 999 }} />
                    <div className="liv-skeleton" style={{ width: "12%", height: 36, borderRadius: 12 }} />
                </div>
            ))}
        </div>
    );
}

// ─── Commandes à livrer ───────────────────────────────────────────────────────

function ListeCommandes() {
    const [filters, setFilters]     = useState({ page: 1, recherche: "" });
    const [data, setData]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [total, setTotal]         = useState(0);
    const [error, setError]         = useState("");
    const [assigning, setAssigning] = useState(null);

    const updateFilter = (key, value) =>
        setFilters(prev => ({ ...prev, [key]: value, page: key !== "page" ? 1 : value }));

    const params = useMemo(() => ({
        page:     filters.page,
        per_page: PER_PAGE,
        ...(filters.recherche ? { recherche: filters.recherche } : {}),
    }), [filters]);

    const reload = useCallback(async () => {
        setLoading(true);
        setError("");

        const stale = CACHE.readCommandesALivrer(params);
        if (stale) {
            setData(stale);
            setTotal(stale.meta?.total ?? 0);
            setLoading(false);
        }

        try {
            const res = await fetchCommandesALivrer(params);
            setData(res);
            setTotal(res.meta?.total ?? 0);
        } catch (err) {
            if (!stale) setError(err?.message ?? "Impossible de charger les commandes.");
        } finally {
            if (!stale) setLoading(false);
        }
    }, [params]);

    useEffect(() => { reload(); }, [reload]);

    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

    if (loading && !data) return (
        <div className="cmdLiv-list">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
    );
    if (error && !data) return <p className="cmdLiv-error">{error}</p>;

    return (
        <>
            {/* ── Barre de recherche ── */}
            <div className="cmdLiv-filterbar">
                <label className="cmdLiv-filter-search">
                    <Search size={15} className="cmdLiv-filter-search__icon" aria-hidden="true" />
                    <input
                        type="search"
                        className="cmdLiv-filter-search__input"
                        placeholder="Rechercher par commande ou client…"
                        value={filters.recherche}
                        onChange={e => updateFilter("recherche", e.target.value)}
                    />
                </label>
            </div>

            {error && <p className="cmdLiv-error">{error}</p>}

            {/* Mobile : cartes */}
            <div className="cmdLiv-list cmdLiv-list--mobile">
                {data?.data?.map(cmd => (
                    <div key={cmd.id} className="cmdLiv-card">
                        <div className="cmdLiv-card__header">
                            <span className="cmdLiv-card__numero">{cmd.numero}</span>
                            <span className={`liv-badge liv-badge--${cmd.etatPaiement === "valide" ? "success" : "warning"}`}>
                                {cmd.etatPaiement === "valide" ? "Validé" : "Partiel"}
                            </span>
                        </div>
                        <p className="cmdLiv-card__client">{cmd.client}</p>
                        <div className="cmdLiv-card__meta">
                            <span className="cmdLiv-card__montant">{formatMontant(cmd.montant)}</span>
                            <span className="cmdLiv-card__date">{formatDate(cmd.date)}</span>
                        </div>
                        <button
                            type="button"
                            className="cmdLiv-card__assign-btn"
                            onClick={() => setAssigning(cmd)}
                        >
                            Assigner un livreur
                        </button>
                    </div>
                ))}
                {!data?.data?.length && !loading && (
                    <div className="cmdLiv-empty">
                        <PackageCheck size={40} className="cmdLiv-empty__icon" aria-hidden="true" />
                        <p>Aucune commande à livrer.</p>
                    </div>
                )}
            </div>

            {/* Desktop : tableau */}
            <div className="cmdLiv-list--desktop">
                <table className="cmdLiv-table">
                    <thead>
                        <tr>
                            <th>Commande</th>
                            <th>Client</th>
                            <th>Montant</th>
                            <th>Date</th>
                            <th>Paiement</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.data?.map(cmd => (
                            <tr key={cmd.id} className="cmdLiv-table__row">
                                <td className="cmdLiv-table__numero">{cmd.numero}</td>
                                <td>{cmd.client}</td>
                                <td className="cmdLiv-table__montant">{formatMontant(cmd.montant)}</td>
                                <td className="cmdLiv-table__date">{formatDate(cmd.date)}</td>
                                <td>
                                    <span className={`liv-badge liv-badge--${cmd.etatPaiement === "valide" ? "success" : "warning"}`}>
                                        {cmd.etatPaiement === "valide" ? "Validé" : "Partiel"}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className="cmdLiv-table__assign-btn"
                                        onClick={() => setAssigning(cmd)}
                                    >
                                        Assigner
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!data?.data?.length && !loading && (
                    <div className="cmdLiv-empty cmdLiv-empty--table">
                        <PackageCheck size={40} className="cmdLiv-empty__icon" aria-hidden="true" />
                        <p>Aucune commande à livrer.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="cmdLiv-pagination">
                    <button
                        type="button"
                        className="cmdLiv-pagination__btn"
                        disabled={filters.page <= 1}
                        onClick={() => updateFilter("page", filters.page - 1)}
                    >
                        Précédent
                    </button>
                    <span className="cmdLiv-pagination__info">
                        Page {filters.page} / {totalPages}
                        {total > 0 && <> · {total} résultat{total > 1 ? "s" : ""}</>}
                    </span>
                    <button
                        type="button"
                        className="cmdLiv-pagination__btn"
                        disabled={filters.page >= totalPages}
                        onClick={() => updateFilter("page", filters.page + 1)}
                    >
                        Suivant
                    </button>
                </div>
            )}

            {assigning && (
                <AssignDriverModal
                    commande={assigning}
                    onClose={() => setAssigning(null)}
                    onSuccess={() => { setAssigning(null); reload(); }}
                />
            )}
        </>
    );
}

// ─── Historique des livraisons ────────────────────────────────────────────────

function HistoriqueLivraisons() {
    const [filters, setFilters]      = useState({ page: 1, recherche: "", statut: "tous", dateDebut: "", dateFin: "" });
    const [data, setData]            = useState(null);
    const [loading, setLoading]      = useState(true);
    const [total, setTotal]          = useState(0);
    const [error, setError]          = useState("");
    const [selected, setSelected]    = useState(null);
    const [loadingDetailId, setLDId] = useState(null);
    const [exporting, setExporting]  = useState(false);
    const [exportMsg, setExportMsg]  = useState("");

    const updateFilter = (key, value) =>
        setFilters(prev => ({ ...prev, [key]: value, page: key !== "page" ? 1 : value }));

    const params = useMemo(() => ({
        page:     filters.page,
        per_page: PER_PAGE,
        ...(filters.recherche         ? { recherche:  filters.recherche  } : {}),
        ...(filters.statut !== "tous" ? { statut:     filters.statut     } : {}),
        ...(filters.dateDebut         ? { date_debut: filters.dateDebut  } : {}),
        ...(filters.dateFin           ? { date_fin:   filters.dateFin    } : {}),
    }), [filters]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");

            const stale = CACHE.readHistoriqueLivraisons(params);
            if (stale) {
                setData(stale);
                setTotal(stale.meta?.total ?? 0);
                setLoading(false);
            }

            try {
                const res = await fetchHistoriqueLivraisons(params);
                setData(res);
                setTotal(res.meta?.total ?? 0);
            } catch (err) {
                if (!stale) setError(err?.message ?? "Impossible de charger l'historique.");
            } finally {
                if (!stale) setLoading(false);
            }
        })();
    }, [params]);

    const handleRowClick = async (liv) => {
        setLDId(liv.id);
        try {
            const detail = await fetchLivraisonDetail(liv.id);
            setSelected(detail);
        } catch {
            setSelected(liv);
        } finally {
            setLDId(null);
        }
    };

    const handleExport = async (format) => {
        setExporting(true);
        try {
            const res = await exportLivraisons(format);
            setExportMsg(res?.message ?? "Export réalisé.");
        } catch {
            setExportMsg("Export non encore disponible.");
        } finally {
            setExporting(false);
            setTimeout(() => setExportMsg(""), 3000);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

    return (
        <>
            {/* ── Barre de filtres ── */}
            <div className="cmdLiv-filterbar">
                <label className="cmdLiv-filter-search">
                    <Search size={15} className="cmdLiv-filter-search__icon" aria-hidden="true" />
                    <input
                        type="search"
                        className="cmdLiv-filter-search__input"
                        placeholder="Rechercher…"
                        value={filters.recherche}
                        onChange={e => updateFilter("recherche", e.target.value)}
                    />
                </label>

                <select
                    className="cmdLiv-filter-select"
                    value={filters.statut}
                    onChange={e => updateFilter("statut", e.target.value)}
                    aria-label="Filtrer par statut"
                >
                    <option value="tous">Tous les statuts</option>
                    <option value="en_cours">En cours</option>
                    <option value="livree">Livrée</option>
                    <option value="echec">Échec</option>
                    <option value="retour">Retour</option>
                </select>

                <input
                    type="date"
                    className="cmdLiv-filter-date"
                    value={filters.dateDebut}
                    onChange={e => updateFilter("dateDebut", e.target.value)}
                    max={filters.dateFin || undefined}
                    aria-label="Date de début"
                />
                <input
                    type="date"
                    className="cmdLiv-filter-date"
                    value={filters.dateFin}
                    onChange={e => updateFilter("dateFin", e.target.value)}
                    min={filters.dateDebut || undefined}
                    aria-label="Date de fin"
                />
            </div>

            {/* ── Toolbar export ── */}
            <div className="cmdLiv-toolbar">
                <div className="cmdLiv-export">
                    <Download size={16} aria-hidden="true" />
                    <span>Exporter</span>
                    {["pdf", "csv", "docx"].map(f => (
                        <button
                            key={f}
                            type="button"
                            className="cmdLiv-export__btn"
                            onClick={() => handleExport(f)}
                            disabled={exporting}
                        >
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>
                {exportMsg && <span className="cmdLiv-export__msg">{exportMsg}</span>}
            </div>

            {error && <p className="cmdLiv-error">{error}</p>}

            {loading && !data && <TableSkeleton />}

            {/* Mobile : cartes */}
            {(!loading || data) && (
                <div className="cmdLiv-list cmdLiv-list--mobile">
                    {data?.data?.map(liv => {
                        const badge = getStatutBadge(liv.statut);
                        return (
                            <button
                                key={liv.id}
                                type="button"
                                className={`cmdLiv-card cmdLiv-card--history${loadingDetailId === liv.id ? " cmdLiv-card--loading" : ""}`}
                                onClick={() => handleRowClick(liv)}
                                disabled={loadingDetailId !== null}
                            >
                                <div className="cmdLiv-card__header">
                                    <span className="cmdLiv-card__numero">{liv.numero}</span>
                                    <span className={`liv-badge liv-badge--${badge.variant}`}>{badge.label}</span>
                                </div>
                                <p className="cmdLiv-card__client">{liv.client} · {liv.livreur}</p>
                                <div className="cmdLiv-card__meta">
                                    <span className="cmdLiv-card__montant">{formatMontant(liv.montant)}</span>
                                    <span className="cmdLiv-card__date">{formatDate(liv.dateCreation)}</span>
                                </div>
                            </button>
                        );
                    })}
                    {!data?.data?.length && !loading && (
                        <div className="cmdLiv-empty">
                            <PackageCheck size={40} className="cmdLiv-empty__icon" aria-hidden="true" />
                            <p>Aucun résultat.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Desktop : tableau */}
            {(!loading || data) && (
                <div className="cmdLiv-list--desktop">
                    <table className="cmdLiv-table">
                        <thead>
                            <tr>
                                <th>Numéro</th>
                                <th>Commande</th>
                                <th>Livreur</th>
                                <th>Statut</th>
                                <th>Création</th>
                                <th>Lancement</th>
                                <th>Livraison</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.data?.map(liv => {
                                const badge = getStatutBadge(liv.statut);
                                return (
                                    <tr
                                        key={liv.id}
                                        className={`cmdLiv-table__row cmdLiv-table__row--clickable${loadingDetailId === liv.id ? " cmdLiv-table__row--loading" : ""}`}
                                        onClick={() => handleRowClick(liv)}
                                        tabIndex={0}
                                        onKeyDown={e => e.key === "Enter" && handleRowClick(liv)}
                                        aria-label={`Détails de ${liv.numero}`}
                                        aria-disabled={loadingDetailId !== null}
                                    >
                                        <td className="cmdLiv-table__numero">{liv.numero}</td>
                                        <td>{liv.commande}</td>
                                        <td>{liv.livreur}</td>
                                        <td><span className={`liv-badge liv-badge--${badge.variant}`}>{badge.label}</span></td>
                                        <td>{formatDate(liv.dateCreation)}</td>
                                        <td>{formatDate(liv.dateLancement)}</td>
                                        <td>{formatDate(liv.dateLivraison)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {!data?.data?.length && !loading && (
                        <div className="cmdLiv-empty cmdLiv-empty--table">
                            <PackageCheck size={40} className="cmdLiv-empty__icon" aria-hidden="true" />
                            <p>Aucun résultat.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="cmdLiv-pagination">
                    <button
                        type="button"
                        className="cmdLiv-pagination__btn"
                        disabled={filters.page <= 1}
                        onClick={() => updateFilter("page", filters.page - 1)}
                    >
                        Précédent
                    </button>
                    <span className="cmdLiv-pagination__info">
                        Page {filters.page} / {totalPages}
                        {total > 0 && <> · {total} résultat{total > 1 ? "s" : ""}</>}
                    </span>
                    <button
                        type="button"
                        className="cmdLiv-pagination__btn"
                        disabled={filters.page >= totalPages}
                        onClick={() => updateFilter("page", filters.page + 1)}
                    >
                        Suivant
                    </button>
                </div>
            )}

            {selected && <DeliveryDrawer livraison={selected} onClose={() => setSelected(null)} />}
        </>
    );
}

// ─── Composant principal ──────────────────────────────────────────────────────

function CommandesALivrer() {
    const [tab, setTab] = useState(TABS[0]);

    return (
        <div className="cmdLiv-root">
            <div className="cmdLiv-tabs" role="tablist" aria-label="Onglets commandes">
                {TABS.map(t => (
                    <button
                        key={t}
                        type="button"
                        role="tab"
                        aria-selected={tab === t}
                        className={`cmdLiv-tab${tab === t ? " cmdLiv-tab--active" : ""}`}
                        onClick={() => setTab(t)}
                    >
                        {t === TABS[0] ? <PackageCheck size={16} aria-hidden="true" /> : <Clock size={16} aria-hidden="true" />}
                        <span>{t}</span>
                    </button>
                ))}
            </div>

            <div role="tabpanel" aria-label={tab}>
                {tab === TABS[0] ? <ListeCommandes /> : <HistoriqueLivraisons />}
            </div>
        </div>
    );
}

export default CommandesALivrer;
