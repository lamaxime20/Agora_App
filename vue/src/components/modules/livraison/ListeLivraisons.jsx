import { useState, useEffect } from "react";
import {
    Truck, Clock, CheckCircle, XCircle, RotateCcw, Play, Download, MapPin, Phone,
} from "lucide-react";
import {
    fetchMesLivraisons, fetchHistoriquePersonnel,
    formatMontant, formatDate, getStatutBadge, exportLivraisons,
    STATUT_EN_COURS,
} from "../../../services/livraison.js";
import DeliveryDrawer from "./DeliveryDrawer.jsx";
import {
    LaunchDeliveryDialog,
    ValidateDeliveryDialog,
    CancelDeliveryDialog,
    EchecDeliveryDialog,
    RetourDeliveryDialog,
} from "./DeliveryActionDialogs.jsx";
import "../../../assets/styles/components/modules/livraison/ListeLivraisons.css";

const TABS = ["En cours", "Historique"];

// ─── Card livraison en cours ──────────────────────────────────────────────────

function DeliveryCard({ livraison, onAction, onDetail }) {
    const lancee = !!livraison.dateLancement;

    return (
        <div className="mesLiv-card">
            <div className="mesLiv-card__top">
                <div className="mesLiv-card__info" onClick={() => onDetail(livraison)} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && onDetail(livraison)}>
                    <div className="mesLiv-card__header">
                        <span className="mesLiv-card__numero">{livraison.commande}</span>
                        <span className={`liv-badge liv-badge--info`}>En cours</span>
                    </div>
                    <p className="mesLiv-card__client">{livraison.client}</p>
                    {livraison.telephone && (
                        <p className="mesLiv-card__contact">
                            <Phone size={12} aria-hidden="true" />
                            {livraison.telephone}
                        </p>
                    )}
                    {livraison.adresse && (
                        <p className="mesLiv-card__adresse">
                            <MapPin size={12} aria-hidden="true" />
                            <span>{livraison.adresse}</span>
                        </p>
                    )}
                    <p className="mesLiv-card__montant">{formatMontant(livraison.montant)}</p>
                </div>
            </div>

            <div className="mesLiv-card__actions">
                {!lancee ? (
                    <>
                        <button
                            type="button"
                            className="mesLiv-card__btn mesLiv-card__btn--cancel"
                            onClick={() => onAction("annuler", livraison)}
                        >
                            <XCircle size={16} aria-hidden="true" />
                            Annuler
                        </button>
                        <button
                            type="button"
                            className="mesLiv-card__btn mesLiv-card__btn--launch"
                            onClick={() => onAction("lancer", livraison)}
                        >
                            <Play size={16} aria-hidden="true" />
                            Lancer
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            className="mesLiv-card__btn mesLiv-card__btn--retour"
                            onClick={() => onAction("retour", livraison)}
                        >
                            <RotateCcw size={16} aria-hidden="true" />
                            Retour
                        </button>
                        <button
                            type="button"
                            className="mesLiv-card__btn mesLiv-card__btn--echec"
                            onClick={() => onAction("echec", livraison)}
                        >
                            <XCircle size={16} aria-hidden="true" />
                            Échec
                        </button>
                        <button
                            type="button"
                            className="mesLiv-card__btn mesLiv-card__btn--valider"
                            onClick={() => onAction("valider", livraison)}
                        >
                            <CheckCircle size={16} aria-hidden="true" />
                            Valider
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Mes livraisons en cours ──────────────────────────────────────────────────

function MesLivraisonsEnCours() {
    const [data, setData]         = useState(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");
    const [dialog, setDialog]     = useState(null);
    const [drawerLiv, setDrawer]  = useState(null);

    const load = () => {
        setLoading(true);
        fetchMesLivraisons()
            .then(setData)
            .catch(() => setError("Impossible de charger vos livraisons."))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleAction = (type, livraison) => setDialog({ type, livraison });
    const handleSuccess = () => { setDialog(null); load(); };

    if (loading) return (
        <div className="mesLiv-list">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mesLiv-card mesLiv-card--skeleton">
                    <div className="liv-skeleton" style={{ width: "50%", height: 16 }} />
                    <div className="liv-skeleton" style={{ width: "70%", height: 14, marginTop: 8 }} />
                    <div className="liv-skeleton" style={{ width: "40%", height: 12, marginTop: 6 }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                        <div className="liv-skeleton" style={{ flex: 1, height: 40, borderRadius: 12 }} />
                        <div className="liv-skeleton" style={{ flex: 1, height: 40, borderRadius: 12 }} />
                    </div>
                </div>
            ))}
        </div>
    );

    if (error) return <p className="mesLiv-error">{error}</p>;

    return (
        <>
            {/* Mobile : cartes */}
            <div className="mesLiv-list mesLiv-list--mobile">
                {data?.data?.map(liv => (
                    <DeliveryCard
                        key={liv.id}
                        livraison={liv}
                        onAction={handleAction}
                        onDetail={setDrawer}
                    />
                ))}
                {!data?.data?.length && (
                    <div className="mesLiv-empty">
                        <Truck size={40} className="mesLiv-empty__icon" aria-hidden="true" />
                        <p>Aucune livraison en cours.</p>
                    </div>
                )}
            </div>

            {/* Desktop : tableau */}
            <div className="mesLiv-list--desktop">
                <table className="mesLiv-table">
                    <thead>
                        <tr>
                            <th>Commande</th>
                            <th>Client</th>
                            <th>Téléphone</th>
                            <th>Adresse</th>
                            <th>Montant</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.data?.map(liv => {
                            const lancee = !!liv.dateLancement;
                            return (
                                <tr
                                    key={liv.id}
                                    className="mesLiv-table__row"
                                    onClick={() => setDrawer(liv)}
                                    tabIndex={0}
                                    onKeyDown={e => e.key === "Enter" && setDrawer(liv)}
                                >
                                    <td className="mesLiv-table__numero">{liv.commande}</td>
                                    <td>{liv.client}</td>
                                    <td>{liv.telephone ?? "—"}</td>
                                    <td className="mesLiv-table__adresse">{liv.adresse ?? "—"}</td>
                                    <td className="mesLiv-table__montant">{formatMontant(liv.montant)}</td>
                                    <td><span className="liv-badge liv-badge--info">En cours</span></td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <div className="mesLiv-table__actions">
                                            {!lancee ? (
                                                <>
                                                    <button type="button" className="mesLiv-table__btn mesLiv-table__btn--cancel" onClick={() => handleAction("annuler", liv)}>Annuler</button>
                                                    <button type="button" className="mesLiv-table__btn mesLiv-table__btn--launch" onClick={() => handleAction("lancer", liv)}>Lancer</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button type="button" className="mesLiv-table__btn mesLiv-table__btn--retour" onClick={() => handleAction("retour", liv)}>Retour</button>
                                                    <button type="button" className="mesLiv-table__btn mesLiv-table__btn--echec" onClick={() => handleAction("echec", liv)}>Échec</button>
                                                    <button type="button" className="mesLiv-table__btn mesLiv-table__btn--valider" onClick={() => handleAction("valider", liv)}>Valider</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!data?.data?.length && (
                    <div className="mesLiv-empty mesLiv-empty--table">
                        <Truck size={40} className="mesLiv-empty__icon" aria-hidden="true" />
                        <p>Aucune livraison en cours.</p>
                    </div>
                )}
            </div>

            {/* Drawer détails */}
            {drawerLiv && <DeliveryDrawer livraison={drawerLiv} onClose={() => setDrawer(null)} />}

            {/* Dialogs d'action */}
            {dialog?.type === "lancer"  && <LaunchDeliveryDialog   livraison={dialog.livraison} onClose={() => setDialog(null)} onSuccess={handleSuccess} />}
            {dialog?.type === "valider" && <ValidateDeliveryDialog  livraison={dialog.livraison} onClose={() => setDialog(null)} onSuccess={handleSuccess} />}
            {dialog?.type === "annuler" && <CancelDeliveryDialog    livraison={dialog.livraison} onClose={() => setDialog(null)} onSuccess={handleSuccess} />}
            {dialog?.type === "echec"   && <EchecDeliveryDialog     livraison={dialog.livraison} onClose={() => setDialog(null)} onSuccess={handleSuccess} />}
            {dialog?.type === "retour"  && <RetourDeliveryDialog    livraison={dialog.livraison} onClose={() => setDialog(null)} onSuccess={handleSuccess} />}
        </>
    );
}

// ─── Historique personnel ─────────────────────────────────────────────────────

function HistoriquePersonnel() {
    const [data, setData]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState("");
    const [selected, setSelected]   = useState(null);
    const [exporting, setExporting] = useState(false);
    const [exportMsg, setExportMsg] = useState("");

    useEffect(() => {
        fetchHistoriquePersonnel()
            .then(setData)
            .catch(() => setError("Impossible de charger l'historique."))
            .finally(() => setLoading(false));
    }, []);

    const handleExport = async (format) => {
        setExporting(true);
        try {
            const res = await exportLivraisons(format);
            setExportMsg(res.message ?? "Export réalisé.");
        } catch {
            setExportMsg("Erreur lors de l'export.");
        } finally {
            setExporting(false);
            setTimeout(() => setExportMsg(""), 3000);
        }
    };

    if (loading) return (
        <div className="mesLiv-list">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="mesLiv-card" style={{ minHeight: 120 }}>
                    <div className="liv-skeleton" style={{ width: "50%", height: 16 }} />
                    <div className="liv-skeleton" style={{ width: "70%", height: 14, marginTop: 8 }} />
                    <div className="liv-skeleton" style={{ width: "40%", height: 24, marginTop: 8, borderRadius: 999 }} />
                </div>
            ))}
        </div>
    );

    if (error) return <p className="mesLiv-error">{error}</p>;

    return (
        <>
            <div className="mesLiv-toolbar">
                <div className="mesLiv-export">
                    <Download size={16} aria-hidden="true" />
                    <span>Exporter</span>
                    {["pdf", "csv", "docx"].map(f => (
                        <button key={f} type="button" className="mesLiv-export__btn" onClick={() => handleExport(f)} disabled={exporting}>
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>
                {exportMsg && <span className="mesLiv-export__msg">{exportMsg}</span>}
            </div>

            {/* Mobile */}
            <div className="mesLiv-list mesLiv-list--mobile">
                {data?.data?.map(liv => {
                    const badge = getStatutBadge(liv.statut);
                    return (
                        <button key={liv.id} type="button" className="mesLiv-card mesLiv-card--history" onClick={() => setSelected(liv)}>
                            <div className="mesLiv-card__header">
                                <span className="mesLiv-card__numero">{liv.commande}</span>
                                <span className={`liv-badge liv-badge--${badge.variant}`}>{badge.label}</span>
                            </div>
                            <p className="mesLiv-card__client">{liv.client}</p>
                            <div className="mesLiv-card__meta">
                                <span className="mesLiv-card__montant">{formatMontant(liv.montant)}</span>
                                <span className="mesLiv-card__date">{formatDate(liv.dateCreation)}</span>
                            </div>
                        </button>
                    );
                })}
                {!data?.data?.length && (
                    <div className="mesLiv-empty">
                        <Clock size={40} className="mesLiv-empty__icon" aria-hidden="true" />
                        <p>Aucun historique trouvé.</p>
                    </div>
                )}
            </div>

            {/* Desktop */}
            <div className="mesLiv-list--desktop">
                <table className="mesLiv-table">
                    <thead>
                        <tr>
                            <th>Commande</th>
                            <th>Client</th>
                            <th>Date création</th>
                            <th>Date lancement</th>
                            <th>Date livraison</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.data?.map(liv => {
                            const badge = getStatutBadge(liv.statut);
                            return (
                                <tr key={liv.id} className="mesLiv-table__row mesLiv-table__row--clickable" onClick={() => setSelected(liv)} tabIndex={0} onKeyDown={e => e.key === "Enter" && setSelected(liv)}>
                                    <td className="mesLiv-table__numero">{liv.commande}</td>
                                    <td>{liv.client}</td>
                                    <td>{formatDate(liv.dateCreation)}</td>
                                    <td>{formatDate(liv.dateLancement)}</td>
                                    <td>{formatDate(liv.dateLivraison)}</td>
                                    <td><span className={`liv-badge liv-badge--${badge.variant}`}>{badge.label}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selected && <DeliveryDrawer livraison={selected} onClose={() => setSelected(null)} />}
        </>
    );
}

// ─── Composant principal ──────────────────────────────────────────────────────

function ListeLivraisons() {
    const [tab, setTab] = useState(TABS[0]);

    return (
        <div className="mesLiv-root">
            <div className="mesLiv-tabs" role="tablist" aria-label="Onglets livraisons">
                {TABS.map(t => (
                    <button
                        key={t}
                        type="button"
                        role="tab"
                        aria-selected={tab === t}
                        className={`mesLiv-tab${tab === t ? " mesLiv-tab--active" : ""}`}
                        onClick={() => setTab(t)}
                    >
                        {t === TABS[0] ? <Truck size={16} aria-hidden="true" /> : <Clock size={16} aria-hidden="true" />}
                        <span>{t}</span>
                    </button>
                ))}
            </div>

            <div role="tabpanel" aria-label={tab}>
                {tab === TABS[0] ? <MesLivraisonsEnCours /> : <HistoriquePersonnel />}
            </div>
        </div>
    );
}

export default ListeLivraisons;
