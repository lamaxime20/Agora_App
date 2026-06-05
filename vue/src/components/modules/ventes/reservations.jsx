import React, { useState } from 'react';

// =========================================================================
// 1. COMPOSANT PRINCIPAL (RACINE)
// =========================================================================
function Reservations() {
    // --- ÉTATS DES DONNÉES (PRODUITS ET RESERVATIONS ISSUES DES COMMANDES) ---
    const [products, setProducts] = useState([
        { id: 1, nom: "Produit Alpha", stock_actuel: 20 },
        { id: 2, nom: "Produit Beta", stock_actuel: 8 },
        { id: 3, nom: "Produit Gamma", stock_actuel: 15 }
    ]);

    const [reservations, setReservations] = useState([
        { id: 1, produit_id: 1, produit_nom: "Produit Alpha", quantite: 5, statut: "en_cours", commande_id: 10, client: "Dupont Jean", date: "2026-06-01" },
        { id: 2, produit_id: 1, produit_nom: "Produit Alpha", quantite: 3, statut: "validé", commande_id: 11, client: "Martin Sophie", date: "2026-06-02" },
        { id: 3, produit_id: 2, produit_nom: "Produit Beta", quantite: 4, statut: "en_cours", commande_id: 12, client: "Durand Pierre", date: "2026-06-03" },
        { id: 4, produit_id: 3, produit_nom: "Produit Gamma", quantite: 2, statut: "annulé", commande_id: 13, client: "Leroy Julie", date: "2026-06-04" }
    ]);

    // --- ÉTATS DE FILTRAGE ET DE SÉLECTION ---
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("tous");
    const [selectedReservation, setSelectedReservation] = useState(null);

    // --- LOGIQUE MÉTIER CYBER-CALCULÉE (Calcul dynamique requis par l'énoncé) ---
    // Le stock réservé est calculé dynamiquement à partir des commandes validées dont la livraison n'est pas confirmée (état 'en_cours')
    const calculateStockReserve = (productId) => {
        return reservations
            .filter(r => r.produit_id === productId && r.statut === "en_cours")
            .reduce((acc, curr) => acc + curr.quantite, 0);
    };

    const handleSelectRow = (reservation) => {
        setSelectedReservation(reservation);
    };

    const handleClosePane = () => {
        setSelectedReservation(null);
    };

    // Filtrage des lignes du tableau
    const filteredReservations = reservations.filter(res => {
        const matchesSearch = res.produit_nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              res.client.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "tous" || res.statut === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div>
            <PageHeader />
            
            <ControlBar 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                statusFilter={statusFilter} 
                setStatusFilter={setStatusFilter} 
                filteredData={filteredReservations}
            />

            <ReservationsTable 
                data={filteredReservations} 
                onSelectRow={handleSelectRow} 
            />

            {selectedReservation && (
                <ReservationDetailsPane 
                    reservation={selectedReservation} 
                    product={products.find(p => p.id === selectedReservation.produit_id)}
                    stockReserve={calculateStockReserve(selectedReservation.produit_id)}
                    onClose={handleClosePane}
                />
            )}
        </div>
    );
}

// =========================================================================
// 2. SOUS-COMPOSANTS DE L'ENTÊTE ET DES FILTRES
// =========================================================================
function PageHeader() {
    return (
        <div>
            <h2>Liste des réservations de produits</h2>
            <p>Note : Le stock réservé et le stock disponible sont calculés dynamiquement.</p>
        </div>
    );
}

function ControlBar({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, filteredData }) {
    return (
        <div>
            <FilterInputs 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                statusFilter={statusFilter} 
                setStatusFilter={setStatusFilter} 
            />
            <ExportActions filteredData={filteredData} />
        </div>
    );
}

function FilterInputs({ searchTerm, setSearchTerm, statusFilter, setStatusFilter }) {
    return (
        <div>
            <SearchField value={searchTerm} onChange={setSearchTerm} />
            <StatusDropdown value={statusFilter} onChange={setStatusFilter} />
        </div>
    );
}

function SearchField({ value, onChange }) {
    return (
        <input 
            type="text" 
            placeholder="Rechercher par produit ou client..." 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
        />
    );
}

function StatusDropdown({ value, onChange }) {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="tous">Tous les états</option>
            <option value="en_cours">En cours</option>
            <option value="validé">Validé (Stock déduit)</option>
            <option value="annulé">Annulé</option>
        </select>
    );
}

// =========================================================================
// 3. SOUS-COMPOSANTS DE GÉNÉRATION DE RAPPORTS (EXPORTS)
// =========================================================================
function ExportActions({ filteredData }) {
    const handleExport = (format) => {
        alert(`Génération du rapport de la liste filtrée (${filteredData.length} lignes) au format .${format}`);
    };

    return (
        <div>
            <ExportButton label="Exporter en .csv" format="csv" onExport={handleExport} />
            <ExportButton label="Exporter en .pdf" format="pdf" onExport={handleExport} />
            <ExportButton label="Exporter en .docx" format="docx" onExport={handleExport} />
        </div>
    );
}

function ExportButton({ label, format, onExport }) {
    return (
        <button onClick={() => onExport(format)}>
            {label}
        </button>
    );
}

// =========================================================================
// 4. SOUS-COMPOSANTS DU TABLEAU PRINCIPAL
// =========================================================================
function ReservationsTable({ data, onSelectRow }) {
    return (
        <table border="1">
            <TableHeader />
            <TableBody data={data} onSelectRow={onSelectRow} />
        </table>
    );
}

function TableHeader() {
    return (
        <thead>
            <tr>
                <th>ID Réservation</th>
                <th>Produit</th>
                <th>Quantité</th>
                <th>Client</th>
                <th>ID Commande</th>
                <th>État Réservation</th>
            </tr>
        </thead>
    );
}

function TableBody({ data, onSelectRow }) {
    if (data.length === 0) {
        return (
            <tbody>
                <tr>
                    <td colSpan="6">Aucune réservation ne correspond à vos filtres.</td>
                </tr>
            </tbody>
        );
    }

    return (
        <tbody>
            {data.map((res) => (
                <TableRow key={res.id} rowData={res} onSelect={onSelectRow} />
            ))}
        </tbody>
    );
}

function TableRow({ rowData, onSelect }) {
    return (
        <tr onClick={() => onSelect(rowData)}>
            <td>#{rowData.id}</td>
            <td>{rowData.produit_nom}</td>
            <td>{rowData.quantite}</td>
            <td>{rowData.client}</td>
            <td>#{rowData.commande_id}</td>
            <td>
                <strong>{rowData.statut}</strong>
            </td>
        </tr>
    );
}

// =========================================================================
// 5. SOUS-COMPOSANTS DU PANE LATÉRAL DE DÉTAILS ET STOCK DYNAMIQUE
// =========================================================================
function ReservationDetailsPane({ reservation, product, stockReserve, onClose }) {
    return (
        <div>
            <div>
                <h3>Volet d'information : Réservation #{reservation.id}</h3>
                <button onClick={onClose}>Fermer la fiche [X]</button>
            </div>

            <DetailsList reservation={reservation} />
            <DynamicStockSummary product={product} stockReserve={stockReserve} />
        </div>
    );
}

function DetailsList({ reservation }) {
    return (
        <ul>
            <li><strong>Produit réservé :</strong> {reservation.produit_nom}</li>
            <li><strong>Quantité demandée :</strong> {reservation.quantite} unités</li>
            <li><strong>Client lié :</strong> {reservation.client}</li>
            <li><strong>Commande d'origine :</strong> Commande n°{reservation.commande_id}</li>
            <li><strong>Date d'enregistrement :</strong> {reservation.date}</li>
            <li><strong>État actuel de l'axe :</strong> {reservation.statut}</li>
        </ul>
    );
}

function DynamicStockSummary({ product, stockReserve }) {
    if (!product) return <p>Informations sur l'inventaire indisponibles.</p>;

    // stock disponible = stock actuel - stock réservé
    const stockDisponible = product.stock_actuel - stockReserve;

    return (
        <div>
            <h4>Calcul de l'inventaire en temps réel pour : {product.nom}</h4>
            <table border="1">
                <thead>
                    <tr>
                        <th>Indicateur</th>
                        <th>Quantité</th>
                        <th>Mécanisme de calcul</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Stock actuel</td>
                        <td>{product.stock_actuel}</td>
                        <td>Diminué uniquement à la confirmation de livraison</td>
                    </tr>
                    <tr>
                        <td>Stock réservé</td>
                        <td>{stockReserve}</td>
                        <td>Calculé dynamiquement (Commandes en cours non livrées)</td>
                    </tr>
                    <tr>
                        <td><strong>Stock disponible</strong></td>
                        <td><strong>{stockDisponible}</strong></td>
                        <td><strong>Stock actuel - Stock réservé</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default Reservations;