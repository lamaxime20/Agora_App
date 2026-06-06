import { useState } from "react";
import { Download, ChevronDown, Repeat } from "lucide-react";
import AbonnementPane from "./AbonnementPane.jsx";
import ReactiverAbonnementPane from "./ReactiverAbonnementPane.jsx";

const MOCK_ARCHIVE = [
    { id: "ABO-01", dateDebut: "2026-01-10", dateFin: null,         montantMensuel: 4900000, nomService: "Hébergement Serveur Cloud",        fournisseur: "AWS" },
    { id: "ABO-02", dateDebut: "2026-04-15", dateFin: null,         montantMensuel: 1499000, nomService: "Outil de Design Collaboratif",    fournisseur: "Figma" },
    { id: "ABO-03", dateDebut: "2024-02-01", dateFin: "2026-03-01", montantMensuel:  990000, nomService: "Banque d'images Premium",         fournisseur: "Shutterstock" },
    { id: "ABO-05", dateDebut: "2023-07-01", dateFin: "2025-12-31", montantMensuel:  320000, nomService: "Logiciel Comptabilité",          fournisseur: "Sage" },
];

function HistoriqueAbonnements() {
    const [selectedAbo, setSelectedAbo]       = useState(null);
    const [aboToReactivate, setAboToReactivate] = useState(null);
    const [filtreStatut, setFiltreStatut]     = useState("tous");
    const [exportOpen, setExportOpen]         = useState(false);

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

    const filtres = MOCK_ARCHIVE.filter(a => {
        if (filtreStatut === "actif")   return !a.dateFin;
        if (filtreStatut === "inactif") return !!a.dateFin;
        return true;
    });

    return (
        <>
            {/* Toolbar */}
            <div className="finAbo-toolbar">
                <div className="finAbo-toolbar__row">
                    <select
                        className="finAbo-filter-select"
                        value={filtreStatut}
                        onChange={e => setFiltreStatut(e.target.value)}
                        aria-label="Filtrer par statut"
                    >
                        <option value="tous">Tous les abonnements</option>
                        <option value="actif">Actifs uniquement</option>
                        <option value="inactif">Résiliés uniquement</option>
                    </select>

                    <div style={{ position: "relative", marginLeft: "auto" }}>
                        <button
                            className="app-button app-button--ghost app-button--sm"
                            onClick={() => setExportOpen(!exportOpen)}
                            type="button"
                            aria-expanded={exportOpen}
                        >
                            <Download size={16} aria-hidden="true" />
                            Exporter
                            <ChevronDown size={14} aria-hidden="true" />
                        </button>
                        {exportOpen && (
                            <div className="finCommandes-export-menu" role="menu">
                                {[".csv", ".pdf", ".docx"].map(fmt => (
                                    <button
                                        key={fmt}
                                        className="finCommandes-export-menu__item"
                                        onClick={() => setExportOpen(false)}
                                        role="menuitem"
                                        type="button"
                                    >
                                        {fmt.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tableau desktop */}
            <div className="finAbo-tableWrap">
                <table className="finAbo-table" aria-label="Historique des abonnements">
                    <thead className="finAbo-table__head">
                        <tr>
                            <th scope="col">Réf.</th>
                            <th scope="col">Service</th>
                            <th scope="col">Fournisseur</th>
                            <th scope="col">Début</th>
                            <th scope="col">Fin</th>
                            <th scope="col">Montant / mois</th>
                            <th scope="col">Statut</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtres.length === 0 ? (
                            <tr>
                                <td colSpan={8}>
                                    <div className="finAbo-empty">
                                        <div className="finAbo-empty__icon"><Repeat size={32} aria-hidden="true" /></div>
                                        <p className="finAbo-empty__title">Aucun abonnement trouvé</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtres.map(abo => (
                                <tr key={abo.id} className="finAbo-table__row" onClick={() => setSelectedAbo(abo)}>
                                    <td className="finAbo-table__id">{abo.id}</td>
                                    <td className="finAbo-table__name">{abo.nomService}</td>
                                    <td style={{ fontSize: "var(--text-sm)" }}>{abo.fournisseur}</td>
                                    <td className="finAbo-table__date">{formatDate(abo.dateDebut)}</td>
                                    <td className="finAbo-table__date">{abo.dateFin ? formatDate(abo.dateFin) : "—"}</td>
                                    <td className="finAbo-table__amount">{formatMontant(abo.montantMensuel)}</td>
                                    <td>
                                        <span className={`fin-badge ${abo.dateFin ? "fin-badge--neutral" : "fin-badge--success"}`}>
                                            {abo.dateFin ? "Résilié" : "Actif"}
                                        </span>
                                    </td>
                                    <td>
                                        {abo.dateFin && (
                                            <button
                                                className="app-button app-button--ghost app-button--sm"
                                                onClick={e => { e.stopPropagation(); setAboToReactivate(abo); }}
                                                type="button"
                                            >
                                                Réactiver
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cartes mobile */}
            <div className="finAbo-cards">
                {filtres.map(abo => (
                    <article key={abo.id} className="finAbo-card" onClick={() => setSelectedAbo(abo)}>
                        <div className="finAbo-card__top">
                            <span className="finAbo-card__id">{abo.id}</span>
                            <span className={`fin-badge ${abo.dateFin ? "fin-badge--neutral" : "fin-badge--success"}`}>
                                {abo.dateFin ? "Résilié" : "Actif"}
                            </span>
                        </div>
                        <p className="finAbo-card__name">{abo.nomService}</p>
                        <div className="finAbo-card__meta">
                            <span className="finAbo-card__amount">{formatMontant(abo.montantMensuel)}/mois</span>
                            <span className="finAbo-card__date">{formatDate(abo.dateDebut)}</span>
                        </div>
                    </article>
                ))}
            </div>

            {selectedAbo && (
                <AbonnementPane abonnement={selectedAbo} onClose={() => setSelectedAbo(null)} />
            )}

            {aboToReactivate && (
                <ReactiverAbonnementPane
                    abonnement={aboToReactivate}
                    onClose={() => setAboToReactivate(null)}
                />
            )}
        </>
    );
}

export default HistoriqueAbonnements;
