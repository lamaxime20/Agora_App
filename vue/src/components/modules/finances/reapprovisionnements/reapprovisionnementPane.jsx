import { useState } from "react";
import DetailsArticlesReapprovisionnementModal from "./DetailsArticlesReapprovisionnementModal.jsx";

function ReapprovisionnementPane({ reappro, onClose }) {
    const [showArticlesModal, setShowArticlesModal] = useState(false);

    return (
        <aside>
            <div>
                <button onClick={onClose}>Fermer le volet</button>
                <h3>Détails du Réapprovisionnement {reappro.id}</h3>

                <p><strong>Fournisseur émetteur :</strong> {reappro.fournisseur.nom}</p>
                <p><strong>Contact commercial :</strong> {reappro.fournisseur.contact}</p>
                <p><strong>Date d'émission :</strong> {reappro.date}</p>
                <p><strong>Montant facturé :</strong> {reappro.montantTotal.toFixed(2)} €</p>
                <p><strong>Statut actuel :</strong> {reappro.statut}</p>

                <hr />

                <button onClick={() => setShowArticlesModal(true)}>
                    Voir la liste des articles commandés
                </button>

                {showArticlesModal && (
                    <DetailsArticlesReapprovisionnementModal 
                        articles={reappro.articles} 
                        commandeId={reappro.id}
                        onClose={() => setShowArticlesModal(false)} 
                    />
                )}
            </div>
        </aside>
    );
}

export default ReapprovisionnementPane;