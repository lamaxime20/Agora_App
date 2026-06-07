import { X, Clock, CheckCircle, XCircle } from "lucide-react";

const PRIORITY_LABEL = { faible: "Faible", normale: "Normale", haute: "Haute", critique: "Critique" };

const ACTION_ICONS = {
    creation: "🟢",
    escalade:  "🔴",
    validation: "✅",
    refus:      "❌",
};

function ReapprovisionnementPane({ reappro, mode = "historique", onClose, onValider, onRefuser }) {
    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d));

    const isAttente    = mode === "attente";
    const isValide     = reappro.statut === "valide";
    const isRefuse     = reappro.statut === "refuse";

    const statutBadge  = isAttente
        ? <span className="fin-badge fin-badge--warning">En attente</span>
        : isValide
            ? <span className="fin-badge fin-badge--success">Validé</span>
            : <span className="fin-badge fin-badge--error">Refusé</span>;

    return (
        <>
            <div className="finReapp-drawer__overlay" onClick={onClose} aria-hidden="true" />
            <aside
                className="finReapp-drawer"
                role="complementary"
                aria-label={`Détails du réapprovisionnement ${reappro.id}`}
            >
                <div className="finReapp-drawer__handle">
                    <div className="finReapp-drawer__handle-bar" />
                </div>

                <div className="finReapp-drawer__header">
                    <h2 className="finReapp-drawer__title">{reappro.id}</h2>
                    <button className="finReapp-drawer__close" onClick={onClose} aria-label="Fermer" type="button">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finReapp-drawer__body">
                    {/* Informations générales */}
                    <section>
                        <p className="finReapp-detail__section-label">Informations générales</p>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Produit</span>
                            <span className="finReapp-detail__val">
                                {reappro.produit.nom}
                                <span className="finReapp-sku-badge">{reappro.produit.sku}</span>
                            </span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Stock actuel</span>
                            <span className="finReapp-detail__val" style={{ color: reappro.stockActuel < reappro.stockMinimum ? "var(--color-error)" : "var(--color-text)" }}>
                                {reappro.stockActuel} unités
                                {reappro.stockActuel < reappro.stockMinimum && " ⚠ sous le seuil"}
                            </span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Seuil minimum</span>
                            <span className="finReapp-detail__val">{reappro.stockMinimum} unités</span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Qté demandée</span>
                            <span className="finReapp-detail__val">{reappro.quantiteDemandee} unités</span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Prix unitaire</span>
                            <span className="finReapp-detail__val">{formatMontant(reappro.prixUnitaire)}</span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Montant total</span>
                            <span className="finReapp-detail__val finReapp-detail__val--amount">
                                {formatMontant(reappro.montantTotal)}
                            </span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Demandeur</span>
                            <span className="finReapp-detail__val">{reappro.demandeur}</span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Service</span>
                            <span className="finReapp-detail__val">{reappro.service}</span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Date demande</span>
                            <span className="finReapp-detail__val">{formatDate(reappro.dateDemande)}</span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Priorité</span>
                            <span className="finReapp-detail__val">
                                <span className={`finReapp-priority finReapp-priority--${reappro.priorite}`}>
                                    {PRIORITY_LABEL[reappro.priorite] ?? reappro.priorite}
                                </span>
                            </span>
                        </div>
                        <div className="finReapp-detail__row">
                            <span className="finReapp-detail__key">Statut</span>
                            <span className="finReapp-detail__val">{statutBadge}</span>
                        </div>
                        {!isAttente && reappro.dateDecision && (
                            <div className="finReapp-detail__row">
                                <span className="finReapp-detail__key">Date décision</span>
                                <span className="finReapp-detail__val">{formatDate(reappro.dateDecision)}</span>
                            </div>
                        )}
                        {!isAttente && reappro.decideur && (
                            <div className="finReapp-detail__row">
                                <span className="finReapp-detail__key">Décideur</span>
                                <span className="finReapp-detail__val">{reappro.decideur}</span>
                            </div>
                        )}
                        {isValide && reappro.referencePaiement && (
                            <div className="finReapp-detail__row">
                                <span className="finReapp-detail__key">Réf. paiement</span>
                                <span className="finReapp-detail__val" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
                                    {reappro.referencePaiement}
                                </span>
                            </div>
                        )}
                    </section>

                    {/* Justification */}
                    <section>
                        <p className="finReapp-detail__section-label">Justification</p>
                        <div className="finReapp-justify-block">{reappro.justification}</div>
                    </section>

                    {/* Motif de refus */}
                    {isRefuse && reappro.motifRefus && (
                        <section>
                            <p className="finReapp-detail__section-label" style={{ color: "var(--color-error)" }}>Motif du refus</p>
                            <div className="finReapp-justify-block" style={{ borderColor: "rgba(231,76,60,0.25)", background: "rgba(231,76,60,0.04)" }}>
                                {reappro.motifRefus}
                            </div>
                        </section>
                    )}

                    {/* Historique actions (attente mode) */}
                    {isAttente && reappro.actionsHistorique?.length > 0 && (
                        <section>
                            <p className="finReapp-detail__section-label">Historique</p>
                            <ol className="finReapp-timeline" aria-label="Historique des actions">
                                {reappro.actionsHistorique.map((ev, i) => (
                                    <li key={i} className="finReapp-timeline__item">
                                        <span className="finReapp-timeline__dot" aria-hidden="true">
                                            {ACTION_ICONS[ev.action] ?? "●"}
                                        </span>
                                        <div className="finReapp-timeline__content">
                                            <p className="finReapp-timeline__msg">{ev.message}</p>
                                            <p className="finReapp-timeline__meta">
                                                {ev.auteur} — {new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(ev.date))}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    )}
                </div>

                {/* Footer actions (attente only) */}
                {isAttente && (
                    <div className="finReapp-drawer__footer">
                        <button
                            className="app-button app-button--sm"
                            style={{ flex: 1, background: "var(--color-success)", color: "#fff", border: "none" }}
                            onClick={onValider}
                            type="button"
                        >
                            <CheckCircle size={15} aria-hidden="true" />
                            Valider
                        </button>
                        <button
                            className="app-button app-button--sm"
                            style={{ flex: 1, background: "var(--color-error)", color: "#fff", border: "none" }}
                            onClick={onRefuser}
                            type="button"
                        >
                            <XCircle size={15} aria-hidden="true" />
                            Refuser
                        </button>
                    </div>
                )}

                {!isAttente && (
                    <div className="finReapp-drawer__footer">
                        <button
                            className="app-button app-button--ghost"
                            style={{ width: "100%" }}
                            onClick={onClose}
                            type="button"
                        >
                            Fermer
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}

export default ReapprovisionnementPane;
