import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import HeaderCommercial from '../../components/commercial/headerCommercial.jsx';
import Footer from '../../components/footer';
import SousHeader from '../../components/commercial/sousHeaderCommercial.jsx';
import { NotificationProvider } from '../../components/manager/notificationContext.jsx';
import Filters from '../../components/filters.jsx';
import FactureTableCommercial from '../../components/commercial/factureTableCommercial.jsx';
import { createContext, useState } from 'react';

export const FacturesContext = createContext();

const FacturePageCommercial = ({ commercialId = 'Commercial 1' }) => {
  const [filters, setFilters] = useState({
    date: '',
    client: 'Tous',
    status: 'Tous',
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFacture, setNewFacture] = useState({
    commandeId: '',
  });

  // Configuration des filtres pour la page Factures (Commercial)
  const filterConfig = [
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'client', label: 'Client', type: 'select' },
    { name: 'status', label: 'Statut', type: 'select', statusType: 'factures' },
  ];

  // Données simulées pour les bons de commande
  const commandes = [
    {
      id: 'CMD001',
      client: 'Cendrillon Ayot',
      clientId: 1,
      dossierId: 1,
      dossierStatus: 'En cours',
      date: '16/03/2019',
      items: [
        { qty: 1, designation: 'Grand brun escargot pour manger', price: 100.00, total: 100.00 },
        { qty: 2, designation: 'Petit marinier uniforme en bleu', price: 15.00, total: 30.00 },
        { qty: 3, designation: 'Facile à jouer accordéon', price: 5.00, total: 15.00 },
      ],
      totalHT: 145.00,
    },
    {
      id: 'CMD002',
      client: 'Client B',
      clientId: 2,
      dossierId: 2,
      dossierStatus: 'Clôturé',
      date: '20/04/2020',
      items: [
        { qty: 2, designation: 'Produit A', price: 300.00, total: 600.00 },
        { qty: 1, designation: 'Produit B', price: 150.00, total: 150.00 },
      ],
      totalHT: 750.00,
    },
  ];

  // Données simulées pour les clients (basées sur clientsPage.jsx)
  const clients = [
    { id: 1, name: 'Cendrillon Ayot', address: '69 rue Nations, 22000 Paris' },
    { id: 2, name: 'Client A', address: '123 Rue Exemple' },
    { id: 3, name: 'Client B', address: '456 Ave Test' },
    { id: 4, name: 'Client C', address: '789 Bd Demo' },
    { id: 5, name: 'Client D', address: '101 Rue Test' },
  ];

  const handleAddFactureChange = (e) => {
    const { name, value } = e.target;
    setNewFacture((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100 w-100 overflow-hidden">
      <div style={{ width: '250px', flexShrink: 0 }}>
        <HeaderCommercial />
      </div>
      <div className="d-md-flex d-flex flex-column flex-grow-1 w-100">
        <main className="flex-grow-1 w-100 mt-5 mt-md-0">
          <NotificationProvider>
            <SousHeader />
            <Container fluid className="p-3 mt-md-0">
              <Card className="shadow-sm border-light">
                <Card.Body>
                  <Row className="mb-3 align-items-end">
                    <Col xs="auto">
                      <FacturesContext.Provider value={{ filters, setFilters }}>
                        <Filters filterConfig={filterConfig} context={FacturesContext} />
                      </FacturesContext.Provider>
                    </Col>
                    <Col className="ms-auto">
                      <Button
                        variant="primary"
                        style={{ backgroundColor: 'orange', borderColor: 'orange', float: 'right' }}
                        onClick={() => setShowAddModal(true)}
                      >
                        <i className="bi bi-plus-lg me-2"></i>Ajouter Facture
                      </Button>
                    </Col>
                  </Row>
                  <FacturesContext.Provider value={{ filters, setFilters }}>
                    <FactureTableCommercial
                      commercialId={commercialId}
                      newFacture={newFacture}
                      setNewFacture={setNewFacture}
                      showAddModal={showAddModal}
                      setShowAddModal={setShowAddModal}
                      commandes={commandes}
                      clients={clients}
                    />
                  </FacturesContext.Provider>
                </Card.Body>
              </Card>
            </Container>
          </NotificationProvider>
        </main>
        <Footer className="mt-auto w-100" />
      </div>
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ color: 'orange' }}>Ajouter une Facture</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Bon de Commande</Form.Label>
              <Form.Select
                name="commandeId"
                value={newFacture.commandeId}
                onChange={handleAddFactureChange}
                required
                style={{ borderColor: 'orange' }}
              >
                <option value="">Sélectionnez un bon de commande</option>
                {commandes.map((commande) => (
                  <option key={commande.id} value={commande.id}>
                    {commande.id} - {commande.client} ({commande.date})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button
              variant="primary"
              type="submit"
              style={{ backgroundColor: 'orange', borderColor: 'orange' }}
              disabled={!newFacture.commandeId}
            >
              Générer Facture
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default FacturePageCommercial;