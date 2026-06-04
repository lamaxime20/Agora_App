import { useState, useEffect, useCallback } from "react";
import {
    X, Package2, User, Calendar, Banknote,
    AlignLeft, Trash2, Clock,
} from "lucide-react";
import "../../../../assets/styles/components/modules/gestionStocks/paneDetailsPerte.css";

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

const MOTIF_CONFIG = {
    vol:        { label: "Vol",        mod: "error"   },
    casse:      { label: "Casse",      mod: "warning" },
    péremption: { label: "Péremption", mod: "info"    },
    autre:      { label: "Autre",      mod: "muted"   },
};

function BadgeMotif({ motif }) {
    const cfg = MOTIF_CONFIG[motif] ?? { label: motif, mod: "muted" };
    return (
        <span className={`panePertes-badge panePertes-badge--${cfg.mod}`}>
            {cfg.label}
        </span>
    );
}

/* ─── Countdown live ──────────────────────────────────────────────────────────── */

function useCountdown(targetIso) {
    const getRemaining = useCallback(() => {
        const diff = new Date(targetIso).getTime() - Date.now();
        if (diff <= 0) return null;
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        const s = Math.floor((diff % 60_000) / 1_000);
        return { h, m, s, diff };
    }, [targetIso]);

    const [remaining, setRemaining] = useState(getRemaining);

    useEffect(() => {
        const id = setInterval(() => {
            const r = getRemaining();
            setRemaining(r);
            if (!r) clearInterval(id);
        }, 1_000);
        return () => clearInterval(id);
    }, [getRemaining]);

    return remaining;
}

function Row({ label, value, icon: Icon }) {
    return (
        <div className="panePertes-row">
            {Icon && <Icon size={14} className="panePertes-row__icon" aria-hidden="true" />}
            <span className="panePertes-row__label">{label}</span>
            <span className="panePertes-row__value">{value ?? "—"}</span>
        </div>
    );
}

/* ─── Composant ──────────────────────────────────────────────────────────────── */

function PaneDetailsPerte({ item, onClose, onAnnuler, peutAnnuler }) {
    const remaining = useCountdown(item.date_limite_annulation);

    return (
        <>
            <div
                className="panePertes-backdrop"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="panePertes-root"
                role="complementary"
                aria-label="Détails de la perte"
            >
                {/* ─── Header ──────────────── */}
                <div className="panePertes-header">
                    <div className="panePertes-header__top">
                        <BadgeMotif motif={item.motif} />
                        <button
                            className="panePertes-close"
                            onClick={onClose}
                            type="button"
                            aria-label="Fermer le volet"
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    </div>
                    <h2 className="panePertes-title">{item.produit?.nom}</h2>
                    <p className="panePertes-sub">{item.reference}</p>
                </div>

                {/* ─── Corps ───────────────── */}
                <div className="panePertes-body">

                    {/* Countdown si annulable */}
                    {item.date_limite_annulation && (
                        <div className={`panePertes-countdown-block${peutAnnuler ? "" : " panePertes-countdown-block--expired"}`}>
                            <Clock size={14} className="panePertes-countdown-block__icon" aria-hidden="true" />
                            {peutAnnuler && remaining ? (
                                <div>
                                    <p className="panePertes-countdown-block__label">
                                        Délai d'annulation restant
                                    </p>
                                    <p className="panePertes-countdown-block__value">
                                        {remaining.h > 0 && `${remaining.h}h `}
                                        {remaining.m}m {remaining.s}s
                                    </p>
                                </div>
                            ) : (
                                <p className="panePertes-countdown-block__expired">
                                    Délai d'annulation expiré
                                </p>
                            )}
                        </div>
                    )}

                    {/* Informations */}
                    <section className="panePertes-section">
                        <h3 className="panePertes-section__title">Détails de la perte</h3>
                        <Row label="Produit"        value={item.produit?.nom}                      icon={Package2} />
                        <Row label="Référence"      value={item.produit?.reference}               />
                        <Row label="Unité"          value={item.produit?.unite}                   />
                        <Row label="Quantité perdue" value={`${item.quantite} ${item.produit?.unite}${item.quantite > 1 ? "s" : ""}`} />
                        <Row label="Prix unitaire"  value={formatMontant(item.prix_unitaire)}      icon={Banknote} />
                        <Row label="Valeur totale"  value={formatMontant(item.valeur_totale)}      icon={Banknote} />
                    </section>

                    {/* Déclaration */}
                    <section className="panePertes-section">
                        <h3 className="panePertes-section__title">Déclaration</h3>
                        <Row label="Déclaré par"   value={item.declarant?.nom}                    icon={User}     />
                        <Row label="Date déclaration" value={formatDate(item.date_declaration)}   icon={Calendar} />
                        <Row label="Motif"         value={MOTIF_CONFIG[item.motif]?.label ?? item.motif} />
                    </section>

                    {/* Note */}
                    {item.note && (
                        <section className="panePertes-section">
                            <h3 className="panePertes-section__title">Note</h3>
                            <div className="panePertes-note">
                                <AlignLeft size={14} className="panePertes-note__icon" aria-hidden="true" />
                                <p className="panePertes-note__text">{item.note}</p>
                            </div>
                        </section>
                    )}
                </div>

                {/* ─── Action annuler ──────── */}
                {peutAnnuler && (
                    <div className="panePertes-footer">
                        <button
                            className="app-button panePertes-btn--annuler"
                            onClick={onAnnuler}
                            type="button"
                        >
                            <Trash2 size={16} aria-hidden="true" />
                            Annuler cette perte
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}

export default PaneDetailsPerte;
