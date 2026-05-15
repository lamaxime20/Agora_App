import { Table, Button, Row, Col, Card, Modal, Form } from 'react-bootstrap';
import { useState, useContext } from 'react';
import { RapportVisiteContext } from '../../pages/commercial/rapportPageCommercial';

const RapportVisiteTable = ({ commercialId }) => {
  const { filters } = useContext(RapportVisiteContext);
  const [rapports, setRapports] = useState([
    {
      id: 'RV-0001',
      date: '15/06/2025',
      dossierId: 'D001',
      client: { name: 'Cendrillon Ayot', address: '69 rue Nations, 22000 Paris', email: 'cendrillon.ayot@example.com', phone: '+33 1 23 45 67 89' },
      objet: 'Suivi commande CMD001',
      commentaire: 'Visite pour confirmer les détails de livraison.',
    },
    {
      id: 'RV-0002',
      date: '10/06/2025',
      dossierId: null,
      client: { name: 'Client B', address: '25 Avenue des Champs, 75008 Paris', email: 'client.b@example.com', phone: '+33 1 98 76 54 32' },
      objet: 'Nouveau projet',
      commentaire: 'Discussion initiale sur un nouveau contrat.',
    },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [objet, setObjet] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [clients] = useState([
    { id: 1, name: 'Cendrillon Ayot', address: '69 rue Nations, 22000 Paris', email: 'cendrillon.ayot@example.com', phone: '+33 1 23 45 67 89' },
    { id: 2, name: 'Client B', address: '25 Avenue des Champs, 75008 Paris', email: 'client.b@example.com', phone: '+33 1 98 76 54 32' },
  ]);
  const [dossiers] = useState([
    { id: 'D001', clientId: 1 },
    { id: 'D002', clientId: 2 },
  ]);

  const handleAddRapport = () => {
    if (selectedClient) {
      const newRapport = {
        id: `RV-${String(rapports.length + 1).padStart(4, '0')}`,
        date: new Date().toLocaleDateString('fr-FR'),
        dossierId: selectedDossier || null,
        client: clients.find(c => c.id === selectedClient),
        objet,
        commentaire,
      };
      setRapports([...rapports, newRapport]);
      setShowAddModal(false);
      setSelectedClient(null);
      setSelectedDossier(null);
      setObjet('');
      setCommentaire('');
    }
  };

  const filteredRapports = rapports.filter((rapport) => {
    const matchesDate = !filters.date || new Date(rapport.date) >= new Date(filters.date);
    const matchesClient = filters.client === 'Tous' || rapport.client.name === filters.client;
    return matchesDate && matchesClient;
  });

  const handleViewDetails = (rapport) => {
    setSelectedRapport(rapport);
  };

  const [selectedRapport, setSelectedRapport] = useState(null);

  return (
    <div>
      {selectedRapport ? (
        <div>
          <Button variant="secondary" onClick={() => setSelectedRapport(null)} className="mb-3">
            <i className="bi bi-arrow-left me-2"></i> Retour
          </Button>
          <Row>
            <Col xs={12} md={12}>
              <Card className="shadow-sm" style={{ borderColor: 'orange', minHeight: '450px' }}>
                <Card.Body>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2>Rapport de Visite N°: {selectedRapport.id}</h2>
                  </div>
                  <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                    <p><strong>Date :</strong> {selectedRapport.date}</p>
                    <p><strong>Dossier :</strong> {selectedRapport.dossierId || 'Aucun'}</p>
                    <p><strong>Client :</strong> {selectedRapport.client.name}</p>
                    <p><strong>Adresse :</strong> {selectedRapport.client.address}</p>
                    <p><strong>Email :</strong> {selectedRapport.client.email}</p>
                    <p><strong>Téléphone :</strong> {selectedRapport.client.phone}</p>
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <p><strong>Objet :</strong> {selectedRapport.objet}</p>
                    <p><strong>Commentaire :</strong> {selectedRapport.commentaire}</p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      ) : filteredRapports.length === 0 ? (
        <p>Aucun rapport de visite trouvé avec les filtres actuels.</p>
      ) : (
        <div >
          <Row>
            <Col>
              <Button
                variant="primary"
                style={{ backgroundColor: 'orange', borderColor: 'orange', float: 'right' }}
                onClick={() => setShowAddModal(true)}
              >
                <i className="bi bi-plus-lg me-2"></i>Ajouter Rapport de Visite
              </Button>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Dossier</th>
                    <th>Client</th>
                    <th>Objet</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRapports.map((rapport) => (
                    <tr key={rapport.id} onClick={() => handleViewDetails(rapport)} style={{ cursor: 'pointer' }}>
                      <td>{rapport.id}</td>
                      <td>{rapport.date}</td>
                      <td>{rapport.dossierId || '-'}</td>
                      <td>{rapport.client.name}</td>
                      <td>{rapport.objet}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        </div>
      )}
      <Modal show={showAddModal} onHide={() => { setShowAddModal(false); setSelectedClient(null); setSelectedDossier(null); setObjet(''); setCommentaire(''); }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ color: 'orange' }}>Ajouter un Rapport de Visite</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Sélectionner un Client</Form.Label>
              <Form.Select
                value={selectedClient || ''}
                onChange={(e) => { setSelectedClient(Number(e.target.value)); setSelectedDossier(null); }}
                style={{ borderColor: 'orange' }}
              >
                <option value="">Choisir un client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {selectedClient && (
              <Form.Group className="mb-3">
                <Form.Label>Sélectionner un Dossier (optionnel)</Form.Label>
                <Form.Select
                  value={selectedDossier || ''}
                  onChange={(e) => setSelectedDossier(e.target.value)}
                  style={{ borderColor: 'orange' }}
                >
                  <option value="">Aucun dossier</option>
                  {dossiers.filter(d => d.clientId === selectedClient).map((dossier) => (
                    <option key={dossier.id} value={dossier.id}>
                      {dossier.id}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Objet de la visite</Form.Label>
              <Form.Control
                type="text"
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                style={{ borderColor: 'orange' }}
                placeholder="Entrez l'objet de la visite"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Commentaire/Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                style={{ borderColor: 'orange' }}
                placeholder="Entrez le commentaire ou la description"
              />
            </Form.Group>
            <Button
              variant="primary"
              type="button"
              style={{ backgroundColor: 'orange', borderColor: 'orange' }}
              onClick={handleAddRapport}
              disabled={!selectedClient || !objet}
            >
              Ajouter
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default RapportVisiteTable;