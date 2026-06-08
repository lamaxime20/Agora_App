import { useState, useEffect } from "react";
import { PackageCheck, Clock, FileText, Download } from "lucide-react";
import {
    fetchCommandesALivrer, fetchHistoriqueLivraisons,
    formatMontant, formatDate, getStatutBadge, exportLivraisons,
} from "../../../services/livraison.js";
import AssignDriverModal from "./AssignDriverModal.jsx";
import DeliveryDrawer    from "./DeliveryDrawer.jsx";
import "../../../assets/styles/components/modules/livraison/CommandesALivrer.css";

const TABS = ["Commandes à livrer", "Historique des livraisons"];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
    return (
        <div className="cmdLiv-card cmdLiv-card--skeleton">
            <div className="liv-skeleton" style={{ width: "40%", height: 14 }} />
            <div className="liv-skeleton" style={{ width: "60%", height: 18, marginTop: 8 }} />
            <div className="liv-skeleton" style={{ width: "30%", height: 12, marginTop: 6 }} />
            <div className="liv-skeleton" style={{ width: "100%", height: 40, marginTop: 12, borderRadius: 12 }} />
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="cmdLiv-table-wrap">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="cmdLiv-table-row cmdLiv-table-row--skeleton">
                    <div className="liv-skeleton" style={{ width: "15%", height: 14 }} />
                    <div className="liv-skeleton" style={{ width: "20%", height: 14 }} />
                    <div className="liv-skeleton" style={{ width: "15%", height: 14 }} />
                    <div className="liv-skeleton" style={{ width: "12%", height: 14 }} />
                    <div className="liv-skeleton" style={{ width: "10%", height: 24, borderRadius: 999 }} />
                    <div className="liv-skeleton" style={{ width: "12%", height: 36, borderRadius: 12 }} />
                </div>
            ))}
        </div>
    );
}

// ─── Commandes à livrer ───────────────────────────────────────────────────────

