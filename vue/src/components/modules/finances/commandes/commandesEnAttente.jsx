import { useState, useEffect, useMemo } from "react";
import { Search, Receipt, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import CommandePane from "./CommandePane.jsx";
import { fetchCommandes } from "../../../../services/financesDashboard.js";

const PER_PAGE = 20;

function SkeletonRow() {
    return (
        <tr className="finCommandes-table__row--skeleton">
            <td><span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--sm" /></td>
            <td><span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--lg" /></td>
            <td><span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--md" /></td>
            <td><span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--md" /></td>
            <td><span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--lg" /></td>
            <td><span className="finCommandes-skeleton__badge" /></td>
        </tr>
    );
}

function SkeletonCard() {
    return (
        <div className="finCommandes-card finCommandes-card--skeleton" aria-hidden="true">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--sm" />
                <span className="finCommandes-skeleton__badge" />
            </div>
            <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--lg" style={{ marginBottom: "var(--space-3)" }} />
            <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--md" />
        </div>
    );
}

function CommandesEnAttente() {
    const [commandes,         setCommandes]         = useState([]);
    const [loading,           setLoading]           = useState(true);
    const [error,             setError]             = useState(null);
    const [selectedCommande,  setSelectedCommande]  = useState(null);
    const [recherche,         setRecherche]         = useState("");
    const [filtreStatut,      setFiltreStatut]      = useState("");
    const [page,              setPage]              = useState(1);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchCommandes()
            .then(data => setCommandes(data.commandes ?? []))
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    const commandesFiltrees = useMemo(() => {
        return commandes.filter(cmd => {
            const q = recherche.toLowerCase();
            const matchSearch = !q ||
                cmd.nom.toLowerCase().includes(q) ||
                cmd.id.toLowerCase().includes(q);
            const matchStatut = !filtreStatut || cmd.statut === filtreStatut;
            return matchSearch && matchStatut;
        });
    }, [commandes, recherche, filtreStatut]);

    const totalPages = Math.max(1, Math.ceil(commandesFiltrees.length / PER_PAGE));
    const paginated  = commandesFiltrees.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const handleRecherche = (v) => { setRecherche(v); setPage(1); };
    const handleStatut    = (v) => { setFiltreStatut(v); setPage(1); };

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const getPct = (paye, total) => Math.min(100, Math.round((paye / total) * 100));

    const STATUTS = ["", "partiellement payé", "en attente de paiement"];

    if (error) {
        return (
            <div className="finCommandes-empty">
                <div className="finCommandes-empty__icon" style={{ color: "var(--color-error)" }}>
                    <AlertCircle size={32} aria-hidden="true" />
                </div>
                <p className="finCommandes-empty__title">Impossible de charger les commandes</p>
                <p className="finCommandes-empty__desc">Vérifiez votre connexion et rechargez la page.</p>
            </div>
        );
    }

    return (
        <>
            {/* Barre recherche + filtres */}
            <div className="finCommandes-toolbar">
                <div className="finCommandes-toolbar__row">
                    <div className="finCommandes-search">
                        <Search size={16} className="finCommandes-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="app-input finCommandes-search__input"
                            placeholder="Rechercher par référence ou client…"
                            value={recherche}
                            onChange={e => handleRecherche(e.target.value)}
                            aria-label="Rechercher une commande"
                        />
                    </div>
                    <select
                        className="finCommandes-filter-select"
                        value={filtreStatut}
                        onChange={e => handleStatut(e.target.value)}
                        aria-label="Filtrer par statut"
                    >
                        <option value="">Tous les statuts</option>
                        {STATUTS.filter(Boolean).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tableau desktop */}
            <div className="finCommandes-tableWrap">
                <table className="finCommandes-table" aria-label="Commandes en attente de paiement">
                    <thead className="finCommandes-table__head">
                        <tr>
                            <th scope="col">Référence</th>
                            <th scope="col">Client / Libellé</th>
                            <th scope="col">Total</th>
                            <th scope="col">Seuil validation</th>
                            <th scope="col">Avancement</th>
                            <th scope="col">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [1,2,3,4,5].map(i => <SkeletonRow key={i} />)
                        ) : paginated.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="finCommandes-empty">
                                        <div className="finCommandes-empty__icon">
                                            <Receipt size={32} aria-hidden="true" />
                                        </div>
                                        <p className="finCommandes-empty__title">Aucune commande en attente</p>
                                        <p className="finCommandes-empty__desc">Toutes les commandes ont été réglées ou aucun résultat ne correspond à votre recherche.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginated.map(cmd => {
                                const pct = getPct(cmd.paye, cmd.total);
                                return (
                                    <tr
                                        key={cmd.id}
                                        className="finCommandes-table__row"
                                        onClick={() => setSelectedCommande(cmd)}
                                        tabIndex={0}
                                        onKeyDown={e => e.key === "Enter" && setSelectedCommande(cmd)}
                                        aria-label={`Voir détail de ${cmd.nom}`}
                                    >
                                        <td className="finCommandes-table__id">{cmd.id}</td>
                                        <td className="finCommandes-table__name">{cmd.nom}</td>
                                        <td className="finCommandes-table__amount">{formatMontant(cmd.total)}</td>
                                        <td className="finCommandes-table__amount">{formatMontant(cmd.minimumValidation)}</td>
                                        <td>
                                            <div className="finCommandes-progress">
                                                <div className="finCommandes-progress__bar">
                                                    <div
                                                        className={`finCommandes-progress__fill${pct >= 100 ? " finCommandes-progress__fill--complete" : ""}`}
                                                        style={{ width: `${pct}%` }}
                                                        role="progressbar"
                                                        aria-valuenow={pct}
                                                        aria-valuemin={0}
                                                        aria-valuemax={100}
                                                    />
                                                </div>
                                                <span className="finCommandes-progress__text">
                                                    {formatMontant(cmd.paye)} / {formatMontant(cmd.total)}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`fin-badge ${cmd.statut === "partiellement payé" ? "fin-badge--warning" : "fin-badge--neutral"}`}>
                                                {cmd.statut}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cartes mobile */}
            <div className="finCommandes-cards">
                {loading ? (
                    [1,2,3,4].map(i => <SkeletonCard key={i} />)
                ) : paginated.length === 0 ? (
                    <div className="finCommandes-empty">
                        <div className="finCommandes-empty__icon">
                            <Receipt size={32} aria-hidden="true" />
                        </div>
                        <p className="finCommandes-empty__title">Aucune commande en attente</p>
                    </div>
                ) : (
                    paginated.map(cmd => {
                        const pct = getPct(cmd.paye, cmd.total);
                        return (
                            <article
                                key={cmd.id}
                                className="finCommandes-card"
                                onClick={() => setSelectedCommande(cmd)}
                                tabIndex={0}
                                onKeyDown={e => e.key === "Enter" && setSelectedCommande(cmd)}
                            >
                                <div className="finCommandes-card__top">
                                    <span className="finCommandes-card__id">{cmd.id}</span>
                                    <span className={`fin-badge ${cmd.statut === "partiellement payé" ? "fin-badge--warning" : "fin-badge--neutral"}`}>
                                        {cmd.statut}
                                    </span>
                                </div>
                                <p className="finCommandes-card__name">{cmd.nom}</p>
                                <div className="finCommandes-progress" style={{ marginBottom: "var(--space-3)" }}>
                                    <div className="finCommandes-progress__bar">
                                        <div
                                            className={`finCommandes-progress__fill${pct >= 100 ? " finCommandes-progress__fill--complete" : ""}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="finCommandes-progress__text">
                                        {formatMontant(cmd.paye)} / {formatMontant(cmd.total)}
                                    </span>
                                </div>
                                <div className="finCommandes-card__footer">
                                    <span className="finCommandes-card__amount">{formatMontant(cmd.total)}</span>
                                    <span className="finCommandes-card__date">Seuil : {formatMontant(cmd.minimumValidation)}</span>
                                </div>
                            </article>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {!loading && commandesFiltrees.length > PER_PAGE && (
                <div className="finCommandes-pagination">
                    <span className="finCommandes-pagination__info">
                        {commandesFiltrees.length} commande{commandesFiltrees.length > 1 ? "s" : ""}
                        &nbsp;— page {page} / {totalPages}
                    </span>
                    <div className="finCommandes-pagination__controls">
                        <button
                            className="finCommandes-pagination__btn"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            aria-label="Page précédente"
                            type="button"
                        >
                            <ChevronLeft size={16} aria-hidden="true" />
                        </button>
                        <span className="finCommandes-pagination__page">{page} / {totalPages}</span>
                        <button
                            className="finCommandes-pagination__btn"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            aria-label="Page suivante"
                            type="button"
                        >
                            <ChevronRight size={16} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            )}

            {/* Drawer détail commande */}
            {selectedCommande && (
                <CommandePane
                    commande={selectedCommande}
                    onClose={() => setSelectedCommande(null)}
                />
            )}
        </>
    );
}

export default CommandesEnAttente;
