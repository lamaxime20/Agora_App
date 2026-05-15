import { Table, Button, Row, Col, Card, Badge, Modal, Form } from 'react-bootstrap';
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FacturesContext } from '../../pages/commercial/facturePageCommercial';

const FactureTableCommercial = ({
  commercialId,
  newFacture,
  setNewFacture,
  showAddModal,
  setShowAddModal,
  commandes,
  clients,
}) => {
  const { filters } = useContext(FacturesContext);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [editFacture, setEditFacture] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  // Données simulées pour les factures
  const [factures, setFactures] = useState([
    {
      id: 'FAC001',
      montant: 174.00,
      dossierId: 1,
      client: 'Cendrillon Ayot',
      status: 'Non payée',
      dossier: { status: 'En cours', client: 'Cendrillon Ayot' },
      details: {
        date: '29/01/2019',
        commandDate: '16/03/2019',
        dueDate: '24/05/2019',
        items: [
          {
            qty: 1,
            designation: 'Grand brun escargot pour manger',
            price: 100.00,
            total: 100.00,
            number: 1,
          },
          {
            qty: 2,
            designation: 'Petit marinier uniforme en bleu',
            price: 15.00,
            total: 30.00,
            number: 2,
          },
          {
            qty: 3,
            designation: 'Facile à jouer accordéon',
            price: 5.00,
            total: 15.00,
            number: 3,
          },
        ],
        totalHT: 145.00,
        tva: 29.00,
        totalTTC: 174.00,
        to: { name: 'Cendrillon Ayot', address: '69 rue Nations, 22000 Paris' },
      },
    },
    {
      id: 'FAC002',
      montant: 750.00,
      dossierId: 2,
      client: 'Client B',
      status: 'Payée',
      dossier: { status: 'Clôturé', client: 'Client B' },
      details: {
        date: '15/02/2020',
        commandDate: '20/04/2020',
        dueDate: '30/06/2020',
        items: [
          { qty: 2, designation: 'Produit A', price: 300.00, total: 600.00, number: 1 },
          { qty: 1, designation: 'Produit B', price: 150.00, total: 150.00, number: 2 },
        ],
        totalHT: 750.00,
        tva: 0.00,
        totalTTC: 750.00,
        to: { name: 'Client B', address: '456 Ave Test' },
      },
    },
  ]);

  const handleAddFacture = () => {
    if (newFacture.commandeId) {
      const commande = commandes.find((cmd) => cmd.id === newFacture.commandeId);
      if (commande) {
        const client = clients.find((c) => c.id === commande.clientId);
        const totalHT = commande.totalHT;
        const tva = totalHT * 0.19;
        const totalTTC = totalHT + tva;
        const newFactureEntry = {
          id: `FAC${String(factures.length + 1).padStart(3, '0')}`,
          montant: totalTTC,
          dossierId: commande.dossierId,
          client: commande.client,
          status: 'Non validée',
          dossier: { status: commande.dossierStatus, client: commande.client },
          details: {
            date: new Date().toLocaleDateString('fr-FR'),
            commandDate: commande.date,
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
            items: commande.items.map((item, index) => ({
              ...item,
              number: index + 1,
            })),
            totalHT,
            tva,
            totalTTC,
            to: {
              name: commande.client,
              address: client ? client.address : 'Adresse non trouvée',
            },
          },
        };
        setFactures((prev) => [...prev, newFactureEntry]);
        console.log('Nouvelle facture ajoutée:', newFactureEntry);
        setNewFacture({ commandeId: '' });
        setShowAddModal(false);
      } else {
        alert('Bon de commande introuvable.');
      }
    }
  };

  const handleEditFactureChange = (index, field, value) => {
    setEditFacture((prev) => {
      const updatedItems = [...prev.details.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: field === 'qty' || field === 'price' ? Number(value) : value,
      };
      if (field === 'qty' || field === 'price') {
        updatedItems[index].total = updatedItems[index].qty * updatedItems[index].price;
      }
      const totalHT = updatedItems.reduce((sum, item) => sum + item.total, 0);
      const tva = totalHT * 0.19;
      const totalTTC = totalHT + tva;
      return {
        ...prev,
        montant: totalTTC,
        details: {
          ...prev.details,
          items: updatedItems,
          totalHT,
          tva,
          totalTTC,
        },
      };
    });
  };

  const handleSaveEditFacture = () => {
    setFactures((prev) =>
      prev.map((facture) => (facture.id === editFacture.id ? editFacture : facture))
    );
    setSelectedFacture(editFacture);
    setShowEditModal(false);
  };

  const handleExportPDF = (facture) => {
    console.log(`Exporter facture ${facture.id} en PDF`);
  };

  const filteredFactures = factures.filter((facture) => {
    const matchesDate = !filters.date || new Date(facture.details.date) >= new Date(filters.date);
    const matchesClient = filters.client === 'Tous' || facture.client === filters.client;
    const matchesStatus = filters.status === 'Tous' || facture.status === filters.status;
    return matchesDate && matchesClient && matchesStatus;
  });

  return (
    <div>
      {selectedFacture ? (
        <div>
          <Button variant="secondary" onClick={() => setSelectedFacture(null)} className="mb-3">
            <i className="bi bi-arrow-left me-2"></i> Retour
          </Button>
          <Row>
            <Col xs={12} md={12}>
              <div className="mb-3">
                <p>
                  <strong>Statut :</strong>{' '}
                  <Badge
                    bg={
                      selectedFacture.status === 'Payée'
                        ? 'success'
                        : selectedFacture.status === 'Non payée'
                        ? 'warning'
                        : 'danger'
                    }
                  >
                    {selectedFacture.status}
                  </Badge>
                </p>
                <p>
                  <strong>Statut Dossier :</strong>{' '}
                  <Badge
                    bg={selectedFacture.dossier.status === 'Clôturé' ? 'success' : 'warning'}
                  >
                    {selectedFacture.dossier.status}
                  </Badge>
                </p>
              </div>
              <Card className="shadow-sm" style={{ borderColor: 'orange', minHeight: '450px' }}>
                <Card.Body>
                  <Card.Title style={{ color: 'orange', fontSize: '24px', fontWeight: 'bold' }}>
                    FACTURE
                  </Card.Title>
                  <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                    <p>
                      FACTURE N° <strong>{selectedFacture.id}</strong>
                    </p>
                    <p>
                      DATE <strong>{selectedFacture.details.date}</strong>
                    </p>
                    <p>
                      COMMANDE N° <strong>{selectedFacture.details.commandDate}</strong>
                    </p>
                  </div>
                  <Row>
                    <Col md={6}>
                      <p>
                        <strong>Facturé à :</strong>
                      </p>
                      <p>{selectedFacture.details.to.name}</p>
                      <p>{selectedFacture.details.to.address}</p>
                    </Col>
                  </Row>
                  <Table>
                    <thead>
                      <tr>
                        <th>N°</th>
                        <th>Désignation</th>
                        <th>Prix Unitaire (CFA)</th>
                        <th>Quantité</th>
                        <th>Prix total (CFA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFacture.details.items.map((item) => (
                        <tr key={item.number}>
                          <td>{item.number}</td>
                          <td>{item.designation}</td>
                          <td>{item.price}</td>
                          <td>{item.qty}</td>
                          <td>{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <div style={{ textAlign: 'right' }}>
                    <p>
                      Total HT : <strong>{selectedFacture.details.totalHT} CFA</strong>
                    </p>
                    <p>
                      TVA 19.0% : <strong>{selectedFacture.details.tva} CFA</strong>
                    </p>
                    <p>
                      TOTAL TTC A PAYER : <strong>{selectedFacture.details.totalTTC} CFA</strong>
                    </p>
                  </div>
                  <div style={{ borderLeft: '4px solid orange', paddingLeft: '10px', marginTop: '20px' }}>
                    <p>
                      <strong>MODALITÉS DE PAIEMENT</strong>
                    </p>
                    <p>Espèce, chèque, virement - 15 à 30 jours après le dépôt de la facture</p>
                  </div>
                </Card.Body>
              </Card>
              <div className="mt-3">
                {selectedFacture.status === 'Non validée' && (
                  <Button
                    variant="primary"
                    style={{ backgroundColor: 'orange', borderColor: 'orange' }}
                    onClick={() => {
                      setEditFacture(selectedFacture);
                      setShowEditModal(true);
                    }}
                    className="me-2"
                  >
                    Modifier
                  </Button>
                )}
                <Button
                  variant="primary"
                  style={{ backgroundColor: 'orange', borderColor: 'orange' }}
                  onClick={() => handleExportPDF(selectedFacture)}
                  disabled={selectedFacture.status === 'Non validée'}
                  className="me-2"
                >
                  Exporter en PDF
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      ) : filteredFactures.length === 0 ? (
        <p>Aucune facture trouvée avec les filtres actuels.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Montant</th>
                <th>Dossier ID</th>
                <th>Client</th>
                <th>Statut Dossier</th>
                <th>Statut Facture</th>
              </tr>
            </thead>
            <tbody>
              {filteredFactures.map((facture) => (
                <tr
                  key={facture.id}
                  onClick={() => setSelectedFacture(facture)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{facture.id}</td>
                  <td>{facture.montant} CFA</td>
                  <td>{facture.dossierId}</td>
                  <td>{facture.client}</td>
                  <td>
                    <Badge
                      bg={facture.dossier.status === 'Clôturé' ? 'success' : 'warning'}
                    >
                      {facture.dossier.status}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      bg={
                        facture.status === 'Payée'
                          ? 'success'
                          : facture.status === 'Non payée'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {facture.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ color: 'orange' }}>Modifier la Facture</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editFacture && (
            <Form>
              {editFacture.details.items.map((item, index) => (
                <Row key={item.number} className="mb-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Désignation</Form.Label>
                      <Form.Control
                        type="text"
                        value={item.designation}
                        onChange={(e) =>
                          handleEditFactureChange(index, 'designation', e.target.value)
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Quantité</Form.Label>
                      <Form.Control
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          handleEditFactureChange(index, 'qty', e.target.value)
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Prix Unitaire (CFA)</Form.Label>
                      <Form.Control
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          handleEditFactureChange(index, 'price', e.target.value)
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Total (CFA)</Form.Label>
                      <Form.Control type="text" value={item.total} readOnly />
                    </Form.Group>
                  </Col>
                </Row>
              ))}
              <div style={{ textAlign: 'right' }}>
                <p>
                  Total HT : <strong>{editFacture.details.totalHT} CFA</strong>
                </p>
                <p>
                  TVA 19.0% : <strong>{editFacture.details.tva} CFA</strong>
                </p>
                <p>
                  TOTAL TTC : <strong>{editFacture.details.totalTTC} CFA</strong>
                </p>
              </div>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            style={{ backgroundColor: 'orange', borderColor: 'orange' }}
            onClick={handleSaveEditFacture}
          >
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FactureTableCommercial;