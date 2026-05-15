import { Table, Button, Modal, Card, Row, Col, ListGroup, Badge, Form } from 'react-bootstrap';
import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DossierCommercialContext } from '../../pages/commercial/dossierPageCommercial';
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

const DossierCommercialTable = ({ commercialId }) => {
  const { dossiers, setDossiers } = useContext(DossierCommercialContext);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [showProformaModal, setShowProformaModal] = useState(false);
  const [showCommandeModal, setShowCommandeModal] = useState(false);
  const [proformaProducts, setProformaProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', quantity: '', currency: 'FCFA' });
  const [newCommande, setNewCommande] = useState({ fichier_scan: null });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [error, setError] = useState('');
  const [hasProforma, setHasProforma] = useState(false);
  const [documents, setDocuments] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Charger les documents (proformas et bons de commande) pour le dossier sélectionné
  useEffect(() => {
    const fetchDocuments = async () => {
      if (selectedDossier) {
        try {
          await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });

          // Récupérer les proformas
          const proformaResponse = await axios.get(`http://localhost:8000/api/proformas/dossier/${selectedDossier.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            withCredentials: true,
          });
          console.log('Réponse de /api/proformas/dossier:', proformaResponse.data);
          const proformas = proformaResponse.data.exists
            ? [
                {
                  id: proformaResponse.data.id,
                  type: 'Proforma',
                  file: `proforma-${proformaResponse.data.id}.pdf`,
                  products: proformaResponse.data.ligne_proformas?.map((ligne) => ({
                    designation: ligne.designation,
                    quantite: ligne.quantite,
                    prix_unitaire: ligne.prix_unitaire,
                  })) || [],
                  totalPrice: proformaResponse.data.total_ttc,
                  currency: proformaResponse.data.currency,
                },
              ]
            : [];

          // Récupérer les bons de commande
          const bonCommandeResponse = await axios.get(`http://localhost:8000/api/bon_commandes/dossier/${selectedDossier.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            withCredentials: true,
          });
          console.log('Réponse de /api/bon_commandes/dossier:', bonCommandeResponse.data);
          const bons = bonCommandeResponse.data;

          setDocuments([...proformas, ...bons]);
          setHasProforma(proformaResponse.data.exists);
          console.log('Documents chargés:', [...proformas, ...bons]);
        } catch (error) {
          console.error('Erreur lors du chargement des documents:', error.message);
          setError('Erreur lors du chargement des documents.');
        }
      }
    };
    fetchDocuments();
  }, [selectedDossier]);

  // Pré-remplir le dossier si dossierId est passé via l'état de navigation
  useEffect(() => {
    if (location.state?.dossierId) {
      const dossier = dossiers.find((d) => d.id === location.state.dossierId);
      if (dossier) {
        setSelectedDossier(dossier);
        setShowCommandeModal(true);
      }
    }
  }, [location.state, dossiers]);

  const handleGenerateProforma = async (currency) => {
    if (proformaProducts.length > 0 && selectedDossier) {
      try {
        await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });

        // Créer la proforma
        const response = await axios.post(
          'http://localhost:8000/api/proformas',
          {
            dossier_id: selectedDossier.id,
            lignes: proformaProducts.map((product) => ({
              id: product.id,
              designation: product.name,
              quantite: product.quantity,
              prix_unitaire: product.price,
            })),
            currency: currency,
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            withCredentials: true,
          }
        );

        const proformaId = response.data.id;

        // Générer et télécharger le PDF
        const pdfResponse = await axios.get(`http://localhost:8000/api/proformas/${proformaId}/generatePdf`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `proforma-${proformaId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Recharger les dossiers
        const updatedDossiersResponse = await axios.get(`http://localhost:8000/api/dossiers/commercial/${commercialId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        });
        setDossiers(updatedDossiersResponse.data);

        // Recharger le dossier sélectionné
        const dossierResponse = await axios.get(`http://localhost:8000/api/dossiers/${selectedDossier.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        });
        setSelectedDossier(dossierResponse.data);

        setProformaProducts([]);
        setShowProformaModal(false);
        setHasProforma(true);
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.response?.data?.errors || error.message;
        console.error('Erreur lors de la création du proforma:', errorMessage);
        setError(`Une erreur est survenue lors de la création du proforma : ${JSON.stringify(errorMessage)}`);
      }
    }
  };

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price && newProduct.quantity) {
      const newId = Date.now() + Math.random();
      setProformaProducts([...proformaProducts, { ...newProduct, id: newId }]);
      setNewProduct({ name: '', price: '', quantity: '', currency: newProduct.currency });
    }
  };

  const handleAddCommande = async () => {
    if (selectedDossier && newCommande.fichier_scan) {
      try {
        await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });

        // Récupérer le proforma
        const proformaResponse = await axios.get(`http://localhost:8000/api/proformas/dossier/${selectedDossier.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        });
        console.log('Réponse de /api/proformas/dossier dans handleAddCommande:', proformaResponse.data);

        if (!proformaResponse.data.exists || !proformaResponse.data.id) {
          setError('Aucun proforma valide trouvé pour ce dossier.');
          console.error('Aucun proforma valide trouvé', { dossier_id: selectedDossier.id });
          return;
        }
        const proformaId = proformaResponse.data.id;

        const formData = new FormData();
        formData.append('proforma_id', proformaId);
        formData.append('fichier_scan', newCommande.fichier_scan);
        const dateLivraison = new Date();
        dateLivraison.setDate(dateLivraison.getDate() + 15);
        formData.append('date_livraison_prevue', dateLivraison.toISOString().split('T')[0]);

        console.log('FormData contents:');
        for (let pair of formData.entries()) {
          console.log(`${pair[0]}: ${pair[1]}`);
        }

        const response = await axios.post('http://localhost:8000/api/bon_commandes', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        });

        console.log('BonCommande response:', response.data);

        // Recharger le dossier sélectionné
        const dossierResponse = await axios.get(`http://localhost:8000/api/dossiers/${selectedDossier.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        });
        console.log('Dossier rechargé:', dossierResponse.data);
        setSelectedDossier(dossierResponse.data);

        // Recharger tous les dossiers
        const updatedDossiersResponse = await axios.get(`http://localhost:8000/api/dossiers/commercial/${commercialId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        });
        setDossiers(updatedDossiersResponse.data);

        // Recharger les documents
        const bonCommandeResponse = await axios.get(`http://localhost:8000/api/bon_commandes/dossier/${selectedDossier.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        });
        setDocuments((prev) => [...prev.filter((doc) => doc.type !== 'Bon de Commande'), ...bonCommandeResponse.data]);

        setNewCommande({ fichier_scan: null });
        setShowCommandeModal(false);

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
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.response?.data?.errors || error.message;
        console.error('Erreur lors de la création du bon de commande:', errorMessage);
        setError(`Une erreur est survenue lors de la création du bon de commande : ${JSON.stringify(errorMessage)}`);
      }
    } else {
      setError('Veuillez téléverser un fichier PDF.');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (selectedDossier && selectedDocument?.type === 'Proforma') {
      try {
        await axios.delete(`http://localhost:8000/api/proformas/${docId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        });
        setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
        setSelectedDocument(null);
        setHasProforma(false);

        // Recharger le dossier sélectionné
        const dossierResponse = await axios.get(`http://localhost:8000/api/dossiers/${selectedDossier.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        });
        setSelectedDossier(dossierResponse.data);
        console.log('Proforma supprimé:', docId);
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        console.error('Erreur lors de la suppression du proforma:', errorMessage);
        setError(`Une erreur est survenue lors de la suppression du document : ${JSON.stringify(errorMessage)}`);
      }
    } else if (selectedDossier && selectedDocument?.type === 'Bon de Commande') {
      try {
        await axios.delete(`http://localhost:8000/api/bon_commandes/${docId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        });
        setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
        setSelectedDocument(null);

        // Recharger le dossier sélectionné
        const dossierResponse = await axios.get(`http://localhost:8000/api/dossiers/${selectedDossier.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true,
        });
        setSelectedDossier(dossierResponse.data);
        console.log('Bon de commande supprimé:', docId);
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        console.error('Erreur lors de la suppression du bon de commande:', errorMessage);
        setError(`Une erreur est survenue lors de la suppression du document : ${JSON.stringify(errorMessage)}`);
      }
    }
  };

  const handleExportDocument = async (file, doc, isGeneratedPdf = false) => {
    try {
      let endpoint;
      if (doc?.type === 'Proforma') {
        endpoint = `http://localhost:8000/api/proformas/${doc.id}/generatePdf`;
      } else if (doc?.type === 'Bon de Commande') {
        endpoint = isGeneratedPdf
          ? `http://localhost:8000/api/bon_commandes/${doc.id}/generatePdf`
          : `http://localhost:8000/api/bon_commandes/${doc.id}/download`;
      } else {
        throw new Error('Type de document inconnu');
      }

      console.log(`Téléchargement du document: ${doc.type}, endpoint: ${endpoint}, fichier: ${file}`);

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      console.error(`Erreur lors du téléchargement du ${doc?.type}:`, errorMessage);
      setError(`Une erreur est survenue lors du téléchargement du document : ${JSON.stringify(errorMessage)}`);
    }
  };

  const handleExportExcel = async () => {
    if (selectedDocument?.type === 'Proforma') {
      try {
        const response = await axios.get(`http://localhost:8000/api/proformas/${selectedDocument.id}/exportExcel`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `proforma_${selectedDocument.id}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        console.error('Erreur lors de l\'exportation en Excel:', errorMessage);
        setError(`Une erreur est survenue lors de l\'exportation en Excel : ${JSON.stringify(errorMessage)}`);
      }
    }
  };

  const hasCommande = documents.some((doc) => doc.type === 'Bon de Commande');

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

  const getDocumentStatusBadge = (doc) => {
    if (doc.type === 'Facture') {
      return (
        <Badge bg={doc.status === 'Payée' ? 'success' : 'danger'} className="ms-2">
          {doc.status}
        </Badge>
      );
    }
    if (doc.type === 'Bon de Livraison') {
      return (
        <Badge bg={doc.status === 'Livré dans les délais' ? 'success' : 'warning'} className="ms-2">
          {doc.status}
        </Badge>
      );
    }
    return null;
  };

  const timelineData = selectedDossier && selectedDossier.etat
    ? {
        labels: ['Demande', 'Proforma', 'Bon de Commande', 'Facturation', 'Terminé'],
        datasets: [
          {
            label: 'Progression',
            data: ['Demande', 'Proforma', 'Bon de Commande', 'Facturation', 'Terminé'].map((step, index) => {
              const normalizedEtat = selectedDossier.etat.trim().toLowerCase();
              const normalizedStep = step.toLowerCase();
              const steps = ['demande', 'proforma', 'bon de commande', 'facturation', 'terminé'];
              const currentStepIndex = steps.indexOf(
                normalizedEtat === 'bon de commande' ? 'bon de commande' : normalizedEtat
              );
              console.log('État normalisé:', normalizedEtat, 'Index:', currentStepIndex); // Log pour débogage
              if (currentStepIndex === -1) return 0; // État invalide
              if (index <= currentStepIndex) return 1; // Étape actuelle ou précédente : en haut
              return 0; // Étapes futures : en bas
            }),
            backgroundColor: ['Demande', 'Proforma', 'Bon de Commande', 'Facturation', 'Terminé'].map((step, index) => {
              const normalizedEtat = selectedDossier.etat.trim().toLowerCase();
              const steps = ['demande', 'proforma', 'bon de commande', 'facturation', 'terminé'];
              const currentStepIndex = steps.indexOf(
                normalizedEtat === 'bon de commande' ? 'bon de commande' : normalizedEtat
              );
              if (currentStepIndex === -1) return 'grey'; // État invalide
              if (index === currentStepIndex) return 'orange'; // Étape actuelle
              if (index < currentStepIndex) return 'green'; // Étapes précédentes
              return 'grey'; // Étapes futures
            }),
            borderColor: 'transparent',
            pointRadius: 10,
            pointHoverRadius: 12,
          },
        ],
      }
    : null;

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {selectedDossier && console.log('Dossier sélectionné:', selectedDossier)}
      {selectedDossier ? (
        <div>
          <div className="mb-3">
            <Button variant="secondary" onClick={() => setSelectedDossier(null)} className="me-2">
              <i className="bi bi-arrow-left me-2"></i>Retour
            </Button>
          </div>

          <Row className="mb-4">
            <Col xs={12} md={8}>
              <h5 style={{ color: 'orange' }}>État du dossier</h5>
              {timelineData ? (
                <div style={{ height: '200px' }}>
                  <Line
                    data={timelineData}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          display: false,
                          min: -0.5,
                          max: 3,
                        },
                        x: {
                          ticks: {
                            font: {
                              size: 12,
                            },
                          },
                        },
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          enabled: true,
                          callbacks: {
                            label: (context) => {
                              const step = ['Demande', 'Proforma', 'Bon de Commande', 'Facturation', 'Terminé'][context.dataIndex];
                              return step === selectedDossier.etat ? `Étape actuelle: ${step}` : step;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              ) : (
                <p>Erreur: impossible d'afficher la progression du dossier.</p>
              )}
            </Col>
            <Col xs={12} md={4}>
              <Card className="shadow-sm mt-2" style={{ borderColor: 'orange' }}>
                <Card.Body>
                  <Card.Title style={{ color: 'orange' }}>Informations Client</Card.Title>
                  <p>Nom : <strong>{selectedDossier.client?.nom_entreprise || 'Client non chargé'}</strong></p>
                  <p>Contact : <strong>{selectedDossier.client?.contact || 'Non disponible'}</strong></p>
                  <p>Email : <strong>{selectedDossier.client?.email || 'Non disponible'}</strong></p>
                  <p>Adresse : <strong>{selectedDossier.client?.adresse || 'Non disponible'}</strong></p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mb-4">
            <Col xs={12}>
              <h5 style={{ color: 'orange' }}>Documents</h5>
              <ListGroup>
                {documents.map((doc) => (
                  <ListGroup.Item
                    key={doc.id}
                    action
                    onClick={() => setSelectedDocument(doc)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(0.99)';
                    }}
                  >
                    {doc.type} - {doc.file} {getDocumentStatusBadge(doc)}
                  </ListGroup.Item>
                ))}
              </ListGroup>
              </Col>
          </Row>
          <Row className="mb-4">
            <Col xs={12}>
              <div className="mt-3 d-flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  style={{ backgroundColor: 'orange', borderColor: 'orange' }}
                  onClick={() => setShowCommandeModal(true)}
                  disabled={hasCommande || !hasProforma}
                >
                  Ajouter Bon de Commande
                </Button>
                <Button
                  variant="primary"
                  style={{ backgroundColor: 'orange', borderColor: 'orange' }}
                  onClick={() => setShowProformaModal(true)}
                  disabled={hasProforma}
                >
                  Ajouter Proforma
                </Button>
                <Button
                  variant="primary"
                  style={{ backgroundColor: 'orange', borderColor: 'orange' }}
                  onClick={() => navigate('/commercial/factures')}
                >
                  Ajouter Facture
                </Button>
                <Button
                  variant="primary"
                  style={{ backgroundColor: 'orange', borderColor: 'orange' }}
                  onClick={() => navigate('/commercial/livraisons')}
                >
                  Ajouter Bon de Livraison
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      ) : dossiers.length === 0 ? (
        <p>Aucun dossier trouvé avec les filtres actuels.</p>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Client</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {dossiers.map((dossier) => (
              <tr key={dossier.id} onClick={() => setSelectedDossier(dossier)} style={{ cursor: 'pointer' }}>
                <td>{dossier.nom}</td>
                <td>{dossier.client?.nom_entreprise || 'Client non chargé'}</td>
                <td>
                  <Badge bg={getStatusBadgeVariant(dossier.statut)}>{dossier.statut}</Badge>
                </td>
                <td>{new Date(dossier.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Modal show={showProformaModal} onHide={() => setShowProformaModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Créer un Proforma</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Ajouter un produit</Form.Label>
              <Form.Control
                type="text"
                placeholder="Désignation du produit"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
              <Form.Control
                type="number"
                placeholder="Prix unitaire"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                className="mt-2"
              />
              <Form.Control
                type="number"
                placeholder="Quantité"
                value={newProduct.quantity}
                onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                className="mt-2"
              />
              <Button
                variant="primary"
                style={{ backgroundColor: 'orange', borderColor: 'orange' }}
                className="mt-2"
                onClick={handleAddProduct}
              >
                Ajouter Produit
              </Button>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Monnaie</Form.Label>
              <Form.Select
                value={newProduct.currency}
                onChange={(e) => setNewProduct({ ...newProduct, currency: e.target.value })}
              >
                <option value="FCFA">FCFA</option>
                <option value="$">$</option>
                <option value="€">€</option>
              </Form.Select>
            </Form.Group>
            <ListGroup>
              {proformaProducts.map((product) => (
                <ListGroup.Item key={product.id}>
                  {product.name} - {product.quantity} x {product.price} ={' '}
                  {parseFloat(product.price) * parseInt(product.quantity)} {product.currency}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProformaModal(false)}>
            Fermer
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: 'orange', borderColor: 'orange' }}
            onClick={() => handleGenerateProforma(newProduct.currency)}
            disabled={proformaProducts.length === 0}
          >
            Générer Proforma
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showCommandeModal} onHide={() => setShowCommandeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Créer un Bon de Commande</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Dossier</Form.Label>
              <Form.Control
                type="text"
                value={`${selectedDossier?.nom} - ${selectedDossier?.client?.nom_entreprise || 'Client non chargé'}`}
                readOnly
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Fichier PDF (pièce jointe)</Form.Label>
              <Form.Control
                type="file"
                accept="application/pdf"
                onChange={(e) => setNewCommande({ ...newCommande, fichier_scan: e.target.files[0] })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCommandeModal(false)}>
            Fermer
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: 'orange', borderColor: 'orange' }}
            onClick={handleAddCommande}
            disabled={!newCommande.fichier_scan || !hasProforma}
          >
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={!!selectedDocument} onHide={() => setSelectedDocument(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Détails du Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Type: {selectedDocument?.type}</p>
          <p>Fichier: {selectedDocument?.file}</p>
          {selectedDocument?.type === 'Proforma' && (
            <ListGroup>
              {selectedDocument.products && selectedDocument.products.length > 0 ? (
                selectedDocument.products.map((product, index) => (
                  <ListGroup.Item key={index}>
                    {product.designation} ({product.quantite} x {product.prix_unitaire}) :{' '}
                    {parseFloat(product.prix_unitaire) * parseInt(product.quantite)} {selectedDocument.currency}
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item>Aucun produit disponible</ListGroup.Item>
              )}
              <ListGroup.Item>
                <strong>
                  Total: {selectedDocument.totalPrice} {selectedDocument.currency}
                </strong>
              </ListGroup.Item>
            </ListGroup>
          )}
          {selectedDocument?.type === 'Bon de Commande' && (
            <div>
              <p>
                <strong>Proforma de référence :</strong> {selectedDocument.proformaId}
              </p>
              <p>
                <strong>Date de livraison prévue :</strong>{' '}
                {selectedDocument.dateLivraison
                  ? new Date(selectedDocument.dateLivraison).toLocaleDateString('fr-FR')
                  : 'Non disponible'}
              </p>
              <ListGroup>
                {selectedDocument.items && selectedDocument.items.length > 0 ? (
                  selectedDocument.items.map((item, index) => (
                    <ListGroup.Item key={index}>
                      {item.designation} - {item.quantite} x {item.prix_unitaire} ={' '}
                      {parseFloat(item.prix_unitaire) * parseInt(item.quantite)} {selectedDocument.currency}
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item>Aucun article disponible</ListGroup.Item>
                )}
                <ListGroup.Item>
                  <strong>
                    Total: {selectedDocument.totalPrice} {selectedDocument.currency}
                  </strong>
                </ListGroup.Item>
              </ListGroup>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedDocument?.type === 'Proforma' && (
            <Button
              variant="primary"
              style={{ backgroundColor: 'orange', borderColor: 'orange' }}
              onClick={handleExportExcel}
            >
              Exporter en Excel
            </Button>
          )}
          <Button
            variant="primary"
            style={{ backgroundColor: 'orange', borderColor: 'orange' }}
            onClick={() => handleExportDocument(selectedDocument?.file || '', selectedDocument, true)}
          >
            Télécharger
          </Button>
          {selectedDocument?.type === 'Bon de Commande' && selectedDocument?.fichier_scan && (
            <Button
              variant="primary"
              style={{ backgroundColor: 'orange', borderColor: 'orange' }}
              onClick={() => handleExportDocument(selectedDocument.fichier_scan, selectedDocument, false)}
            >
              Télécharger Pièce Jointe
            </Button>
          )}
          <Button variant="danger" onClick={() => handleDeleteDocument(selectedDocument?.id || 0)}>
            Supprimer
          </Button>
          {/*<Button variant="secondary" onClick={() => setSelectedDocument(null)}>
            Fermer
          </Button>*/}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DossierCommercialTable;