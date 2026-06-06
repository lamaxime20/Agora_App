import { useState } from "react";
import ChoixFournisseurPane from "./ChoixFournisseurPane.jsx";

function EnregistrerReapprovisionnement() {
    const [selectedFournisseur, setSelectedFournisseur] = useState(null);
    const [showFournisseurPane, setShowFournisseurPane] = useState(false);
    
    // États pour l'ajout dynamique d'articles dans la commande
    const [articleNom, setArticleNom] = useState("");
    const [quantite, setQuantite] = useState("");
    const [prixUnitaire, setPrixUnitaire] = useState("");
    const [listeArticles, setListeArticles] = useState([]);

    const handleSelectFournisseur = (fournisseur) => {
        setSelectedFournisseur(fournisseur);
        setShowFournisseurPane(false);
    };

    const handleAddArticle = (e) => {
        e.preventDefault();
        if (!articleNom.trim() || !quantite || quantite <= 0 || !prixUnitaire || prixUnitaire <= 0) {
            alert("Veuillez saisir des informations d'article valides.");
            return;
        }

        const nouvelArticle = {
            id: Date.now(),
            nom: articleNom,
            quantite: parseInt(quantite, 10),
            prixUnitaire: parseFloat(prixUnitaire),
            total: parseInt(quantite, 10) * parseFloat(prixUnitaire)
        };

        setListeArticles([...listeArticles, nouvelArticle]);
        setArticleNom("");
        setQuantite("");
        setPrixUnitaire("");
    };

    const handleRemoveArticle = (id) => {
        setListeArticles(listeArticles.filter(art => art.id !== id));
    };

    const calculerMontantTotal = () => {
        return listeArticles.reduce((sum, art) => sum + art.total, 0);
    };

    const handleSubmitCommande = () => {
        if (!selectedFournisseur) {
            alert("Veuillez sélectionner un fournisseur.");
            return;
        }

        if (listeArticles.length === 0) {
            alert("Votre liste de réapprovisionnement est vide. Ajoutez au moins un article.");
            return;
        }

        const total = calculerMontantTotal();
        const confirmation = window.confirm(
            `Confirmez-vous l'envoi de cette commande de réapprovisionnement ?\n\nFournisseur : ${selectedFournisseur.nom}\nNombre d'articles : ${listeArticles.length}\nMontant total estimé : ${total.toFixed(2)} €`
        );

        if (confirmation) {
            alert("La commande de réapprovisionnement a été enregistrée et envoyée au fournisseur.");
            // Réinitialisation globale
            setSelectedFournisseur(null);
            setListeArticles([]);
        }
    };

    return (
        <div>
            <h2>Nouvelle commande fournisseur</h2>

            <section>
                <div>
                    <label>Fournisseur ciblé : </label>
                    <input 
                        type="text" 
                        readOnly 
                        placeholder="Cliquez pour choisir un fournisseur..." 
                        value={selectedFournisseur ? selectedFournisseur.nom : ""} 
                    />
                    <button type="button" onClick={() => setShowFournisseurPane(true)}>
                        Sélectionner le fournisseur
                    </button>
                </div>
            </section>

            {/* Formulaire interne pour concevoir le bon de commande d'articles */}
            <form onSubmit={handleAddArticle}>
                <h4>Ajouter un article au bon de commande</h4>
                <div>
                    <label>Nom du produit : </label>
                    <input type="text" value={articleNom} onChange={(e) => setArticleNom(e.target.value)} placeholder="Ex: Rame de papier" />
                    
                    <label> Quantité : </label>
                    <input type="number" value={quantite} onChange={(e) => setQuantite(e.target.value)} placeholder="Ex: 50" />
                    
                    <label> Prix d'achat unitaire (€) : </label>
                    <input type="number" step="0.01" value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} placeholder="Ex: 3.50" />
                    
                    <button type="submit">Ajouter à la liste</button>
                </div>
            </form>

            <h4>Articles inclus dans la demande actuelle</h4>
            <table>
                <thead>
                    <tr>
                        <th>Désignation</th>
                        <th>Quantité</th>
                        <th>Prix Unitaire HT</th>
                        <th>Total</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {listeArticles.map((art) => (
                        <tr key={art.id}>
                            <td>{art.nom}</td>
                            <td>{art.quantite}</td>
                            <td>{art.prixUnitaire.toFixed(2)} €</td>
                            <td>{art.total.toFixed(2)} €</td>
                            <td>
                                <button type="button" onClick={() => handleRemoveArticle(art.id)}>Retirer</button>
                            </td>
                        </tr>
                    ))}
                    {listeArticles.length === 0 && (
                        <tr>
                            <td colSpan="5">Aucun article ajouté pour le moment.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {listeArticles.length > 0 && (
                <div>
                    <h3>Montant total de la commande : {calculerMontantTotal().toFixed(2)} €</h3>
                    <button type="button" onClick={handleSubmitCommande}>
                        Valider et émettre le réapprovisionnement
                    </button>
                </div>
            )}

            {showFournisseurPane && (
                <ChoixFournisseurPane 
                    onSelectFournisseur={handleSelectFournisseur} 
                    onClose={() => setShowFournisseurPane(false)} 
                />
            )}
        </div>
    );
}

export default EnregistrerReapprovisionnement;