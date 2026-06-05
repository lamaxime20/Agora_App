import React, { useState } from 'react';

// =========================================================================
// 1. COMPOSANT PRINCIPAL (RACINE)
// =========================================================================
function Statistiques() {
    // --- ÉTATS DES DONNÉES (SIMULATION DE L'HISTORIQUE ET DES VENTES) ---
    const [performanceData, setPerformanceData] = useState([
        { id: 1, nom: "Produit Alpha", quantite_vendue: 58, prix_unitaire: 150, reduction_appliquee: 870, categories: "Électronique" },
        { id: 2, nom: "Produit Beta", quantite_vendue: 34, prix_unitaire: 80, reduction_appliquee: 0, categories: "Accessoires" },
        { id: 3, nom: "Produit Gamma", quantite_vendue: 22, prix_unitaire: 200, reduction_appliquee: 1100, categories: "Électronique" }
    ]);

    // --- ÉTATS DE FILTRAGE ET DE DRILL-DOWN ---
    const [startDate, setStartDate] = useState("2026-01-01");
    const [endDate, setEndDate] = useState("2026-06-30");
    const [categoryFilter, setCategoryFilter] = useState("toutes");
    const [selectedProduct, setSelectedProduct] = useState(null);

    // --- LOGIQUE MÉTIER ET CALCULS STATISTIQUES DYNAMIQUES ---
    // CA par ligne = (quantite * prix_unitaire) - reduction
    const calculateProductRevenue = (item) => {
        return (item.quantite_vendue * item.prix_unitaire) - item.reduction_appliquee;
    };

    // CA Global cumulé
    const totalRevenue = performanceData
        .filter(item => categoryFilter === "toutes" || item.categories === categoryFilter)
        .reduce((acc, curr) => acc + calculateProductRevenue(curr), 0);

    // Volume total d'articles écoulés
    const totalUnitsSold = performanceData
        .filter(item => categoryFilter === "toutes" || item.categories === categoryFilter)
        .reduce((acc, curr) => acc + curr.quantite_vendue, 0);

    // Panier ou valeur moyenne par produit distinct
    const averageRevenuePerProduct = performanceData.length > 0 ? (totalRevenue / performanceData.length) : 0;

    // Filtrage des lignes pour le tableau de performance
    const filteredPerformance = performanceData.filter(item => {
        return categoryFilter === "toutes" || item.categories === categoryFilter;
    });

    return (
        <div>
            <StatsHeader />
            
            <StatsFilters 
                startDate={startDate} 
                setStartDate={setStartDate} 
                endDate={endDate} 
                setEndDate={setEndDate} 
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                filteredData={filteredPerformance}
            />

            <KpiGrid 
                revenue={totalRevenue} 
                units={totalUnitsSold} 
                average={averageRevenuePerProduct} 
            />

            <ProductPerformanceSection 
                data={filteredPerformance} 
                calculateRevenue={calculateProductRevenue}
                onSelectProduct={setSelectedProduct}
            />

            {selectedProduct && (
                <ProductDetailsPane 
                    product={selectedProduct} 
                    revenue={calculateProductRevenue(selectedProduct)}
                    onClose={() => setSelectedProduct(null)} 
                />
            )}
        </div>
    );
}

// =========================================================================
// 2. SOUS-COMPOSANTS DE L'ENTÊTE ET DES FILTRES TEMPELS
// =========================================================================
function StatsHeader() {
    return (
        <div>
            <h2>Rapports et Statistiques Commerciales</h2>
            <p>Analyse décisionnelle des flux financiers et des volumes d'écoulement du stock.</p>
        </div>
    );
}

function StatsFilters({ startDate, setStartDate, endDate, setEndDate, categoryFilter, setCategoryFilter, filteredData }) {
    return (
        <div>
            <div>
                <DateInput label="Période du :" value={startDate} onChange={setStartDate} />
                <DateInput label="Au :" value={endDate} onChange={setEndDate} />
                
                <label><strong>Secteur / Catégorie : </strong></label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="toutes">Toutes les catégories</option>
                    <option value="Électronique">Électronique</option>
                    <option value="Accessoires">Accessoires</option>
                </select>
            </div>
            <ExportActions filteredData={filteredData} />
        </div>
    );
}

function DateInput({ label, value, onChange }) {
    return (
        <span>
            <label><strong>{label}</strong></label>
            <input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
        </span>
    );
}

// =========================================================================
// 3. SOUS-COMPOSANTS DE GÉNÉRATION DE RAPPORTS (EXPORTS)
// =========================================================================
function ExportActions({ filteredData }) {
    return (
        <div>
            <ExportButton label="Extraire les statistiques (.csv)" format="csv" count={filteredData.length} />
            <ExportButton label="Générer le rapport graphique (.pdf)" format="pdf" count={filteredData.length} />
            <ExportButton label="Exporter la synthèse (.docx)" format="docx" count={filteredData.length} />
        </div>
    );
}

