import { useState } from "react";
import { Search, ChevronDown, Download, Receipt } from "lucide-react";
import PaiementPane from "./PaiementPane.jsx";

const MOCK_PAIEMENTS = [
    { id: "P-101", date: "2026-06-02", montant: 1500,  mode: "virement bancaire", reference: "VIR-77312", utilisateur: "Alice Caisse",    commandeAssociee: { id: "CMD-889", nom: "Commande Client Dupond", total: 1500 } },
    { id: "P-102", date: "2026-06-05", montant: 450,   mode: "espèces",           reference: "",          utilisateur: "Jean Comptable",  commandeAssociee: { id: "CMD-990", nom: "Commande Client Martin", total: 900 } },
    { id: "P-103", date: "2026-06-08", montant: 3200,  mode: "carte bancaire",    reference: "CB-55841",  utilisateur: "Marie Finance",   commandeAssociee: { id: "CMD-991", nom: "Commande Ngo Essomba", total: 3200 } },
    { id: "P-104", date: "2026-06-10", montant: 800,   mode: "chèque",            reference: "CHQ-0122",  utilisateur: "Paul Trésorerie", commandeAssociee: { id: "CMD-992", nom: "Commande Mvondo Paul", total: 800 } },
    { id: "P-105", date: "2026-06-12", montant: 5000,  mode: "virement bancaire", reference: "VIR-99001", utilisateur: "Alice Caisse",    commandeAssociee: { id: "CMD-993", nom: "Commande Biyong Crist.", total: 5800 } },
];

const MODES = ["", "carte bancaire", "virement bancaire", "espèces", "chèque"];

function HistoriquePaiements() {
    const [selectedPaiement, setSelectedPaiement] = useState(null);
    const [filtreDate, setFiltreDate]             = useState("");
    const [filtreMode, setFiltreMode]             = useState("");
    const [recherche, setRecherche]               = useState("");
    const [exportOpen, setExportOpen]             = useState(false);

    const paiementsFiltres = MOCK_PAIEMENTS.filter(p => {
        const matchDate = filtreDate ? p.date === filtreDate : true;
        const matchMode = filtreMode ? p.mode === filtreMode : true;
        const matchSearch = recherche
            ? p.id.toLowerCase().includes(recherche.toLowerCase()) ||
              p.utilisateur.toLowerCase().includes(recherche.toLowerCase()) ||
              p.commandeAssociee.nom.toLowerCase().includes(recherche.toLowerCase())
            : true;
        return matchDate && matchMode && matchSearch;
    });

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const formatDate = (d) =>
        new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

    return (
        <>
            {/* Barre d'outils */}
            <div className="finCommandes-toolbar">
                <div className="finCommandes-toolbar__row">
                    <div className="finCommandes-search">
                        <Search size={16} className="finCommandes-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="app-input finCommandes-search__input"
                            placeholder="Rechercher par référence, client…"
                            value={recherche}
                            onChange={e => setRecherche(e.target.value)}
                            aria-label="Rechercher un paiement"
                        />
                    </div>

                    <input
                        type="date"
                        className="finCommandes-filter-select"
                        value={filtreDate}
                        onChange={e => setFiltreDate(e.target.value)}
                        aria-label="Filtrer par date"
                    />

                    <select
                        className="finCommandes-filter-select"
                        value={filtreMode}
                        onChange={e => setFiltreMode(e.target.value)}
                        aria-label="Filtrer par mode de paiement"
                    >
                        <option value="">Tous les modes</option>
                        {MODES.filter(Boolean).map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                    <div className="finCommandes-export-wrap">
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
                                        onClick={() => { alert(`Export ${fmt} en cours…`); setExportOpen(false); }}
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
            <div className="finCommandes-tableWrap">
                <table className="finCommandes-table" aria-label="Historique des paiements">
                    <thead className="finCommandes-table__head">
                        <tr>
                            <th scope="col">Référence</th>
                            <th scope="col">Date</th>
                            <th scope="col">Montant</th>
                            <th scope="col">Mode</th>
                            <th scope="col">Transaction</th>
                            <th scope="col">Enregistré par</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paiementsFiltres.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="finCommandes-empty">
                                        <div className="finCommandes-empty__icon">
                                            <Receipt size={32} aria-hidden="true" />
                                        </div>
                                        <p className="finCommandes-empty__title">Aucun paiement trouvé</p>
                                        <p className="finCommandes-empty__desc">Modifiez les filtres pour afficher des résultats.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paiementsFiltres.map(p => (
                                <tr
                                    key={p.id}
                                    className="finCommandes-table__row"
                                    onClick={() => setSelectedPaiement(p)}
                                >
                                    <td className="finCommandes-table__id">{p.id}</td>
                                    <td className="finCommandes-table__date">{formatDate(p.date)}</td>
                                    <td className="finCommandes-table__amount">{formatMontant(p.montant)}</td>
                                    <td>
                                        <span className="fin-badge fin-badge--info">{p.mode}</span>
                                    </td>
                                    <td className="finCommandes-table__id">{p.reference || "—"}</td>
                                    <td className="finCommandes-table__name">{p.utilisateur}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cartes mobile */}
            <div className="finCommandes-cards">
                {paiementsFiltres.map(p => (
                    <article
                        key={p.id}
                        className="finCommandes-card"
                        onClick={() => setSelectedPaiement(p)}
                    >
                        <div className="finCommandes-card__top">
                            <span className="finCommandes-card__id">{p.id}</span>
                            <span className="fin-badge fin-badge--info">{p.mode}</span>
                        </div>
                        <p className="finCommandes-card__name">{p.commandeAssociee.nom}</p>
                        <div className="finCommandes-card__meta">
                            <span className="finCommandes-card__amount">{formatMontant(p.montant)}</span>
                            <span className="finCommandes-card__date">{formatDate(p.date)}</span>
                        </div>
                        <div className="finCommandes-card__footer">
                            <span className="finCommandes-card__id">{p.utilisateur}</span>
                        </div>
                    </article>
                ))}
            </div>

            {selectedPaiement && (
                <PaiementPane
                    paiement={selectedPaiement}
                    onClose={() => setSelectedPaiement(null)}
                />
            )}
        </>
    );
}

export default HistoriquePaiements;
