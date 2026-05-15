import { Container, Card, Button, Modal, Form } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import HeaderManager from '../../components/manager/hearderManger.jsx';
import Footer from '../../components/footer';
import SousHeader from '../../components/manager/sousHeaderManager.jsx';
import { NotificationProvider } from '../../components/manager/notificationContext.jsx';
import { useNavigate } from 'react-router-dom';

const AgendaPage = () => {
  const [date, setDate] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ titre: '', date: '', type: 'evenement' });
  const [events, setEvents] = useState([
    { id: 1, titre: '4:00 Événement Répétitif', date: new Date(2025, 0, 19), type: 'repétitif', couleur: '#dc3545' },
    { id: 2, titre: 'Conférence', date: new Date(2025, 0, 23), type: 'conférence', couleur: '#F37B14' },
    { id: 3, titre: 'Événement Long', debut: new Date(2025, 0, 26), fin: new Date(2025, 0, 27), type: 'long', couleur: '#6c757d' },
    { id: 4, titre: '4:51 Cérémonie d\'Ouverture', date: new Date(2025, 0, 27), type: 'cérémonie', couleur: '#28a745' },
    { id: 5, titre: '12h Petit Déjeuner', date: new Date(2025, 0, 31), type: 'petitdej', couleur: '#007bff' },
    { id: 6, titre: '13h21 Événement Répétitif', date: new Date(2025, 0, 31), type: 'repétitif', couleur: '#dc3545' },
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    // Synchroniser avec la date actuelle si besoin
  }, []);

  const handleAddEvent = () => {
    if (newEvent.titre && newEvent.date) {
      setEvents([...events, { id: Date.now(), titre: newEvent.titre, date: new Date(newEvent.date), type: newEvent.type, couleur: getEventColor(newEvent.type) }]);
      setNewEvent({ titre: '', date: '', type: 'evenement' });
      setShowAddEventModal(false);
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'repétitif': return '#dc3545';
      case 'conférence': return '#F37B14';
      case 'long': return '#6c757d';
      case 'cérémonie': return '#28a745';
      case 'petitdej': return '#007bff';
      default: return '#007bff';
    }
  };

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100 w-100 overflow-hidden">
      <div style={{ width: '250px', flexShrink: 0 }}>
        <HeaderManager />
      </div>
      <div className="d-md-flex d-flex flex-column flex-grow-1 w-100">
        <main className="flex-grow-1 w-100 mt-5 mt-md-0">
          <NotificationProvider>
            <SousHeader />
            <Container fluid className="p-3 mt-md-0">
              <Card className="shadow-sm border-light" style={{ borderColor: '#F37B14' }}>
                <Card.Body className="p-0">
                  <div className="d-flex justify-content-between align-items-center mb-3 p-3">
                    <Button variant="outline-primary" onClick={() => setDate(new Date())} style={{ color: '#F37B14', borderColor: '#F37B14' }}>Aujourd'hui</Button>
                    <Button variant="warning" style={{ backgroundColor: 'orange', borderColor: 'orange', color: '#FFFFFF' }} onClick={() => setShowAddEventModal(true)}>
                      Ajouter Nouvel Événement
                    </Button>
                  </div>
                  <div className="p-3">
                    <Card className="border-0">
                      <Card.Body className="p-0">
                        <Calendar 
                          onChange={setDate}
                          value={date}
                          tileContent={({ date: tileDate, view }) => {
                            if (view === 'month') {
                              const event = events.find(e => 
                                (e.date && e.date.toDateString() === tileDate.toDateString()) || 
                                (e.debut && e.fin && tileDate >= e.debut && tileDate <= e.fin)
                              );
                              return event ? <div style={{ backgroundColor: event.couleur, padding: '2px 5px', borderRadius: '3px', color: '#FFFFFF', fontSize: '12px' }}>{event.titre}</div> : null;
                            }
                            return null;
                          }}
                          className="agora-calendar w-100"
                        />
                      </Card.Body>
                    </Card>
                  </div>
                </Card.Body>
              </Card>
            </Container>
          </NotificationProvider>
        </main>
        <Footer className="mt-auto w-100" style={{ backgroundColor: '#F37B14', color: '#FFFFFF' }} />
      </div>

      {/* Modal pour ajouter un événement */}
      <Modal show={showAddEventModal} onHide={() => setShowAddEventModal(false)}>
        <Modal.Header closeButton style={{ backgroundColor: '#F37B14', color: '#FFFFFF' }}>
          <Modal.Title>Ajouter un Nouvel Événement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Titre</Form.Label>
              <Form.Control
                type="text"
                value={newEvent.titre}
                onChange={(e) => setNewEvent({ ...newEvent, titre: e.target.value })}
                placeholder="Entrez le titre de l'événement"
                style={{ borderColor: '#F37B14' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                style={{ borderColor: '#F37B14' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                style={{ borderColor: '#F37B14' }}
              >
                <option value="evenement">Événement</option>
                <option value="repétitif">Événement Répétitif</option>
                <option value="conférence">Conférence</option>
                <option value="long">Événement Long</option>
                <option value="cérémonie">Cérémonie</option>
                <option value="petitdej">Petit Déjeuner</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddEventModal(false)} style={{ color: '#F37B14', borderColor: '#F37B14' }}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleAddEvent} style={{ backgroundColor: '#F37B14', borderColor: '#F37B14', color: '#FFFFFF' }}>
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AgendaPage;