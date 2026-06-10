import { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, Download, Receipt, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import PaiementPane from "./PaiementPane.jsx";
import { fetchPaiements } from "../../../../services/financesDashboard.js";
import { readCache } from "../../../../services/financesCache.js";

const PER_PAGE = 20;
const MODES    = ["carte bancaire", "virement bancaire", "espèces", "chèque"];

function SkeletonRow() {
    return (
        <tr className="finCommandes-table__row--skeleton">
            <td><span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--sm" /></td>
            <td><span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--sm" /></td>
            <td><span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--md" /></td>
            <td><span className="finCommandes-skeleton__badge" /></td>
            <td><span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--sm" /></td>
            <td><span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--md" /></td>
        </tr>
    );
}

function HistoriquePaiements() {
    const [paiements,        setPaiements]       = useState([]);
    const [loading,          setLoading]         = useState(true);
    const [error,            setError]           = useState(null);
    const [selectedPaiement, setSelectedPaiement] = useState(null);
    const [recherche,        setRecherche]       = useState("");
    const [filtreDate,       setFiltreDate]      = useState("");
    const [filtreMode,       setFiltreMode]      = useState("");
    const [exportOpen,       setExportOpen]      = useState(false);
    const [page,             setPage]            = useState(1);

    useEffect(() => {
        setLoading(true);
        setError(null);
        const cacheKey = `paiements_${page}`
        const donneesCache = readCache(cacheKey);
        if (donneesCache) {
            setPaiements(donneesCache ?? []);
            setLoading(false);
        }
        fetchPaiements()
            .then(data => setPaiements(data.data ?? []))
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    const paiementsFiltres = useMemo(() => {
        return paiements.filter(p => {
            const q = recherche.toLowerCase();
            const matchSearch = !q ||
                p.id.toLowerCase().includes(q) || //
                p.client.toLowerCase().includes(q) ||
                p.commande_numero.toLowerCase().includes(q);
            const matchDate = !filtreDate || p.date_payement === filtreDate;
            const matchMode = !filtreMode || p.mode_payement === filtreMode;
            return matchSearch && matchDate && matchMode;
        });
    }, [paiements, recherche, filtreDate, filtreMode]); //

    const totalPages = Math.max(1, Math.ceil(paiementsFiltres.length / PER_PAGE));
    const paginated  = paiementsFiltres.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const handleRecherche = (v) => { setRecherche(v); setPage(1); };
    const handleDate      = (v) => { setFiltreDate(v); setPage(1); };
    const handleMode      = (v) => { setFiltreMode(v); setPage(1); };

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

    if (error) {
        return (
            <div className="finCommandes-empty">
                <div className="finCommandes-empty__icon" style={{ color: "var(--color-error)" }}>
                    <AlertCircle size={32} aria-hidden="true" />
                </div>
                <p className="finCommandes-empty__title">Impossible de charger l'historique</p>
                <p className="finCommandes-empty__desc">Vérifiez votre connexion et rechargez la page.</p>
            </div>
        );
    }

    return (
        <>
            {/* Barre d'outils */}
            <div className="finCommandes-toolbar">
                <div className="finCommandes-toolbar__row">
                    <div className="finCommandes-search">
                        <Search size={16} className="finCommandes-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="app-input finCommandes-search__input"
                            placeholder="Rechercher par référence, client…"
                            value={recherche}
                            onChange={e => handleRecherche(e.target.value)}
                            aria-label="Rechercher un paiement"
                        />
                    </div>

                    <input
                        type="date"
                        className="finCommandes-filter-select"
                        value={filtreDate}
                        onChange={e => handleDate(e.target.value)}
                        aria-label="Filtrer par date"
                    />

                    <select
                        className="finCommandes-filter-select"
                        value={filtreMode}
                        onChange={e => handleMode(e.target.value)}
                        aria-label="Filtrer par mode de paiement"
                    >
                        <option value="">Tous les modes</option>
                        {MODES.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                    {(filtreDate || filtreMode || recherche) && (
                        <button
                            className="app-button app-button--ghost app-button--sm"
                            onClick={() => { handleRecherche(""); handleDate(""); handleMode(""); }}
                            type="button"
                        >
                            Réinitialiser
                        </button>
                    )}

                    <div className="finCommandes-export-wrap" style={{ marginLeft: "auto" }}>
                        <button
                            className="app-button app-button--ghost app-button--sm"
                            onClick={() => setExportOpen(!exportOpen)}
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
                                        onClick={() => { alert(`Export ${fmt} en cours…`); setExportOpen(false); }}
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

            {/* Tableau desktop */}
            <div className="finCommandes-tableWrap">
                <table className="finCommandes-table" aria-label="Historique des paiements">
                    <thead className="finCommandes-table__head">
                        <tr>
                            <th scope="col">Référence</th>
                            <th scope="col">Date</th>
                            <th scope="col">Montant</th>
                            <th scope="col">Mode</th>
                            <th scope="col">Transaction</th>
                            <th scope="col">Enregistré par</th>
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
                                        <p className="finCommandes-empty__title">Aucun paiement trouvé</p>
                                        <p className="finCommandes-empty__desc">Modifiez les filtres pour afficher des résultats.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginated.map(p => (
                                <tr
                                    key={p.id}
                                    className="finCommandes-table__row"
                                    onClick={() => setSelectedPaiement(p)}
                                    tabIndex={0}
                                    onKeyDown={e => e.key === "Enter" && setSelectedPaiement(p)}
                                >
                                    <td className="finCommandes-table__id">{p.id}</td>
                                    <td className="finCommandes-table__date">{formatDate(p.date_payement)}</td>
                                    <td className="finCommandes-table__amount">{formatMontant(p.montant)}</td>
                                    <td>
                                        <span className="fin-badge fin-badge--info">{p.mode_payement}</span>
                                    </td>
                                    <td className="finCommandes-table__id">{p.reference_transaction || "—"}</td>
                                    <td className="finCommandes-table__name">{p.enregistre_par}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cartes mobile */}
            <div className="finCommandes-cards">
                {loading ? (
                    [1,2,3].map(i => (
                        <div key={i} className="finCommandes-card" aria-hidden="true">
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                                <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--sm" />
                                <span className="finCommandes-skeleton__badge" />
                            </div>
                            <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--lg" style={{ marginBottom: "var(--space-3)" }} />
                            <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--md" />
                        </div>
                    ))
                ) : paginated.length === 0 ? (
                    <div className="finCommandes-empty">
                        <div className="finCommandes-empty__icon">
                            <Receipt size={32} aria-hidden="true" />
                        </div>
                        <p className="finCommandes-empty__title">Aucun paiement trouvé</p>
                    </div>
                ) : (
                    paginated.map(p => (
                        <article
                            key={p.id}
                            className="finCommandes-card"
                            onClick={() => setSelectedPaiement(p)}
                            tabIndex={0}
                            onKeyDown={e => e.key === "Enter" && setSelectedPaiement(p)}
                        >
                            <div className="finCommandes-card__top">
                                <span className="finCommandes-card__id">{p.id}</span>
                                <span className="fin-badge fin-badge--info">{p.mode_payement}</span>
                            </div>
                            <p className="finCommandes-card__name">{p.client} ({p.commande_numero})</p>
                            <div className="finCommandes-card__meta">
                                <span className="finCommandes-card__amount">{formatMontant(p.montant)}</span>
                                <span className="finCommandes-card__date">{formatDate(p.date_payement)}</span>
                            </div>
                            <div className="finCommandes-card__footer" style={{ justifyContent: 'flex-end' }}>
                                <span className="finCommandes-card__id">Par: {p.enregistre_par}</span>
                            </div>
                        </article>
                    ))
                )}
            </div>

            {/* Pagination */}
            {!loading && paiementsFiltres.length > PER_PAGE && (
                <div className="finCommandes-pagination">
                    <span className="finCommandes-pagination__info">
                        {paiementsFiltres.length} paiement{paiementsFiltres.length > 1 ? "s" : ""}
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

            {selectedPaiement && (
                <PaiementPane
                    paiement={{
                        id: selectedPaiement.id,
                        date: selectedPaiement.date_payement,
                        montant: selectedPaiement.montant,
                        mode: selectedPaiement.mode_payement,
                        reference: selectedPaiement.reference_transaction,
                        utilisateur: selectedPaiement.enregistre_par,
                        commandeAssociee: {
                            id: selectedPaiement.commande_numero,
                            nom: selectedPaiement.client,
                            total: selectedPaiement.montant_commande,
                        }
                    }}
                    onClose={() => setSelectedPaiement(null)}
                />
            )}
        </>
    );
}

export default HistoriquePaiements;
