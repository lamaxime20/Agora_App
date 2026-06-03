function StatsProduits() {
    return (
        <div>
            <section>
                <h2>Performances des Ventes par Produit</h2>
                
                <div>
                    <h3>Produits les plus vendus</h3>
                    <ol>
                        <li>Produit A — 450 unités</li>
                        <li>Produit B — 320 unités</li>
                    </ol>
                </div>

                <div>
                    <h3>Produits les moins vendus</h3>
                    <ol>
                        <li>Produit Z — 1 unité</li>
                        <li>Produit Y — 3 unités</li>
                    </ol>
                </div>
            </section>

            <section>
                <h2>Génération de Chiffre d'Affaires (CA)</h2>
                
                <div>
                    <h3>Produits générant le plus de chiffre d'affaires</h3>
                    <ol>
                        <li>Produit Luxe X — 15 000 €</li>
                        <li>Produit Standard A — 9 000 €</li>
                    </ol>
                </div>

                <div>
                    <h3>Produits générant le moins de chiffre d'affaires</h3>
                    <ol>
                        <li>Produit Z — 15 €</li>
                        <li>Produit Y — 45 €</li>
                    </ol>
                </div>
            </section>
        </div>
    );
}

export default StatsProduits;