function ListeCommandes() {
    const [data, setData]         = useState(null);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");
    const [assigning, setAssigning] = useState(null);

    const load = () => {
        setLoading(true);
        fetchCommandesALivrer()
            .then(setData)
            .catch(() => setError("Impossible de charger les commandes."))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    if (loading) return (
        <div className="cmdLiv-list">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
    );
    if (error) return <p className="cmdLiv-error">{error}</p>;

    return (
        <>
            {/* Mobile : cartes */}
            <div className="cmdLiv-list cmdLiv-list--mobile">
                {data?.data?.map(cmd => (
                    <div key={cmd.id} className="cmdLiv-card">
                        <div className="cmdLiv-card__header">
                            <span className="cmdLiv-card__numero">{cmd.numero}</span>
                            <span className={`liv-badge liv-badge--${cmd.etatPaiement === "valide" ? "success" : "warning"}`}>
                                {cmd.etatPaiement === "valide" ? "Validé" : "Partiel"}
                            </span>
                        </div>
                        <p className="cmdLiv-card__client">{cmd.client}</p>
                        <div className="cmdLiv-card__meta">
                            <span className="cmdLiv-card__montant">{formatMontant(cmd.montant)}</span>
                            <span className="cmdLiv-card__date">{formatDate(cmd.date)}</span>
                        </div>
                        <button
                            type="button"
                            className="cmdLiv-card__assign-btn"
                            onClick={() => setAssigning(cmd)}
                        >
                            Assigner un livreur
                        </button>
                    </div>
                ))}
                {!data?.data?.length && (
                    <div className="cmdLiv-empty">
                        <PackageCheck size={40} className="cmdLiv-empty__icon" aria-hidden="true" />
                        <p>Aucune commande à livrer.</p>
                    </div>
                )}
            </div>

            {/* Desktop : tableau */}
            <div className="cmdLiv-list--desktop">
                <table className="cmdLiv-table">
                    <thead>
                        <tr>
                            <th>Commande</th>
                            <th>Client</th>
                            <th>Montant</th>
                            <th>Date</th>
                            <th>Paiement</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.data?.map(cmd => (
                            <tr key={cmd.id} className="cmdLiv-table__row">
                                <td className="cmdLiv-table__numero">{cmd.numero}</td>
                                <td>{cmd.client}</td>
                                <td className="cmdLiv-table__montant">{formatMontant(cmd.montant)}</td>
                                <td className="cmdLiv-table__date">{formatDate(cmd.date)}</td>
                                <td>
                                    <span className={`liv-badge liv-badge--${cmd.etatPaiement === "valide" ? "success" : "warning"}`}>
                                        {cmd.etatPaiement === "valide" ? "Validé" : "Partiel"}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className="cmdLiv-table__assign-btn"
                                        onClick={() => setAssigning(cmd)}
                                    >
                                        Assigner
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!data?.data?.length && (
                    <div className="cmdLiv-empty cmdLiv-empty--table">
                        <PackageCheck size={40} className="cmdLiv-empty__icon" aria-hidden="true" />
                        <p>Aucune commande à livrer.</p>
                    </div>
                )}
            </div>

            {assigning && (
                <AssignDriverModal
                    commande={assigning}
                    onClose={() => setAssigning(null)}
                    onSuccess={() => { setAssigning(null); load(); }}
                />
            )}
        </>
    );
}

// ─── Historique des livraisons ────────────────────────────────────────────────

function HistoriqueLivraisons() {
    const [data, setData]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState("");
    const [selected, setSelected]   = useState(null);
    const [exporting, setExporting] = useState(false);
    const [exportMsg, setExportMsg] = useState("");

    useEffect(() => {
        fetchHistoriqueLivraisons()
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

    if (loading) return <TableSkeleton />;
    if (error)   return <p className="cmdLiv-error">{error}</p>;

    return (
        <>
            {/* Export */}
            <div className="cmdLiv-toolbar">
                <div className="cmdLiv-export">
                    <Download size={16} aria-hidden="true" />
                    <span>Exporter</span>
                    {["pdf", "csv", "docx"].map(f => (
                        <button
                            key={f}
                            type="button"
                            className="cmdLiv-export__btn"
                            onClick={() => handleExport(f)}
                            disabled={exporting}
                        >
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>
                {exportMsg && <span className="cmdLiv-export__msg">{exportMsg}</span>}
            </div>

            {/* Mobile : cartes */}
            <div className="cmdLiv-list cmdLiv-list--mobile">
                {data?.data?.map(liv => {
                    const badge = getStatutBadge(liv.statut);
                    return (
                        <button
                            key={liv.id}
                            type="button"
                            className="cmdLiv-card cmdLiv-card--history"
                            onClick={() => setSelected(liv)}
                        >
                            <div className="cmdLiv-card__header">
                                <span className="cmdLiv-card__numero">{liv.numero}</span>
                                <span className={`liv-badge liv-badge--${badge.variant}`}>{badge.label}</span>
                            </div>
                            <p className="cmdLiv-card__client">{liv.client} · {liv.livreur}</p>
                            <div className="cmdLiv-card__meta">
                                <span className="cmdLiv-card__montant">{formatMontant(liv.montant)}</span>
                                <span className="cmdLiv-card__date">{formatDate(liv.dateCreation)}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Desktop : tableau */}
            <div className="cmdLiv-list--desktop">
                <table className="cmdLiv-table">
                    <thead>
                        <tr>
                            <th>Numéro</th>
                            <th>Commande</th>
                            <th>Livreur</th>
                            <th>Statut</th>
                            <th>Création</th>
                            <th>Lancement</th>
                            <th>Livraison</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.data?.map(liv => {
                            const badge = getStatutBadge(liv.statut);
                            return (
                                <tr
                                    key={liv.id}
                                    className="cmdLiv-table__row cmdLiv-table__row--clickable"
                                    onClick={() => setSelected(liv)}
                                    tabIndex={0}
                                    onKeyDown={e => e.key === "Enter" && setSelected(liv)}
                                    aria-label={`Détails de ${liv.numero}`}
                                >
                                    <td className="cmdLiv-table__numero">{liv.numero}</td>
                                    <td>{liv.commande}</td>
                                    <td>{liv.livreur}</td>
                                    <td><span className={`liv-badge liv-badge--${badge.variant}`}>{badge.label}</span></td>
                                    <td>{formatDate(liv.dateCreation)}</td>
                                    <td>{formatDate(liv.dateLancement)}</td>
                                    <td>{formatDate(liv.dateLivraison)}</td>
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

function CommandesALivrer() {
    const [tab, setTab] = useState(TABS[0]);

    return (
        <div className="cmdLiv-root">
            <div className="cmdLiv-tabs" role="tablist" aria-label="Onglets commandes">
                {TABS.map(t => (
                    <button
                        key={t}
                        type="button"
                        role="tab"
                        aria-selected={tab === t}
                        className={`cmdLiv-tab${tab === t ? " cmdLiv-tab--active" : ""}`}
                        onClick={() => setTab(t)}
                    >
                        {t === TABS[0] ? <PackageCheck size={16} aria-hidden="true" /> : <Clock size={16} aria-hidden="true" />}
                        <span>{t}</span>
                    </button>
                ))}
            </div>

            <div role="tabpanel" aria-label={tab}>
                {tab === TABS[0] ? <ListeCommandes /> : <HistoriqueLivraisons />}
            </div>
        </div>
    );
}

export default CommandesALivrer;
