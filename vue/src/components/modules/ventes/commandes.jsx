import React, { useState } from 'react';

// =========================================================================
// 1. COMPOSANT PRINCIPAL (RACINE)
// =========================================================================
function Commandes() {
    // --- ÉTATS DES DONNÉES (SIMULATION BASE DE DONNÉES) ---
    const [clients, setClients] = useState([
        { id: 1, nom: "Dupont", prenom: "Jean", email: "jean.dupont@email.com", telephone: "0601020304" },
        { id: 2, nom: "Martin", prenom: "Sophie", email: "sophie.martin@email.com", telephone: "0605060708" }
    ]);

    const [products, setProducts] = useState([
        { id: 1, nom: "Produit Alpha", prix_unitaire: 150, reduction: 15, stock: 10 },
        { id: 2, nom: "Produit Beta", prix_unitaire: 80, reduction: 0, stock: 2 },
        { id: 3, nom: "Produit Gamma", prix_unitaire: 200, reduction: 50, stock: 5 }
    ]);

    const [orders, setOrders] = useState([
        { 
            id: 1, 
            client: "Dupont Jean", 
            montant: 135, 
            statut: "reçu", 
            adresse: "12 Rue de Paris", 
            date: "2026-06-15", 
            notes: "Livraison le matin",
            paiements: [] 
        },
        { 
            id: 2, 
            client: "Martin Sophie", 
            montant: 80, 
            statut: "validé", 
            adresse: "45 Avenue de Lyon", 
            date: "2026-06-18", 
            notes: "",
            paiements: [
                { date: "2026-06-05", montant: 80, mode: "Carte Bancaire", reference: "TX-99823", user: "Finance_User_A" }
            ] 
        }
    ]);

    // --- ÉTATS DE NAVIGATION ET VISIBILITÉ ---
    const [activeTab, setActiveTab] = useState('list'); // 'list' ou 'new'
    const [error, setError] = useState("");
    const [showClientPane, setShowClientPane] = useState(false);
    const [showAddClientForm, setShowAddClientForm] = useState(false);
    const [showProductPane, setShowProductPane] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // --- ÉTATS DE RECHERCHE ET REQUÊTES ---
    const [searchClient, setSearchClient] = useState("");
    const [searchProduct, setSearchProduct] = useState("");
    const [cancelReason, setCancelReason] = useState("");

    // --- ÉTATS DES FORMULAIRES ---
    const [newClientForm, setNewClientForm] = useState({ nom: "", prenom: "", email: "", telephone: "" });
    const [newOrder, setNewOrder] = useState({ client: "", items: [], adresse: "", date: "", notes: "" });

    // --- LOGIQUE ET ACTIONS METIER ---
    const calculateTotal = () => {
        return newOrder.items.reduce((acc, item) => acc + (item.quantite * item.prix_unitaire - item.reduction), 0);
    };

    const handleAddProductToOrder = (product) => {
        setNewOrder({ ...newOrder, items: [...newOrder.items, { ...product, quantite: 1 }] });
    };

    const handleUpdateQty = (id, delta) => {
        const updatedItems = newOrder.items.map(item => {
            if (item.id === id) return { ...item, quantite: item.quantite + delta };
            return item;
        }).filter(item => item.quantite > 0);
        setNewOrder({ ...newOrder, items: updatedItems });
    };

    const handleRemoveItem = (id) => {
        setNewOrder({ ...newOrder, items: newOrder.items.filter(item => item.id !== id) });
    };

    const handleAddClientSubmit = () => {
        if (!newClientForm.nom || !newClientForm.email) {
            setError("Le nom et l'email sont obligatoires.");
            return;
        }
        const emailExists = clients.some(c => c.email.toLowerCase() === newClientForm.email.toLowerCase());
        if (emailExists) {
            setError("un client avec cet email existe déjà");
            return;
        }
        const newlyCreated = { id: clients.length + 1, ...newClientForm };
        setClients([...clients, newlyCreated]);
        setNewOrder({ ...newOrder, client: `${newlyCreated.nom} ${newlyCreated.prenom}` });
        setNewClientForm({ nom: "", prenom: "", email: "", telephone: "" });
        setShowAddClientForm(false);
        setShowClientPane(false);
        setError("");
    };

    const handleConfirmOrderSubmit = () => {
        if (!newOrder.client) {
            setError("Veuillez sélectionner un client.");
            return;
        }
        if (newOrder.items.length === 0) {
            setError("Veuillez sélectionner au moins un produit.");
            return;
        }
        for (let item of newOrder.items) {
            if (item.quantite > item.stock) {
                setError(`stock insuffisant pour le produit ${item.nom}`);
                return;
            }
        }
        const savedOrder = {
            id: orders.length + 1,
            client: newOrder.client,
            montant: calculateTotal(),
            statut: "reçu",
            adresse: newOrder.adresse,
            date: newOrder.date,
            notes: newOrder.notes,
            paiements: []
        };
        setOrders([...orders, savedOrder]);
        alert("Commande enregistrée en statut 'brouillon'. Notification envoyée à la Finance.");
        setNewOrder({ client: "", items: [], adresse: "", date: "", notes: "" });
        setError("");
        setActiveTab('list');
    };

    const handleConfirmCancelSubmit = () => {
        if (!cancelReason) {
            alert("Veuillez renseigner un motif d'annulation.");
            return;
        }
        setOrders(orders.map(o => o.id === orderToCancel.id ? { ...o, statut: 'annulé' } : o));
        if (selectedOrder && selectedOrder.id === orderToCancel.id) {
            setSelectedOrder({ ...selectedOrder, statut: 'annulé' });
        }
        alert(`Commande #${orderToCancel.id} annulée.`);
        setShowCancelModal(false);
        setOrderToCancel(null);
        setCancelReason("");
    };

    return (
        <div>
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} setError={setError} />
            <ErrorMessage error={error} />

            {activeTab === 'new' && (
                <NewOrderForm 
                    newOrder={newOrder} 
                    setNewOrder={setNewOrder}
                    openClientPane={() => { setShowClientPane(true); setError(""); }}
                    openProductPane={() => setShowProductPane(true)}
                    totalAmount={calculateTotal()}
                    onConfirm={handleConfirmOrderSubmit}
                />
            )}

            {activeTab === 'list' && (
                <OrderHistory 
                    orders={orders} 
                    onSelectOrder={setSelectedOrder} 
                    onCancelTrigger={(order) => {
                        setOrderToCancel(order);
                        setShowCancelModal(true);
                    }}
                />
            )}

            {showClientPane && (
                <ClientPane 
                    searchClient={searchClient}
                    setSearchClient={setSearchClient}
                    showAddClientForm={showAddClientForm}
                    setShowAddClientForm={setShowAddClientForm}
                    newClientForm={newClientForm}
                    setNewClientForm={setNewClientForm}
                    onAddClient={handleAddClientSubmit}
                    clients={clients}
                    onSelectClient={(client) => {
                        setNewOrder({ ...newOrder, client: `${client.nom} ${client.prenom}` });
                        setShowClientPane(false);
                    }}
                    onClose={() => { setShowClientPane(false); setShowAddClientForm(false); }}
                />
            )}

            {showProductPane && (
                <ProductPane 
                    selectedItems={newOrder.items}
                    onUpdateQty={handleUpdateQty}
                    onRemoveItem={handleRemoveItem}
                    searchProduct={searchProduct}
                    setSearchProduct={setSearchProduct}
                    products={products}
                    onAddProduct={handleAddProductToOrder}
                    onClose={() => setShowProductPane(false)}
                />
            )}

            {selectedOrder && (
                <OrderDetailsPane 
                    order={selectedOrder} 
                    onClose={() => setSelectedOrder(null)} 
                    onCancelTrigger={(order) => {
                        setOrderToCancel(order);
                        setShowCancelModal(true);
                    }}
                />
            )}

            {showCancelModal && (
                <CancelModal 
                    orderToCancel={orderToCancel}
                    cancelReason={cancelReason}
                    setCancelReason={setCancelReason}
                    onConfirm={handleConfirmCancelSubmit}
                    onClose={() => {
                        setShowCancelModal(false);
                        setOrderToCancel(null);
                        setCancelReason("");
                    }}
                />
            )}
        </div>
    );
}

