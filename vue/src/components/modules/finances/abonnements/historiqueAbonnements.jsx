import { useState, useEffect, useCallback } from "react";
import { Download, ChevronDown, ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { fetchAbonnements } from "../../../../services/financesP4.js";
import { exportAbonnements } from "../../../../services/exportService.js";
import AbonnementPane from "./abonnementPane.jsx";
import { readCache } from "../../../../services/financesCache.js";
import ReactiverAbonnementPane from "./reactiverAbonnementPane.jsx";

function TableSkeleton() {
    return Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="finAbo-table__row--skeleton">
            <td><div className="finAbo-skeleton finAbo-skeleton--sm" /></td>
            <td><div className="finAbo-skeleton finAbo-skeleton--md" /></td>
            <td><div className="finAbo-skeleton finAbo-skeleton--sm" /></td>
            <td><div className="finAbo-skeleton finAbo-skeleton--sm" /></td>
            <td><div className="finAbo-skeleton finAbo-skeleton--sm" /></td>
            <td><div className="finAbo-skeleton finAbo-skeleton--md" /></td>
            <td><div className="finAbo-skeleton finAbo-skeleton--sm" /></td>
            <td><div className="finAbo-skeleton finAbo-skeleton--sm" /></td>
        </tr>
    ));
}

function HistoriqueAbonnements() {
    const [data, setData]                     = useState([]);
    const [meta, setMeta]                     = useState(null);
    const [page, setPage]                     = useState(1);
    const [loading, setLoading]               = useState(true);
    const [erreur, setErreur]                 = useState("");
    const [filtreStatut, setFiltreStatut]     = useState("tous");
    const [exportOpen, setExportOpen]         = useState(false);
    const [exporting, setExporting]           = useState(null);
    const [selectedAbo, setSelectedAbo]       = useState(null);
    const [aboToReactivate, setAboToReactivate] = useState(null);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) => {
        if (!d) return "";
        const date = new Date(d);
        return !isNaN(date) ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date) : "";
    };

    const mapAbonnement = (abo) => ({
        id: abo.id,
        nomService: abo.service_paye,
        fournisseur: abo.fournisseur,
        montantMensuel: abo.montant_mensuel,
        dateDebut: abo.date_abonnement,
        statut: abo.depense_active ? "actif" : "resilié",
        // Le champ dateFin n'est pas fourni par la nouvelle API pour l'historique,
        // il sera donc undefined, ce qui est géré dans le rendu.
    });

    const load = useCallback(async (p, statutFiltre) => {
        setErreur("");
        const cacheKey = `abonnements_${p}_${statutFiltre}`;
        const cached = readCache(cacheKey);

        if (cached) {
            // Appliquer le mapping aussi sur les données du cache
            setData(cached.data.map(mapAbonnement));
            setMeta(cached.meta);
            setLoading(false);
        } else {
            setLoading(true);
        }

        try {
            // Utiliser le filtre de statut pour l'appel API
            const res = await fetchAbonnements(p, statutFiltre);
            setData(res.data.map(mapAbonnement));
            setMeta(res.meta);
        } catch {
            setErreur("Impossible de charger l'historique des abonnements.");
        }
        setLoading(false);
    }, []); // Les dépendances sont gérées par useEffect

    useEffect(() => { load(page, filtreStatut); }, [page, filtreStatut, load]);

    const filtered = data.filter(a => {
        if (filtreStatut === "actif")   return a.statut === "actif";
        if (filtreStatut === "resilié") return a.statut !== "actif";
        return true;
    });

    const totalPages = meta ? Math.ceil(meta.total / meta.per_page) : 1;

    const handleExport = async (fmtKey) => {
        if (exporting === fmtKey) return;
        setExporting(fmtKey);
        setExportOpen(false);
        try {
            await exportAbonnements(fmtKey, { statut: filtreStatut !== "tous" ? filtreStatut : undefined });
        } catch { /* silencieux */ } finally {
            setExporting(null);
        }
    };

    return (
        <>
            {/* Toolbar */}
            <div className="finAbo-toolbar">
                <div className="finAbo-toolbar__row">
                    <select
                        className="finAbo-filter-select"
                        value={filtreStatut}
                        onChange={e => setFiltreStatut(e.target.value)}
                        aria-label="Filtrer par statut"
                    >
                        <option value="tous">Tous les abonnements</option>
                        <option value="actif">Actifs uniquement</option>
                        <option value="resilié">Résiliés uniquement</option>
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
            <div className="finAbo-tableWrap">
                <table className="finAbo-table" aria-label="Historique des abonnements">
                    <thead className="finAbo-table__head">
                        <tr>
                            <th scope="col">Réf.</th>
                            <th scope="col">Service</th>
                            <th scope="col">Fournisseur</th>
                            <th scope="col">Début</th>
                            <th scope="col">Fin</th>
                            <th scope="col">Montant / mois</th>
                            <th scope="col">Statut</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <TableSkeleton /> : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8}>
                                    <div className="finAbo-empty">
                                        <div className="finAbo-empty__icon"><Repeat size={32} aria-hidden="true" /></div>
                                        <p className="finAbo-empty__title">Aucun abonnement trouvé</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(abo => (
                                <tr key={abo.id} className="finAbo-table__row" onClick={() => setSelectedAbo(abo)}>
                                    <td className="finAbo-table__id">{abo.id}</td>
                                    <td className="finAbo-table__name">{abo.nomService}</td>
                                    <td style={{ fontSize: "var(--text-sm)" }}>{abo.fournisseur}</td>
                                    <td className="finAbo-table__date">{formatDate(abo.dateDebut)}</td>
                                    <td className="finAbo-table__date">{abo.dateFin ? formatDate(abo.dateFin) : "—"}</td>
                                    <td className="finAbo-table__amount">{formatMontant(abo.montantMensuel)}</td>
                                    <td>
                                        <span className={`fin-badge ${abo.statut === "actif" ? "fin-badge--success" : "fin-badge--neutral"}`}>
                                            {abo.statut === "actif" ? "Actif" : "Résilié"}
                                        </span>
                                    </td>
                                    <td onClick={e => e.stopPropagation()}>
                                        {abo.statut !== "actif" && (
                                            <button
                                                className="app-button app-button--ghost app-button--sm"
                                                onClick={() => setAboToReactivate(abo)}
                                                type="button"
                                            >
                                                Réactiver
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
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
                ) : filtered.map(abo => (
                    <article key={abo.id} className="finAbo-card" onClick={() => setSelectedAbo(abo)}>
                        <div className="finAbo-card__top">
                            <span className="finAbo-card__id">{abo.id}</span>
                            <span className={`fin-badge ${abo.statut === "actif" ? "fin-badge--success" : "fin-badge--neutral"}`}>
                                {abo.statut === "actif" ? "Actif" : "Résilié"}
                            </span>
                        </div>
                        <p className="finAbo-card__name">{abo.nomService}</p>
                        <div className="finAbo-card__meta">
                            <span className="finAbo-card__amount">{formatMontant(abo.montantMensuel)}/mois</span>
                            <span className="finAbo-card__date">{formatDate(abo.dateDebut)}</span>
                        </div>
                    </article>
                ))}
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
                <AbonnementPane abonnement={selectedAbo} onClose={() => setSelectedAbo(null)} />
            )}

            {aboToReactivate && (
                <ReactiverAbonnementPane
                    abonnement={aboToReactivate}
                    onClose={() => setAboToReactivate(null)}
                    onSuccess={() => { setAboToReactivate(null); load(page); }}
                />
            )}
        </>
    );
}

export default HistoriqueAbonnements;
