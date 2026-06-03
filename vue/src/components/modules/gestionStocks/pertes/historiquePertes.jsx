import { useState } from 'react';
import PaneDetailsPerte from './PaneDetailsPerte';
import ModalAnnulerPerte from './ModalAnnulerPerte';

function HistoriquePertes() {
    const [perteSelectionnee, setPerteSelectionnee] = useState(null);
    const [perteAAnnuler, setPerteAAnnuler] = useState(null);

    // Liste complète englobant toutes les pertes, avec calcul de la condition des 24h
    const historiquePertesGlobal = [
        { id: 1, date: '2026-06-03T09:00:00', produit: 'Produit Physique X', quantite: 3, raison: 'Casse accidentelle', moinsDe24h: true, valeurEstimee: '45€' },
        { id: 2, date: '2026-05-12T14:20:00', produit: 'Produit Physique Y', quantite: 15, raison: 'Péremption', moinsDe24h: false, valeurEstimee: '300€' }
    ];

    return (
        <div>
            <header>
                <fieldset>
                    <legend>Filtres de l'historique des pertes</legend>
                    <label>
                        Période Début :
                        <input type="date" />
                    </label>
                    <label>
                        Période Fin :
                        <input type="date" />
                    </label>
                    
                    <input type="search" placeholder="Rechercher une perte..." />

                    <select aria-label="Filtrer par type de produit">
                        <option value="">Tous les types</option>
                        <option value="physique">Physique</option>
                        <option value="service">Service</option>
                    </select>

                    <select aria-label="Filtrer par catégorie">
                        <option value="">Toutes les catégories</option>
                    </select>
                </fieldset>

                <div>
                    <span>Générer le rapport : </span>
                    <button>Rapport .pdf</button>
                    <button>Rapport .csv</button>
                    <button>Rapport .docx</button>
                </div>
            </header>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Produit</th>
                        <th>Quantité</th>
                        <th>Actions / Statuts</th>
                    </tr>
                </thead>
                <tbody>
                    {historiquePertesGlobal.map((perte) => (
                        <tr key={perte.id} onClick={() => setPerteSelectionnee(perte)}>
                            <td>{perte.date}</td>
                            <td>{perte.produit}</td>
                            <td>{perte.quantite}</td>
                            <td>
                                {perte.moinsDe24h ? (
                                    <button onClick={(e) => { e.stopPropagation(); setPerteAAnnuler(perte); }}>
                                        Annuler la perte
                                    </button>
                                ) : (
                                    <span>Enregistré définitivement</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {perteSelectionnee && (
                <PaneDetailsPerte 
                    perte={perteSelectionnee} 
                    onClose={() => setPerteSelectionnee(null)} 
                    onAnnulerLoss={() => setPerteAAnnuler(perteSelectionnee)}
                />
            )}

            {perteAAnnuler && (
                <ModalAnnulerPerte perte={perteAAnnuler} onClose={() => setPerteAAnnuler(null)} />
            )}
        </div>
    );
}

export default HistoriquePertes;