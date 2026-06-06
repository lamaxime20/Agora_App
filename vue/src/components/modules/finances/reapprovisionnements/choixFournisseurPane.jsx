import { useState } from "react";
import { Search, X, Check } from "lucide-react";

const FOURNISSEURS = [
    { id: "FOURN-01", nom: "Papeterie Centrale de l'Est",  categorie: "Fournitures de bureau",    contact: "contact@papet-est.com" },
    { id: "FOURN-02", nom: "LogiTech Distribution",        categorie: "Matériel informatique",    contact: "commercial@logitech-dist.com" },
    { id: "FOURN-03", nom: "BricoPro Énergie",             categorie: "Maintenance & Électricité", contact: "contact@bricopro.cm" },
    { id: "FOURN-04", nom: "AfriPack Solutions",           categorie: "Emballages & Logistique",  contact: "info@afripack.cm" },
    { id: "FOURN-05", nom: "TechNord Cameroun",            categorie: "Matériel informatique",    contact: "sales@technord.cm" },
];

function ChoixFournisseurPane({ onSelectFournisseur, onClose }) {
    const [recherche, setRecherche] = useState("");

    const filtres = FOURNISSEURS.filter(f =>
        f.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        f.categorie.toLowerCase().includes(recherche.toLowerCase())
    );

    return (
        <>
            <div
                className="finReapp-drawer__overlay"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className="finReapp-drawer"
                role="complementary"
                aria-label="Sélectionner un fournisseur"
            >
                <div className="finReapp-drawer__handle">
                    <div className="finReapp-drawer__handle-bar" />
                </div>

                <div className="finReapp-drawer__header">
                    <h2 className="finReapp-drawer__title">Choisir un fournisseur</h2>
                    <button
                        className="finReapp-drawer__close"
                        onClick={onClose}
                        aria-label="Fermer"
                        type="button"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="finReapp-drawer__body" style={{ gap: "var(--space-4)" }}>
                    <div style={{ position: "relative" }}>
                        <Search size={16} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} aria-hidden="true" />
                        <input
                            type="search"
                            className="app-input"
                            style={{ paddingLeft: "var(--space-9)" }}
                            placeholder="Rechercher par nom ou catégorie…"
                            value={recherche}
                            onChange={e => setRecherche(e.target.value)}
                            aria-label="Rechercher un fournisseur"
                        />
                    </div>

                    {filtres.length === 0 ? (
                        <div className="finReapp-empty">
                            <p className="finReapp-empty__title">Aucun fournisseur trouvé</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                            {filtres.map(f => (
                                <article
                                    key={f.id}
                                    style={{
                                        background: "var(--color-surface-alt)",
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "var(--radius-xl)",
                                        padding: "var(--space-3) var(--space-4)",
                                        cursor: "pointer",
                                        transition: "border-color 200ms ease-out",
                                    }}
                                    onClick={() => onSelectFournisseur(f)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onSelectFournisseur(f); }}
                                    aria-label={`Sélectionner ${f.nom}`}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-3)" }}>
                                        <div>
                                            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "0 0 var(--space-1)" }}>{f.id}</p>
                                            <p style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text)", margin: "0 0 var(--space-1)" }}>{f.nom}</p>
                                            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                                                {f.categorie} · {f.contact}
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

export default ChoixFournisseurPane;
