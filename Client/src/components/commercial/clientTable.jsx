import { Table, Modal, Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientsContext } from '../../pages/commercial/clientsPage.jsx';
import axios from 'axios';

const ClientsTableCommercial = ({ conversionRates, currency }) => {
  const { clients } = useContext(ClientsContext);
  const [dossiers, setDossiers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const navigate = useNavigate();

  // Charger les dossiers
  useEffect(() => {
    axios
      .get('http://localhost:8000/api/dossiers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        if (Array.isArray(response.data)) {
          setDossiers(response.data);
        } else {
          console.error('Réponse API dossiers non valide:', response.data);
        }
      })
      .catch((error) => console.error('Erreur lors du chargement des dossiers:', error));
  }, []);

  const handleRowClick = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleDossierClick = (dossierId) => {
    navigate(`/commercial/dossiers/${dossierId}`);
  };

  // Convertir le chiffre d'affaires en fonction de la devise
  const convertTurnover = (ca) => {
    if (!ca && ca !== 0) return 'Chargement...';
    const converted = (ca * conversionRates[currency]).toFixed(2);
    return `${converted} ${currency}`;
  };

  // Définir les variantes de badge pour les statuts des clients
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
            <th>Statut du client</th>
            <th>Chiffre d'affaires</th>
            <th>Dossiers</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(clients) &&
            clients.map((client) => (
              <tr
                key={client.id}
                onClick={() => handleRowClick(client)}
                style={{ cursor: 'pointer' }}
              >
                <td>{client.nom_entreprise}</td>
                <td>
                  <Badge bg={getStatusBadgeVariant(client.etat)}>
                    {client.etat}
                  </Badge>
                </td>
                <td>{convertTurnover(client.ca)}</td>
                <td>{client.dossiers ?? 'Chargement...'}</td>
                <td>{client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : ''}</td>
              </tr>
            ))}
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
                      Nom : <strong>{selectedClient.nom_entreprise}</strong>
                    </p>
                    <p>
                      Téléphone : <strong>{selectedClient.contact}</strong>
                    </p>
                    <p>
                      Mail : <strong>{selectedClient.email}</strong>
                    </p>
                    <p>
                      Adresse : <strong>{selectedClient.adresse}</strong>
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={5}>
                <Card className="shadow-sm" style={{ borderColor: 'orange' }}>
                  <Card.Body>
                    <p>
                      Commercial chargé :{' '}
                      <strong>{selectedClient.commercial || 'Non assigné'}</strong>
                    </p>
                    <p>
                      Date inscription :{' '}
                      <strong>
                        {selectedClient.created_at
                          ? new Date(selectedClient.created_at).toLocaleDateString('fr-FR')
                          : ''}
                      </strong>
                    </p>
                    <p>
                      Chiffre d'affaires :{' '}
                      <strong>{convertTurnover(selectedClient.ca)}</strong>
                    </p>
                    <p>
                      Statut :{' '}
                      <strong>
                        <Badge bg={getStatusBadgeVariant(selectedClient.etat)}>
                          {selectedClient.etat}
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
                      <strong>{selectedClient.dossiers ?? 'Chargement...'}</strong>
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
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClientsTableCommercial;