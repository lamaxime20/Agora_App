import { useState, useEffect, useMemo } from "react";
import { Search, Receipt, AlertCircle, ChevronLeft, ChevronRight, Edit2, X } from "lucide-react";
import CommandePane from "./CommandePane.jsx";
import { fetchCommandes } from "../../../../services/financesDashboard.js";
import { readCache } from "../../../../services/financesCache.js";

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
        <div className="finCommandes-card" aria-hidden="true">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--sm" />
                <span className="finCommandes-skeleton__badge" />
            </div>
            <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--lg" style={{ marginBottom: "var(--space-3)", display: "block" }} />
            <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--md" style={{ display: "block" }} />
        </div>
    );
}

function SeuilModal({ commande, onClose, onConfirm }) {
    const [valeur, setValeur] = useState(String(commande.minimumValidation));

    const fmt = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const handleConfirm = () => {
        const val = parseFloat(valeur);
        if (!isNaN(val) && val > 0 && val <= commande.total) {
            onConfirm(val);
        }
    };

    return (
        <div
            className="finCommandes-seuil-modal__overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="seuil-modal-title"
        >
            <div className="finCommandes-seuil-modal__panel">
                <div className="finCommandes-seuil-modal__header">
                    <h2 className="finCommandes-seuil-modal__title" id="seuil-modal-title">
                        Modifier le seuil de validation
                    </h2>
                    <button
                        className="finCommandes-drawer__close"
                        onClick={onClose}
                        type="button"
                        aria-label="Fermer"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>
                <div className="finCommandes-seuil-modal__body">
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: "var(--line-height-relaxed)" }}>
                        Commande <strong style={{ color: "var(--color-text)" }}>{commande.id}</strong>.
                        Total facturé : <strong style={{ color: "var(--color-text)" }}>{fmt(commande.montant_commande)}</strong>.
                    </p>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", background: "rgba(243,156,18,0.07)", border: "1px solid rgba(243,156,18,0.2)", borderRadius: "var(--radius-lg)", padding: "var(--space-3) var(--space-4)" }}>
                        Le seuil est le montant minimum à encaisser pour valider la commande financièrement et déclencher la livraison.
                    </p>
                    <div className="finCommandes-form__field">
                        <label className="finCommandes-form__label" htmlFor="nouveau-seuil">
                            Nouveau seuil de validation (FCFA)
                        </label>
                        <input
                            id="nouveau-seuil"
                            type="number"
                            className="app-input"
                            value={valeur}
                            onChange={e => setValeur(e.target.value)}
                            min="1"
                            max={commande.montant_commande}
                            step="100"
                            autoFocus
                        />
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                            Maximum autorisé : {fmt(commande.montant_commande)}
                        </span>
                    </div>
                </div>
                <div className="finCommandes-seuil-modal__footer">
                    <button
                        className="app-button app-button--ghost"
                        onClick={onClose}
                        type="button"
                    >
                        Annuler
                    </button>
                    <button
                        className="app-button app-button--primary"
                        onClick={handleConfirm}
                        type="button"
                        disabled={!valeur || parseFloat(valeur) <= 0 || parseFloat(valeur) > commande.total}
                    >
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    );
}

