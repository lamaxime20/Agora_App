import { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Table, Modal, Card, ListGroup, Badge } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import HeaderManager from "../components/manager/hearderManger";
import Footer from "../components/footer";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const DossiersPage = () => {
  const [dossiers, setDossiers] = useState([
    {
      id: 1,
      client: "Client A",
      statut: "Demande",
      date: "01/06/2025",
      commercial: "Jean",
      details: {
        clientInfo: { name: "Client A", contact: "clientA@example.com", history: ["Appel 01/06", "Email 02/06"] },
        timeline: ["Demande", "Validation", "Cotation", "Bon de Commande", "Livraison", "Facturation"],
        currentStep: 0,
        documents: [
          { id: 1, type: "Proforma", file: "proforma1.pdf" },
          { id: 2, type: "Bon de Commande Client", file: "bdc1.pdf" },
        ],
        supplierOrders: [{ id: 1, supplier: "Fournisseur Y", item: "Papier", status: "En attente" }],
        factureStatut: "Non payé",
        livraisonStatut: "Hors délai",
      },
    },
  ]);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ client: "", description: "", statut: "Demande", files: [], notes: "" });
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterCommercial, setFilterCommercial] = useState("");
  const [userRole, setUserRole] = useState("commercial"); // 'commercial' or 'manager'

  // Placeholder for offline support using IndexedDB
  useEffect(() => {
    const initIndexedDB = async () => {
      console.log("Initializing IndexedDB for offline dossier storage");
      // Implement IndexedDB setup here (e.g., using Dexie.js)
    };
    initIndexedDB();
  }, []);

  // Placeholder for FCM notifications
  const sendNotification = (dossierId, newStatut) => {
    console.log(`FCM Notification: Dossier ${dossierId} changed to ${newStatut}`);
    // Implement FCM push notification here
  };

  const handleCreateDossier = () => {
    setFormData({ client: "", description: "", statut: "Demande", files: [], notes: "" });
    setShowModal(true);
  };

  const handleEditDossier = (dossier) => {
    setFormData({ ...dossier, files: [] });
    setShowModal(true);
  };

  const handleDeleteDossier = (id) => {
    if (userRole === "manager") {
      setDossiers(dossiers.filter((d) => d.id !== id));
      // API call: DELETE /api/dossiers/:id
      sendNotification(id, "Deleted");
    } else {
      alert("Seul un manager peut supprimer un dossier.");
    }
  };

  const handleSaveDossier = () => {
    if (formData.id) {
      setDossiers(dossiers.map((d) => (d.id === formData.id ? { ...formData, details: d.details } : d)));
      // API call: PUT /api/dossiers/:id
      sendNotification(formData.id, formData.statut);
    } else {
      const newDossier = {
        ...formData,
        id: dossiers.length + 1,
        date: new Date().toLocaleDateString(),
        details: {
          clientInfo: { name: formData.client, contact: "", history: [] },
          timeline: ["Demande", "Validation", "Cotation", "Bon de Commande", "Livraison", "Facturation"],
          currentStep: 0,
          documents: formData.files,
          supplierOrders: [],
          factureStatut: "Non payé",
          livraisonStatut: "Hors délai",
        },
      };
      setDossiers([...dossiers, newDossier]);
      // API call: POST /api/dossiers
      sendNotification(newDossier.id, formData.statut);
    }
    setShowModal(false);
    // Sync with IndexedDB for offline support
  };

  const handleViewDossier = (dossier) => {
    setSelectedDossier(dossier);
  };

  const handleGenerateDocument = (dossierId, type) => {
    console.log(`Generating ${type} for dossier ${dossierId}`);
    // API call: POST /api/documents/generate/:dossierId/:type
    alert(`Document ${type} généré pour le dossier ${dossierId}`);
  };

  const handleUploadDocument = (dossierId, file) => {
    console.log(`Uploading ${file.name} for dossier ${dossierId}`);
    // API call: POST /api/documents/upload/:dossierId
    // Store in IndexedDB for offline sync
  };

  const handleDeleteDocument = (dossierId, docId) => {
    if (userRole === "manager" || userRole === "commercial") {
      setSelectedDossier({
        ...selectedDossier,
        details: {
          ...selectedDossier.details,
          documents: selectedDossier.details.documents.filter((doc) => doc.id !== docId),
        },
      });
      // API call: DELETE /api/documents/:dossierId/:docId
    } else {
      alert("Vous n'avez pas les permissions pour supprimer un document.");
    }
  };

  const handleAddSupplierOrder = (dossierId, order) => {
    setSelectedDossier({
      ...selectedDossier,
      details: {
        ...selectedDossier.details,
        supplierOrders: [...selectedDossier.details.supplierOrders, { id: Date.now(), ...order }],
      },
    });
    // API call: POST /api/supplier-orders/:dossierId
    sendNotification(dossierId, "Supplier Order Added");
  };

  const handleMarkDelivered = (dossierId, date) => {
    if (userRole === "manager") {
      setSelectedDossier({
        ...selectedDossier,
        details: { ...selectedDossier.details, livraisonStatut: "Dans les délais", currentStep: 4 },
      });
      // API call: PUT /api/dossiers/:dossierId/mark-delivered
      sendNotification(dossierId, "Livré");
    } else {
      alert("Seul un manager peut marquer un dossier comme livré.");
    }
  };

  const handleChangeStatut = (dossierId, newStatut) => {
    if (userRole === "manager") {
      setSelectedDossier({
        ...selectedDossier,
        statut: newStatut,
        details: { ...selectedDossier.details, currentStep: selectedDossier.details.timeline.indexOf(newStatut) },
      });
      // API call: PUT /api/dossiers/:dossierId/status
      sendNotification(dossierId, newStatut);
    } else {
      alert("Seul un manager peut changer le statut d'un dossier.");
    }
  };

  const filteredDossiers = dossiers.filter(
    (d) =>
      (d.id.toString().includes(search) || d.client.toLowerCase().includes(search.toLowerCase())) &&
      (filterStatut ? d.statut === filterStatut : true) &&
      (filterDate ? d.date.includes(filterDate) : true) &&
      (filterCommercial ? d.commercial === filterCommercial : true)
  );

  const timelineData = selectedDossier
    ? {
        labels: selectedDossier.details.timeline,
        datasets: [
          {
            label: "Progression",
            data: selectedDossier.details.timeline.map((_, index) =>
              index <= selectedDossier.details.currentStep ? 1 : 0
            ),
            backgroundColor: selectedDossier.details.timeline.map((_, index) =>
              index < selectedDossier.details.currentStep
                ? "green"
                : index === selectedDossier.details.currentStep
                ? "orange"
                : "grey"
            ),
            borderColor: "transparent",
            pointRadius: 10,
          },
        ],
      }
    : null;

  return (
    <div>
      <HeaderManager />
      <Container fluid className="p-4" style={{ marginTop: "60px", marginBottom: "30px" }}>
        <Row className="mb-4">
          <Col>
            <h3>Gestion des Dossiers</h3>
          </Col>
          <Col className="text-end">
            <Button
              variant="warning"
              style={{ backgroundColor: "#ff9900", borderColor: "#ff9900" }}
              onClick={handleCreateDossier}
            >
              <i className="bi bi-plus-circle me-2"></i> Créer Dossier
            </Button>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={4}>
            <Form.Control
              type="text"
              placeholder="Rechercher par ID ou Client"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          <Col md={3}>
            <Form.Select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="Demande">Demande</option>
              <option value="Validation">Validation</option>
              <option value="Cotation">Cotation</option>
              <option value="Bon de Commande">Bon de Commande</option>
              <option value="Livraison">Livraison</option>
              <option value="Facturation">Facturation</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Control
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </Col>
          <Col md={2}>
            <Form.Select value={filterCommercial} onChange={(e) => setFilterCommercial(e.target.value)}>
              <option value="">Tous les commerciaux</option>
              <option value="Jean">Jean</option>
              <option value="Marie">Marie</option>
            </Form.Select>
          </Col>
        </Row>

        {!selectedDossier ? (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Client</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDossiers.map((dossier) => (
                <tr key={dossier.id}>
                  <td>{dossier.id}</td>
                  <td>{dossier.client}</td>
                  <td>{dossier.statut}</td>
                  <td>{dossier.date}</td>
                  <td>
                    <Button variant="link" onClick={() => handleViewDossier(dossier)}>
                      <i className="bi bi-eye"></i>
                    </Button>
                    <Button variant="link" onClick={() => handleEditDossier(dossier)}>
                      <i className="bi bi-pencil"></i>
                    </Button>
                    {userRole === "manager" && (
                      <Button variant="link" onClick={() => handleDeleteDossier(dossier.id)}>
                        <i className="bi bi-trash"></i>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div>
            <Button variant="secondary" onClick={() => setSelectedDossier(null)} className="mb-3">
              <i className="bi bi-arrow-left me-2"></i> Retour
            </Button>
            <Row>
              <Col md={8}>
                <h5>Timeline</h5>
                <div style={{ height: "150px" }}>
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
                    <h5>Documents</h5>
                    <ListGroup>
                      {selectedDossier.details.documents.map((doc) => (
                        <ListGroup.Item key={doc.id}>
                          {doc.type} - {doc.file}
                          <Button
                            variant="link"
                            onClick={() => handleDeleteDocument(selectedDossier.id, doc.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                          <Button variant="link" onClick={() => alert(`Téléchargement de ${doc.file}`)}>
                            <i className="bi bi-download"></i>
                          </Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                    <Form.Group className="mt-3">
                      <Form.Control
                        type="file"
                        accept=".pdf,.jpg,.png"
                        onChange={(e) => handleUploadDocument(selectedDossier.id, e.target.files[0])}
                      />
                    </Form.Group>
                    <Button
                      variant="warning"
                      className="mt-3"
                      style={{ backgroundColor: "#ff9900", borderColor: "#ff9900" }}
                      onClick={() => handleGenerateDocument(selectedDossier.id, "Proforma")}
                    >
                      <i className="bi bi-file-earmark-text me-2"></i> Générer Proforma
                    </Button>
                    <Button
                      variant="warning"
                      className="mt-3 ms-2"
                      style={{ backgroundColor: "#ff9900", borderColor: "#ff9900" }}
                      onClick={() => handleGenerateDocument(selectedDossier.id, "Facture")}
                    >
                      <i className="bi bi-file-earmark-text me-2"></i> Générer Facture
                    </Button>
                    <Button
                      variant="warning"
                      className="mt-3 ms-2"
                      style={{ backgroundColor: "#ff9900", borderColor: "#ff9900" }}
                      onClick={() => handleGenerateDocument(selectedDossier.id, "Bon de Livraison")}
                    >
                      <i className="bi bi-file-earmark-text me-2"></i> Générer Bon de Livraison
                    </Button>
                  </Col>
                  <Col>
                    <h5>Commandes Fournisseurs</h5>
                    <ListGroup>
                      {selectedDossier.details.supplierOrders.map((order) => (
                        <ListGroup.Item key={order.id}>
                          {order.item} chez {order.supplier} - {order.status}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                    <Button
                      variant="warning"
                      className="mt-3"
                      style={{ backgroundColor: "#ff9900", borderColor: "#ff9900" }}
                      onClick={() =>
                        handleAddSupplierOrder(selectedDossier.id, {
                          supplier: "Fournisseur Y",
                          item: "Papier",
                          status: "En attente",
                        })
                      }
                    >
                      <i className="bi bi-cart-plus me-2"></i> Ajouter Bon de Commande Fournisseur
                    </Button>
                  </Col>
                </Row>
              </Col>
              <Col md={4}>
                <Card>
                  <Card.Body>
                    <Card.Title>Informations Client</Card.Title>
                    <p><strong>Nom:</strong> {selectedDossier.details.clientInfo.name}</p>
                    <p><strong>Contact:</strong> {selectedDossier.details.clientInfo.contact}</p>
                    <p><strong>Historique:</strong></p>
                    <ul>
                      {selectedDossier.details.clientInfo.history.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                    <p>
                      <strong>Statut Facture:</strong>{" "}
                      <Badge bg={selectedDossier.details.factureStatut === "Payé" ? "success" : "danger"}>
                        {selectedDossier.details.factureStatut}
                      </Badge>
                    </p>
                    <p>
                      <strong>Statut Livraison:</strong>{" "}
                      <Badge bg={selectedDossier.details.livraisonStatut === "Dans les délais" ? "success" : "warning"}>
                        {selectedDossier.details.livraisonStatut}
                      </Badge>
                    </p>
                    {userRole === "manager" && (
                      <>
                        <Button
                          variant="warning"
                          className="mt-3"
                          style={{ backgroundColor: "#ff9900", borderColor: "#ff9900" }}
                          onClick={() => handleMarkDelivered(selectedDossier.id, new Date().toLocaleDateString())}
                        >
                          <i className="bi bi-check-circle me-2"></i> Marquer Livré
                        </Button>
                        <Form.Select
                          className="mt-3"
                          onChange={(e) => handleChangeStatut(selectedDossier.id, e.target.value)}
                          value={selectedDossier.statut}
                        >
                          {selectedDossier.details.timeline.map((step, index) => (
                            <option key={index} value={step}>{step}</option>
                          ))}
                        </Form.Select>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </div>
        )}

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{formData.id ? "Modifier Dossier" : "Créer Dossier"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Client</Form.Label>
                <Form.Select
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                >
                  <option>Choisir un client</option>
                  <option value="Client A">Client A</option>
                  <option value="Client B">Client B</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Statut</Form.Label>
                <Form.Select
                  value={formData.statut}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                  disabled={userRole !== "manager"}
                >
                  <option value="Demande">Demande</option>
                  <option value="Validation">Validation</option>
                  <option value="Cotation">Cotation</option>
                  <option value="Bon de Commande">Bon de Commande</option>
                  <option value="Livraison">Livraison</option>
                  <option value="Facturation">Facturation</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Fichiers</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.png"
                  onChange={(e) => setFormData({ ...formData, files: Array.from(e.target.files) })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button
              variant="warning"
              style={{ backgroundColor: "#ff9900", borderColor: "#ff9900" }}
              onClick={handleSaveDossier}
            >
              <i className="bi bi-save me-2"></i> Enregistrer
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
      <Footer />
    </div>
  );
};

export default DossiersPage;