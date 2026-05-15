import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import HeaderCommercial from '../../components/commercial/headerCommercial.jsx';
import Footer from '../../components/footer';
import SousHeader from '../../components/commercial/sousHeaderCommercial.jsx';
import { NotificationProvider } from '../../components/manager/notificationContext.jsx';
import Filters from '../../components/filters.jsx';
import DossierCommercialTable from '../../components/commercial/dossierTableCommercial.jsx';
import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const DossierCommercialContext = createContext();

const DossierCommercialPage = () => {
  const [filters, setFilters] = useState({
    date: '',
    status: 'Tous',
    client: 'Tous',
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDossier, setNewDossier] = useState({
    name: '',
    client_id: '',
  });
  const [clients, setClients] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [error, setError] = useState('');

  // Récupérer l'ID du commercial depuis localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const commercialId = user?.id;

  // Charger les clients du commercial
  useEffect(() => {
    if (!commercialId) {
      setError('Aucun commercial connecté. Veuillez vous reconnecter.');
      return;
    }

    const fetchClients = async () => {
      try {
        await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
        const response = await axios.get(`http://localhost:8000/api/clients/commercial/${commercialId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        });

        if (Array.isArray(response.data)) {
          setClients(response.data);
        } else {
          setError('Réponse API clients non valide.');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error.response?.data || error.message);
        setError('Une erreur est survenue lors du chargement des clients.');
      }
    };

    fetchClients();
  }, [commercialId]);

  // Charger les dossiers des clients du commercial
  useEffect(() => {
    if (!commercialId) {
      setError('Aucun commercial connecté. Veuillez vous reconnecter.');
      return;
    }

    const fetchDossiers = async () => {
      try {
        await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
        const response = await axios.get(`http://localhost:8000/api/dossiers/commercial/${commercialId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        });

        if (Array.isArray(response.data)) {
          setDossiers(response.data);
        } else {
          setError('Réponse API dossiers non valide.');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des dossiers:', error.response?.data || error.message);
        setError('Une erreur est survenue lors du chargement des dossiers.');
      }
    };

    fetchDossiers();
  }, [commercialId]);

  // Filtrer les dossiers en fonction des filtres
  const filteredDossiers = dossiers.filter((dossier) => {
    const matchesStatus = filters.status === 'Tous' || dossier.statut === filters.status;
    const matchesClient = filters.client === 'Tous' || dossier.client_id === parseInt(filters.client);
    const matchesDate = !filters.date || new Date(dossier.created_at) >= new Date(filters.date);
    return matchesStatus && matchesClient && matchesDate;
  });

  const handleAddDossierChange = (e) => {
    const { name, value } = e.target;
    setNewDossier((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddDossierSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
      const response = await axios.post(
        'http://localhost:8000/api/dossiers',
        {
          nom: newDossier.name,
          client_id: newDossier.client_id,
          statut: 'Nouveau', // Statut par défaut
          etat: 'Demande', // État par défaut
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        }
      );

      // Ajouter le nouveau dossier à la liste
      setDossiers((prev) => [...prev, response.data]);
      setNewDossier({ name: '', client_id: '' });
      setShowAddModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du dossier:', error.response?.data || error.message);
      setError('Une erreur est survenue lors de l\'ajout du dossier.');
    }
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
                  {error && <div className="alert alert-danger">{error}</div>}
                  <Row className="mb-3 align-items-end">
                    <Col xs="auto">
                      <h4 style={{ color: 'orange' }}>Dossiers</h4>
                    </Col>
                    <Col className="ms-auto">
                      <Button
                        variant="primary"
                        style={{ backgroundColor: 'orange', borderColor: 'orange', float: 'right' }}
                        onClick={() => setShowAddModal(true)}
                      >
                        <i className="bi bi-plus-lg me-2"></i>Ajouter Dossier
                      </Button>
                    </Col>
                  </Row>
                  <DossierCommercialContext.Provider value={{ filters, setFilters, dossiers: filteredDossiers, setDossiers }}>
                    <Filters
                      filterConfig={[
                        { name: 'date', label: 'Date', type: 'date' },
                        { name: 'status', label: 'Statut', type: 'select', statusType: 'dossiers' },
                        {
                          name: 'client',
                          label: 'Client',
                          type: 'select',
                          options: clients.map((client) => ({
                            value: client.id,
                            label: client.nom_entreprise,
                          })),
                        },
                      ]}
                      context={DossierCommercialContext}
                    />
                    <DossierCommercialTable
                      commercialId={commercialId}
                      newDossier={newDossier}
                      setNewDossier={setNewDossier}
                      showAddModal={showAddModal}
                      setShowAddModal={setShowAddModal}
                    />
                  </DossierCommercialContext.Provider>
                </Card.Body>
              </Card>
            </Container>
          </NotificationProvider>
        </main>
        <Footer className="mt-auto w-100" />
      </div>
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ color: 'orange' }}>Ajouter un Dossier</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddDossierSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nom du Dossier</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newDossier.name}
                onChange={handleAddDossierChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Client Associé</Form.Label>
              <Form.Select
                name="client_id"
                value={newDossier.client_id}
                onChange={handleAddDossierChange}
                style={{ borderColor: 'orange' }}
                required
              >
                <option value="">Sélectionner un client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom_entreprise}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button
              variant="primary"
              type="submit"
              style={{ backgroundColor: 'orange', borderColor: 'orange' }}
              disabled={!newDossier.name || !newDossier.client_id}
            >
              Enregistrer
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DossierCommercialPage;