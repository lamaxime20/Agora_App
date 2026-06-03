function StatsStock() {
    return (
        <div>
            <section>
                <h2>Analyse des Stocks par Catégorie</h2>
                
                <table>
                    <thead>
                        <tr>
                            <th>Catégorie</th>
                            <th>Répartition du stock (Quantité)</th>
                            <th>Valeur du stock (€)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Électronique</td>
                            <td>450 unités</td>
                            <td>22 500 €</td>
                        </tr>
                        <tr>
                            <td>Alimentation</td>
                            <td>1 200 unités</td>
                            <td>6 200 €</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <section>
                <h2>Niveaux de Stockage Individuels</h2>
                
                <div>
                    <h3>Produits les plus stockés</h3>
                    <ul>
                        <li>Gobelets Plastiques — 2 500 unités en stock</li>
                        <li>Stylos Bleus — 1 800 unités en stock</li>
                    </ul>
                </div>

                <div>
                    <h3>Produits les moins stockés</h3>
                    <ul>
                        <li>Ordinateur Portable Pro — 1 unité en stock</li>
                        <li>Écran 4K — 2 unités en stock</li>
                    </ul>
                </div>
            </section>

            <section>
                <h2>Évolution du stock dans le temps</h2>
                <p><em>[Graphique / Tableau chronologique de l'état des stocks]</em></p>
                <table>
                    <thead>
                        <tr>
                            <th>Mois</th>
                            <th>Volume global stocké</th>
                            <th>Valeur estimée</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Mai 2026</td>
                            <td>3 400 unités</td>
                            <td>41 000 €</td>
                        </tr>
                        <tr>
                            <td>Juin 2026</td>
                            <td>3 652 unités</td>
                            <td>45 230 €</td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </div>
    );
}

export default StatsStock;