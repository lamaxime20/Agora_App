import { useState } from 'react';
import ListeReapprovisionnement from './reapprovisionnements/listeReapprovisionnement';
import HistoriqueReapprovisionnement from './reapprovisionnements/HistoriqueReapprovisionnement';

function Reapprovisionnement() {
    const [vueActive, setVueActive] = useState('gestion');

    return (
        <div>
            <header>
                <button onClick={() => setVueActive('gestion')}>
                    Réapprovisionnement
                </button>
                <button onClick={() => setVueActive('historique')}>
                    Historique Réapprovisionnement
                </button>
            </header>

            <main>
                {vueActive === 'gestion' && <ListeReapprovisionnement />}
                {vueActive === 'historique' && <HistoriqueReapprovisionnement />}
            </main>
        </div>
    );
}

export default Reapprovisionnement;