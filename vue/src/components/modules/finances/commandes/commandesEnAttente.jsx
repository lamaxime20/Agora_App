import { useState } from "react";
import { Search, Edit2, Receipt, AlertCircle } from "lucide-react";
import CommandePane from "./CommandePane.jsx";

const MOCK_COMMANDES = [
    { id: "CMD-FIN-001", nom: "Commande Alpha — Dupond Jean",    total: 1500,  minimumValidation: 1500,  paye: 500,  statut: "partiellement payé" },
    { id: "CMD-FIN-002", nom: "Commande Beta — Martin Sophie",   total: 800,   minimumValidation: 800,   paye: 0,    statut: "en attente de paiement" },
    { id: "CMD-FIN-003", nom: "Commande Gamma — Ngo Essomba",    total: 3200,  minimumValidation: 2000,  paye: 1200, statut: "partiellement payé" },
    { id: "CMD-FIN-004", nom: "Commande Delta — Mvondo Paul",    total: 950,   minimumValidation: 950,   paye: 0,    statut: "en attente de paiement" },
    { id: "CMD-FIN-005", nom: "Commande Epsilon — Biyong Crist.",total: 5800,  minimumValidation: 5000,  paye: 5000, statut: "partiellement payé" },
];

function CommandesEnAttente() {
    const [selectedCommande, setSelectedCommande]   = useState(null);
    const [commandes, setCommandes]                 = useState(MOCK_COMMANDES);
    const [recherche, setRecherche]                 = useState("");
    const [seuilModal, setSeuilModal]               = useState(null);
    const [nouveauSeuil, setNouveauSeuil]           = useState("");

    const commandesFiltrees = commandes.filter(cmd =>
        cmd.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        cmd.id.toLowerCase().includes(recherche.toLowerCase())
    );

    const ouvrirSeuilModal = (e, cmd) => {
        e.stopPropagation();
        setSeuilModal(cmd);
        setNouveauSeuil(String(cmd.minimumValidation));
    };

    const confirmerSeuil = () => {
        const val = parseFloat(nouveauSeuil);
        if (!isNaN(val) && val > 0) {
            setCommandes(commandes.map(c =>
                c.id === seuilModal.id ? { ...c, minimumValidation: val } : c
            ));
        }
        setSeuilModal(null);
    };

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const getPourcentage = (paye, total) => Math.min(100, Math.round((paye / total) * 100));

    const SKELETONS = [1, 2, 3, 4, 5];

    return (
        <>
            {/* Barre recherche */}
            <div className="finCommandes-toolbar">
                <div className="finCommandes-toolbar__row">
                    <div className="finCommandes-search">
                        <Search size={16} className="finCommandes-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="app-input finCommandes-search__input"
                            placeholder="Rechercher par référence ou client…"
                            value={recherche}
                            onChange={e => setRecherche(e.target.value)}
                            aria-label="Rechercher une commande"
                        />
                    </div>
                </div>
            </div>

            {/* Tableau desktop */}
            <div className="finCommandes-tableWrap">
                <table className="finCommandes-table" aria-label="Commandes en attente de paiement">
                    <thead className="finCommandes-table__head">
                        <tr>
                            <th scope="col">Référence</th>
                            <th scope="col">Client / Libellé</th>
                            <th scope="col">Montant total</th>
                            <th scope="col">Seuil validation</th>
                            <th scope="col">Avancement</th>
                            <th scope="col">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {commandesFiltrees.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="finCommandes-empty">
                                        <div className="finCommandes-empty__icon">
                                            <Receipt size={32} aria-hidden="true" />
                                        </div>
                                        <p className="finCommandes-empty__title">Aucune commande en attente</p>
                                        <p className="finCommandes-empty__desc">Toutes les commandes ont été réglées.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            commandesFiltrees.map(cmd => {
                                const pct = getPourcentage(cmd.paye, cmd.total);
                                return (
                                    <tr
                                        key={cmd.id}
                                        className="finCommandes-table__row"
                                        onClick={() => setSelectedCommande(cmd)}
                                    >
                                        <td className="finCommandes-table__id">{cmd.id}</td>
                                        <td className="finCommandes-table__name">{cmd.nom}</td>
                                        <td className="finCommandes-table__amount">{formatMontant(cmd.total)}</td>
                                        <td>
                                            <button
                                                className="finCommandes-table__seuil-btn"
                                                onClick={e => ouvrirSeuilModal(e, cmd)}
                                                title="Modifier le seuil de validation"
                                                type="button"
                                                aria-label={`Modifier le seuil de validation de ${cmd.nom}`}
                                            >
                                                <Edit2 size={12} aria-hidden="true" />
                                                {formatMontant(cmd.minimumValidation)}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="finCommandes-progress">
                                                <div className="finCommandes-progress__bar">
                                                    <div
                                                        className={`finCommandes-progress__fill${pct >= 100 ? " finCommandes-progress__fill--complete" : ""}`}
                                                        style={{ width: `${pct}%` }}
                                                        role="progressbar"
                                                        aria-valuenow={pct}
                                                        aria-valuemin={0}
                                                        aria-valuemax={100}
                                                    />
                                                </div>
                                                <span className="finCommandes-progress__text">{formatMontant(cmd.paye)} / {formatMontant(cmd.total)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`fin-badge ${cmd.statut === "partiellement payé" ? "fin-badge--warning" : "fin-badge--neutral"}`}>
                                                {cmd.statut}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cartes mobile */}
            <div className="finCommandes-cards">
                {commandesFiltrees.length === 0 ? (
                    <div className="finCommandes-empty">
                        <div className="finCommandes-empty__icon">
                            <Receipt size={32} aria-hidden="true" />
                        </div>
                        <p className="finCommandes-empty__title">Aucune commande en attente</p>
                    </div>
                ) : (
                    commandesFiltrees.map(cmd => {
                        const pct = getPourcentage(cmd.paye, cmd.total);
                        return (
                            <article
                                key={cmd.id}
                                className="finCommandes-card"
                                onClick={() => setSelectedCommande(cmd)}
                            >
                                <div className="finCommandes-card__top">
                                    <span className="finCommandes-card__id">{cmd.id}</span>
                                    <span className={`fin-badge ${cmd.statut === "partiellement payé" ? "fin-badge--warning" : "fin-badge--neutral"}`}>
                                        {cmd.statut}
                                    </span>
                                </div>
                                <p className="finCommandes-card__name">{cmd.nom}</p>
                                <div className="finCommandes-progress">
                                    <div className="finCommandes-progress__bar">
                                        <div
                                            className={`finCommandes-progress__fill${pct >= 100 ? " finCommandes-progress__fill--complete" : ""}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="finCommandes-progress__text">{formatMontant(cmd.paye)} / {formatMontant(cmd.total)}</span>
                                </div>
                                <div className="finCommandes-card__footer">
                                    <span className="finCommandes-card__amount">{formatMontant(cmd.total)}</span>
                                    <button
                                        className="finCommandes-table__seuil-btn"
                                        onClick={e => ouvrirSeuilModal(e, cmd)}
                                        type="button"
                                    >
                                        <Edit2 size={12} aria-hidden="true" />
                                        Seuil : {formatMontant(cmd.minimumValidation)}
                                    </button>
                                </div>
                            </article>
                        );
                    })
                )}
            </div>

            {/* Drawer détail commande */}
            {selectedCommande && (
                <CommandePane
                    commande={selectedCommande}
                    onClose={() => setSelectedCommande(null)}
                />
            )}

            {/* Modal modification seuil */}
            {seuilModal && (
                <div className="finCommandes-seuil-modal__overlay" role="dialog" aria-modal="true" aria-labelledby="seuil-modal-title">
                    <div className="finCommandes-seuil-modal__panel">
                        <div className="finCommandes-seuil-modal__header">
                            <h2 className="finCommandes-seuil-modal__title" id="seuil-modal-title">
                                Modifier le seuil de validation
                            </h2>
                            <button
                                className="finCommandes-drawer__close"
                                onClick={() => setSeuilModal(null)}
                                type="button"
                                aria-label="Fermer"
                            >
                                <AlertCircle size={18} aria-hidden="true" />
                            </button>
                        </div>
                        <div className="finCommandes-seuil-modal__body">
                            <div className="finCommandes-form__field">
                                <label className="finCommandes-form__label" htmlFor="nouveau-seuil">
                                    Nouveau seuil (FCFA)
                                </label>
                                <input
                                    id="nouveau-seuil"
                                    type="number"
                                    className="app-input"
                                    value={nouveauSeuil}
                                    onChange={e => setNouveauSeuil(e.target.value)}
                                    min="1"
                                    step="100"
                                />
                            </div>
                        </div>
                        <div className="finCommandes-seuil-modal__footer">
                            <button
                                className="app-button app-button--ghost"
                                onClick={() => setSeuilModal(null)}
                                type="button"
                            >
                                Annuler
                            </button>
                            <button
                                className="app-button app-button--primary"
                                onClick={confirmerSeuil}
                                type="button"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CommandesEnAttente;
