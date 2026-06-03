import { useState } from 'react';
import PaneDetailsReapprovisionnement from './PaneDetailsReapprovisionnement';
import ModalAnnulerReapprovisionnement from './ModalAnnulerReapprovisionnement';
import ModalConfirmerReapprovisionnement from './ModalConfirmerReapprovisionnement';

function HistoriqueReapprovisionnement() {
    const [reapproSelectionne, setReapproSelectionne] = useState(null);
    const [itemAAnnuler, setItemAAnnuler] = useState(null);
    const [itemAConfirmer, setItemAConfirmer] = useState(null);

    // Liste complète incluant tous les statuts (terminés, annulés, en cours, etc.)
    const historiqueGeneral = [
        { id: 1, date: '2023-11-01', produit: 'Produit A', quantite: 50, statut: 'en attente', cout: '500€', demandeur: 'Jean Dupont' },
        { id: 2, date: '2023-11-02', produit: 'Produit B', quantite: 100, statut: 'en cours', cout: '1200€', demandeur: 'Marie Claire' },
        { id: 3, date: '2023-10-25', produit: 'Produit C', quantite: 20, statut: 'validé', cout: '200€', demandeur: 'Jean Dupont' },
        { id: 4, date: '2023-10-20', produit: 'Produit A', quantite: 10, statut: 'annulé', cout: '100€', demandeur: 'Pierre Martin', raisonAnnulation: 'Erreur de saisie de quantité' }
    ];

    return (
        <div>
            <header>
                <fieldset>
                    <legend>Filtres de l'historique</legend>
                    <input type="date" aria-label="Période début" />
                    <input type="date" aria-label="Période fin" />
                    <input type="search" placeholder="Rechercher un réapprovisionnement..." />
                    
                    <select aria-label="Sélection du type de produit">
                        <option value="">Tous les types</option>
                        <option value="physique">Physique</option>
                        <option value="service">Service</option>
                    </select>

                    <select aria-label="Sélection de la catégorie">
                        <option value="">Toutes les catégories</option>
                    </select>
                </fieldset>

                <div>
                    <span>Générer le rapport : </span>
                    <button>Fichier .pdf</button>
                    <button>Fichier .csv</button>
                    <button>Fichier .docx</button>
                </div>
            </header>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Produit</th>
                        <th>Quantité</th>
                        <th>Statut</th>
                        <th>Actions associées</th>
                    </tr>
                </thead>
                <tbody>
                    {historiqueGeneral.map((reappro) => (
                        <tr key={reappro.id}>
                            <td onClick={() => setReapproSelectionne(reappro)}>{reappro.date}</td>
                            <td onClick={() => setReapproSelectionne(reappro)}>{reappro.produit}</td>
                            <td onClick={() => setReapproSelectionne(reappro)}>{reappro.quantite}</td>
                            <td onClick={() => setReapproSelectionne(reappro)}>{reappro.statut}</td>
                            <td>
                                {(reappro.statut === 'en attente' || reappro.statut === 'en cours') ? (
                                    <div>
                                        <button onClick={(e) => { e.stopPropagation(); setItemAAnnuler(reappro); }}>
                                            Annuler
                                        </button>
                                        {reappro.statut === 'en cours' && (
                                            <button onClick={(e) => { e.stopPropagation(); setItemAConfirmer(reappro); }}>
                                                Confirmer
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <span>Aucune action</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {reapproSelectionne && (
                <PaneDetailsReapprovisionnement 
                    reappro={reapproSelectionne} 
                    onClose={() => setReapproSelectionne(null)} 
                />
            )}

            {itemAAnnuler && (
                <ModalAnnulerReapprovisionnement 
                    item={itemAAnnuler} 
                    onClose={() => setItemAAnnuler(null)} 
                />
            )}

            {itemAConfirmer && (
                <ModalConfirmerReapprovisionnement 
                    item={itemAConfirmer} 
                    onClose={() => setItemAConfirmer(null)} 
                />
            )}
        </div>
    );
}

export default HistoriqueReapprovisionnement;