function ExportButton({ label, format, count }) {
    return (
        <button onClick={() => alert(`Exportation analytique lancée : ${count} segments traités au format .${format}`)}>
            {label}
        </button>
    );
}

// =========================================================================
// 4. SOUS-COMPOSANTS DES BLOCS MÉTRIQUES (KPI DASHBOARD)
// =========================================================================
function KpiGrid({ revenue, units, average }) {
    return (
        <div>
            <h3>Indicateurs Clés de Performance Globaux</h3>
            <KpiCard title="Chiffre d'Affaires Net" value={`${revenue} €`} description="Cumul après déduction des rabais commerciaux." />
            <KpiCard title="Volume de Distribution" value={`${units} unités`} description="Nombre total d'articles liquidés sur la période." />
            <KpiCard title="Rendement Moyen par Référence" value={`${average.toFixed(2)} €`} description="Chiffre d'affaires divisé par le nombre de lignes catalogue." />
        </div>
    );
}

function KpiCard({ title, value, description }) {
    return (
        <div>
            <h4>{title}</h4>
            <p><strong>{value}</strong></p>
            <p><small>{description}</small></p>
        </div>
    );
}

// =========================================================================
// 5. SOUS-COMPOSANTS DU TABLEAU DE PERFORMANCE DES PRODUITS
// =========================================================================
function ProductPerformanceSection({ data, calculateRevenue, onSelectProduct }) {
    return (
        <div>
            <h3>Classement des ventes par produit distinct</h3>
            <PerformanceTable data={data} calculateRevenue={calculateRevenue} onSelectProduct={onSelectProduct} />
        </div>
    );
}

function PerformanceTable({ data, calculateRevenue, onSelectProduct }) {
    return (
        <table border="1">
            <TableHeader />
            <TableBody data={data} calculateRevenue={calculateRevenue} onSelectProduct={onSelectProduct} />
        </table>
    );
}

function TableHeader() {
    return (
        <thead>
            <tr>
                <th>Code Article</th>
                <th>Désignation</th>
                <th>Famille Produit</th>
                <th>Unités Vendues</th>
                <th>Remises Accordées</th>
                <th>Chiffre d'Affaires Généré</th>
            </tr>
        </thead>
    );
}

function TableBody({ data, calculateRevenue, onSelectProduct }) {
    return (
        <tbody>
            {data.map(product => (
                <TableRow 
                    key={product.id} 
                    product={product} 
                    revenue={calculateRevenue(product)} 
                    onSelect={onSelectProduct} 
                />
            ))}
        </tbody>
    );
}

function TableRow({ product, revenue, onSelect }) {
    return (
        <tr onClick={() => onSelect(product)}>
            <td>#{product.id}</td>
            <td>{product.nom}</td>
            <td>{product.categories}</td>
            <td>{product.quantite_vendue}</td>
            <td>{product.reduction_appliquee} €</td>
            <td><strong>{revenue} €</strong></td>
        </tr>
    );
}

// =========================================================================
// 6. SOUS-COMPOSANTS DU PANE D'AUDIT COMPTABLE (DRILL-DOWN COUCHE INFÉRIEURE)
// =========================================================================
function ProductDetailsPane({ product, revenue, onClose }) {
    return (
        <div>
            <div>
                <h3>Analyse de Contribution : {product.nom}</h3>
                <button onClick={onClose}>Fermer l'audit [X]</button>
            </div>

            <p><strong>Segment de marché :</strong> {product.categories}</p>
            <p><strong>Prix unitaire catalogue initial :</strong> {product.prix_unitaire} €</p>
            <p><strong>Volume brut écoulé :</strong> {product.quantite_vendue} unités facturées</p>
            <p><strong>Rendement financier brut théorique :</strong> {product.quantite_vendue * product.prix_unitaire} €</p>
            <p><strong>Manque à gagner (Réductions/Promotions) :</strong> {product.reduction_appliquee} €</p>
            <p><strong>Apport net final au Chiffre d'Affaires :</strong> {revenue} €</p>

            <MonthlyBreakdownTable quantite={product.quantite_vendue} revenue={revenue} />
        </div>
    );
}

function MonthlyBreakdownTable({ quantite, revenue }) {
    // Calcul de sous-composante de projection fictive par trimestre (Q1 / Q2)
    return (
        <div>
            <h4>Distribution des performances par période trimestrielle (Simulation)</h4>
            <table border="1">
                <thead>
                    <tr>
                        <th>Période Comptable</th>
                        <th>Estimation Volume</th>
                        <th>Estimation Chiffre d'affaires</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Trimestre 1 (Q1)</td>
                        <td>{Math.floor(quantite * 0.4)} unités</td>
                        <td>{(revenue * 0.4).toFixed(2)} €</td>
                    </tr>
                    <tr>
                        <td>Trimestre 2 (Q2)</td>
                        <td>{Math.ceil(quantite * 0.6)} unités</td>
                        <td>{(revenue * 0.6).toFixed(2)} €</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default Statistiques;