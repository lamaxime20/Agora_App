import React from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import { useState, useContext } from 'react';
import { CommerciauxContext } from '../../pages/manager/commerciauxPage';
import { useNavigate } from 'react-router-dom';

const CommerciauxTable = () => {
  const { filters } = useContext(CommerciauxContext);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCommercial, setNewCommercial] = useState({ name: '', email: '', phone: '' });
  const navigate = useNavigate();

  // Données simulées
  const commerciaux = [
    {
      id: 1,
      name: 'Jean Dupont',
      email: 'jean.dupont@x.com',
      phone: '06 12 34 56 78',
      creationDate: '2023-01-15',
      clients: [
        { id: 1, name: 'Client A', status: 'Terminé', turnover: 5000 },
        { id: 2, name: 'Client B', status: 'Non cloturé', turnover: 3000 },
      ],
      agenda: [
        { id: 1, title: 'Réunion Client A', date: '2025-06-20', time: '10:00' },
        { id: 2, title: 'Appel Client B', date: '2025-06-21', time: '14:00' },
      ],
    },
    {
      id: 2,
      name: 'Marie Leclerc',
      email: 'marie.leclerc@x.com',
      phone: '06 23 45 67 89',
      creationDate: '2023-06-20',
      clients: [
        { id: 3, name: 'Client C', status: 'Terminé', turnover: 7000 },
        { id: 4, name: 'Client D', status: 'Non cloturé', turnover: 4000 },
      ],
      agenda: [{ id: 3, title: 'Réunion Client C', date: '2025-06-22', time: '09:00' }],
    },
  ];

  // Filtrage
  const filteredCommerciaux = commerciaux.filter((commercial) => {
    const matchesSearch =
      !filters.name ||
      commercial.name.toLowerCase().includes(filters.name.toLowerCase()) ||
      commercial.email.toLowerCase().includes(filters.email.toLowerCase()) ||
      commercial.phone.includes(filters.phone);
    const matchesDate = !filters.date || new Date(commercial.creationDate) >= new Date(filters.date);
    return matchesSearch && matchesDate;
  });

  const handleDeleteCommercial = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce commercial ?')) {
      // Update commerciaux state (in a real app, this would be a state or API call)
      console.log(`Supprimer commercial ID: ${id}`);
    }
  };

  const handleAddCommercial = () => {
    if (newCommercial.name && newCommercial.email && newCommercial.phone) {
      const currentDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD
      const newEntry = {
        ...newCommercial,
        id: Date.now(),
        creationDate: currentDate,
        clients: [],
        agenda: [],
      };
      // Update commerciaux state (in a real app, this would be a state or API call)
      console.log('Ajouter commercial:', newEntry);
      setNewCommercial({ name: '', email: '', phone: '' });
      setShowAddModal(false);
    }
  };

  const handlePlanMeeting = (commercialId) => {
    navigate(`/manager/reunion?commercialId=${commercialId}`);
  };

  // Calcul du chiffre d'affaires et du nombre de clients
  const calculateTurnover = (clients) => {
    return clients.reduce((sum, client) => sum + client.turnover, 0);
  };

  const countClientsByStatus = (clients, status) => {
    return clients.filter((client) => client.status === status).length;
  };

  // Résumé de l'agenda
  const getAgendaSummary = (agenda) => {
    return agenda.length > 0
      ? `${agenda.length} événement(s) prévu(s)`
      : 'Aucun événement';
  };

  return (
    <div>
      <Button
        variant="warning"
        style={{ backgroundColor: 'orange', borderColor: 'orange', color: 'white' }}
        onClick={() => setShowAddModal(true)}
        className="mb-3"
      >
        <i className="bi bi-plus-circle me-2" style={{ color: 'white' }}></i> Ajouter Commercial
      </Button>
      {filteredCommerciaux.length === 0 ? (
        <p>Aucun commercial trouvé avec les filtres actuels.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Date de Création</th>
                <th>Dossiers Terminés</th>
                <th>Dossiers Non Cloturés</th>
                <th>Nombre de Clients</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommerciaux.map((commercial) => (
                <tr key={commercial.id}>
                  <td>{commercial.id}</td>
                  <td>{commercial.name}</td>
                  <td>{commercial.email}</td>
                  <td>{commercial.phone}</td>
                  <td>{commercial.creationDate}</td>
                  <td>{countClientsByStatus(commercial.clients, 'Terminé')}</td>
                  <td>{countClientsByStatus(commercial.clients, 'Non cloturé')}</td>
                  <td>
                    {commercial.clients.length} (CA: {calculateTurnover(commercial.clients)} €)
                  </td>
                  <td>
                    <Button
                      variant="link"
                      onClick={() => handlePlanMeeting(commercial.id)}
                      className="p-1"
                    >
                      <i className="bi bi-calendar" style={{ color: '#28a745' }}></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => handleDeleteCommercial(commercial.id)}
                      className="p-1"
                    >
                      <i className="bi bi-trash" style={{ color: '#dc3545' }}></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Modal pour ajouter un commercial */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un Commercial</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nom</Form.Label>
              <Form.Control
                type="text"
                value={newCommercial.name}
                onChange={(e) => setNewCommercial({ ...newCommercial, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={newCommercial.email}
                onChange={(e) => setNewCommercial({ ...newCommercial, email: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Téléphone</Form.Label>
              <Form.Control
                type="text"
                value={newCommercial.phone}
                onChange={(e) => setNewCommercial({ ...newCommercial, phone: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleAddCommercial}>
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CommerciauxTable;