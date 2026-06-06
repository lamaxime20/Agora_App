import { useState } from "react";
import { Search, X, Check } from "lucide-react";

const COMMANDES_ELIGIBLES = [
    { id: "CMD-201", nom: "Commande Durand Jean — réf. 2026-201",   totalPaye: 1200000, statutLivraison: "Non livrée" },
    { id: "CMD-202", nom: "Commande Moreau Sophie — réf. 2026-202",  totalPaye:  450000, statutLivraison: "En préparation" },
    { id: "CMD-203", nom: "Commande Lefevre Paul — réf. 2026-203",   totalPaye:  900000, statutLivraison: "Non livrée" },
    { id: "CMD-204", nom: "Commande Ngo Essomba — réf. 2026-204",   totalPaye: 3200000, statutLivraison: "En transit" },
    { id: "CMD-205", nom: "Commande Mvondo Crist. — réf. 2026-205", totalPaye:  680000, statutLivraison: "Non livrée" },
];

function ChoixCommandePane({ onSelectCommande, onClose }) {
    const [recherche, setRecherche] = useState("");

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const filtrees = COMMANDES_ELIGIBLES.filter(c =>
        c.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        c.id.toLowerCase().includes(recherche.toLowerCase())
    );

    return (
        <>
            <div
                className="finRemb-drawer__overlay"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="finRemb-drawer"
                role="complementary"
                aria-label="Sélectionner une commande"
            >
                <div className="finRemb-drawer__handle">
                    <div className="finRemb-drawer__handle-bar" />
                </div>

                <div className="finRemb-drawer__header">
                    <h2 className="finRemb-drawer__title">Sélectionner une commande</h2>
                    <button
                        className="finRemb-drawer__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finRemb-drawer__body" style={{ gap: "var(--space-4)" }}>
                    <div className="finRemb-search">
                        <Search size={16} className="finRemb-search__icon" aria-hidden="true" />
                        <input
                            type="search"
                            className="app-input finRemb-search__input"
                            placeholder="Rechercher par référence ou client…"
                            value={recherche}
                            onChange={e => setRecherche(e.target.value)}
                            aria-label="Rechercher une commande"
                        />
                    </div>

                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                        Commandes éligibles — ayant reçu un paiement et non encore livrées
                    </p>

                    {filtrees.length === 0 ? (
                        <div className="finRemb-empty">
                            <p className="finRemb-empty__title">Aucune commande éligible</p>
                            <p className="finRemb-empty__desc">Modifiez votre recherche.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                            {filtrees.map(cmd => (
                                <article
                                    key={cmd.id}
                                    style={{
                                        background: "var(--color-surface-alt)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "var(--radius-xl)",
                                        padding: "var(--space-3) var(--space-4)",
                                        cursor: "pointer",
                                        transition: "border-color 200ms ease-out, box-shadow 200ms ease-out",
                                    }}
                                    onClick={() => onSelectCommande(cmd)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onSelectCommande(cmd); }}
                                    aria-label={`Sélectionner ${cmd.nom}`}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-3)" }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "0 0 var(--space-1)" }}>{cmd.id}</p>
                                            <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text)", margin: "0 0 var(--space-1)" }}>{cmd.nom}</p>
                                            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                                                Payé : <strong style={{ color: "var(--color-success)" }}>{formatMontant(cmd.totalPaye)}</strong>
                                                &nbsp;·&nbsp;{cmd.statutLivraison}
                                            </p>
                                        </div>
                                        <Check size={16} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: "var(--space-1)" }} aria-hidden="true" />
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