function CommandesEnAttente() {
    const [commandes,        setCommandes]        = useState([]);
    const [loading,          setLoading]          = useState(true);
    const [error,            setError]            = useState(null);
    const [selectedCommande, setSelectedCommande] = useState(null);
    const [seuilModal,       setSeuilModal]       = useState(null);
    const [recherche,        setRecherche]        = useState("");
    const [filtreStatut,     setFiltreStatut]     = useState("");
    const [page,             setPage]             = useState(1);

    useEffect(() => {
        setLoading(true);
        setError(null);
        const cacheKey = `commandes_${page}`
        const donneesCache = readCache(cacheKey);
        if (donneesCache) {
            setCommandes(donneesCache ?? []);
            setLoading(false);
        }
        console.log(donneesCache);
        fetchCommandes()
            .then(data => setCommandes(data.data ?? []))
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

    const confirmerSeuil = (nouvelleValeur) => {
        setCommandes(prev =>
            prev.map(c =>
                c.id === seuilModal.id
                    ? { ...c, minimumValidation: nouvelleValeur }
                    : c
            )
        );
        setSeuilModal(null);
    };

    const ouvrirSeuilModal = (e, cmd) => {
        e.stopPropagation();
        setSeuilModal(cmd);
    };

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const getPct = (paye, total) => Math.min(100, Math.round((paye / total) * 100));

    const STATUTS = ["partiellement payé", "en attente de paiement"];

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
                        {STATUTS.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Tableau desktop ── */}
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
                                        <p className="finCommandes-empty__desc">
                                            Toutes les commandes ont été réglées ou aucun résultat ne correspond à votre recherche.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginated.map(cmd => {
                                console.log("commande :", cmd)
                                const pct = getPct(cmd.total_paye, cmd.montant_commande);
                                return (
                                    <tr
                                        key={cmd.id}
                                        className="finCommandes-table__row"
                                        onClick={() => setSelectedCommande(cmd)}
                                        tabIndex={0}
                                        onKeyDown={e => e.key === "Enter" && setSelectedCommande(cmd)}
                                        aria-label={`Voir détail de ${cmd.client}`}
                                    >
                                        <td className="finCommandes-table__id">{cmd.id}</td>
                                        <td className="finCommandes-table__name">{cmd.client}</td>
                                        <td className="finCommandes-table__amount">{formatMontant(cmd.montant_commande)}</td>
                                        <td>
                                            <button
                                                className="finCommandes-table__seuil-btn"
                                                onClick={e => ouvrirSeuilModal(e, cmd)}
                                                title="Modifier le seuil de validation"
                                                type="button"
                                                aria-label={`Modifier le seuil de ${cmd.client}`}
                                            >
                                                <Edit2 size={11} aria-hidden="true" />
                                                {formatMontant(cmd.montant_minimum_validation)}
                                            </button>
                                        </td>
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
                                                    {formatMontant(cmd.total_paye)} / {formatMontant(cmd.montant_commande)}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`fin-badge ${cmd.etat_payement === "partiellement payé" ? "fin-badge--warning" : "fin-badge--neutral"}`}>
                                                {cmd.etat_payement}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Cartes mobile ── */}
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
                        const pct = getPct(cmd.total_paye, cmd.montant_commande);
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
                                    <span className={`fin-badge ${cmd.etat_payement === "partiellement payé" ? "fin-badge--warning" : "fin-badge--neutral"}`}>
                                        {cmd.etat_payement}
                                    </span>
                                </div>
                                <p className="finCommandes-card__name">{cmd.client}</p>
                                <div className="finCommandes-progress" style={{ marginBottom: "var(--space-3)" }}>
                                    <div className="finCommandes-progress__bar">
                                        <div
                                            className={`finCommandes-progress__fill${pct >= 100 ? " finCommandes-progress__fill--complete" : ""}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="finCommandes-progress__text">
                                        {formatMontant(cmd.total_paye)} / {formatMontant(cmd.montant_commande)}
                                    </span>
                                </div>
                                <div className="finCommandes-card__footer">
                                    <span className="finCommandes-card__amount">{formatMontant(cmd.montant_commande)}</span>
                                    <button
                                        className="finCommandes-table__seuil-btn"
                                        onClick={e => ouvrirSeuilModal(e, cmd)}
                                        type="button"
                                        aria-label={`Modifier le seuil de ${cmd.client}`}
                                    >
                                        <Edit2 size={11} aria-hidden="true" />
                                        Seuil : {formatMontant(cmd.montant_minimum_validation)}
                                    </button>
                                </div>
                            </article>
                        );
                    })
                )}
            </div>

            {/* ── Pagination ── */}
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

            {/* ── Drawer détail commande ── */}
            {selectedCommande && (
                <CommandePane
                    commande={selectedCommande}
                    onClose={() => setSelectedCommande(null)}
                />
            )}

            {/* ── Modal modification seuil ── */}
            {seuilModal && (
                <SeuilModal
                    commande={seuilModal}
                    onClose={() => setSeuilModal(null)}
                    onConfirm={confirmerSeuil}
                />
            )}
        </>
    );
}

export default CommandesEnAttente;
