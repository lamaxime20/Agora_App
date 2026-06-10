import { useState, useEffect } from "react";
import { X, CreditCard, PlusCircle, Package, Loader } from "lucide-react";
import EnregistrerPaiementForm from "./enregistrerPaiementForm.jsx";
import { fetchCommandeDetail } from "../../../../services/financesDashboard.js";
import { readCache } from "../../../../services/financesCache.js";
import "../../../../assets/styles/components/modules/finances/commandePane.css";

function CommandePane({ commande, onClose }) {
    const [detail,          setDetail]          = useState(null);
    const [loadingDetail,   setLoadingDetail]   = useState(true);
    const [showFormPaiement, setShowFormPaiement] = useState(false);

    useEffect(() => {
        setLoadingDetail(true);
        const cacheKey = `commande_detail_${commande.id}`;
        const donneesCache = readCache(cacheKey);
        console.log('hello')
        if (donneesCache) {
            setDetail(donneesCache);
            setLoadingDetail(false);
        }
        fetchCommandeDetail(commande.id)
            .then(res => setDetail(res)) // La réponse est directement l'objet attendu
            .catch(() => setDetail(null))
            .finally(() => setLoadingDetail(false));

        console.log("les détails sont :", detail)
    }, [commande.id]);

    // Fusionne les données de base avec les détails chargés
    const data = detail ? { ...commande, ...detail.commande } : commande;
    const client = detail?.client;
    const produits = detail?.produits ?? [];
    const paiements = detail?.paiements ?? [];

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
    
    // Utilisation des bonnes clés du JSON
    const montantCommande = data.montant_commande ?? 0;
    const totalPaye = data.total_paye ?? 0;
    const resteAPayer = montantCommande - totalPaye;
    const pct = montantCommande > 0
        ? Math.min(100, Math.round((totalPaye / montantCommande) * 100))
        : 0;

    return (
        <>
            <div
                className="finCommandes-drawer__overlay"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="finCommandes-drawer"
                role="complementary"
                aria-label={`Détails de ${data.numero}`}
            >
                <div className="finCommandes-drawer__handle">
                    <div className="finCommandes-drawer__handle-bar" />
                </div>

                <div className="finCommandes-drawer__header">
                    <h2 className="finCommandes-drawer__title">{data.numero ?? "Détails"}</h2>
                    <button
                        className="finCommandes-drawer__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finCommandes-drawer__body">

                    {loadingDetail ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="finCommandes-detail__row">
                                    <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--sm" />
                                    <span className="finCommandes-skeleton__cell finCommandes-skeleton__cell--md" />
                                </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-4)", color: "var(--color-text-muted)" }}>
                                <Loader size={20} aria-hidden="true" style={{ animation: "spin 1s linear infinite" }} />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Informations générales */}
                            <section>
                                <p className="finCommandes-detail__section-label">Informations</p>
                                <div className="finCommandes-detail__row">
                                    <span className="finCommandes-detail__key">Référence</span>
                                    <span className="finCommandes-detail__val">{data.numero}</span>
                                </div>
                                {client && (
                                    <div className="finCommandes-detail__row">
                                        <span className="finCommandes-detail__key">Client</span>
                                        <span className="finCommandes-detail__val">{`${client.prenom} ${client.nom}`}</span>
                                    </div>
                                )}
                                {data.date_commande && (
                                    <div className="finCommandes-detail__row">
                                        <span className="finCommandes-detail__key">Date</span>
                                        <span className="finCommandes-detail__val">{formatDate(data.date_commande)}</span>
                                    </div>
                                )}
                                <div className="finCommandes-detail__row">
                                    <span className="finCommandes-detail__key">Montant total</span>
                                    <span className="finCommandes-detail__val finCommandes-detail__val--amount">{formatMontant(montantCommande)}</span>
                                </div>
                                <div className="finCommandes-detail__row">
                                    <span className="finCommandes-detail__key">Seuil de validation</span>
                                    <span className="finCommandes-detail__val finCommandes-detail__val--amount">{formatMontant(data.montant_minimum_validation)}</span>
                                </div>
                                <div className="finCommandes-detail__row">
                                    <span className="finCommandes-detail__key">Montant payé</span>
                                    <span className="finCommandes-detail__val finCommandes-detail__val--amount" style={{ color: "var(--color-success)" }}>
                                        {formatMontant(totalPaye)}
                                    </span>
                                </div>
                                <div className="finCommandes-detail__row">
                                    <span className="finCommandes-detail__key">Reste à payer</span>
                                    <span className="finCommandes-detail__val finCommandes-detail__val--amount" style={{ color: resteAPayer > 0 ? "var(--color-error)" : "var(--color-success)" }}>
                                        {formatMontant(resteAPayer)}
                                    </span>
                                </div>
                                {data.etat_payement && (<div className="finCommandes-detail__row">
                                    <span className="finCommandes-detail__key">Statut</span>
                                    <span className="finCommandes-detail__val">
                                        <span className={`fin-badge ${data.statut === "partiellement payé" ? "fin-badge--warning" : "fin-badge--neutral"}`}>
                                            {data.statut}
                                        </span>
                                    </span>
                                </div>
                                )}
                            </section>

                            {/* Avancement */}
                            <section>
                                <p className="finCommandes-detail__section-label">Avancement du paiement</p>
                                <div className="finCommandes-progress">
                                    <div className="finCommandes-progress__bar" style={{ height: "8px" }}>
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
                                        {pct}% — {formatMontant(totalPaye)} payés sur {formatMontant(montantCommande)}
                                    </span>
                                </div>
                            </section>

                            {/* Produits */}
                            {produits.length > 0 && (
                                <section>
                                    <p className="finCommandes-detail__section-label">
                                        <Package size={12} aria-hidden="true" style={{ display: "inline", marginRight: "4px" }} />
                                        Produits
                                    </p>
                                    <table className="finCommandes-payments__table">
                                        <thead>
                                            <tr>
                                                <th scope="col">Produit</th>
                                                <th scope="col">Qté</th>
                                                <th scope="col">Sous-total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {produits.map(p => (
                                                <tr key={p.id}>
                                                    <td>{p.nom}</td>
                                                    <td>{p.quantite}</td>
                                                    <td><strong>{formatMontant(p.montant)}</strong></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </section>
                            )}

                            {/* Historique des paiements */}
                            <section>
                                <p className="finCommandes-detail__section-label">
                                    <CreditCard size={12} aria-hidden="true" style={{ display: "inline", marginRight: "4px" }} />
                                    Paiements associés
                                </p>
                                {!paiements.length ? (
                                    <p className="finCommandes-payments__empty">Aucun paiement enregistré.</p>
                                ) : (
                                    <table className="finCommandes-payments__table">
                                        <thead>
                                            <tr>
                                                <th scope="col">Date</th>
                                                <th scope="col">Montant</th>
                                                <th scope="col">Mode</th>
                                                <th scope="col">Réf.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paiements.map((p, i) => (
                                                <tr key={p.id ?? i}>
                                                    <td>{formatDate(p.date_payement)}</td>
                                                    <td><strong>{formatMontant(p.montant)}</strong></td>
                                                    <td>{p.mode_payement}</td>
                                                    <td>{p.reference || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </section>
                        </>
                    )}
                </div>

                <div className="finCommandes-drawer__footer">
                    <button
                        className="app-button app-button--primary"
                        style={{ width: "100%" }}
                        onClick={() => setShowFormPaiement(true)}
                        type="button"
                        disabled={loadingDetail}
                    >
                        <PlusCircle size={16} aria-hidden="true" />
                        Enregistrer un paiement
                    </button>
                </div>
            </aside>

            {showFormPaiement && (
                <EnregistrerPaiementForm
                    commande={{
                        id: data.id,
                        nom: data.numero,
                        total: montantCommande,
                        paye: totalPaye
                    }}
                    onClose={() => setShowFormPaiement(false)}
                />
            )}
        </>
    );
}

export default CommandePane;
