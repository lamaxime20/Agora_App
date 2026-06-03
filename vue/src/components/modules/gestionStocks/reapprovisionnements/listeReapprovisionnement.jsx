import { useState } from 'react';
import ModalCreationReapprovisionnement from './ModalCreationReapprovisionnement';
import ModalAnnulerReapprovisionnement from './ModalAnnulerReapprovisionnement';
import ModalConfirmerReapprovisionnement from './ModalConfirmerReapprovisionnement';

function ListeReapprovisionnement() {
    const [modalCreationOuvert, setModalCreationOuvert] = useState(false);
    const [itemAAnnuler, setItemAAnnuler] = useState(null);
    const [itemAConfirmer, setItemAConfirmer] = useState(null);

    // Données factices représentant les réapprovisionnements actifs
    const reapprovisionnementsActifs = [
        { id: 1, produit: 'Produit A', quantite: 50, statut: 'en attente' },
        { id: 2, produit: 'Produit B', quantite: 100, statut: 'en cours' }
    ];

    return (
        <div>
            <section>
                <button onClick={() => setModalCreationOuvert(true)}>
                    Faire un réapprovisionnement
                </button>
            </section>

            <section>
                <h2>Réapprovisionnements en attente ou en cours</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th>Quantité</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reapprovisionnementsActifs.map((reappro) => (
                            <tr key={reappro.id}>
                                <td>{reappro.produit}</td>
                                <td>{reappro.quantite}</td>
                                <td>{reappro.statut}</td>
                                <td>
                                    <button onClick={() => setItemAAnnuler(reappro)}>
                                        Annuler
                                    </button>
                                    {reappro.statut === 'en cours' && (
                                        <button onClick={() => setItemAConfirmer(reappro)}>
                                            Confirmer le ravitaillement
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {modalCreationOuvert && (
                <ModalCreationReapprovisionnement onClose={() => setModalCreationOuvert(false)} />
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

export default ListeReapprovisionnement;