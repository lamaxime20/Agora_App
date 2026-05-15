import { Table, Button, Row, Col, Card, ListGroup, Badge, Modal } from 'react-bootstrap';
import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DossierContext } from '../../pages/manager/dossiersPage.jsx';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const DossierTable = () => {
  const { filters } = useContext(DossierContext);
  const [dossiers, setDossiers] = useState([]);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Charger les dossiers depuis l'API
  useEffect(() => {
    const fetchDossiers = async () => {
      try {
        await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
        const response = await axios.get('http://localhost:8000/api/dossiers', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (Array.isArray(response.data)) {
          console.log('Dossiers récupérés:', response.data);
          // Normaliser les données
          const normalizedDossiers = response.data.map((dossier) => ({
            ...dossier,
            documents: Array.isArray(dossier.documents)
              ? dossier.documents
              : typeof dossier.documents === 'string'
              ? JSON.parse(dossier.documents || '[]')
              : [],
          }));
          console.log('Dossiers normalisés:', normalizedDossiers);
          setDossiers(normalizedDossiers);
        } else {
          console.error('Réponse API dossiers non valide:', response.data);
          setError('Réponse API dossiers non valide.');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des dossiers:', error.response?.data || error.message);
        setError('Une erreur est survenue lors du chargement des dossiers.');
      }
    };

    if (token) {
      fetchDossiers();
    } else {
      setError('Aucun utilisateur connecté. Veuillez vous reconnecter.');
    }
  }, [token]);

  // Filtrage global
  const filteredDossiers = dossiers.filter((dossier) => {
    const matchesDate = !filters.date || new Date(dossier.created_at) >= new Date(filters.date);
    const matchesStatus = filters.status === 'Tous' || dossier.statut === filters.status;
    const matchesCommercial = filters.commercial === 'Tous' || dossier.commercial?.name === filters.commercial;
    const matchesClient = filters.client === 'Tous' || dossier.client?.nom_entreprise === filters.client;
    console.log(`Dossier ${dossier.nom}:`, { matchesDate, matchesStatus, matchesCommercial, matchesClient });
    return matchesDate && matchesStatus && matchesCommercial && matchesClient;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) {
      try {
        await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
        await axios.delete(`http://localhost:8000/api/dossiers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setDossiers((prev) => prev.filter((dossier) => dossier.id !== id));
        setSelectedDossier(null);
      } catch (error) {
        console.error('Erreur lors de la suppression du dossier:', error.response?.data || error.message);
        setError('Une erreur est survenue lors de la suppression du dossier.');
      }
    }
  };

  const handleExportDocument = async (doc) => {
    if (doc?.type === 'Proforma') {
      try {
        const response = await axios.get(`http://localhost:8000/api/proformas/${doc.id}/generatePdf`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `proforma-${doc.id}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        console.error('Erreur lors du téléchargement du document:', errorMessage);
        setError(`Une erreur est survenue lors du téléchargement du document : ${JSON.stringify(errorMessage)}`);
      }
    }
  };

  const getStatusBadgeVariant = (statut) => {
    switch (statut) {
      case 'Nouveau':
        return 'primary';
      case 'Encours':
        return 'warning';
      case 'Cloturé':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const timelineData = selectedDossier
    ? {
        labels: ['Demande', 'Proforma', 'Bon de Commande', 'Facturation', 'Livraison'],
        datasets: [
          {
            label: 'Progression',
            data: ['Demande', 'Proforma', 'Bon de Commande', 'Facturation', 'Terminé'].map(
              (step, index) => (step === selectedDossier.etat ? 1 : 0)
            ),
            backgroundColor: ['Demande', 'Proforma', 'Bon de Commande', 'Facturation', 'Terminé'].map(
              (step, index) =>
                step === selectedDossier.etat
                  ? 'orange'
                  : index < ['Demande', 'Proforma', 'Bon de Commande', 'Facturation', 'Terminé'].indexOf(selectedDossier.etat)
                  ? 'green'
                  : 'grey'
            ),
            borderColor: 'transparent',
            pointRadius: 10,
          },
        ],
      }
    : null;

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {selectedDossier ? (
        <div>
          <Button variant="secondary" onClick={() => setSelectedDossier(null)} className="mb-3">
            <i className="bi bi-arrow-left me-2"></i> Retour
          </Button>
          <Row>
            <Col xs={12} md={8}>
              <h5 style={{ color: 'orange' }}>État du dossier</h5>
              <div style={{ height: '150px' }}>
                <Line
                  data={timelineData}
                  options={{
                    maintainAspectRatio: false,
                    scales: { y: { display: false } },
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
              <Row className="mt-4">
                <Col>
                  <h5 style={{ color: 'orange' }}>Documents</h5>
                  <ListGroup>
                    {Array.isArray(selectedDossier?.documents)
                      ? selectedDossier.documents.map((doc) => (
                          <ListGroup.Item
                            key={doc.id}
                            action
                            onClick={() => doc.type === 'Proforma' && setSelectedDocument(doc)}
                            style={{ cursor: doc.type === 'Proforma' ? 'pointer' : 'default' }}
                          >
                            {doc.type} - {doc.file}
                          </ListGroup.Item>
                        ))
                      : <ListGroup.Item>Aucun document disponible</ListGroup.Item>}
                  </ListGroup>
                </Col>
              </Row>
            </Col>
            <Col xs={12} md={4}>
              <Card className="shadow-sm mt-2" style={{ borderColor: 'orange' }}>
                <Card.Body>
                  <Card.Title style={{ color: 'orange' }}>Informations Client</Card.Title>
                  <p>Nom : <strong>{selectedDossier.client?.nom_entreprise || 'N/A'}</strong></p>
                  <p>Contact : <strong>{selectedDossier.client?.contact || 'N/A'}</strong></p>
                  <p>Email : <strong>{selectedDossier.client?.email || 'N/A'}</strong></p>
                  <p>Adresse : <strong>{selectedDossier.client?.adresse || 'N/A'}</strong></p>
                  <p>
                    Statut Facture :{' '}
                    <strong>
                      <Badge bg={selectedDossier.facture_statut === 'Payé' ? 'success' : 'danger'}>
                        {selectedDossier.facture_statut || 'N/A'}
                      </Badge>
                    </strong>
                  </p>
                  <p>
                    Statut Livraison :{' '}
                    <strong>
                      <Badge
                        bg={
                          selectedDossier.livraison_statut === 'Dans les délais' ||
                          selectedDossier.livraison_statut === 'Livré'
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {selectedDossier.livraison_statut || 'N/A'}
                      </Badge>
                    </strong>
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Modal show={!!selectedDocument} onHide={() => setSelectedDocument(null)}>
            <Modal.Header closeButton>
              <Modal.Title>Détails du Document</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>Type: {selectedDocument?.type}</p>
              <p>Fichier: {selectedDocument?.file}</p>
              {selectedDocument?.type === 'Proforma' && (
                <ListGroup>
                  {selectedDocument.products?.map((product, index) => (
                    <ListGroup.Item key={index}>
                      {product.designation} ({product.quantite} x {product.prix_unitaire}) :{' '}
                      {parseFloat(product.prix_unitaire) * parseInt(product.quantite)} {selectedDocument.currency}
                    </ListGroup.Item>
                  ))}
                  <ListGroup.Item>
                    <strong>
                      Total: {selectedDocument.totalPrice} {selectedDocument.currency}
                    </strong>
                  </ListGroup.Item>
                </ListGroup>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="primary"
                style={{ backgroundColor: 'orange', borderColor: 'orange' }}
                onClick={() => handleExportDocument(selectedDocument)}
              >
                Télécharger
              </Button>
              <Button variant="secondary" onClick={() => setSelectedDocument(null)}>
                Fermer
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      ) : filteredDossiers.length === 0 ? (
        <p>Aucun dossier trouvé avec les filtres actuels.</p>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom du dossier</th>
              <th>Client</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDossiers.map((dossier) => (
              <tr key={dossier.id}>
                <td>{dossier.id}</td>
                <td>{dossier.nom}</td>
                <td>{dossier.client?.nom_entreprise || 'N/A'}</td>
                <td>
                  <Badge bg={getStatusBadgeVariant(dossier.statut)}>{dossier.statut}</Badge>
                </td>
                <td>{new Date(dossier.created_at).toLocaleDateString('fr-FR')}</td>
                <td>
                  <Button variant="link" onClick={() => setSelectedDossier(dossier)}>
                    <i className="bi bi-eye" style={{ color: 'orange' }}></i>
                  </Button>
                  <Button variant="link" onClick={() => handleDelete(dossier.id)}>
                    <i className="bi bi-trash" style={{ color: '#dc3545' }}></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default DossierTable;