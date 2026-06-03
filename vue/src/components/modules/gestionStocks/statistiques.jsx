import { useState } from 'react';
import StatsVueGenerale from './statistiques/StatsVueGenerale';
import StatsProduits from './statistiques/StatsProduits';
import StatsStock from './statistiques/StatsStock';
import StatsReapprovisionnements from './statistiques/StatsReapprovisionnements';
import StatsPertes from './statistiques/StatsPertes';

function Statistiques() {
    const [pageActive, setPageActive] = useState('generale');

    return (
        <div>
            <header>
                <h1>Tableaux de Statistiques</h1>
                <nav>
                    <button onClick={() => setPageActive('generale')}>Vue Générale</button>
                    <button onClick={() => setPageActive('produits')}>Produits</button>
                    <button onClick={() => setPageActive('stock')}>Stock</button>
                    <button onClick={() => setPageActive('reappro')}>Réapprovisionnements</button>
                    <button onClick={() => setPageActive('pertes')}>Pertes</button>
                </nav>
            </header>

            <main>
                {pageActive === 'generale' && <StatsVueGenerale />}
                {pageActive === 'produits' && <StatsProduits />}
                {pageActive === 'stock' && <StatsStock />}
                {pageActive === 'reappro' && <StatsReapprovisionnements />}
                {pageActive === 'pertes' && <StatsPertes />}
            </main>
        </div>
    );
}

export default Statistiques;