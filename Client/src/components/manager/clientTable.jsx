import { Table, Button, Modal, Card, Row, Col, Badge } from 'react-bootstrap';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientsContext } from '../../pages/manager/clientPage.jsx';
import axios from 'axios';

const ClientsTable = () => {
  const { clients, setClients, filters } = useContext(ClientsContext);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [dossiers, setDossiers] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Charger les dossiers
  useEffect(() => {
    const fetchDossiers = async () => {
      try {
        await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
        const response = await axios.get('http://localhost:8000/api/dossiers', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (Array.isArray(response.data)) {
          setDossiers(response.data);
        } else {
          console.error('Réponse API dossiers non valide:', response.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des dossiers:', error);
      }
    };

    if (token) {
      fetchDossiers();
    }
  }, [token]);

  console.log('Clients:', clients);
  console.log('Filters:', filters);
  const filteredClients = clients.filter((client) => {
    const matchesCommercial = filters.commercial === 'Tous' || client.commercial === filters.commercial;
    const matchesStatus = filters.status === 'Tous' || client.status === filters.status;
    const matchesDate = !filters.date || new Date(client.date) >= new Date(filters.date);
    console.log(`Client ${client.name}:`, { matchesCommercial, matchesStatus, matchesDate });
    return matchesCommercial && matchesStatus && matchesDate;
  });
  console.log('Filtered Clients:', filteredClients);

  const handleDetails = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
        await axios.delete(`http://localhost:8000/api/clients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setClients((prev) => {
          const updatedClients = prev.filter((client) => client.id !== id);
          return updatedClients;
        });
        setShowModal(false);
      } catch (error) {
        console.error('Erreur lors de la suppression du client:', error.response?.data || error.message);
      }
    }
  };

  const handleDossierClick = (dossierId) => {
    navigate(`/manager/dossiers/${dossierId}`);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Prospect':
        return 'warning';
      case 'Client':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <div>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Commercial</th>
            <th>CA</th>
            <th>Dossiers</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center">
                Aucun client disponible pour ces filtres.
              </td>
            </tr>
          ) : (
            filteredClients.map((client) => (
              <tr key={client.id}>
                <td>{client.name}</td>
                <td>{client.commercial}</td>
                <td>{client.ca ? `${client.ca} FCFA` : 'N/A'}</td>
                <td>{client.dossiers ?? 'N/A'}</td>
                <td>{client.date ? new Date(client.date).toLocaleDateString('fr-FR') : ''}</td>
                <td>
                  <Button variant="link" onClick={() => handleDetails(client)}>
                    <i className="bi bi-eye" style={{ color: 'orange' }}></i>
                  </Button>
                  <Button variant="link" onClick={() => handleDelete(client.id)}>
                    <i className="bi bi-trash" style={{ color: '#dc3545' }}></i>
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ color: 'orange' }}>Détails du Client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClient && (
            <Row className="g-3">
              <Col md={4}>
                <Card className="shadow-sm" style={{ borderColor: 'orange' }}>
                  <Card.Body>
                    <p>
                      Nom : <strong>{selectedClient.name}</strong>
                    </p>
                    <p>
                      Téléphone : <strong>{selectedClient.phone}</strong>
                    </p>
                    <p>
                      Mail : <strong>{selectedClient.email}</strong>
                    </p>
                    <p>
                      Adresse : <strong>{selectedClient.address}</strong>
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={5}>
                <Card className="shadow-sm" style={{ borderColor: 'orange' }}>
                  <Card.Body>
                    <p>
                      Commercial chargé : <strong>{selectedClient.commercial}</strong>
                    </p>
                    <p>
                      Date inscription :{' '}
                      <strong>
                        {selectedClient.date
                          ? new Date(selectedClient.date).toLocaleDateString('fr-FR')
                          : ''}
                      </strong>
                    </p>
                    <p>
                      Chiffre d'affaires :{' '}
                      <strong>{selectedClient.ca ? `${selectedClient.ca} FCFA` : 'N/A'}</strong>
                    </p>
                    <p>
                      Statut :{' '}
                      <strong>
                        <Badge bg={getStatusBadgeVariant(selectedClient.status)}>
                          {selectedClient.status}
                        </Badge>
                      </strong>
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm" style={{ borderColor: 'orange' }}>
                  <Card.Body>
                    <p>
                      Nombre total de dossiers :{' '}
                      <strong>{selectedClient.dossiers ?? 'N/A'}</strong>
                    </p>
                    <ul className="list-unstyled">
                      {dossiers
                        .filter((d) => d.client_id === selectedClient.id)
                        .map((dossier) => (
                          <li key={dossier.id}>
                            <span
                              style={{ cursor: 'pointer', color: '#007bff' }}
                              onClick={() => handleDossierClick(dossier.id)}
                            >
                              {dossier.nom} -{' '}
                              <Badge bg={getStatusBadgeVariant(dossier.statut)}>
                                {dossier.statut}
                              </Badge>
                            </span>
                          </li>
                        ))}
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => handleDelete(selectedClient?.id)}>
            Supprimer le client
          </Button>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClientsTable;