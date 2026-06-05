import { X } from "lucide-react";
import { TYPE_CONFIG } from "./historiqueTransactions.jsx";
import "../../../../assets/styles/components/modules/gestionStocks/paneDetailsTransaction.css";

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

/* ─── Ligne d'info générique ──────────────────────────────────────────────────── */

function Row({ label, value, mod }) {
    return (
        <div className="paneTransaction-row">
            <span className="paneTransaction-row__label">{label}</span>
            <span className={`paneTransaction-row__value${mod ? ` paneTransaction-row__value--${mod}` : ""}`}>
                {value ?? "—"}
            </span>
        </div>
    );
}

/* ─── Section d'info ──────────────────────────────────────────────────────────── */

function Section({ title, children }) {
    return (
        <section className="paneTransaction-section">
            <h3 className="paneTransaction-section__title">{title}</h3>
            {children}
        </section>
    );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────────── */

function PaneSkeleton() {
    return (
        <div className="paneTransaction-skeleton" aria-busy="true" aria-label="Chargement des détails">
            <div className="paneTransaction-skeleton__badge" />
            <div className="paneTransaction-skeleton__section">
                <div className="paneTransaction-skeleton__line paneTransaction-skeleton__line--third" />
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div className="paneTransaction-skeleton__line" style={{ width: "35%" }} />
                        <div className="paneTransaction-skeleton__line" style={{ width: "50%" }} />
                    </div>
                ))}
            </div>
            <div className="paneTransaction-skeleton__section">
                <div className="paneTransaction-skeleton__line paneTransaction-skeleton__line--third" />
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div className="paneTransaction-skeleton__line" style={{ width: "40%" }} />
                        <div className="paneTransaction-skeleton__line" style={{ width: "45%" }} />
                    </div>
                ))}
            </div>
            <div className="paneTransaction-skeleton__section">
                <div className="paneTransaction-skeleton__line paneTransaction-skeleton__line--third" />
                <div className="paneTransaction-skeleton__line paneTransaction-skeleton__line--full" />
                <div className="paneTransaction-skeleton__line paneTransaction-skeleton__line--half" />
            </div>
        </div>
    );
}

/* ─── Sections spécifiques par type ──────────────────────────────────────────── */

function SectionRavitaillement({ detail }) {
    if (!detail) return null;
    return (
        <Section title="Détails du réapprovisionnement">
            <Row label="Quantité ajoutée"    value={`${detail.quantite} unités`} />
            <Row label="Montant"             value={detail.montant ? `${detail.montant.toLocaleString("fr-FR")} FCFA` : "—"} />
            <Row label="Fournisseur"         value={detail.fournisseur} />
            <Row label="Demandeur"           value={detail.demandeur} />
            <Row label="Validateur"          value={detail.validateur} />
            <Row label="Date de demande"     value={formatDate(detail.date_demande)} />
            <Row label="Date de validation"  value={formatDate(detail.date_validation)} />
            <Row label="Statut"              value={detail.statut} />
        </Section>
    );
}

function SectionPerte({ detail }) {
    if (!detail) return null;
    return (
        <Section title="Détails de la perte">
            <Row label="Quantité perdue"  value={`${detail.quantite_perdue} unités`} mod="minus" />
            <Row label="Valeur estimée"   value={detail.valeur_estimee ? `${detail.valeur_estimee.toLocaleString("fr-FR")} FCFA` : "—"} />
            <Row label="Motif"            value={detail.motif} />
            <Row label="Annulable"        value={detail.annulable ? "Oui (< 24h)" : "Non"} />
        </Section>
    );
}

function SectionLivraison({ detail }) {
    if (!detail) return null;
    return (
        <Section title="Détails de la livraison">
            <Row label="Référence commande"     value={detail.commande_ref} />
            <Row label="Client"                  value={detail.client} />
            <Row label="Quantité livrée"         value={`${detail.quantite_livree} unités`} mod="minus" />
            <Row label="Date validation livraison" value={formatDate(detail.date_validation_livraison)} />
            <Row label="Impact stock"            value={detail.impact_stock} />
        </Section>
    );
}

function SectionAnnulation({ detail, label }) {
    if (!detail) return null;
    return (
        <Section title={label}>
            <Row label="Réf. transaction annulée" value={detail.transaction_annulee ?? detail.reapprovisionnement_ref} />
            <Row label="Raison"                   value={detail.raison_annulation} />
            {detail.quantite_restauree != null && (
                <Row label="Quantité restaurée" value={`${detail.quantite_restauree} unités`} mod="plus" />
            )}
            {detail.montant_annule != null && (
                <Row label="Montant annulé" value={`${detail.montant_annule.toLocaleString("fr-FR")} FCFA`} />
            )}
        </Section>
    );
}

function SectionCreation({ detail }) {
    if (!detail) return null;
    return (
        <Section title="Création du produit">
            <Row label="Stock initial"   value={`${detail.stock_initial} unités`} mod="plus" />
            <Row label="Prix unitaire"   value={detail.prix_unitaire ? `${detail.prix_unitaire.toLocaleString("fr-FR")} FCFA` : "—"} />
            <Row label="Catégorie"       value={detail.categorie} />
            <Row label="Type de produit" value={detail.type_produit} />
        </Section>
    );
}

