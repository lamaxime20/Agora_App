import { useState } from "react";
import { PlusCircle, Repeat, ScissorsLineDashed } from "lucide-react";
import AbonnementPane from "./AbonnementPane.jsx";
import FormNouvelAbonnement from "./FormNouvelAbonnement.jsx";
import CouperAbonnementPane from "./CouperAbonnementPane.jsx";

const MOCK_ACTIFS = [
    { id: "ABO-01", dateDebut: "2026-01-10", montantMensuel: 4900000, nomService: "Hébergement Serveur Cloud",        fournisseur: "AWS",      dateFin: null },
    { id: "ABO-02", dateDebut: "2026-04-15", montantMensuel: 1499000, nomService: "Outil de Design Collaboratif",    fournisseur: "Figma",    dateFin: null },
    { id: "ABO-03", dateDebut: "2026-03-01", montantMensuel:  590000, nomService: "Suite Bureautique Cloud",         fournisseur: "Google",   dateFin: null },
    { id: "ABO-04", dateDebut: "2026-05-20", montantMensuel:  250000, nomService: "Antivirus & Sécurité Réseau",     fournisseur: "Kaspersky",dateFin: null },
];

function AbonnementsEnCours() {
    const [abonnements, setAbonnements]     = useState(MOCK_ACTIFS);
    const [selectedAbo, setSelectedAbo]     = useState(null);
    const [showAddModal, setShowAddModal]   = useState(false);
    const [aboToCut, setAboToCut]           = useState(null);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

    const totalMensuel = abonnements.reduce((s, a) => s + a.montantMensuel, 0);

    const handleCouper = (abo) => {
        setAbonnements(prev => prev.filter(a => a.id !== abo.id));
        setAboToCut(null);
    };

    return (
        <>
            {/* KPI */}
            <div className="finAbo-kpis" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: "var(--space-4)" }}>
                <div className="finAbo-kpi">
                    <p className="finAbo-kpi__label">Actifs</p>
                    <p className="finAbo-kpi__value">{abonnements.length}</p>
                </div>
                <div className="finAbo-kpi">
                    <p className="finAbo-kpi__label">Charge mensuelle</p>
                    <p className="finAbo-kpi__value finAbo-kpi__value--error">{formatMontant(totalMensuel)}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="finAbo-toolbar">
                <div className="finAbo-toolbar__row" style={{ justifyContent: "flex-end" }}>
                    <button
                        className="app-button app-button--primary app-button--sm"
                        onClick={() => setShowAddModal(true)}
                        type="button"
                    >
                        <PlusCircle size={16} aria-hidden="true" />
                        Nouvel abonnement
                    </button>
                </div>
            </div>

            {/* Tableau desktop */}
            <div className="finAbo-tableWrap">
                <table className="finAbo-table" aria-label="Abonnements en cours">
                    <thead className="finAbo-table__head">
                        <tr>
                            <th scope="col">Réf.</th>
                            <th scope="col">Service</th>
                            <th scope="col">Fournisseur</th>
                            <th scope="col">Depuis</th>
                            <th scope="col">Montant / mois</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {abonnements.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="finAbo-empty">
                                        <div className="finAbo-empty__icon">
                                            <Repeat size={32} aria-hidden="true" />
                                        </div>
                                        <p className="finAbo-empty__title">Aucun abonnement actif</p>
                                        <p className="finAbo-empty__desc">Ajoutez votre premier abonnement.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            abonnements.map(abo => (
                                <tr key={abo.id} className="finAbo-table__row" onClick={() => setSelectedAbo(abo)}>
                                    <td className="finAbo-table__id">{abo.id}</td>
                                    <td className="finAbo-table__name">{abo.nomService}</td>
                                    <td style={{ fontSize: "var(--text-sm)" }}>{abo.fournisseur}</td>
                                    <td className="finAbo-table__date">{formatDate(abo.dateDebut)}</td>
                                    <td className="finAbo-table__amount">{formatMontant(abo.montantMensuel)}</td>
                                    <td>
                                        <button
                                            className="app-button app-button--ghost app-button--sm"
                                            style={{ color: "var(--color-error)" }}
                                            onClick={e => { e.stopPropagation(); setAboToCut(abo); }}
                                            type="button"
                                            aria-label={`Résilier ${abo.nomService}`}
                                        >
                                            <ScissorsLineDashed size={14} aria-hidden="true" />
                                            Résilier
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cartes mobile */}
            <div className="finAbo-cards">
                {abonnements.length === 0 ? (
                    <div className="finAbo-empty">
                        <div className="finAbo-empty__icon"><Repeat size={32} aria-hidden="true" /></div>
                        <p className="finAbo-empty__title">Aucun abonnement actif</p>
                    </div>
                ) : (
                    abonnements.map(abo => (
                        <article key={abo.id} className="finAbo-card" onClick={() => setSelectedAbo(abo)}>
                            <div className="finAbo-card__top">
                                <span className="finAbo-card__id">{abo.id}</span>
                                <span className="fin-badge fin-badge--success">Actif</span>
                            </div>
                            <p className="finAbo-card__name">{abo.nomService}</p>
                            <div className="finAbo-card__meta">
                                <span className="finAbo-card__amount">{formatMontant(abo.montantMensuel)}/mois</span>
                                <span className="finAbo-card__date">Depuis {formatDate(abo.dateDebut)}</span>
                            </div>
                        </article>
                    ))
                )}
            </div>

            {selectedAbo && (
                <AbonnementPane abonnement={selectedAbo} onClose={() => setSelectedAbo(null)} />
            )}

            {showAddModal && (
                <FormNouvelAbonnement onClose={() => setShowAddModal(false)} />
            )}

            {aboToCut && (
                <CouperAbonnementPane
                    abonnement={aboToCut}
                    onConfirm={handleCouper}
                    onClose={() => setAboToCut(null)}
                />
            )}
        </>
    );
}

export default AbonnementsEnCours;
