import { useState, useEffect } from "react";
import { Search, X, Check, AlertTriangle } from "lucide-react";
import { fetchCommandesRemboursables } from "../../../../services/financesP3.js";

const fmt = (n) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
    new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));

const SKELETON_COUNT = 4;

function ChoixCommandePane({ onSelectCommande, onClose }) {
    const [recherche, setRecherche] = useState("");
    const [commandes, setCommandes] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [erreur, setErreur]       = useState(null);

    useEffect(() => {
        fetchCommandesRemboursables()
            .then(data => { setCommandes(data); setLoading(false); })
            .catch(() => { setErreur("Impossible de charger les commandes."); setLoading(false); });
    }, []);

    const filtrees = commandes.filter(c =>
        c.client.toLowerCase().includes(recherche.toLowerCase()) ||
        c.id.toLowerCase().includes(recherche.toLowerCase()) ||
        (c.ref ?? "").toLowerCase().includes(recherche.toLowerCase())
    );

    return (
        <>
            <div className="finRemb-drawer__overlay" onClick={onClose} aria-hidden="true" />
            <aside
                className="finRemb-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Sélectionner une commande"
            >
                <div className="finRemb-drawer__handle">
                    <div className="finRemb-drawer__handle-bar" />
                </div>

                <div className="finRemb-drawer__header">
                    <h2 className="finRemb-drawer__title">Choisir une commande</h2>
                    <button
                        className="finRemb-drawer__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finRemb-drawer__body">
                    <div className="finRemb-search">
                        <Search size={16} className="finRemb-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="app-input finRemb-search__input"
                            placeholder="Référence, client…"
                            value={recherche}
                            onChange={e => setRecherche(e.target.value)}
                            aria-label="Rechercher une commande"
                            autoFocus
                        />
                    </div>

                    <p className="finRemb-choix__hint">
                        Commandes ayant reçu un paiement — éligibles au remboursement
                    </p>

                    {loading && (
                        <div className="finRemb-choix__skeleton-list" aria-busy="true" aria-label="Chargement">
                            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                                <div key={i} className="finRemb-choix__skeleton-card">
                                    <span className="finRemb-skeleton finRemb-skeleton--sm" />
                                    <span className="finRemb-skeleton finRemb-skeleton--lg" />
                                    <span className="finRemb-skeleton finRemb-skeleton--md" />
                                </div>
                            ))}
                        </div>
                    )}

                    {erreur && (
                        <div className="finRemb-empty">
                            <div className="finRemb-empty__icon">
                                <AlertTriangle size={24} aria-hidden="true" />
                            </div>
                            <p className="finRemb-empty__title">{erreur}</p>
                        </div>
                    )}

                    {!loading && !erreur && filtrees.length === 0 && (
                        <div className="finRemb-empty">
                            <p className="finRemb-empty__title">Aucune commande éligible</p>
                            <p className="finRemb-empty__desc">Modifiez votre recherche.</p>
                        </div>
                    )}

                    {!loading && !erreur && filtrees.length > 0 && (
                        <div className="finRemb-choix__list">
                            {filtrees.map(cmd => (
                                <article
                                    key={cmd.id}
                                    className="finRemb-choix__card"
                                    onClick={() => onSelectCommande(cmd)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={e => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            onSelectCommande(cmd);
                                        }
                                    }}
                                    aria-label={`Sélectionner la commande ${cmd.id} — ${cmd.client}`}
                                >
                                    <div className="finRemb-choix__card-top">
                                        <div>
                                            <p className="finRemb-choix__card-ref">{cmd.id}</p>
                                            <p className="finRemb-choix__card-client">{cmd.client}</p>
                                        </div>
                                        <span className={`fin-badge fin-badge--${cmd.statut === "Payée" ? "success" : "warning"}`}>
                                            {cmd.statut}
                                        </span>
                                    </div>
                                    <div className="finRemb-choix__card-amounts">
                                        <span>
                                            Total payé :{" "}
                                            <strong style={{ color: "var(--color-text)" }}>{fmt(cmd.totalPaye)}</strong>
                                        </span>
                                        <span>
                                            Remboursable :{" "}
                                            <strong style={{ color: "var(--color-success)" }}>
                                                {fmt(cmd.montantRemboursable)}
                                            </strong>
                                        </span>
                                    </div>
                                    <div className="finRemb-choix__card-footer">
                                        <span className="finRemb-choix__card-date">{fmtDate(cmd.date)}</span>
                                        <span className="finRemb-choix__card-select">
                                            <Check size={14} aria-hidden="true" />
                                            Sélectionner
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}

export default ChoixCommandePane;
