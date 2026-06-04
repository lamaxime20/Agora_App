import { X, User, Calendar, Banknote, Package2, AlignLeft, Truck } from "lucide-react";
import "../../../../assets/styles/components/modules/gestionStocks/paneDetailsReservation.css";

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
    en_cours: { label: "En cours", mod: "warning" },
    validé:   { label: "Validé",   mod: "success" },
    annulé:   { label: "Annulé",   mod: "error"   },
};

function BadgeStatut({ statut }) {
    const cfg = STATUT_CONFIG[statut] ?? { label: statut, mod: "info" };
    return (
        <span className={`paneRes-badge paneRes-badge--${cfg.mod}`}>
            {cfg.label}
        </span>
    );
}

function Row({ label, value, icon: Icon }) {
    return (
        <div className="paneRes-row">
            {Icon && <Icon size={14} className="paneRes-row__icon" aria-hidden="true" />}
            <span className="paneRes-row__label">{label}</span>
            <span className="paneRes-row__value">{value ?? "—"}</span>
        </div>
    );
}

/* ─── Composant ──────────────────────────────────────────────────────────────── */

function PaneDetailsReservation({ item, onClose }) {
    const lignesPhysiques = item.lignes?.filter(l => l.type === "physique") ?? [];

    return (
        <>
            <div
                className="paneRes-backdrop"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="paneRes-root"
                role="complementary"
                aria-label="Détails de la réservation"
            >
                {/* ─── Header ──────────────── */}
                <div className="paneRes-header">
                    <div className="paneRes-header__top">
                        <BadgeStatut statut={item.statut} />
                        <button
                            className="paneRes-close"
                            onClick={onClose}
                            type="button"
                            aria-label="Fermer le volet"
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    </div>
                    <h2 className="paneRes-title">Commande {item.reference}</h2>
                    <p className="paneRes-sub">{item.client?.nom}</p>
                </div>

                {/* ─── Corps ───────────────── */}
                <div className="paneRes-body">

                    {/* Informations commande */}
                    <section className="paneRes-section">
                        <h3 className="paneRes-section__title">Informations commande</h3>
                        <Row label="Date réservation" value={formatDate(item.date_reservation)} icon={Calendar} />
                        <Row label="Expiration"        value={formatDate(item.date_expiration)}  icon={Calendar} />
                        <Row label="Client"            value={item.client?.nom}                  icon={User}     />
                        <Row label="Commercial"        value={item.commercial?.nom}               icon={User}     />
                        <Row label="Montant total"     value={formatMontant(item.montant_total)}  icon={Banknote} />
                    </section>

                    {/* Articles */}
                    <section className="paneRes-section">
                        <h3 className="paneRes-section__title">
                            Articles réservés
                            <span className="paneRes-section__count">{item.lignes?.length}</span>
                        </h3>
                        <ul className="paneRes-lignes">
                            {item.lignes?.map((ligne, i) => (
                                <li key={i} className="paneRes-ligne">
                                    <div className="paneRes-ligne__left">
                                        <Package2 size={14} className="paneRes-ligne__icon" aria-hidden="true" />
                                        <div className="paneRes-ligne__info">
                                            <p className="paneRes-ligne__nom">{ligne.nom}</p>
                                            <p className="paneRes-ligne__meta">
                                                {ligne.type === "physique" ? "Physique" : "Service"} · {ligne.quantite_reservee} unité{ligne.quantite_reservee > 1 ? "s" : ""}
                                            </p>
                                            {ligne.type === "physique" && ligne.quantite_stock_actuel != null && (
                                                <p className="paneRes-ligne__stock">
                                                    Stock actuel : {ligne.quantite_stock_actuel}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="paneRes-ligne__total">
                                        {formatMontant(ligne.sous_total)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Statut stock (produits physiques seulement) */}
                    {item.statut === "en_cours" && lignesPhysiques.length > 0 && (
                        <section className="paneRes-section">
                            <h3 className="paneRes-section__title">Impact sur le stock</h3>
                            <div className="paneRes-info-block">
                                <Truck size={14} className="paneRes-info-block__icon" aria-hidden="true" />
                                <p className="paneRes-info-block__text">
                                    Le stock physique ne sera décrémenté qu'à la confirmation de la livraison associée.
                                </p>
                            </div>
                            {lignesPhysiques.map((ligne, i) => (
                                <div key={i} className="paneRes-stock-row">
                                    <span className="paneRes-stock-row__nom">{ligne.nom}</span>
                                    <span className="paneRes-stock-row__qty">
                                        Réservé : <strong>{ligne.quantite_reservee}</strong>
                                    </span>
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Note */}
                    {item.note && (
                        <section className="paneRes-section">
                            <h3 className="paneRes-section__title">Note</h3>
                            <div className="paneRes-note">
                                <AlignLeft size={14} className="paneRes-note__icon" aria-hidden="true" />
                                <p className="paneRes-note__text">{item.note}</p>
                            </div>
                        </section>
                    )}
                </div>
            </aside>
        </>
    );
}

export default PaneDetailsReservation;
