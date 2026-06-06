import { useState } from "react";
import { Search, PlusCircle, Trash2, CheckCircle } from "lucide-react";
import ChoixFournisseurPane from "./ChoixFournisseurPane.jsx";

function EnregistrerReapprovisionnement() {
    const [selectedFournisseur, setSelectedFournisseur] = useState(null);
    const [showFournisseurPane, setShowFournisseurPane] = useState(false);
    const [articleNom, setArticleNom]         = useState("");
    const [quantite, setQuantite]             = useState("");
    const [prixUnitaire, setPrixUnitaire]     = useState("");
    const [listeArticles, setListeArticles]   = useState([]);
    const [artError, setArtError]             = useState("");
    const [submitting, setSubmitting]         = useState(false);
    const [success, setSuccess]               = useState(false);
    const [formError, setFormError]           = useState("");

    const formatMontant = (n) =>
        new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF", maximumFractionDigits: 0 }).format(n);

    const totalCommande = listeArticles.reduce((s, a) => s + a.total, 0);

    const handleAddArticle = (e) => {
        e.preventDefault();
        setArtError("");

        if (!articleNom.trim() || !quantite || parseInt(quantite) <= 0 || !prixUnitaire || parseFloat(prixUnitaire) <= 0) {
            setArtError("Remplissez tous les champs avec des valeurs valides.");
            return;
        }

        const qte  = parseInt(quantite, 10);
        const prix = parseFloat(prixUnitaire);

        setListeArticles(prev => [...prev, {
            id: Date.now(),
            nom: articleNom.trim(),
            quantite: qte,
            prixUnitaire: prix,
            total: qte * prix,
        }]);

        setArticleNom("");
        setQuantite("");
        setPrixUnitaire("");
    };

    const handleRemoveArticle = (id) => {
        setListeArticles(prev => prev.filter(a => a.id !== id));
    };

    const handleSubmit = async () => {
        setFormError("");

        if (!selectedFournisseur) { setFormError("Veuillez sélectionner un fournisseur."); return; }
        if (listeArticles.length === 0) { setFormError("Ajoutez au moins un article à la commande."); return; }

        setSubmitting(true);
        await new Promise(r => setTimeout(r, 900));
        setSubmitting(false);
        setSuccess(true);
    };

    if (success) {
        return (
            <div className="finReapp-empty" style={{ padding: "var(--space-16)" }}>
                <CheckCircle size={48} style={{ color: "var(--color-success)" }} aria-hidden="true" />
                <p className="finReapp-empty__title" style={{ color: "var(--color-success)" }}>
                    Commande de réapprovisionnement émise avec succès !
                </p>
                <button
                    className="app-button app-button--ghost app-button--sm"
                    onClick={() => { setSuccess(false); setSelectedFournisseur(null); setListeArticles([]); }}
                    type="button"
                >
                    Nouvelle commande
                </button>
            </div>
        );
    }

    return (
        <>
            <div style={{ maxWidth: "760px", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

                {formError && (
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-error)", background: "rgba(231,76,60,0.07)", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(231,76,60,0.2)", margin: 0 }}>
                        {formError}
                    </p>
                )}

                {/* Fournisseur */}
                <section>
                    <p className="finReapp-detail__section-label">Fournisseur</p>
                    <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                        <input
                            type="text"
                            className="app-input"
                            readOnly
                            placeholder="Cliquer pour sélectionner un fournisseur…"
                            value={selectedFournisseur ? `${selectedFournisseur.nom} — ${selectedFournisseur.categorie}` : ""}
                            style={{ flex: 1, cursor: "pointer" }}
                            onClick={() => setShowFournisseurPane(true)}
                        />
                        <button
                            type="button"
                            className="app-button app-button--ghost app-button--sm"
                            onClick={() => setShowFournisseurPane(true)}
                            style={{ flexShrink: 0 }}
                        >
                            <Search size={16} aria-hidden="true" />
                            Choisir
                        </button>
                    </div>
                    {selectedFournisseur && (
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "var(--space-1) 0 0" }}>
                            Contact : {selectedFournisseur.contact}
                        </p>
                    )}
                </section>

                {/* Ajouter un article */}
                <section>
                    <p className="finReapp-detail__section-label">Ajouter un article</p>
                    {artError && (
                        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-error)", margin: "0 0 var(--space-3)" }}>
                            {artError}
                        </p>
                    )}
                    <form onSubmit={handleAddArticle} className="finReapp-add-form">
                        <div className="finReapp-add-form__field">
                            <label className="finReapp-add-form__label" htmlFor="art-nom">Désignation</label>
                            <input
                                id="art-nom"
                                type="text"
                                className="app-input"
                                value={articleNom}
                                onChange={e => setArticleNom(e.target.value)}
                                placeholder="Ex : Rame de papier A4"
                            />
                        </div>
                        <div className="finReapp-add-form__field" style={{ maxWidth: "120px" }}>
                            <label className="finReapp-add-form__label" htmlFor="art-qte">Quantité</label>
                            <input
                                id="art-qte"
                                type="number"
                                className="app-input"
                                value={quantite}
                                onChange={e => setQuantite(e.target.value)}
                                min="1"
                                placeholder="50"
                            />
                        </div>
                        <div className="finReapp-add-form__field" style={{ maxWidth: "180px" }}>
                            <label className="finReapp-add-form__label" htmlFor="art-prix">Prix unitaire (FCFA)</label>
                            <input
                                id="art-prix"
                                type="number"
                                className="app-input"
                                value={prixUnitaire}
                                onChange={e => setPrixUnitaire(e.target.value)}
                                min="1"
                                step="100"
                                placeholder="3500"
                            />
                        </div>
                        <button type="submit" className="app-button app-button--primary app-button--sm" style={{ alignSelf: "flex-end" }}>
                            <PlusCircle size={16} aria-hidden="true" />
                            Ajouter
                        </button>
                    </form>
                </section>

                {/* Liste articles */}
                <section>
                    <p className="finReapp-detail__section-label">Articles de la commande ({listeArticles.length})</p>
                    <table className="finReapp-articles-table" aria-label="Liste des articles">
                        <thead>
                            <tr>
                                <th scope="col">Désignation</th>
                                <th scope="col">Qté</th>
                                <th scope="col">Prix unit.</th>
                                <th scope="col">Total</th>
                                <th scope="col"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {listeArticles.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                                        Aucun article ajouté.
                                    </td>
                                </tr>
                            ) : (
                                listeArticles.map(a => (
                                    <tr key={a.id}>
                                        <td>{a.nom}</td>
                                        <td style={{ color: "var(--color-text-muted)" }}>{a.quantite}</td>
                                        <td style={{ color: "var(--color-text-muted)" }}>{formatMontant(a.prixUnitaire)}</td>
                                        <td className="finReapp-articles-table__amount">{formatMontant(a.total)}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="app-button app-button--ghost app-button--sm"
                                                style={{ color: "var(--color-error)" }}
                                                onClick={() => handleRemoveArticle(a.id)}
                                                aria-label={`Retirer ${a.nom}`}
                                            >
                                                <Trash2 size={14} aria-hidden="true" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {listeArticles.length > 0 && (
                        <div className="finReapp-total-row">
                            <p className="finReapp-total-label">Total estimé de la commande</p>
                            <p className="finReapp-total-value">{formatMontant(totalCommande)}</p>
                        </div>
                    )}
                </section>

                {/* Soumettre */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        className="app-button app-button--primary"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? "Envoi en cours…" : "Valider et émettre la commande"}
                    </button>
                </div>
            </div>

            {showFournisseurPane && (
                <ChoixFournisseurPane
                    onSelectFournisseur={(f) => { setSelectedFournisseur(f); setShowFournisseurPane(false); }}
                    onClose={() => setShowFournisseurPane(false)}
                />
            )}
        </>
    );
}

export default EnregistrerReapprovisionnement;
