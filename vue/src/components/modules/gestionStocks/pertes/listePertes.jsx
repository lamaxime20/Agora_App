import { useState } from 'react';
import ModalSignalerPerte from './ModalSignalerPerte';
import ModalAnnulerPerte from './ModalAnnulerPerte';
import PaneDetailsPerte from './PaneDetailsPerte';

function ListePertes() {
    const [modalSignalerOuvert, setModalSignalerOuvert] = useState(false);
    const [perteAAnnuler, setPerteAAnnuler] = useState(null);
    const [perteSelectionnee, setPerteSelectionnee] = useState(null);

    // Données factices de pertes enregistrées il y a moins de 24 heures
    const pertesRecentes = [
        { id: 1, produit: 'Produit Physique X', quantite: 3, raison: 'Casse accidentelle', date: '2026-06-03T09:00:00', moinsDe24h: true, valeurEstimee: '45€' }
    ];

    return (
        <div>
            <section>
                <button onClick={() => setModalSignalerOuvert(true)}>
                    Signaler une perte
                </button>
            </section>

            <section>
                <h2>Pertes enregistrées il y a moins de 24 heures</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th>Quantité perdue</th>
                            <th>Raison</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pertesRecentes.map((perte) => (
                            <tr key={perte.id} onClick={() => setPerteSelectionnee(perte)}>
                                <td>{perte.produit}</td>
                                <td>{perte.quantite}</td>
                                <td>{perte.raison}</td>
                                <td>
                                    <button onClick={(e) => { e.stopPropagation(); setPerteAAnnuler(perte); }}>
                                        Annuler la perte
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {modalSignalerOuvert && (
                <ModalSignalerPerte onClose={() => setModalSignalerOuvert(false)} />
            )}

            {perteAAnnuler && (
                <ModalAnnulerPerte perte={perteAAnnuler} onClose={() => setPerteAAnnuler(null)} />
            )}

            {perteSelectionnee && (
                <PaneDetailsPerte 
                    perte={perteSelectionnee} 
                    onClose={() => setPerteSelectionnee(null)} 
                    onAnnulerLoss={() => setPerteAAnnuler(perteSelectionnee)}
                />
            )}
        </div>
    );
}

export default ListePertes;