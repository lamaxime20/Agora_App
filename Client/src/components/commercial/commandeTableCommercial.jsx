import { Table, Button, Row, Col, Card, Modal, Form, Badge } from 'react-bootstrap';
import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommandesContext } from '../../pages/commercial/commandePageCommercial';
import axios from 'axios';

const CommandeTable = ({ commercialId }) => {
  const { filters } = useContext(CommandesContext);
  const [commandes, setCommandes] = useState([]);
  const [proformas, setProformas] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProforma, setSelectedProforma] = useState(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Charger les bons de commande et les proformas
  useEffect(() => {
    const fetchData = async () => {
      try {
        await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });

        // Charger les bons de commande
        const response = await axios.get('http://localhost:8000/api/bon_commandes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        });
        setCommandes(response.data);
        console.log('Bons de commande chargés:', response.data);

        // Charger les proformas disponibles
        const proformaResponse = await axios.get('http://localhost:8000/api/proformas', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        });
        setProformas(proformaResponse.data);
        console.log('Proformas chargés:', proformaResponse.data);
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message;
        console.error('Erreur lors du chargement des données:', errorMessage);
        setError(`Erreur lors du chargement des données: ${JSON.stringify(errorMessage)}`);
      }
    };
    fetchData();
  }, []);

  const handleAddCommande = async () => {
    if (selectedProforma && deliveryDate) {
      try {
        await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });

        const formData = new FormData();
        formData.append('proforma_id', selectedProforma);
        formData.append('date_livraison_prevue', deliveryDate);
        formData.append('statut_livraison', 'En attente de livraison');

        const response = await axios.post('http://localhost:8000/api/bon_commandes', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        });

        setCommandes([...commandes, response.data]);
        setShowAddModal(false);
        setSelectedProforma(null);
        setDeliveryDate('');

        // Télécharger le PDF généré
        const pdfResponse = await axios.get(`http://localhost:8000/api/bon_commandes/${response.data.id}/generatePdf`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bon-commande-${response.data.id}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.response?.data?.errors || err.message;
        console.error('Erreur lors de la création du bon de commande:', errorMessage);
        setError(`Une erreur est survenue lors de la création du bon de commande: ${JSON.stringify(errorMessage)}`);
      }
    } else {
      setError('Veuillez sélectionner un proforma et une date de livraison.');
    }
  };

  const filteredCommandes = commandes.filter((commande) => {
    const matchesDate = !filters.date || new Date(commande.date_livraison_prevue) >= new Date(filters.date);
    const matchesClient = filters.client === 'Tous' || commande.proforma?.dossier?.client?.nom_entreprise === filters.client;
    return matchesDate && matchesClient;
  });

  const handleViewDetails = (commande) => {
    setSelectedCommande(commande);
  };

  const getStatusBadgeVariant = (statut) => {
    switch (statut) {
      case 'En attente de livraison':
        return 'warning';
      case 'Livraison dans les délais':
        return 'success';
      case 'Livraison hors délais':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {selectedCommande ? (
        <div>
          <Button variant="secondary" onClick={() => setSelectedCommande(null)} className="mb-3">
            <i className="bi bi-arrow-left me-2"></i> Retour
          </Button>
          <Row>
            <Col xs={12} md={12}>
              <Card className="shadow-sm" style={{ borderColor: 'orange', minHeight: '450px' }}>
                <Card.Body>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2>Bon de Commande</h2>
                  </div>
                  <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                    <p><strong>Client :</strong> {selectedCommande.proforma?.dossier?.client?.nom_entreprise}</p>
                    <p><strong>Adresse :</strong> {selectedCommande.proforma?.dossier?.client?.adresse}</p>
                    <p><strong>Email :</strong> {selectedCommande.proforma?.dossier?.client?.email}</p>
                    <p><strong>Téléphone :</strong> {selectedCommande.proforma?.dossier?.client?.contact}</p>
                  </div>
                  <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                    <p><strong>N° de commande :</strong> {selectedCommande.id}</p>
                    <p><strong>Proforma associé :</strong> {selectedCommande.proforma_id}</p>
                    <p><strong>Date de livraison :</strong> {new Date(selectedCommande.date_livraison_prevue).toLocaleDateString('fr-FR')}</p>
                    <p><strong>Statut livraison :</strong> <Badge bg={getStatusBadgeVariant(selectedCommande.statut_livraison)}>{selectedCommande.statut_livraison}</Badge></p>
                  </div>
                  <Table bordered>
                    <thead>
                      <tr>
                        <th>Réf</th>
                        <th>Désignation</th>
                        <th>PU HT</th>
                        <th>Quantité</th>
                        <th>Prix HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCommande.proforma?.ligne_proformas?.map((item, index) => (
                        <tr key={index}>
                          <td>REF{String(index + 1).padStart(3, '0')}</td>
                          <td>{item.designation}</td>
                          <td>{item.prix_unitaire} {selectedCommande.proforma?.currency}</td>
                          <td>{item.quantite}</td>
                          <td>{item.prix_unitaire * item.quantite} {selectedCommande.proforma?.currency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <div style={{ textAlign: 'right', marginTop: '10px' }}>
                    <p><strong>Total HT :</strong> {selectedCommande.proforma?.total_ttc} {selectedCommande.proforma?.currency}</p>
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <p><strong>Fait à :</strong> Besançon</p>
                    <p><strong>Date :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
                    <p><strong>Nom du signataire :</strong> Jean Dupont</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      ) : filteredCommandes.length === 0 ? (
        <p>Aucune commande trouvée avec les filtres actuels.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Row>
            <Col>
              <Button
                variant="primary"
                style={{ backgroundColor: 'orange', borderColor: 'orange', float: 'right' }}
                onClick={() => setShowAddModal(true)}
              >
                <i className="bi bi-plus-lg me-2"></i>Ajouter Bon de Commande
              </Button>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Client</th>
                    <th>Dossier</th>
                    <th>Date de livraison</th>
                    <th>Total HT</th>
                    <th>Statut livraison</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCommandes.map((commande) => (
                    <tr key={commande.id} onClick={() => handleViewDetails(commande)} style={{ cursor: 'pointer' }}>
                      <td>{commande.id}</td>
                      <td>{commande.proforma?.dossier?.client?.nom_entreprise || 'Client non chargé'}</td>
                      <td>{commande.proforma?.dossier?.nom || 'Dossier non chargé'}</td>
                      <td>{new Date(commande.date_livraison_prevue).toLocaleDateString('fr-FR')}</td>
                      <td>{commande.proforma?.total_ttc} {commande.proforma?.currency}</td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(commande.statut_livraison)}>
                          {commande.statut_livraison}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        </div>
      )}
      <Modal show={showAddModal} onHide={() => { setShowAddModal(false); setSelectedProforma(null); setDeliveryDate(''); }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ color: 'orange' }}>Ajouter un Bon de Commande</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Sélectionner un Proforma</Form.Label>
              <Form.Select
                value={selectedProforma || ''}
                onChange={(e) => setSelectedProforma(e.target.value)}
                style={{ borderColor: 'orange' }}
              >
                <option value="">Choisir un proforma</option>
                {proformas.map((proforma) => (
                  <option key={proforma.id} value={proforma.id}>
                    {proforma.id} - {proforma.dossier?.client?.nom_entreprise} - {proforma.dossier?.nom}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date de livraison prévue</Form.Label>
              <Form.Control
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                style={{ borderColor: 'orange' }}
              />
            </Form.Group>
            {selectedProforma && (
              <div>
                <h5>Informations du Proforma</h5>
                {proformas.find((p) => p.id === selectedProforma)?.ligne_proformas?.map((item, index) => (
                  <Row key={item.designation} className="mb-2">
                    <Col md={4}>
                      <Form.Label>{item.designation}</Form.Label>
                    </Col>
                    <Col md={2}>
                      <Form.Label>{item.quantite}</Form.Label>
                    </Col>
                    <Col md={2}>
                      <Form.Label>{item.prix_unitaire} {proformas.find((p) => p.id === selectedProforma).currency}</Form.Label>
                    </Col>
                    <Col md={4}>
                      <Form.Label>{item.prix_unitaire * item.quantite} {proformas.find((p) => p.id === selectedProforma).currency}</Form.Label>
                    </Col>
                  </Row>
                ))}
                <div style={{ textAlign: 'right', marginTop: '10px' }}>
                  <strong>Total HT : {proformas.find((p) => p.id === selectedProforma)?.total_ttc} {proformas.find((p) => p.id === selectedProforma)?.currency}</strong>
                </div>
              </div>
            )}
            <Button
              variant="primary"
              type="button"
              style={{ backgroundColor: 'orange', borderColor: 'orange' }}
              onClick={handleAddCommande}
              disabled={!selectedProforma || !deliveryDate}
            >
              Ajouter
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CommandeTable;