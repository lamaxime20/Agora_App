function StatsPertes() {
    return (
        <div>
            <section>
                <h2>Bilan Financier des Pertes</h2>
                <p><strong>Valeur financière globale des pertes enregistrées :</strong> 1 420 €</p>
            </section>

            <section>
                <h2>Impact par Produit et Catégorie</h2>
                
                <div>
                    <h3>Produits les plus touchés par les pertes</h3>
                    <ul>
                        <li>Bouteilles en verre — 18 perdues (Raison principale : Casse)</li>
                        <li>Salades fraîches — 12 perdues (Raison principale : Péremption)</li>
                    </ul>
                </div>

                <div>
                    <h3>Produits les moins touchés par les pertes</h3>
                    <ul>
                        <li>Clé USB — 0 perte</li>
                        <li>Disque Dur — 1 perte</li>
                    </ul>
                </div>

                <div>
                    <h3>Répartition des pertes par catégorie</h3>
                    <ul>
                        <li>Alimentation Fraîche : 65% des pertes</li>
                        <li>Matériel Informatique : 5% des pertes</li>
                    </ul>
                </div>
            </section>

            <section>
                <h2>Évolution des pertes dans le temps</h2>
                <p><em>[Historique chronologique des pertes]</em></p>
                <ul>
                    <li>Semaine 22 : 3 pertes signalées (Valeur : 90 €)</li>
                    <li>Semaine 23 (En cours) : 1 perte signalée (Valeur : 45 €)</li>
                </ul>
            </section>
        </div>
    );
}

export default StatsPertes;