// =========================================================================
// 2. SOUS-COMPOSANTS DE NAVIGATION ET MESSAGES
// =========================================================================
function Navigation({ activeTab, setActiveTab, setError }) {
    return (
        <div>
            <button onClick={() => { setActiveTab('new'); setError(""); }}>
                Nouvelle Commande
            </button>
            <button onClick={() => setActiveTab('list')}>
                Historique de Commandes
            </button>
        </div>
    );
}

function ErrorMessage({ error }) {
    if (!error) return null;
    return (
        <div>
            <strong>Erreur : </strong> {error}
        </div>
    );
}

// =========================================================================
// 3. SOUS-COMPOSANTS DU FORMULAIRE DE COMMANDE
// =========================================================================
function NewOrderForm({ newOrder, setNewOrder, openClientPane, openProductPane, totalAmount, onConfirm }) {
    return (
        <div>
            <h2>Enregistrer une nouvelle commande</h2>
            
            <ClientSelectionField clientName={newOrder.client} onOpenPane={openClientPane} />
            <ProductSelectionSummary items={newOrder.items} onOpenPane={openProductPane} />
            
            <div>
                <label><strong>Adresse de livraison :</strong></label>
                <input 
                    type="text" 
                    value={newOrder.adresse} 
                    onChange={(e) => setNewOrder({ ...newOrder, adresse: e.target.value })} 
                />
            </div>

            <div>
                <label><strong>Date de livraison souhaitée :</strong></label>
                <input 
                    type="date" 
                    value={newOrder.date} 
                    onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })} 
                />
            </div>

            <div>
                <label><strong>Notes supplémentaires :</strong></label>
                <textarea 
                    rows="3" 
                    value={newOrder.notes} 
                    onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })} 
                />
            </div>

            <OrderTotalDisplay amount={totalAmount} />

            <button onClick={onConfirm}>
                Confirmer la commande
            </button>
        </div>
    );
}

