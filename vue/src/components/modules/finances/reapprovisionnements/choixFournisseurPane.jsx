import { useState } from "react";

function ChoixFournisseurPane({ onSelectFournisseur, onClose }) {
    const [searchQuery, setSearchQuery] = useState("");

    // Données de test : Liste des grossistes / fournisseurs partenaires
    const fournisseursDisponibles = [
        { id: "FOURN-01", nom: "Papeterie Centrale de l'Est", categorie: "Fournitures de bureau", contact: "contact@papet-est.com" },
        { id: "FOURN-02", nom: "LogiTech Distribution", categorie: "Matériel Informatique", contact: "commercial@logitech-dist.fr" },
        { id: "FOURN-03", nom: "BricoPro Énergie", categorie: "Maintenance & Électricité", contact: "contact@bricopro.org" }
    ];

    const fournisseursFiltres = fournisseursDisponibles.filter(f =>
        f.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.categorie.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <aside>
            <div>
                <button onClick={onClose}>Fermer le volet</button>
                <h3>Sélectionner un fournisseur partenaire</h3>
                
                <section>
                    <label>Rechercher par nom ou catégorie : </label>
                    <input 
                        type="text" 
                        placeholder="Filtrer..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </section>

                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nom de l'entreprise</th>
                            <th>Secteur / Catégorie</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fournisseursFiltres.map((fourn) => (
                            <tr key={fourn.id}>
                                <td>{fourn.id}</td>
                                <td>{fourn.nom}</td>
                                <td>{fourn.categorie}</td>
                                <td>
                                    <button onClick={() => onSelectFournisseur(fourn)}>
                                        Choisir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </aside>
    );
}

export default ChoixFournisseurPane;