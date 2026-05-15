import { Container, Row, Col, Card } from 'react-bootstrap';
import HeaderManager from '../../components/manager/hearderManger.jsx';
import Footer from '../../components/footer';
import SousHeader from '../../components/manager/sousHeaderManager.jsx';
import { NotificationProvider } from '../../components/manager/notificationContext.jsx';
import Filters from '../../components/filters.jsx';
import ClientsTable from '../../components/manager/clientTable.jsx';
import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const ClientsContext = createContext();

const ClientPage = () => {
  const [filters, setFilters] = useState({
    commercial: 'Tous',
    status: 'Tous',
    date: '',
  });
  const [clients, setClients] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  // Charger les clients depuis l'API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
        const response = await axios.get('http://localhost:8000/api/clients', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (Array.isArray(response.data)) {
          console.log('Clients récupérés:', response.data);
          const fetchedClients = response.data.map((client) => ({
            id: client.id,
            name: client.nom_entreprise,
            phone: client.contact,
            address: client.adresse,
            email: client.email,
            commercial: client.commercial?.name || 'Non assigné',
            ca: 0,
            dossiers: 0,
            date: client.created_at,
            status: client.etat,
          }));
          console.log('Clients transformés:', fetchedClients);
          setClients(fetchedClients);

          // Charger les données supplémentaires (CA et dossiers)
          await Promise.all(
            fetchedClients.map(async (client) => {
              try {
                const [dossierResponse, turnoverResponse] = await Promise.all([
                  axios.get(`http://localhost:8000/api/dossiers/count/client/${client.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  }),
                  axios.get(
                    `http://localhost:8000/api/turnover/client/${client.id}?month=${filters.month || new Date().toISOString().slice(0, 7)}`,
                    {
                      headers: { Authorization: `Bearer ${token}` },
                    }
                  ),
                ]);

                setClients((prev) =>
                  prev.map((c) =>
                    c.id === client.id
                      ? {
                          ...c,
                          dossiers: dossierResponse.data.total_dossiers,
                          ca: turnoverResponse.data.chiffre_affaires,
                        }
                      : c
                  )
                );
              } catch (error) {
                console.error(`Erreur pour le client ${client.id}:`, error);
              }
            })
          );
          setDataLoaded(true);
        } else {
          setError('Réponse API clients non valide.');
          setDataLoaded(true);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error.response?.data || error.message);
        setError('Une erreur est survenue lors du chargement des clients.');
        setDataLoaded(true);
      }
    };

    if (token) {
      fetchClients();
    } else {
      setError('Aucun utilisateur connecté. Veuillez vous reconnecter.');
      setDataLoaded(true);
    }
  }, [token]);

  const filterConfig = [
    { name: 'commercial', label: 'Commercial', type: 'select' },
    { name: 'status', label: 'Statut', type: 'select', statusType: 'clients' },
    { name: 'date', label: 'Date', type: 'date' },
  ];

  if (!dataLoaded) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100 w-100 overflow-hidden">
      <div style={{ width: '250px', flexShrink: 0 }}>
        <HeaderManager />
      </div>
      <div className="d-md-flex d-flex flex-column flex-grow-1 w-100">
        <main className="flex-grow-1 w-100 mt-5 mt-md-0">
          <NotificationProvider>
            <SousHeader />
            <Container fluid className="p-3 mt-md-0" style={{ borderColor: 'white' }}>
              <Card className="shadow-sm border-light">
                <Card.Body>
                  {error && <div className="alert alert-danger">{error}</div>}
                  <ClientsContext.Provider value={{ clients, setClients, filters, setFilters }}>
                    <Filters filterConfig={filterConfig} context={ClientsContext} />
                    <ClientsTable />
                  </ClientsContext.Provider>
                </Card.Body>
              </Card>
            </Container>
          </NotificationProvider>
        </main>
        <Footer className="mt-auto w-100" />
      </div>
    </div>
  );
};

export default ClientPage;