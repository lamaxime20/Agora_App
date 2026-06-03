import { useState } from 'react';
import ListeProduits from './produits/listeProduits';
import HistoriqueTransactions from './produits/historiqueTransactions';

function Produits() {
    const [vueActive, setVueActive] = useState('liste');

    return (
        <div>
            <header>
                <button onClick={() => setVueActive('liste')}>
                    Liste de Produits
                </button>
                <button onClick={() => setVueActive('historique')}>
                    Historique transaction de produits
                </button>
            </header>

            <main>
                {vueActive === 'liste' && <ListeProduits />}
                {vueActive === 'historique' && <HistoriqueTransactions />}
            </main>
        </div>
    );
}

export default Produits;