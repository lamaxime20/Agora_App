import { useState } from 'react';
import PaneDetailsTransaction from './paneDetailsTransaction';

function HistoriqueTransactions() {
    const [transactionSelectionnee, setTransactionSelectionnee] = useState(null);

    const transactions = [
        { id: 1, type: 'Ravitaillement', date: '2023-11-01', produit: 'Produit A' },
        { id: 2, type: 'Perte', date: '2023-11-02', produit: 'Produit B' }
    ];

    return (
        <div>
            <header>
                <fieldset>
                    <legend>Filtres de l'historique</legend>
                    <input type="date" aria-label="Date de début" />
                    <input type="date" aria-label="Date de fin" />
                    <input type="search" placeholder="Rechercher..." />
                    
                    <select aria-label="Type de produit">
                        <option value="">Tous les types</option>
                        <option value="physique">Physique</option>
                        <option value="service">Service</option>
                    </select>

                    <select aria-label="Catégorie">
                        <option value="">Toutes les catégories</option>
                    </select>
                </fieldset>

                <div>
                    <span>Générer rapport : </span>
                    <button>PDF</button>
                    <button>CSV</button>
                    <button>DOCX</button>
                </div>
            </header>

            <ul>
                {transactions.map((transaction) => (
                    <li 
                        key={transaction.id} 
                        onClick={() => setTransactionSelectionnee(transaction)}
                    >
                        <span>{transaction.date}</span>
                        <span>{transaction.type}</span>
                        <span>{transaction.produit}</span>
                    </li>
                ))}
            </ul>

            {transactionSelectionnee && (
                <PaneDetailsTransaction 
                    transaction={transactionSelectionnee} 
                    onClose={() => setTransactionSelectionnee(null)} 
                />
            )}
        </div>
    );
}

export default HistoriqueTransactions;