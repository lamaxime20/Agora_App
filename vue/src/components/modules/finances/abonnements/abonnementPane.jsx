import { useState, useEffect } from "react";
import { X, Calendar, CreditCard, Bell } from "lucide-react";
import { fetchAbonnementDetail } from "../../../../services/financesP4.js";

const DAYS_URGENT = 14;

function daysUntil(dateStr) {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function PaiementSkeleton() {
    return Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="finAbo-timeline__item" style={{ opacity: 0.5 }}>
            <span className="finAbo-timeline__dot" />
            <div className="finAbo-timeline__content">
                <div className="finAbo-skeleton finAbo-skeleton--md" style={{ marginBottom: "var(--space-1)" }} />
                <div className="finAbo-skeleton finAbo-skeleton--sm" />
            </div>
        </li>
    ));
}

function AbonnementPane({ abonnement, onClose, onSuspendre }) {
    const [detail, setDetail]       = useState(null);
    const [detailLoading, setDetailLoading] = useState(true);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d));

    const formatDateShort = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

    useEffect(() => {
        setDetailLoading(true);
        fetchAbonnementDetail(abonnement.id)
            .then(d => setDetail(d))
            .catch(() => setDetail(abonnement))
            .finally(() => setDetailLoading(false));
    }, [abonnement.id]);

    const abo = detail ?? abonnement;
    const actif = abo.statut === "actif";
    const days = daysUntil(abo.prochaineEcheance);
    const urgent = days !== null && days <= DAYS_URGENT;

    return (
        <>
            <div className="finAbo-drawer__overlay" onClick={onClose} aria-hidden="true" />
            <aside
                className="finAbo-drawer"
                role="complementary"
                aria-label={`Détails de l'abonnement ${abo.nomService}`}
            >
                <div className="finAbo-drawer__handle">
                    <div className="finAbo-drawer__handle-bar" />
                </div>

                <div className="finAbo-drawer__header">
                    <h2 className="finAbo-drawer__title">{abo.nomService}</h2>
                    <button className="finAbo-drawer__close" onClick={onClose} aria-label="Fermer" type="button">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finAbo-drawer__body">
                    {/* Informations */}
                    <section>
                        <p className="finAbo-detail__section-label">Informations</p>
                        <div className="finAbo-detail__row">
                            <span className="finAbo-detail__key">Référence</span>
                            <span className="finAbo-detail__val" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>{abo.id}</span>
                        </div>
                        <div className="finAbo-detail__row">
                            <span className="finAbo-detail__key">Fournisseur</span>
                            <span className="finAbo-detail__val">{abo.fournisseur}</span>
                        </div>
                        <div className="finAbo-detail__row">
                            <span className="finAbo-detail__key">Montant mensuel</span>
                            <span className="finAbo-detail__val finAbo-detail__val--amount" style={{ color: "var(--color-error)" }}>
                                {formatMontant(abo.montantMensuel)}
                            </span>
                        </div>
                        <div className="finAbo-detail__row">
                            <span className="finAbo-detail__key">Date de début</span>
                            <span className="finAbo-detail__val">{formatDate(abo.dateDebut)}</span>
                        </div>
                        {abo.dateFin && (
                            <div className="finAbo-detail__row">
                                <span className="finAbo-detail__key">Date de résiliation</span>
                                <span className="finAbo-detail__val">{formatDate(abo.dateFin)}</span>
                            </div>
                        )}
                        <div className="finAbo-detail__row">
                            <span className="finAbo-detail__key">Statut</span>
                            <span className="finAbo-detail__val">
                                <span className={`fin-badge ${actif ? "fin-badge--success" : "fin-badge--neutral"}`}>
                                    {actif ? "Actif" : "Résilié"}
                                </span>
                            </span>
                        </div>
                        {actif && abo.prochaineEcheance && (
                            <div className="finAbo-detail__row">
                                <span className="finAbo-detail__key">
                                    <Calendar size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} aria-hidden="true" />
                                    Prochaine échéance
                                </span>
                                <span className="finAbo-detail__val">
                                    <span className={`finAbo-echeance-badge${urgent ? " finAbo-echeance-badge--urgent" : ""}`}>
                                        {formatDate(abo.prochaineEcheance)}
                                        {urgent && ` · dans ${days} jour${days > 1 ? "s" : ""}`}
                                    </span>
                                </span>
                            </div>
                        )}
                    </section>

                    {/* Historique paiements */}
                    <section>
                        <p className="finAbo-detail__section-label">
                            <CreditCard size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} aria-hidden="true" />
                            Historique des paiements
                        </p>
                        {detailLoading ? (
                            <ol className="finAbo-timeline"><PaiementSkeleton /></ol>
                        ) : abo.paiementsHistorique?.length > 0 ? (
                            <ol className="finAbo-timeline" aria-label="Historique des paiements">
                                {abo.paiementsHistorique.map((p, i) => (
                                    <li key={i} className="finAbo-timeline__item">
                                        <span className="finAbo-timeline__dot" aria-hidden="true">💳</span>
                                        <div className="finAbo-timeline__content">
                                            <p className="finAbo-timeline__msg">
                                                {formatMontant(p.montant)} — {p.mode}
                                            </p>
                                            <p className="finAbo-timeline__meta">
                                                {formatDateShort(p.date)} · {p.ref}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Aucun paiement enregistré.</p>
                        )}
                    </section>

                    {/* Notifications */}
                    {!detailLoading && abo.notifications?.length > 0 && (
                        <section>
                            <p className="finAbo-detail__section-label">
                                <Bell size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} aria-hidden="true" />
                                Notifications
                            </p>
                            <ul className="finAbo-notif-list" aria-label="Notifications abonnement">
                                {abo.notifications.map((n, i) => (
                                    <li key={i} className="finAbo-notif-item">
                                        <span className="finAbo-notif-item__date">{formatDateShort(n.date)}</span>
                                        <span className="finAbo-notif-item__msg">{n.message}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>

                <div className="finAbo-drawer__footer">
                    {actif && onSuspendre ? (
                        <>
                            <button
                                className="app-button app-button--ghost"
                                onClick={onClose}
                                type="button"
                                style={{ flex: 1 }}
                            >
                                Fermer
                            </button>
                            <button
                                className="app-button"
                                style={{ flex: 1, background: "var(--color-error)", color: "#fff", border: "none" }}
                                onClick={() => onSuspendre(abo)}
                                type="button"
                            >
                                Résilier l'abonnement
                            </button>
                        </>
                    ) : (
                        <button
                            className="app-button app-button--ghost"
                            style={{ width: "100%" }}
                            onClick={onClose}
                            type="button"
                        >
                            Fermer
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}

export default AbonnementPane;
