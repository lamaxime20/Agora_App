import { useState } from 'react';
import ListePertes from './pertes/listePertes';
import HistoriquePertes from './pertes/historiquePertes';

function Pertes() {
    const [vueActive, setVueActive] = useState('gestion');

    return (
        <div>
            <header>
                <button onClick={() => setVueActive('gestion')}>
                    Pertes
                </button>
                <button onClick={() => setVueActive('historique')}>
                    Historique Pertes
                </button>
            </header>

            <main>
                {vueActive === 'gestion' && <ListePertes />}
                {vueActive === 'historique' && <HistoriquePertes />}
            </main>
        </div>
    );
}

export default Pertes;