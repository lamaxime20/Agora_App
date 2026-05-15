import { Table, Button, Row, Col, Card, Modal, Form } from 'react-bootstrap';
import { useState, useContext } from 'react';
import { LivraisonsContext } from '../../pages/commercial/livraisonPageCommercial';

const LivraisonTable = ({ commercialId }) => {
  const { filters } = useContext(LivraisonsContext);
  const [livraisons, setLivraisons] = useState([
    {
      id: 'BL-0001',
      dossierId: 1,
      client: { name: 'Cendrillon Ayot', address: '69 rue Nations, 22000 Paris', email: 'cendrillon.ayot@example.com', phone: '+33 1 23 45 67 89' },
      statut: 'En attente de livraison',
      datePrevue: '20/06/2025',
      dateReelle: null,
      commandeId: 'CMD001',
      items: [],
    },
    {
      id: 'BL-0002',
      dossierId: 2,
      client: { name: 'Client B', address: '25 Avenue des Champs, 75008 Paris', email: 'client.b@example.com', phone: '+33 1 98 76 54 32' },
      statut: 'Livré',
      datePrevue: '15/05/2025',
      dateReelle: '16/05/2025',
      commandeId: 'CMD002',
      items: [],
    },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [selectedLivraison, setSelectedLivraison] = useState(null);
  const [file, setFile] = useState(null);
  const [commentaire, setCommentaire] = useState('');
  const [commandes] = useState([
    {
      id: 'CMD001',
      clientId: 1,
      dateLivraison: '20/03/2019',
      client: { name: 'Cendrillon Ayot', address: '69 rue Nations, 22000 Paris', email: 'cendrillon.ayot@example.com', phone: '+33 1 23 45 67 89' },
      items: [{ ref: 'REF001', designation: 'Grand brun escargot', puHT: 100.00, quantite: 1, prixHT: 100.00 }, { ref: 'REF002', designation: 'Petit marinier', puHT: 15.00, quantite: 2, prixHT: 30.00 }],
      totalHT: 130.00,
    },
    {
      id: 'CMD002',
      clientId: 2,
      dateLivraison: '25/04/2020',
      client: { name: 'Client B', address: '25 Avenue des Champs, 75008 Paris', email: 'client.b@example.com', phone: '+33 1 98 76 54 32' },
      items: [{ ref: 'REF004', designation: 'Produit A', puHT: 300.00, quantite: 2, prixHT: 600.00 }],
      totalHT: 600.00,
    },
  ]);

  const handleAddLivraison = () => {
    if (selectedCommande) {
      const commande = commandes.find(c => c.id === selectedCommande);
      if (commande) {
        const newLivraison = {
          id: `BL-${String(livraisons.length + 1).padStart(4, '0')}`,
          dossierId: commande.id.replace('CMD', 'D'),
          client: commande.client,
          statut: 'En attente de livraison',
          datePrevue: new Date().toLocaleDateString('fr-FR'),
          dateReelle: null,
          commandeId: commande.id,
          items: commande.items.map(item => ({ ref: item.ref, designation: item.designation, quantite: item.quantite })),
        };
        setLivraisons([...livraisons, newLivraison]);
        setShowAddModal(false);
        setSelectedCommande(null);
      }
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImportScan = () => {
    if (file && selectedLivraison) {
      const currentDate = new Date().toLocaleDateString('fr-FR');
      const datePrevue = new Date(selectedLivraison.datePrevue);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      datePrevue.setHours(0, 0, 0, 0);

      let newStatut = 'Livré';
      if (today > datePrevue) {
        newStatut = commentaire ? 'Livraison hors délais' : 'Livraison hors délais (justification requise)';
      } else if (today.toDateString() === datePrevue.toDateString()) {
        newStatut = 'Livraison dans les délais';
      }

      setLivraisons(livraisons.map(l =>
        l.id === selectedLivraison.id ? { ...l, dateReelle: currentDate, statut: newStatut } : l
      ));
      setSelectedLivraison({ ...selectedLivraison, dateReelle: currentDate, statut: newStatut });
      setFile(null);
      setCommentaire('');
    }
  };

  const filteredLivraisons = livraisons.filter((livraison) => {
    const matchesDate = !filters.date || new Date(livraison.datePrevue) >= new Date(filters.date);
    const matchesClient = filters.client === 'Tous' || livraison.client.name === filters.client;
    return matchesDate && matchesClient;
  });

  const handleViewDetails = (livraison) => {
    setSelectedLivraison(livraison);
  };

  return (
    <div>
      {selectedLivraison ? (
        <div>
          <Button variant="secondary" onClick={() => setSelectedLivraison(null)} className="mb-3">
            <i className="bi bi-arrow-left me-2"></i> Retour
          </Button>
          <Row>
            <Col xs={12}>
              <Card className="shadow-sm" style={{ borderColor: 'orange', minHeight: '450px' }}>
                <Card.Body>
                  <div className="text-center mb-3">
                    <h2>Bon de Livraison N°: {selectedLivraison.id}</h2>
                  </div>
                  <div className="text-left mb-3">
                    <p><strong>Client :</strong> {selectedLivraison.client.name}</p>
                    <p><strong>Adresse :</strong> {selectedLivraison.client.address}</p>
                    <p><strong>Email :</strong> {selectedLivraison.client.email}</p>
                    <p><strong>Téléphone :</strong> {selectedLivraison.client.phone}</p>
                  </div>
                  <div className="text-right mb-2">
                    <p><strong>Date de création :</strong> {selectedLivraison.datePrevue}</p>
                  </div>
                  <div className="table-responsive">
                    <Table bordered>
                      <thead>
                        <tr>
                          <th># Item</th>
                          <th>Description</th>
                          <th>Quantité</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedLivraison.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.ref || `R-${index + 1}`}</td>
                            <td>{item.designation}</td>
                            <td>{item.quantite}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  <div className="mt-3">
                    <p><strong>Statut :</strong> {selectedLivraison.statut}</p>
                    <p><strong>Date prévue :</strong> {selectedLivraison.datePrevue}</p>
                    <p><strong>Date réelle :</strong> {selectedLivraison.dateReelle || 'Non livré'}</p>
                  </div>
                  <Form.Group className="mt-3">
                    <Form.Label>Importer le scan du bon de livraison</Form.Label>
                    <Form.Control type="file" onChange={handleFileChange} />
                    {selectedLivraison.datePrevue && new Date(selectedLivraison.datePrevue) < new Date() && !selectedLivraison.dateReelle && (
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Justification du retard (obligatoire si livraison hors délai)"
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                        className="mt-2"
                      />
                    )}
                    <Button
                      variant="primary"
                      style={{ backgroundColor: 'orange', borderColor: 'orange' }}
                      onClick={handleImportScan}
                      disabled={!file || (new Date(selectedLivraison.datePrevue) < new Date() && !commentaire && !selectedLivraison.dateReelle)}
                      className="mt-2"
                    >
                      Importer
                    </Button>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      ) : filteredLivraisons.length === 0 ? (
        <p>Aucune livraison trouvée avec les filtres actuels.</p>
      ) : (
        <div>
          <Row className="mb-3">
            <Col className="text-end">
              <Button
                variant="primary"
                style={{ backgroundColor: 'orange', borderColor: 'orange' }}
                onClick={() => setShowAddModal(true)}
              >
                <i className="bi bi-plus-lg me-2"></i>Ajouter Bon de Livraison
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>ID de la livraison</th>
                      <th>Dossier</th>
                      <th>Client</th>
                      <th>Statut de la livraison</th>
                      <th>Date de livraison prévue</th>
                      <th>Date de livraison réelle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLivraisons.map((livraison) => (
                      <tr key={livraison.id} onClick={() => handleViewDetails(livraison)} style={{ cursor: 'pointer' }}>
                        <td>{livraison.id}</td>
                        <td>{livraison.dossierId}</td>
                        <td>{livraison.client.name}</td>
                        <td>{livraison.statut}</td>
                        <td>{livraison.datePrevue}</td>
                        <td>{livraison.dateReelle || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Col>
          </Row>
        </div>
      )}
      <Modal show={showAddModal} onHide={() => { setShowAddModal(false); setSelectedCommande(null); }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ color: 'orange' }}>Ajouter un Bon de Livraison</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Sélectionner un Bon de Commande</Form.Label>
              <Form.Select
                value={selectedCommande || ''}
                onChange={(e) => setSelectedCommande(e.target.value)}
                style={{ borderColor: 'orange' }}
              >
                <option value="">Choisir un bon de commande</option>
                {commandes.map((commande) => (
                  <option key={commande.id} value={commande.id}>
                    {commande.id} - {commande.client.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {selectedCommande && (
              <div>
                {commandes.find(c => c.id === selectedCommande)?.items.map((item, index) => (
                  <Row key={item.ref} className="mb-2">
                    <Col xs={6}>
                      <Form.Label>{item.designation}</Form.Label>
                    </Col>
                    <Col xs={2}>
                      <Form.Label>{item.quantite}</Form.Label>
                    </Col>
                  </Row>
                ))}
              </div>
            )}
            <Button
              variant="primary"
              type="button"
              style={{ backgroundColor: 'orange', borderColor: 'orange' }}
              onClick={handleAddLivraison}
              disabled={!selectedCommande}
            >
              Ajouter
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default LivraisonTable;