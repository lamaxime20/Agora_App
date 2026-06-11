import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Search, Download, ChevronDown, ChevronLeft, ChevronRight, Repeat, ScissorsLineDashed } from "lucide-react";
import { fetchAbonnements } from "../../../../services/financesP4.js";
import AbonnementPane from "./abonnementPane.jsx";
import { readCache } from "../../../../services/financesCache.js";
import FormNouvelAbonnement from "./formNouvelAbonnement.jsx";
import CouperAbonnementPane from "./couperAbonnementPane.jsx";

const DAYS_URGENT = 14;

function daysUntil(dateStr) {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function KpiSkeleton() {
    return (
        <div className="finAbo-kpis">
            {[0,1,2,3].map(i => (
                <div key={i} className="finAbo-kpi">
                    <div className="finAbo-skeleton finAbo-skeleton--sm" style={{ marginBottom: "var(--space-2)" }} />
                    <div className="finAbo-skeleton finAbo-skeleton--lg" />
                </div>
            ))}
        </div>
    );
}

function TableSkeleton() {
    return Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="finAbo-table__row--skeleton">
            <td><div className="finAbo-skeleton finAbo-skeleton--sm" /></td>
            <td><div className="finAbo-skeleton finAbo-skeleton--md" /></td>
            <td><div className="finAbo-skeleton finAbo-skeleton--sm" /></td>
            <td><div className="finAbo-skeleton finAbo-skeleton--sm" /></td>
            <td><div className="finAbo-skeleton finAbo-skeleton--md" /></td>
            <td><div className="finAbo-skeleton finAbo-skeleton--sm" /></td>
            <td><div className="finAbo-skeleton finAbo-skeleton--sm" /></td>
        </tr>
    ));
}

