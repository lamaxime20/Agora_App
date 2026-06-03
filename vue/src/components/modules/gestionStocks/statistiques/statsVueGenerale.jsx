function StatsVueGenerale() {
    return (
        <div>
            <section>
                <h2>Filtre de période</h2>
                <label>
                    Du : <input type="date" />
                </label>
                <label>
                    Au : <input type="date" />
                </label>
            </section>

            <section>
                <h2>Vue Générale de l'Activité</h2>
                
                <ul>
                    <li>
                        <strong>Nombre total de produits :</strong> 150
                    </li>
                    <li>
                        <strong>Nombre total de catégories :</strong> 12
                    </li>
                    <li>
                        <strong>Valeur totale du stock :</strong> 45 230 €
                    </li>
                    <li>
                        <strong>Quantité perdue sur la période :</strong> 24 unités
                    </li>
                    <li>
                        <strong>Coût des pertes sur la période :</strong> 580 €
                    </li>
                </ul>
            </section>

            <section>
                <h2>Alertes Stock</h2>
                <div>
                    <h3>Produits en rupture de stock</h3>
                    <ul>
                        <li>Produit Imprimante laser (ID: 45)</li>
                        <li>Câble HDMI 2m (ID: 89)</li>
                    </ul>
                </div>

                <div>
                    <h3>Produits en stock faible (Seuil d'alerte atteint)</h3>
                    <ul>
                        <li>Souris Sans Fil (Actuel: 3 / Seuil: 5)</li>
                        <li>Clavier Mécanique (Actuel: 2 / Seuil: 2)</li>
                    </ul>
                </div>
            </section>
        </div>
    );
}

export default StatsVueGenerale;