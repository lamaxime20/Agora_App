import { Table, Button, Row, Col, Card, ListGroup, Form, Modal } from 'react-bootstrap';
import { useState, useContext } from 'react';
import { FournisseursContext } from '../../pages/manager/fournisseurPage';
import { useNavigate } from 'react-router-dom';

const FournisseursTable = () => {
  const { filters } = useContext(FournisseursContext);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  const [file, setFile] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newOrderForm, setNewOrderForm] = useState(false);
  const [newOrderItems, setNewOrderItems] = useState([{ product: '', quantity: '' }]);
  const navigate = useNavigate();

  // Données simulées
  const fournisseurs = [
    { 
      id: 1, 
      name: "Fournisseur A", 
      address: "12 Rue Exemple, 75001 Paris", 
      email: "contactA@example.com", 
      phone: "01 23 45 67 89", 
      registrationDate: "2023-01-15", 
      orders: [
        { id: 1, date: "2023-02-01", items: [{ product: "Produit 1", quantity: 5 }] },
        { id: 2, date: "2023-03-15", items: [{ product: "Produit 2", quantity: 3 }] },
      ], 
      invoices: [
        { id: 1, name: "facture1.pdf", date: "2023-02-10" },
        { id: 2, name: "facture2.pdf", date: "2023-04-01" },
      ]
    },
    { 
      id: 2, 
      name: "Fournisseur B", 
      address: "45 Avenue Test, 69000 Lyon", 
      email: "contactB@example.com", 
      phone: "04 56 78 90 12", 
      registrationDate: "2023-06-20", 
      orders: [], 
      invoices: []
    },
  ];

  // Filtrage
  const filteredFournisseurs = fournisseurs.filter((fournisseur) => {
    const matchesSearch = !filters.search || 
      fournisseur.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      fournisseur.address.toLowerCase().includes(filters.search.toLowerCase()) ||
      fournisseur.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      fournisseur.phone.includes(filters.search);
    const matchesDate = !filters.date || new Date(fournisseur.registrationDate) >= new Date(filters.date);
    return matchesSearch && matchesDate;
  });

  const handleDeleteFournisseur = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) {
      console.log(`Supprimer fournisseur ${id}`);
    }
  };

  const handleImportInvoice = () => {
    if (file && selectedFournisseur) {
      console.log(`Importer facture ${file.name} pour fournisseur ${selectedFournisseur.id}`);
      setSelectedFournisseur({
        ...selectedFournisseur,
        invoices: [...selectedFournisseur.invoices, { id: Date.now(), name: file.name, date: new Date().toISOString().split('T')[0] }],
      });
      setFile(null);
    }
  };

  const handleDeleteOrder = (orderId) => {
    if (selectedFournisseur && window.confirm("Êtes-vous sûr de vouloir supprimer ce bon de commande ?")) {
      setSelectedFournisseur({
        ...selectedFournisseur,
        orders: selectedFournisseur.orders.filter(order => order.id !== orderId),
      });
      console.log(`Supprimer bon de commande ${orderId} pour fournisseur ${selectedFournisseur.id}`);
    }
  };

  const handleCreateOrder = () => {
    setNewOrderForm(true);
  };

  const handleSaveNewOrder = () => {
    if (selectedFournisseur) {
      const newOrder = { id: Date.now(), date: new Date().toISOString().split('T')[0], items: newOrderItems.filter(item => item.product && item.quantity) };
      setSelectedFournisseur({
        ...selectedFournisseur,
        orders: [...selectedFournisseur.orders, newOrder],
      });
      setNewOrderForm(false);
      setNewOrderItems([{ product: '', quantity: '' }]);
      console.log(`Créer bon de commande ${newOrder.id} pour fournisseur ${selectedFournisseur.id}`);
    }
  };

  const handleEditOrder = (orderId) => {
    console.log(`Éditer bon de commande ${orderId} pour fournisseur ${selectedFournisseur.id}`);
  };

  const handleExportOrder = (orderId) => {
    console.log(`Exporter bon de commande ${orderId} pour fournisseur ${selectedFournisseur.id}`);
  };

  const viewDocument = (doc) => {
    if (doc.items) {
      setSelectedOrder(doc);
      setShowOrderModal(true);
    } else {
      navigate("/manager/factures"); // Redirige vers une page facture
    }
  };

  return (
    <div>
      {selectedFournisseur ? (
        <div>
          <Button variant="secondary" onClick={() => setSelectedFournisseur(null)} className="mb-3">
            <i className="bi bi-arrow-left me-2"></i> Retour
          </Button>
          <Row>
            <Col xs={12} md={8}>
              <h5 style={{ color: 'orange' }}>Dossiers Fournisseur</h5>
              <Row className="mt-4">
                <Col>
                  <h6 style={{ color: 'orange' }}>Commandes</h6>
                  <ListGroup>
                    {selectedFournisseur.orders.map((order) => (
                      <ListGroup.Item key={order.id}>
                        Bon de Commande {order.id} - {order.date}
                        <Button variant="link" onClick={() => handleDeleteOrder(order.id)}>
                          <i className="bi bi-trash" style={{ color: '#dc3545' }}></i>
                        </Button>
                        <Button variant="link" onClick={() => handleExportOrder(order.id)}>
                          <i className="bi bi-download" style={{ color: '#28a745' }}></i>
                        </Button>
                        <Button variant="link" onClick={() => viewDocument(order)}>
                          <i className="bi bi-eye" style={{ color: '#007bff' }}></i>
                        </Button>
                      </ListGroup.Item>
                    ))}
                    <ListGroup.Item>
                      <Button variant="warning" style={{ backgroundColor: '#F37B14', borderColor: '#ff9900' }} onClick={handleCreateOrder}>
                        <i className="bi bi-plus-circle me-2"></i> Créer Bon de Commande
                      </Button>
                    </ListGroup.Item>
                  </ListGroup>
                </Col>
                <Col>
                  <h6 style={{ color: 'orange' }}>Factures</h6>
                  <ListGroup>
                    {selectedFournisseur.invoices.map((invoice) => (
                      <ListGroup.Item key={invoice.id}>
                        {invoice.name} - {invoice.date}
                        <Button variant="link" onClick={() => viewDocument(invoice)}>
                          <i className="bi bi-eye" style={{ color: '#007bff' }}></i>
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  <Form.Group className="mt-3">
                    <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} />
                    <Button variant="warning" style={{ backgroundColor: 'orange', borderColor: '#FCF1DE', color: 'white' }} onClick={handleImportInvoice} className="mt-2">
                      Importer Facture
                    </Button>
                  </Form.Group>
                </Col>
              </Row>
            </Col>
            <Col xs={12} md={4}>
              <Card className="shadow-sm mt-2" style={{ borderColor: 'orange' }}>
                <Card.Body>
                  <Card.Title style={{ color: 'orange' }}>Informations Fournisseur</Card.Title>
                  <p>Nom : <strong>{selectedFournisseur.name}</strong></p>
                  <p>Adresse : <strong>{selectedFournisseur.address}</strong></p>
                  <p>Email : <strong>{selectedFournisseur.email}</strong></p>
                  <p>Téléphone : <strong>{selectedFournisseur.phone}</strong></p>
                  <p>Date Inscription : <strong>{selectedFournisseur.registrationDate}</strong></p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Modal pour les détails du bon de commande */}
          <Modal show={showOrderModal} onHide={() => { setShowOrderModal(false); setSelectedOrder(null); }}>
            <Modal.Header closeButton>
              <Modal.Title>Détails du Bon de Commande {selectedOrder?.id}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p><strong>Date :</strong> {selectedOrder?.date}</p>
              <h6>Produits Commandés :</h6>
              <ListGroup>
                {selectedOrder?.items?.map((item, index) => (
                  <ListGroup.Item key={index}>
                    {item.product} - Quantité : {item.quantity}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => { setShowOrderModal(false); setSelectedOrder(null); }}>
                Fermer
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Formulaire pour ajouter un bon de commande */}
          <Modal show={newOrderForm} onHide={() => setNewOrderForm(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Ajouter un Bon de Commande</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                {newOrderItems.map((item, index) => (
                  <Row key={index} className="mb-3">
                    <Col>
                      <Form.Control
                        type="text"
                        placeholder="Produit"
                        value={item.product}
                        onChange={(e) => {
                          const updatedItems = [...newOrderItems];
                          updatedItems[index].product = e.target.value;
                          setNewOrderItems(updatedItems);
                        }}
                      />
                    </Col>
                    <Col>
                      <Form.Control
                        type="number"
                        placeholder="Quantité"
                        value={item.quantity}
                        onChange={(e) => {
                          const updatedItems = [...newOrderItems];
                          updatedItems[index].quantity = e.target.value;
                          setNewOrderItems(updatedItems);
                        }}
                      />
                    </Col>
                    <Col xs="auto">
                      <Button variant="danger" onClick={() => {
                        const updatedItems = newOrderItems.filter((_, i) => i !== index);
                        setNewOrderItems(updatedItems);
                      }} disabled={newOrderItems.length <= 1}>
                        <i className="bi bi-trash"></i>
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Button variant="secondary" onClick={() => setNewOrderItems([...newOrderItems, { product: '', quantity: '' }])}>
                  Ajouter un produit
                </Button>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setNewOrderForm(false)}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleSaveNewOrder}>
                Enregistrer
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      ) : (
        <>
          <Button variant="warning" style={{ backgroundColor: 'orange', borderColor: 'orange', color: 'white' }} onClick={() => setSelectedFournisseur({ id: Date.now(), name: '', address: '', email: '', phone: '', registrationDate: new Date().toISOString().split('T')[0], orders: [], invoices: [] })} className="mb-3">
            <i className="bi bi-plus-circle me-2" style={{color: 'white'}}></i> Ajouter Fournisseur
          </Button>
          {filteredFournisseurs.length === 0 ? (
            <p>Aucun fournisseur trouvé avec les filtres actuels.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Adresse</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Date Inscription</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFournisseurs.map((fournisseur) => (
                    <tr key={fournisseur.id}>
                      <td>{fournisseur.id}</td>
                      <td>{fournisseur.name}</td>
                      <td>{fournisseur.address}</td>
                      <td>{fournisseur.email}</td>
                      <td>{fournisseur.phone}</td>
                      <td>{fournisseur.registrationDate}</td>
                      <td>
                        <Button variant="link" onClick={() => setSelectedFournisseur(fournisseur)}>
                          <i className="bi bi-eye" style={{ color: 'orange' }}></i>
                        </Button>
                        <Button variant="link" onClick={() => handleDeleteFournisseur(fournisseur.id)}>
                          <i className="bi bi-trash" style={{ color: '#dc3545' }}></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FournisseursTable;