function SectionModification({ detail }) {
    if (!detail) return null;
    return (
        <Section title="Modification">
            <Row label="Champ modifié"    value={detail.champ_modifie} />
            <Row label="Ancienne valeur"  value={detail.ancienne_valeur} />
            <Row label="Nouvelle valeur"  value={detail.nouvelle_valeur} />
        </Section>
    );
}

function SectionArchivage({ detail }) {
    if (!detail) return null;
    return (
        <Section title="Archivage">
            <Row label="Raison"          value={detail.raison} />
            <Row label="Stock archivé"   value={detail.stock_archive != null ? `${detail.stock_archive} unités` : "—"} />
        </Section>
    );
}

/* ─── Contenu du pane ─────────────────────────────────────────────────────────── */

function PaneContent({ transaction }) {
    const cfg    = TYPE_CONFIG[transaction.type] ?? TYPE_CONFIG.modification;
    const Icon   = cfg.icon;
    const isPlus = (transaction.variation ?? 0) > 0;
    const isZero = transaction.variation == null || transaction.variation === 0;

    return (
        <>
            {/* Badge type */}
            <span className={`paneTransaction-typeBadge paneTransaction-typeBadge--${cfg.mod}`}>
                <Icon size={13} aria-hidden="true" />
                {cfg.label}
            </span>

            {/* ID */}
            <div className="paneTransaction-id" aria-label={`Identifiant : ${transaction.id}`}>
                {transaction.id}
            </div>

            {/* Produit */}
            <Section title="Produit">
                <Row label="Nom"        value={transaction.produit.nom} />
                <Row label="Référence"  value={transaction.produit.reference} />
                <Row label="Catégorie"  value={transaction.produit.categorie} />
                <Row label="Type"       value={transaction.produit.type_produit} />
            </Section>

            {/* Impact stock */}
            {transaction.produit.type_produit === "physique" && (
                <Section title="Impact sur le stock">
                    <Row
                        label="Variation"
                        value={isZero ? "—" : `${isPlus ? "+" : ""}${transaction.variation}`}
                        mod={isZero ? undefined : (isPlus ? "plus" : "minus")}
                    />
                    {transaction.stock_avant != null && <Row label="Stock avant"  value={transaction.stock_avant} />}
                    {transaction.stock_apres != null && <Row label="Stock après"  value={transaction.stock_apres} />}
                </Section>
            )}

            {/* Sections spécifiques par type */}
            {transaction.type === "ravitaillement"                && <SectionRavitaillement detail={transaction.detail} />}
            {transaction.type === "perte"                         && <SectionPerte          detail={transaction.detail} />}
            {transaction.type === "livraison"                     && <SectionLivraison      detail={transaction.detail} />}
            {transaction.type === "annulation_perte"              && <SectionAnnulation     detail={transaction.detail} label="Annulation de perte" />}
            {transaction.type === "annulation_reapprovisionnement"&& <SectionAnnulation     detail={transaction.detail} label="Annulation de réapprovisionnement" />}
            {transaction.type === "creation"                      && <SectionCreation       detail={transaction.detail} />}
            {transaction.type === "modification"                   && <SectionModification   detail={transaction.detail} />}
            {transaction.type === "archivage"                     && <SectionArchivage      detail={transaction.detail} />}

            {/* Informations générales */}
            <Section title="Informations">
                <Row label="Utilisateur" value={transaction.utilisateur.nom} />
                <Row label="Date"        value={formatDate(transaction.date)} />
            </Section>

            {/* Note */}
            {transaction.note && (
                <Section title="Note">
                    <p className="paneTransaction-note">{transaction.note}</p>
                </Section>
            )}
        </>
    );
}

/* ─── Composant principal ─────────────────────────────────────────────────────── */

function PaneDetailsTransaction({ transaction, loading, onClose }) {
    const isMobile = window.innerWidth < 1025;

    const panelContent = (
        <>
            <div className="paneTransaction-header">
                <h2 className="paneTransaction-title">Détails</h2>
                <button
                    className="paneTransaction-close"
                    onClick={onClose}
                    aria-label="Fermer le volet"
                    type="button"
                >
                    <X size={20} aria-hidden="true" />
                </button>
            </div>

            {loading ? (
                <PaneSkeleton />
            ) : (
                <div className="paneTransaction-body">
                    {transaction && <PaneContent transaction={transaction} />}
                </div>
            )}
        </>
    );

    if (isMobile) {
        return (
            <div
                className="paneTransaction-overlay-mobile"
                onClick={onClose}
                role="presentation"
            >
                <aside
                    className="paneTransaction-panel"
                    aria-label="Détails de la transaction"
                    onClick={e => e.stopPropagation()}
                >
                    {panelContent}
                </aside>
            </div>
        );
    }

    return (
        <aside className="paneTransaction-panel" aria-label="Détails de la transaction">
            {panelContent}
        </aside>
    );
}

export default PaneDetailsTransaction;
