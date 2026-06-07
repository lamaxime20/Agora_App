import { useState, useEffect } from "react";
import { X, Mail, Phone, Briefcase, Calendar, CreditCard, TrendingDown, History } from "lucide-react";
import { fetchSalarieDetail } from "../../../../services/financesP5.js";
import HistoriquePaiementsSalarie from "./historiquePaiementsSalarie.jsx";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
    d ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d)) : "—";

function getInitiales(prenom, nom) {
    return [(prenom?.[0] ?? ""), (nom?.[0] ?? "")].join("").toUpperCase();
}

const STATUT_MAP = {
    actif:   { label: "Actif",    cls: "fin-badge--success" },
    conge:   { label: "En congé", cls: "fin-badge--warning" },
    inactif: { label: "Inactif",  cls: "fin-badge--neutral" },
};

function DetailSkeleton() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
                <div className="finSal-skeleton finSal-skeleton--avatar" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                    <div className="finSal-skeleton finSal-skeleton--lg" />
                    <div className="finSal-skeleton finSal-skeleton--md" />
                </div>
            </div>
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="finSal-detail__row">
                    <div className="finSal-skeleton finSal-skeleton--md" />
                    <div className="finSal-skeleton finSal-skeleton--sm" />
                </div>
            ))}
        </div>
    );
}

function SalariePane({ salarieId, onClose }) {
    const [loading, setLoading]             = useState(true);
    const [salarie, setSalarie]             = useState(null);
    const [showHistorique, setShowHistorique] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchSalarieDetail(salarieId)
            .then(d => { if (!cancelled) { setSalarie(d); setLoading(false); } })
            .catch(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [salarieId]);

    const st = salarie ? (STATUT_MAP[salarie.statut] ?? { label: salarie.statut, cls: "fin-badge--neutral" }) : null;

    return (
        <>
            <div className="finSal-drawer__overlay" onClick={onClose} aria-hidden="true" />
            <aside
                className="finSal-drawer"
                role="complementary"
                aria-label={salarie ? `Profil de ${salarie.prenom} ${salarie.nom}` : "Chargement"}
            >
                <div className="finSal-drawer__handle">
                    <div className="finSal-drawer__handle-bar" />
                </div>

                <div className="finSal-drawer__header">
                    <h2 className="finSal-drawer__title">
                        {loading ? "Chargement…" : salarie ? `${salarie.prenom} ${salarie.nom}` : "Introuvable"}
                    </h2>
                    <button className="finSal-drawer__close" onClick={onClose} aria-label="Fermer" type="button">
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finSal-drawer__body">
                    {loading ? (
                        <DetailSkeleton />
                    ) : !salarie ? (
                        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                            Données introuvables.
                        </p>
                    ) : (
                        <>
                            {/* Hero */}
                            <div className="finSal-pane-hero">
                                <div className="finSal-avatar finSal-avatar--lg" aria-hidden="true">
                                    {getInitiales(salarie.prenom, salarie.nom)}
                                </div>
                                <div className="finSal-pane-hero__info">
                                    <p className="finSal-pane-hero__name">{salarie.prenom} {salarie.nom}</p>
                                    <p className="finSal-pane-hero__id">{salarie.id}</p>
                                </div>
                                {st && <span className={`fin-badge ${st.cls}`}>{st.label}</span>}
                            </div>

                            {/* Informations personnelles */}
                            <section>
                                <p className="finSal-detail__section-label">Informations</p>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">
                                        <Mail size={13} style={{ marginRight: 4 }} aria-hidden="true" />Email
                                    </span>
                                    <span className="finSal-detail__val">{salarie.email}</span>
                                </div>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">
                                        <Phone size={13} style={{ marginRight: 4 }} aria-hidden="true" />Téléphone
                                    </span>
                                    <span className="finSal-detail__val">{salarie.telephone}</span>
                                </div>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">
                                        <Briefcase size={13} style={{ marginRight: 4 }} aria-hidden="true" />Poste
                                    </span>
                                    <span className="finSal-detail__val">{salarie.poste}</span>
                                </div>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">
                                        <Calendar size={13} style={{ marginRight: 4 }} aria-hidden="true" />Date d'embauche
                                    </span>
                                    <span className="finSal-detail__val">{fmtDate(salarie.dateEmbauche)}</span>
                                </div>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">
                                        <CreditCard size={13} style={{ marginRight: 4 }} aria-hidden="true" />Salaire net
                                    </span>
                                    <span className="finSal-detail__val finSal-detail__val--amount" style={{ color: "var(--color-error)" }}>
                                        {fmt(salarie.salaireNet)}/mois
                                    </span>
                                </div>
                            </section>

                            {/* Résumé financier */}
                            <section>
                                <p className="finSal-detail__section-label">Résumé financier</p>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">
                                        <TrendingDown size={13} style={{ marginRight: 4 }} aria-hidden="true" />Total versé
                                    </span>
                                    <span className="finSal-detail__val finSal-detail__val--amount">{fmt(salarie.totalPaye)}</span>
                                </div>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">Nombre de paiements</span>
                                    <span className="finSal-detail__val">{salarie.nombrePaiements}</span>
                                </div>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">Dernier versement</span>
                                    <span className="finSal-detail__val">{fmtDate(salarie.dernierPaiement)}</span>
                                </div>
                                <div className="finSal-detail__row">
                                    <span className="finSal-detail__key">Prochain versement</span>
                                    <span className="finSal-detail__val" style={{ color: "var(--color-warning)", fontWeight: "var(--weight-semibold)" }}>
                                        {fmtDate(salarie.prochaineEcheance)}
                                    </span>
                                </div>
                            </section>

                            {/* Derniers paiements */}
                            <section>
                                <p className="finSal-detail__section-label">Derniers paiements</p>
                                <div className="finSal-timeline">
                                    {(salarie.paiementsRecents ?? []).slice(0, 5).map(p => (
                                        <div key={p.id} className="finSal-timeline__item">
                                            <div className="finSal-timeline__dot" aria-hidden="true" />
                                            <div className="finSal-timeline__content">
                                                <p className="finSal-timeline__msg">
                                                    {p.periode} — <strong>{fmt(p.montant)}</strong>
                                                </p>
                                                <p className="finSal-timeline__meta">
                                                    {fmtDate(p.date)} · {p.reference}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </div>

                <div className="finSal-drawer__footer">
                    {salarie && (
                        <button
                            className="app-button app-button--primary"
                            style={{ flex: 1 }}
                            onClick={() => setShowHistorique(true)}
                            type="button"
                        >
                            <History size={16} style={{ marginRight: 6 }} aria-hidden="true" />
                            Historique complet
                        </button>
                    )}
                    <button
                        className="app-button app-button--ghost"
                        style={{ flex: salarie ? undefined : 1 }}
                        onClick={onClose}
                        type="button"
                    >
                        Fermer
                    </button>
                </div>
            </aside>

            {showHistorique && salarie && (
                <HistoriquePaiementsSalarie
                    salarie={salarie}
                    onClose={() => setShowHistorique(false)}
                />
            )}
        </>
    );
}

export default SalariePane;