function AbonnementsEnCours() {
    const [data, setData]             = useState([]);
    const [meta, setMeta]             = useState(null);
    const [kpis, setKpis]             = useState(null);
    const [page, setPage]             = useState(1);
    const [loading, setLoading]       = useState(true);
    const [erreur, setErreur]         = useState("");
    const [recherche, setRecherche]   = useState("");
    const [exportOpen, setExportOpen] = useState(false);
    const [selectedAbo, setSelectedAbo]   = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [aboToCut, setAboToCut]         = useState(null);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) => {
        if (!d) return "";
        const date = new Date(d);
        return !isNaN(date) ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date) : "";
    };

    const mapAbonnement = (abo) => {
        let prochaineEcheance = null;
        if (abo.depense_active && abo.date_abonnement) {
            const today = new Date();
            const dateAbonnement = new Date(abo.date_abonnement);
            const subscriptionDay = dateAbonnement.getDate();

            let nextDueDate = new Date(today.getFullYear(), today.getMonth(), subscriptionDay);

            if (nextDueDate < today) {
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            }
            prochaineEcheance = nextDueDate.toISOString().split('T')[0];
        }
        return {
            id: abo.id,
            nomService: abo.service_paye,
            fournisseur: abo.fournisseur,
            montantMensuel: abo.montant_mensuel,
            dateDebut: abo.date_abonnement,
            statut: abo.depense_active ? "actif" : "resilié",
            prochaineEcheance: prochaineEcheance,
            dateFin: abo.dateFin, // Ce champ n'est pas dans la nouvelle réponse, il sera undefined
        };
    };

    const processResponse = (res) => {
        const mappedData = res.data.map(mapAbonnement);
        setData(mappedData);
        setMeta(res.meta);
        const all = (res.all?.map(mapAbonnement) ?? mappedData).filter(a => a.statut === "actif");
        const charge = all.reduce((s, a) => s + a.montantMensuel, 0);
        const fournisseurs = new Set(all.map(a => a.fournisseur)).size;
        const prochaines = all
            .filter(a => a.prochaineEcheance)
            .map(a => ({ id: a.id, date: a.prochaineEcheance }))
            .sort((x, y) => new Date(x.date) - new Date(y.date));
        setKpis({
            count: res.meta.total,
            charge,
            prochaineEcheance: prochaines[0]?.date ?? null,
            fournisseurs,
        });
    };

    const load = useCallback(async (p) => {
        setErreur("");
        fetchAbonnements(p, "actif")
            .then(res => { processResponse(res); setLoading(false); })
            .catch(() => { setErreur("Impossible de charger les abonnements actifs."); setLoading(false); });
    }, []);

    useEffect(() => {
        const cacheKey = `abonnements_${page}_actif`;
        const cached = readCache(cacheKey);

        if (cached) {
            processResponse(cached);
            setLoading(false);
        } else {
            setLoading(true);
        }

        load(page);
    }, [page, load]);

    const filtered = data.filter(a => {
        const q = recherche.toLowerCase();
        return !q || a.nomService.toLowerCase().includes(q) || a.fournisseur.toLowerCase().includes(q);
    });

    const totalPages = meta ? Math.ceil(meta.total / meta.per_page) : 1;

    const handleCutSuccess = () => {
        setAboToCut(null);
        load(page);
    };

    return (
        <>
            {/* KPIs */}
            {loading ? <KpiSkeleton /> : kpis ? (
                <div className="finAbo-kpis">
                    <div className="finAbo-kpi">
                        <p className="finAbo-kpi__label">Abonnements actifs</p>
                        <p className="finAbo-kpi__value">{kpis.count}</p>
                    </div>
                    <div className="finAbo-kpi">
                        <p className="finAbo-kpi__label">Charge mensuelle</p>
                        <p className="finAbo-kpi__value finAbo-kpi__value--error">{formatMontant(kpis.charge)}</p>
                    </div>
                    <div className="finAbo-kpi">
                        <p className="finAbo-kpi__label">Prochaine échéance</p>
                        <p className={`finAbo-kpi__value ${kpis.prochaineEcheance && daysUntil(kpis.prochaineEcheance) <= DAYS_URGENT ? "finAbo-kpi__value--warning" : ""}`}>
                            {kpis.prochaineEcheance
                                ? formatDate(kpis.prochaineEcheance)
                                : "—"}
                        </p>
                    </div>
                    <div className="finAbo-kpi">
                        <p className="finAbo-kpi__label">Fournisseurs</p>
                        <p className="finAbo-kpi__value">{kpis.fournisseurs}</p>
                    </div>
                </div>
            ) : null}

            {/* Toolbar */}
            <div className="finAbo-toolbar">
                <div className="finAbo-toolbar__row">
                    <div className="finAbo-search">
                        <Search size={16} className="finAbo-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="finAbo-search__input"
                            placeholder="Rechercher un service, un fournisseur…"
                            value={recherche}
                            onChange={e => setRecherche(e.target.value)}
                            aria-label="Rechercher"
                        />
                    </div>

                    <div style={{ position: "relative" }}>
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

                    <button
                        className="app-button app-button--primary app-button--sm"
                        onClick={() => setShowAddModal(true)}
                        type="button"
                    >
                        <PlusCircle size={16} aria-hidden="true" />
                        Nouvel abonnement
                    </button>
                </div>
            </div>

            {erreur && (
                <p style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", background: "rgba(231,76,60,0.07)", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(231,76,60,0.2)" }}>
                    {erreur}
                </p>
            )}

            {/* Desktop table */}
            <div className="finAbo-tableWrap">
                <table className="finAbo-table" aria-label="Abonnements en cours">
                    <thead className="finAbo-table__head">
                        <tr>
                            <th scope="col">Réf.</th>
                            <th scope="col">Service</th>
                            <th scope="col">Fournisseur</th>
                            <th scope="col">Depuis</th>
                            <th scope="col">/mois</th>
                            <th scope="col">Prochaine échéance</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <TableSkeleton /> : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="finAbo-empty">
                                        <div className="finAbo-empty__icon"><Repeat size={32} aria-hidden="true" /></div>
                                        <p className="finAbo-empty__title">Aucun abonnement actif</p>
                                        <p className="finAbo-empty__desc">Ajoutez votre premier abonnement.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(abo => {
                                const days = daysUntil(abo.prochaineEcheance);
                                const urgent = days !== null && days <= DAYS_URGENT;
                                return (
                                    <tr key={abo.id} className="finAbo-table__row" onClick={() => setSelectedAbo(abo)}>
                                        <td className="finAbo-table__id">{abo.id}</td>
                                        <td className="finAbo-table__name">{abo.nomService}</td>
                                        <td style={{ fontSize: "var(--text-sm)" }}>{abo.fournisseur}</td>
                                        <td className="finAbo-table__date">{formatDate(abo.dateDebut)}</td>
                                        <td className="finAbo-table__amount">{formatMontant(abo.montantMensuel)}</td>
                                        <td>
                                            {abo.prochaineEcheance ? (
                                                <span className={`finAbo-echeance-badge${urgent ? " finAbo-echeance-badge--urgent" : ""}`}>
                                                    {formatDate(abo.prochaineEcheance)}
                                                    {urgent && ` · J-${days}`}
                                                </span>
                                            ) : "—"}
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <div style={{ display: "flex", gap: "var(--space-2)" }}>
                                                <button
                                                    className="app-button app-button--ghost app-button--sm"
                                                    onClick={() => setSelectedAbo(abo)}
                                                    type="button"
                                                >
                                                    Voir
                                                </button>
                                                <button
                                                    className="app-button app-button--ghost app-button--sm"
                                                    style={{ color: "var(--color-error)" }}
                                                    onClick={() => setAboToCut(abo)}
                                                    type="button"
                                                    aria-label={`Résilier ${abo.nomService}`}
                                                >
                                                    <ScissorsLineDashed size={14} aria-hidden="true" />
                                                    Résilier
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="finAbo-cards">
                {loading ? (
                    [0,1,2].map(i => (
                        <div key={i} className="finAbo-card">
                            <div className="finAbo-skeleton finAbo-skeleton--sm" style={{ marginBottom: "var(--space-2)" }} />
                            <div className="finAbo-skeleton finAbo-skeleton--lg" style={{ marginBottom: "var(--space-2)" }} />
                            <div className="finAbo-skeleton finAbo-skeleton--md" />
                        </div>
                    ))
                ) : filtered.map(abo => {
                    const days = daysUntil(abo.prochaineEcheance);
                    const urgent = days !== null && days <= DAYS_URGENT;
                    return (
                        <article key={abo.id} className="finAbo-card" onClick={() => setSelectedAbo(abo)}>
                            <div className="finAbo-card__top">
                                <span className="finAbo-card__id">{abo.id}</span>
                                <span className="fin-badge fin-badge--success">Actif</span>
                            </div>
                            <p className="finAbo-card__name">{abo.nomService}</p>
                            <div className="finAbo-card__meta">
                                <span className="finAbo-card__amount">{formatMontant(abo.montantMensuel)}/mois</span>
                                {abo.prochaineEcheance && (
                                    <span className={`finAbo-echeance-badge${urgent ? " finAbo-echeance-badge--urgent" : ""}`}>
                                        {urgent ? `J-${days}` : formatDate(abo.prochaineEcheance)}
                                    </span>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="finAbo-pagination">
                    <button
                        className="finAbo-pagination__btn"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Page précédente"
                        type="button"
                    >
                        <ChevronLeft size={16} aria-hidden="true" />
                    </button>
                    <span className="finAbo-pagination__info">Page {page} / {totalPages}</span>
                    <button
                        className="finAbo-pagination__btn"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        aria-label="Page suivante"
                        type="button"
                    >
                        <ChevronRight size={16} aria-hidden="true" />
                    </button>
                </div>
            )}

            {selectedAbo && (
                <AbonnementPane
                    abonnement={selectedAbo}
                    onClose={() => setSelectedAbo(null)}
                    onSuspendre={(abo) => { setSelectedAbo(null); setAboToCut(abo); }}
                />
            )}

            {showAddModal && (
                <FormNouvelAbonnement
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => { setShowAddModal(false); load(page); }}
                />
            )}

            {aboToCut && (
                <CouperAbonnementPane
                    abonnement={aboToCut}
                    onClose={() => setAboToCut(null)}
                    onSuccess={handleCutSuccess}
                />
            )}
        </>
    );
}

export default AbonnementsEnCours;
