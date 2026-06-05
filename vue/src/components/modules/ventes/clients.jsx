import React, { useState } from 'react';

// =========================================================================
// 1. COMPOSANT PRINCIPAL (RACINE)
// =========================================================================
function Clients() {
    // --- ÉTATS DES DONNÉES (SIMULATION CLIENTS & COMMANDES DE LA BASE) ---
    const [clients, setClients] = useState([
        { id: 1, nom: "Dupont", prenom: "Jean", email: "jean.dupont@email.com", telephone: "0601020304" },
        { id: 2, nom: "Martin", prenom: "Sophie", email: "sophie.martin@email.com", telephone: "0605060708" },
        { id: 3, nom: "Durand", prenom: "Pierre", email: "pierre.durand@email.com", telephone: "0609101112" }
    ]);

    const [orders, setOrders] = useState([
        { id: 101, client_id: 1, montant: 150, statut: "reçu", date: "2026-06-01" },
        { id: 102, client_id: 1, montant: 85, statut: "en cours de livraison", date: "2026-06-04" },
        { id: 103, client_id: 2, montant: 210, statut: "validé", date: "2026-06-02" },
        { id: 104, client_id: 2, montant: 45, statut: "livré", date: "2026-06-05" },
        { id: 105, client_id: 3, montant: 300, statut: "annulé", date: "2026-05-28" }
    ]);

    // --- ÉTATS DE NAVIGATION DU MODULE ---
    const [selectedClient, setSelectedClient] = useState(null);
    const [showOrdersInterface, setShowOrdersInterface] = useState(false);

    // --- REQUÊTES ET FILTRAGE DYNAMIQUE ---
    // Récupère uniquement les commandes associées au client actif
    const getClientOrders = (clientId) => {
        return orders.filter(order => order.client_id === clientId);
    };

    return (
        <div>
            <PageHeader />
            
            <ClientsTable 
                clients={clients} 
                onSelectClient={(client) => {
                    setSelectedClient(client);
                    setShowOrdersInterface(false); // Réinitialise l'interface secondaire si on change de client
                }} 
            />

            {selectedClient && (
                <ClientDetailsPane 
                    client={selectedClient} 
                    onClose={() => {
                        setSelectedClient(null);
                        setShowOrdersInterface(false);
                    }}
                    onViewOrders={() => setShowOrdersInterface(true)}
                />
            )}

            {showOrdersInterface && selectedClient && (
                <ClientOrdersInterface 
                    client={selectedClient} 
                    clientOrders={getClientOrders(selectedClient.id)} 
                    onClose={() => setShowOrdersInterface(false)}
                />
            )}
        </div>
    );
}

// =========================================================================
// 2. SOUS-COMPOSANTS DE L'ENTÊTE ET DE LA STRUCTURE GÉNÉRALE
// =========================================================================
function PageHeader() {
    return (
        <div>
            <h2>Gestion du portefeuille Clients</h2>
            <p>Cliquez sur une ligne pour inspecter les coordonnées et l'historique des achats d'un client.</p>
        </div>
    );
}

// =========================================================================
// 3. SOUS-COMPOSANTS DU TABLEAU PRINCIPAL DES CLIENTS
// =========================================================================
function ClientsTable({ clients, onSelectClient }) {
    return (
        <table border="1">
            <ClientsTableHeader />
            <ClientsTableBody clients={clients} onSelectClient={onSelectClient} />
        </table>
    );
}

function ClientsTableHeader() {
    return (
        <thead>
            <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Adresse Email</th>
                <th>Numéro de Téléphone</th>
            </tr>
        </thead>
    );
}

function ClientsTableBody({ clients, onSelectClient }) {
    return (
        <tbody>
            {clients.map(client => (
                <ClientsTableRow 
                    key={client.id} 
                    client={client} 
                    onSelect={onSelectClient} 
                />
            ))}
        </tbody>
    );
}

function ClientsTableRow({ client, onSelect }) {
    return (
        <tr onClick={() => onSelect(client)}>
            <td>#{client.id}</td>
            <td>{client.nom}</td>
            <td>{client.prenom}</td>
            <td>{client.email}</td>
            <td>{client.telephone}</td>
        </tr>
    );
}

// =========================================================================
// 4. SOUS-COMPOSANTS DU VOLET DE DÉTAILS DU CLIENT (PANE)
// =========================================================================
function ClientDetailsPane({ client, onClose, onViewOrders }) {
    return (
        <div>
            <PaneHeader title="Fiche Client détaillée" onClose={onClose} />
            <ClientInfoDisplay client={client} />
            <PaneActions onViewOrders={onViewOrders} />
        </div>
    );
}

function PaneHeader({ title, onClose }) {
    return (
        <div>
            <h3>{title}</h3>
            <button onClick={onClose}>Fermer le volet [X]</button>
        </div>
    );
}

function ClientInfoDisplay({ client }) {
    return (
        <ul>
            <li><strong>Nom de famille :</strong> {client.nom}</li>
            <li><strong>Prénom :</strong> {client.prenom}</li>
            <li><strong>Adresse de messagerie (Email) :</strong> {client.email}</li>
            <li><strong>Ligne téléphonique :</strong> {client.telephone}</li>
        </ul>
    );
}

function PaneActions({ onViewOrders }) {
    return (
        <div>
            <button onClick={onViewOrders}>
                Voir toutes les commandes du client
            </button>
        </div>
    );
}

// =========================================================================
// 5. SOUS-COMPOSANTS DE L'INTERFACE SECONDAIRE DES COMMANDES CLIENT
// =========================================================================
function ClientOrdersInterface({ client, clientOrders, onClose }) {
    return (
        <div>
            <OrdersInterfaceHeader client={client} onClose={onClose} />
            <OrdersListingTable orders={clientOrders} />
        </div>
    );
}

function OrdersInterfaceHeader({ client, onClose }) {
    return (
        <div>
            <h4>Historique des transactions d'achat pour : {client.nom} {client.prenom}</h4>
            <button onClick={onClose}>Masquer l'interface des commandes [X]</button>
        </div>
    );
}

function OrdersListingTable({ orders }) {
    return (
        <table border="1">
            <OrdersListingHeader />
            <OrdersListingBody orders={orders} />
        </table>
    );
}

// Format des en-têtes requis par la structure d'historique
function OrdersListingHeader() {
    return (
        <thead>
            <tr>
                <th>ID Commande</th>
                <th>Date d'enregistrement</th>
                <th>Montant facturé</th>
                <th>Statut Backend transmis</th>
            </tr>
        </thead>
    );
}

function OrdersListingBody({ orders }) {
    if (orders.length === 0) {
        return (
            <tbody>
                <tr>
                    <td colSpan="4">Aucune commande n'est encore enregistrée pour ce client.</td>
                </tr>
            </tbody>
        );
    }

    return (
        <tbody>
            {orders.map(order => (
                <OrdersListingRow key={order.id} order={order} />
            ))}
        </tbody>
    );
}

function OrdersListingRow({ order }) {
    return (
        <tr>
            <td>#{order.id}</td>
            <td>{order.date}</td>
            <td>{order.montant} €</td>
            <td>
                <strong>{order.statut}</strong>
            </td>
        </tr>
    );
}

export default Clients;