function ClientSelectionField({ clientName, onOpenPane }) {
    return (
        <div>
            <label><strong>Choix du client :</strong></label>
            <input 
                type="text" 
                readOnly 
                value={clientName} 
                placeholder="Cliquez sur le bouton pour choisir" 
            />
            <button onClick={onOpenPane}>Parcourir les clients</button>
        </div>
    );
}

function ProductSelectionSummary({ items, onOpenPane }) {
    return (
        <div>
            <label><strong>Choix des produits :</strong></label>
            <button onClick={onOpenPane}>Ouvrir le catalogue produits</button>
            {items.length > 0 && (
                <div>
                    <span><strong>Produits retenus temporairement :</strong></span>
                    <ul>
                        {items.map(item => (
                            <li key={item.id}>
                                {item.nom} x{item.quantite} — {item.quantite * item.prix_unitaire - item.reduction} €
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function OrderTotalDisplay({ amount }) {
    return (
        <div>
            <strong>Montant total de la commande calculé : </strong> {amount} €
        </div>
    );
}

// =========================================================================
// 4. SOUS-COMPOSANTS DE L'HISTORIQUE ET DES TABLEAUX
// =========================================================================
function OrderHistory({ orders, onSelectOrder, onCancelTrigger }) {
    return (
        <div>
            <h2>Historique de toutes les commandes</h2>
            <HistoryFilters />
            <OrdersTable orders={orders} onSelectOrder={onSelectOrder} onCancelTrigger={onCancelTrigger} />
        </div>
    );
}

function HistoryFilters() {
    return (
        <div>
            <input type="text" placeholder="Rechercher / Filtrer les commandes..." />
            <button onClick={() => alert("Export CSV")}>Exporter .csv</button>
            <button onClick={() => alert("Export PDF")}>Exporter .pdf</button>
            <button onClick={() => alert("Export DOCX")}>Exporter .docx</button>
        </div>
    );
}

function OrdersTable({ orders, onSelectOrder, onCancelTrigger }) {
    return (
        <table border="1">
            <thead>
                <tr>
                    <th>ID Commande</th>
                    <th>Client</th>
                    <th>Montant Total</th>
                    <th>Statut Réel</th>
                    <th>Actions Possibles</th>
                </tr>
            </thead>
            <tbody>
                {orders.map(order => (
                    <tr key={order.id} onClick={() => onSelectOrder(order)}>
                        <td>#{order.id}</td>
                        <td>{order.client}</td>
                        <td>{order.montant} €</td>
                        <td><strong>{order.statut}</strong></td>
                        <td>
                            {(order.statut === 'reçu' || order.statut === 'validé' || order.statut === 'en cours de livraison') ? (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCancelTrigger(order);
                                    }}
                                >
                                    Annuler la commande
                                </button>
                            ) : (
                                <span>Aucune action</span>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// =========================================================================
// 5. SOUS-COMPOSANTS DES PANES INTERACTIFS (CLIENTS & PRODUITS)
// =========================================================================
function ClientPane({ searchClient, setSearchClient, showAddClientForm, setShowAddClientForm, newClientForm, setNewClientForm, onAddClient, clients, onSelectClient, onClose }) {
    return (
        <div>
            <div>
                <h3>Sélectionner un client de la base</h3>
                <button onClick={onClose}>Fermer [X]</button>
            </div>

            <input 
                type="text" 
                placeholder="Rechercher un client existant..." 
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
            />

            <button onClick={() => setShowAddClientForm(!showAddClientForm)}>
                {showAddClientForm ? "Retour à la liste" : "Créer et lier un nouveau client"}
            </button>

            {showAddClientForm ? (
                <AddClientForm form={newClientForm} setForm={setNewClientForm} onSubmit={onAddClient} />
            ) : (
                <ClientList clients={clients} searchClient={searchClient} onSelectClient={onSelectClient} />
            )}
        </div>
    );
}

function AddClientForm({ form, setForm, onSubmit }) {
    return (
        <div>
            <h4>Créer un profil client</h4>
            <div><label>Nom : </label><input type="text" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} /></div>
            <div><label>Prénom : </label><input type="text" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} /></div>
            <div><label>Email : </label><input type="text" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div><label>Téléphone : </label><input type="text" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} /></div>
            <button onClick={onSubmit}>Enregistrer et Sélectionner</button>
        </div>
    );
}

function ClientList({ clients, searchClient, onSelectClient }) {
    return (
        <ul>
            {clients
                .filter(c => `${c.nom} ${c.prenom}`.toLowerCase().includes(searchClient.toLowerCase()))
                .map(client => (
                    <li key={client.id}>
                        <span>{client.nom} {client.prenom} ({client.email}) </span>
                        <button onClick={() => onSelectClient(client)}>
                            Sélectionner
                        </button>
                    </li>
                ))
            }
        </ul>
    );
}

function ProductPane({ selectedItems, onUpdateQty, onRemoveItem, searchProduct, setSearchProduct, products, onAddProduct, onClose }) {
    return (
        <div>
            <div>
                <h3>Sélection des articles pour la commande</h3>
                <button onClick={onClose}>Fermer le catalogue [X]</button>
            </div>

            <div>
                <h4>Zone du haut : Produits sélectionnés pour cette commande</h4>
                {selectedItems.length === 0 ? (
                    <p>Aucun produit n'a encore été ajouté.</p>
                ) : (
                    <table border="1">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Quantité commandée</th>
                                <th>Prix unitaire</th>
                                <th>Réduction</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedItems.map(item => (
                                <tr key={item.id}>
                                    <td>{item.nom}</td>
                                    <td><strong>{item.quantite}</strong></td>
                                    <td>{item.prix_unitaire} €</td>
                                    <td>{item.reduction} €</td>
                                    <td>
                                        <button onClick={() => onUpdateQty(item.id, -1)}>-</button>
                                        <button onClick={() => onUpdateQty(item.id, 1)}>+</button>
                                        <button onClick={() => onRemoveItem(item.id)}>Supprimer</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div>
                <h4>Zone du bas : Catalogue de tous les produits utilisables</h4>
                <input 
                    type="text" 
                    placeholder="Filtrer l'inventaire général..." 
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                />
                <ul>
                    {products
                        .filter(p => p.nom.toLowerCase().includes(searchProduct.toLowerCase()))
                        .filter(p => !selectedItems.some(item => item.id === p.id))
                        .map(product => (
                            <li key={product.id}>
                                <span>{product.nom} — Prix : {product.prix_unitaire}€ — Stock dispo : {product.stock} units </span>
                                <button onClick={() => onAddProduct(product)}>Ajouter à la commande</button>
                            </li>
                        ))
                    }
                </ul>
            </div>
        </div>
    );
}

// =========================================================================
// 6. SOUS-COMPOSANTS DE CONSULTATION DES DETAILS ET MODALE
// =========================================================================
function OrderDetailsPane({ order, onClose, onCancelTrigger }) {
    return (
        <div>
            <div>
                <h3>Visualisation Pane : Commande #{order.id}</h3>
                <button onClick={onClose}>Masquer la fiche [X]</button>
            </div>
            
            <p><strong>Nom complet du client associé :</strong> {order.client}</p>
            <p><strong>Statut de traitement de l'entité :</strong> {order.statut}</p>
            <p><strong>Adresse d'expédition finale :</strong> {order.adresse || "Non renseignée"}</p>
            <p><strong>Date programmée souhaitée :</strong> {order.date || "Non planifiée"}</p>
            <p><strong>Notes ou instructions logistiques :</strong> {order.notes || "Aucune note"}</p>
            <p><strong>Montant financier global stocké :</strong> {order.montant} €</p>

            {(order.statut === 'reçu' || order.statut === 'validé' || order.statut === 'en cours de livraison') && (
                <button onClick={() => onCancelTrigger(order)}>
                    Annuler cette commande depuis la fiche
                </button>
            )}

            <PaymentsHistory paiements={order.paiements} />
        </div>
    );
}

function PaymentsHistory({ paiements }) {
    return (
        <div>
            <h4>Historique des transactions financières associées (Consultation uniquement)</h4>
            {paiements && paiements.length > 0 ? (
                <table border="1">
                    <thead>
                        <tr>
                            <th>Date transaction</th>
                            <th>Montant payé</th>
                            <th>Mode usité</th>
                            <th>Référence unique</th>
                            <th>Agent Finance émetteur</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paiements.map((pay, i) => (
                            <tr key={i}>
                                <td>{pay.date}</td>
                                <td>{pay.montant} €</td>
                                <td>{pay.mode}</td>
                                <td>{pay.reference}</td>
                                <td>{pay.user}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Aucun mouvement de caisse enregistré pour cette commande. Les encaissements s'effectuent au pôle Finance.</p>
            )}
        </div>
    );
}

function CancelModal({ orderToCancel, cancelReason, setCancelReason, onConfirm, onClose }) {
    return (
        <div>
            <h3>Demande de confirmation d'annulation</h3>
            <p>Vous êtes sur le point de résilier la commande de <strong>{orderToCancel?.client}</strong> (Montant : {orderToCancel?.montant} €).</p>
            
            <label><strong>Raison obligatoire de l'annulation :</strong></label>
            <textarea 
                rows="3" 
                placeholder="Précisez le motif légal ou logistique..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
            />

            <div>
                <button onClick={onConfirm}>
                    Confirmer la rupture définitive
                </button>
                <button onClick={onClose}>
                    Retour / Abandonner
                </button>
            </div>
        </div>
    );
}

export default Commandes;