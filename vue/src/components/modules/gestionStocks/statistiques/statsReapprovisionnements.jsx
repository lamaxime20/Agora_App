function StatsReapprovisionnements() {
    return (
        <div>
            <section>
                <h2>Filtre Temporel</h2>
                <label>
                    Choisir la période : <input type="month" defaultValue="2026-06" />
                </label>
            </section>

            <section>
                <h2>Métriques de Réapprovisionnement</h2>
                <ul>
                    <li><strong>Nombre de réapprovisionnements sur la période :</strong> 14 commandes validées</li>
                    <li><strong>Coût total des réapprovisionnements :</strong> 8 430 €</li>
                </ul>
            </section>

            <section>
                <h2>Fréquence d'Achat par Produit</h2>
                
                <div>
                    <h3>Produits les plus réapprovisionnés</h3>
                    <ul>
                        <li>Cartouches d'encre (Réapprovisionné 8 fois)</li>
                        <li>Papier A4 (Réapprovisionné 6 fois)</li>
                    </ul>
                </div>

                <div>
                    <h3>Produits les moins réapprovisionnés</h3>
                    <ul>
                        <li>Bureau d'angle (Réapprovisionné 1 fois)</li>
                        <li>Fauteuil de bureau (Réapprovisionné 1 fois)</li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

export default StatsReapprovisionnements;