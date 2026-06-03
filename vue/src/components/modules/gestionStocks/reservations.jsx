import { useState } from 'react';
import PaneDetailsReservation from './reservations/paneDetailsReservation.jsx';

function Reservations() {
    const [reservationSelectionnee, setReservationSelectionnee] = useState(null);

    // Données factices illustrant les 3 états d'une réservation (en_cours, validé, annulé)
    const reservations = [
        { 
            id: "CMD-2026-001", 
            date: "2026-06-01", 
            produit: "Produit Physique X", 
            categorie: "Électronique",
            type: "physique",
            quantite: 5, 
            statut: "en_cours",
            stockActuel: 20,
            stockReserve: 5, // calculé dynamiquement
            client: "Société Alpha"
        },
        { 
            id: "CMD-2026-002", 
            date: "2026-05-28", 
            produit: "Service de Maintenance", 
            categorie: "Prestation",
            type: "service",
            quantite: 1, 
            statut: "validé",
            stockActuel: 0, // Non applicable ou 0 pour service
            stockReserve: 0,
            client: "Client B"
        },
        { 
            id: "CMD-2026-003", 
            date: "2026-05-15", 
            produit: "Produit Physique Y", 
            categorie: "Alimentation",
            type: "physique",
            quantite: 12, 
            statut: "annulé",
            stockActuel: 50,
            stockReserve: 0,
            client: "Jean Dupont"
        }
    ];

    return (
        <div>
            <header>
                <h1>Gestion des Réservations (Commandes)</h1>
                
                <fieldset>
                    <legend>Filtres de recherche</legend>
                    <label>
                        Période du :
                        <input type="date" name="debut" />
                    </label>
                    <label>
                        Au :
                        <input type="date" name="fin" />
                    </label>
                    
                    <input type="search" placeholder="Rechercher une commande ou un produit..." />
                    
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
                    <span>Générer le rapport de la liste filtrée : </span>
                    <button>Exporter en .pdf</button>
                    <button>Exporter en .csv</button>
                    <button>Exporter en .docx</button>
                </div>
            </header>

            <main>
                <table>
                    <thead>
                        <tr>
                            <th>N° Commande</th>
                            <th>Date</th>
                            <th>Produit</th>
                            <th>Quantité Réservée</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.map((res) => (
                            <tr 
                                key={res.id} 
                                onClick={() => setReservationSelectionnee(res)}
                            >
                                <td>{res.id}</td>
                                <td>{res.date}</td>
                                <td>{res.produit}</td>
                                <td>{res.quantite}</td>
                                <td>
                                    {res.statut === 'en_cours' && <span>En cours</span>}
                                    {res.statut === 'validé' && <span>Validé (Livré)</span>}
                                    {res.statut === 'annulé' && <span>Annulé</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>

            {reservationSelectionnee && (
                <PaneDetailsReservation 
                    reservation={reservationSelectionnee} 
                    onClose={() => setReservationSelectionnee(null)} 
                />
            )}
        </div>
    );
}

export default Reservations;