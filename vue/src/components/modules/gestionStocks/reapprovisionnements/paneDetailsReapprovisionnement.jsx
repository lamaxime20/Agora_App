import { X, Package2, User, Calendar, Banknote, AlignLeft, CheckCircle2, XCircle } from "lucide-react";
import "../../../../assets/styles/components/modules/gestionStocks/paneDetailsReapprovisionnement.css";

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function formatMontant(n) {
    if (n == null) return "—";
    return n.toLocaleString("fr-FR") + " FCFA";
}

const STATUT_CONFIG = {
    en_attente: { label: "En attente", mod: "warning" },
    en_cours:   { label: "En cours",   mod: "info"    },
    reçu:       { label: "Reçu",       mod: "success" },
    annulé:     { label: "Annulé",     mod: "error"   },
};

function BadgeStatut({ statut }) {
    const cfg = STATUT_CONFIG[statut] ?? { label: statut, mod: "info" };
    return (
        <span className={`paneReappro-badge paneReappro-badge--${cfg.mod}`}>
            {cfg.label}
        </span>
    );
}

function Row({ label, value, icon: Icon }) {
    return (
        <div className="paneReappro-row">
            {Icon && <Icon size={14} className="paneReappro-row__icon" aria-hidden="true" />}
            <span className="paneReappro-row__label">{label}</span>
            <span className="paneReappro-row__value">{value ?? "—"}</span>
        </div>
    );
}

/* ─── Composant ──────────────────────────────────────────────────────────────── */

function PaneDetailsReapprovisionnement({ item, onClose, onAnnuler, onConfirmer }) {
    const peutAnnuler   = item.statut === "en_attente" || item.statut === "en_cours";
    const peutConfirmer = item.statut === "en_cours";

    return (
        <>
            <div
                className="paneReappro-backdrop"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="paneReappro-root"
                role="complementary"
                aria-label="Détails du réapprovisionnement"
            >
                {/* ─── Header ──────────────── */}
                <div className="paneReappro-header">
                    <div className="paneReappro-header__top">
                        <BadgeStatut statut={item.statut} />
                        <button
                            className="paneReappro-close"
                            onClick={onClose}
                            type="button"
                            aria-label="Fermer le volet"
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    </div>
                    <h2 className="paneReappro-title">{item.reference}</h2>
                    <p className="paneReappro-sub">{item.fournisseur}</p>
                </div>

                {/* ─── Corps scrollable ─────── */}
                <div className="paneReappro-body">

                    {/* Informations générales */}
                    <section className="paneReappro-section">
                        <h3 className="paneReappro-section__title">Informations générales</h3>
                        <Row label="Date de demande"  value={formatDate(item.date_demande)}          icon={Calendar}  />
                        <Row label="Réception prévue" value={formatDate(item.date_reception_prevue)} icon={Calendar}  />
                        {item.date_reception_reelle && (
                            <Row label="Reçu le"      value={formatDate(item.date_reception_reelle)} icon={Calendar}  />
                        )}
                        <Row label="Demandeur"        value={item.demandeur?.nom}                   icon={User}      />
                        <Row label="Montant total"    value={formatMontant(item.montant_total)}      icon={Banknote}  />
                    </section>

                    {/* Articles */}
                    <section className="paneReappro-section">
                        <h3 className="paneReappro-section__title">
                            Articles
                            <span className="paneReappro-section__count">{item.lignes?.length}</span>
                        </h3>
                        <ul className="paneReappro-lignes">
                            {item.lignes?.map((ligne, i) => (
                                <li key={i} className="paneReappro-ligne">
                                    <div className="paneReappro-ligne__left">
                                        <Package2 size={14} className="paneReappro-ligne__icon" aria-hidden="true" />
                                        <div>
                                            <p className="paneReappro-ligne__nom">{ligne.nom}</p>
                                            <p className="paneReappro-ligne__meta">
                                                {ligne.quantite} × {ligne.prix_unitaire?.toLocaleString("fr-FR")} FCFA
                                            </p>
                                        </div>
                                    </div>
                                    <span className="paneReappro-ligne__total">
                                        {ligne.sous_total?.toLocaleString("fr-FR")} FCFA
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Commentaire */}
                    {item.note && (
                        <section className="paneReappro-section">
                            <h3 className="paneReappro-section__title">Commentaire</h3>
                            <div className="paneReappro-note">
                                <AlignLeft size={14} className="paneReappro-note__icon" aria-hidden="true" />
                                <p className="paneReappro-note__text">{item.note}</p>
                            </div>
                        </section>
                    )}
                </div>

                {/* ─── Actions ─────────────── */}
                {(peutAnnuler || peutConfirmer) && (
                    <div className="paneReappro-footer">
                        {peutAnnuler && (
                            <button
                                className="app-button paneReappro-btn--danger"
                                onClick={onAnnuler}
                                type="button"
                            >
                                <XCircle size={16} aria-hidden="true" />
                                Annuler
                            </button>
                        )}
                        {peutConfirmer && (
                            <button
                                className="app-button app-button--primary"
                                onClick={onConfirmer}
                                type="button"
                            >
                                <CheckCircle2 size={16} aria-hidden="true" />
                                Confirmer la réception
                            </button>
                        )}
                    </div>
                )}
            </aside>
        </>
    );
}

export default PaneDetailsReapprovisionnement;
