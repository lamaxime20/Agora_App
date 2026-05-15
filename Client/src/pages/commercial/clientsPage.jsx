import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import HeaderCommercial from '../../components/commercial/headerCommercial.jsx';
import Footer from '../../components/footer';
import SousHeaderCommercial from '../../components/commercial/sousHeaderCommercial.jsx';
import { NotificationProvider } from '../../components/manager/notificationContext.jsx';
import Filters from '../../components/filters.jsx';
import ClientsTableCommercial from '../../components/commercial/clientTable.jsx';
import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ClientsContext = createContext();

const ClientsPageCommercial = () => {
  const [filters, setFilters] = useState({
    status: 'Tous',
    date: '',
    month: new Date().toISOString().slice(0, 7), // Mois courant par défaut (YYYY-MM)
  });
  const [clients, setClients] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({
    nom_entreprise: '',
    contact: '',
    email: '',
    adresse: '',
  });
  const [currency, setCurrency] = useState('FCFA');
  const [error, setError] = useState('');

  // Récupérer l'ID du commercial depuis localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const commercialId = user?.id;

  // Taux de conversion (exemple, à ajuster)
  const conversionRates = {
    FCFA: 1,
    USD: 0.0016, // 1 FCFA ≈ 0.0016 USD
    EUR: 0.0015, // 1 FCFA ≈ 0.0015 EUR
  };

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
          const fetchedClients = response.data.map((client) => ({
            id: client.id,
            nom_entreprise: client.nom_entreprise,
            contact: client.contact,
            email: client.email,
            adresse: client.adresse,
            commercial: client.commercial?.name || 'Non assigné',
            ca: 0, // Initialisé, sera mis à jour via l'API turnover
            dossiers: 0, // Initialisé, sera mis à jour via l'API count
            created_at: client.created_at,
            etat: client.etat,
          }));
          setClients(fetchedClients);
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

  // Charger les chiffres d'affaires et le nombre de dossiers
  useEffect(() => {
    if (!clients.length) return;

    clients.forEach((client) => {
      // Nombre de dossiers
      axios
        .get(`http://localhost:8000/api/dossiers/count/client/${client.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        .then((response) =>
          setClients((prev) =>
            prev.map((c) =>
              c.id === client.id ? { ...c, dossiers: response.data.total_dossiers } : c
            )
          )
        )
        .catch((error) => console.error('Erreur lors du chargement du nombre de dossiers:', error));

      // Chiffre d'affaires mensuel
      axios
        .get(`http://localhost:8000/api/turnover/client/${client.id}?month=${filters.month}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        .then((response) =>
          setClients((prev) =>
            prev.map((c) =>
              c.id === client.id ? { ...c, ca: response.data.chiffre_affaires } : c
            )
          )
        )
        .catch((error) => console.error('Erreur lors du chargement du CA:', error));
    });
  }, [clients, filters.month]);

  // Filtrer les clients en fonction des filtres
  const filteredClients = clients.filter((client) => {
    const matchesStatus = filters.status === 'Tous' || client.etat === filters.status;
    const matchesDate = !filters.date || new Date(client.created_at) >= new Date(filters.date);
    return matchesStatus && matchesDate;
  });

  const handleAddClientChange = (e) => {
    const { name, value } = e.target;
    setNewClient((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClientSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
      const response = await axios.post(
        'http://localhost:8000/api/clients',
        {
          nom_entreprise: newClient.nom_entreprise,
          contact: newClient.contact,
          email: newClient.email,
          adresse: newClient.adresse,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        }
      );

      const client = {
        id: response.data.id,
        nom_entreprise: response.data.nom_entreprise,
        contact: response.data.contact,
        email: response.data.email,
        adresse: response.data.adresse,
        commercial: response.data.commercial?.name || 'Non assigné',
        ca: 0,
        dossiers: 0,
        created_at: response.data.created_at,
        etat: response.data.etat,
      };

      setClients((prev) => [...prev, client]);
      setNewClient({
        nom_entreprise: '',
        contact: '',
        email: '',
        adresse: '',
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du client:', error.response?.data || error.message);
      setError('Une erreur est survenue lors de l\'ajout du client.');
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
            <SousHeaderCommercial />
            <Container fluid className="p-3 mt-md-0" style={{ borderColor: 'white' }}>
              <Card className="shadow-sm border-light">
                <Card.Body>
                  {error && <div className="alert alert-danger">{error}</div>}
                  <ClientsContext.Provider value={{ clients: filteredClients, setClients, filters, setFilters }}>
                    <Row className="mb-3 align-items-end">
                      <Col xs="auto">
                        <Filters
                          filterConfig={[
                            { name: 'status', label: 'Statut', type: 'select', statusType: 'clients' },
                            { name: 'date', label: 'Date', type: 'date' },
                          ]}
                          context={ClientsContext}
                        />
                      </Col>
                      <Col ms="auto">
                        <Form.Group>
                          <Form.Label>Devise</Form.Label>
                          <Form.Select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            style={{ borderColor: 'orange' }}
                          >
                            <option value="FCFA">FCFA</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col className="ms-auto">
                        <Button
                          variant="primary"
                          onClick={() => setShowAddModal(true)}
                          style={{ backgroundColor: 'orange', borderColor: 'orange', float: 'right' }}
                        >
                          Ajouter un client
                        </Button>
                      </Col>
                    </Row>
                    <ClientsTableCommercial conversionRates={conversionRates} currency={currency} />
                  </ClientsContext.Provider>
                </Card.Body>
              </Card>
            </Container>
          </NotificationProvider>
        </main>
        <Footer className="mt-auto w-100" />
      </div>
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ color: 'orange' }}>Ajouter un nouveau client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddClientSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nom de l'entreprise</Form.Label>
              <Form.Control
                type="text"
                name="nom_entreprise"
                value={newClient.nom_entreprise}
                onChange={handleAddClientChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contact</Form.Label>
              <Form.Control
                type="tel"
                name="contact"
                value={newClient.contact}
                onChange={handleAddClientChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Adresse mail</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={newClient.email}
                onChange={handleAddClientChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Adresse</Form.Label>
              <Form.Control
                type="text"
                name="adresse"
                value={newClient.adresse}
                onChange={handleAddClientChange}
                required
              />
            </Form.Group>
            <Button
              variant="primary"
              type="submit"
              style={{ backgroundColor: 'orange', borderColor: 'orange' }}
            >
              Ajouter
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ClientsPageCommercial;