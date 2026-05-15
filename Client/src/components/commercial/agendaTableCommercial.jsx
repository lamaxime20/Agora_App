import { Button, Row, Col, Card, Modal, Form, Nav } from 'react-bootstrap';
import { useState, useContext } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { AgendaContext } from '../../pages/commercial/agendaPageCommercial';

const AgendaTable = ({ commercialId }) => {
  const { filters, setFilters } = useContext(AgendaContext);
  const [events, setEvents] = useState([
    {
      id: 'EV-0001',
      date: new Date('2025-06-18'),
      recurrence: 'unique',
      time: '14:00',
      title: 'Réunion commerciale',
      description: 'Préparation du trimestre.',
      type: 'réunion',
      color: '#dc3545',
    },
    {
      id: 'EV-0002',
      date: new Date('2025-06-18'),
      recurrence: 'unique',
      time: '10:00',
      title: 'Visite client',
      description: 'Suivi avec Cendrillon Ayot.',
      type: 'visite',
      color: '#F37B14',
      client: { id: 1, name: 'Cendrillon Ayot', address: '69 rue Nations, 22000 Paris' },
      dossier: 'D001',
    },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('events');
  const [recurrence, setRecurrence] = useState('unique');
  const [time, setTime] = useState('09:00');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('réunion');
  const [client, setClient] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [clients] = useState([
    { id: 1, name: 'Cendrillon Ayot', address: '69 rue Nations, 22000 Paris' },
    { id: 2, name: 'Client B', address: '25 Avenue des Champs, 75008 Paris' },
  ]);
  const [dossiers] = useState([
    { id: 'D001', clientId: 1 },
    { id: 'D002', clientId: 2 },
  ]);
  const [people] = useState(['Jean Dupont', 'Marie Leclerc', 'Pierre Martin']);

  const handleAddEvent = () => {
    const newEvent = {
      id: `EV-${String(events.length + 1).padStart(4, '0')}`,
      date: new Date(selectedDate),
      recurrence,
      time,
      title,
      description,
      type,
      color: getEventColor(type),
      ...(type === 'visite' ? { client: clients.find(c => c.id === client), dossier } : {}),
      ...(type === 'réunion' ? { participants } : {}),
    };
    setEvents([...events, newEvent]);
    setShowAddModal(false);
    setRecurrence('unique');
    setTime('09:00');
    setTitle('');
    setDescription('');
    setType('réunion');
    setClient(null);
    setDossier(null);
    setParticipants([]);
  };

  const handleDeleteEvent = (id) => {
    setEvents(events.filter(e => e.id !== id));
    setSelectedEvent(null);
  };

  const handleUpdateEvent = () => {
    if (selectedEvent) {
      setEvents(events.map(e =>
        e.id === selectedEvent.id
          ? { ...selectedEvent, date: new Date(selectedDate), recurrence, time, title, description, type, color: getEventColor(type), ...(type === 'visite' ? { client: clients.find(c => c.id === client), dossier } : {}), ...(type === 'réunion' ? { participants } : {}) }
          : e
      ));
      setSelectedEvent(null);
      setShowAddModal(false);
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'réunion': return '#dc3545';
      case 'visite': return '#F37B14';
      case 'anniversaire': return '#28a745';
      default: return '#007bff';
    }
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const eventDate = date.toLocaleDateString('fr-FR');
      const eventsForDate = events.filter(e => e.date.toLocaleDateString('fr-FR') === eventDate);
      return eventsForDate.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {eventsForDate.map(e => (
            <div key={e.id} style={{ backgroundColor: e.color, padding: '2px 5px', borderRadius: '3px', color: '#FFFFFF', fontSize: '12px' }}>
              {e.title}
            </div>
          ))}
        </div>
      ) : null;
    }
    return null;
  };

  const currentDate = new Date().toLocaleDateString('fr-FR');

  return (
    <div>
      <Row className="d-flex align-items-center mb-3 p-3">
        <Col xs="auto">
          <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav.Item>
              <Nav.Link eventKey="events" style={{ color: activeTab === 'events' ? 'white' : '#000', borderColor: activeTab === 'events' ? 'orange' : '#dee2e6', backgroundColor: activeTab === 'events' ? 'orange' : '#dee2e6' }}>
                Événements du Jour
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="calendar" style={{ color: activeTab === 'calendar' ? 'white' : '#000', borderColor: activeTab === 'calendar' ? 'orange' : '#dee2e6', backgroundColor: activeTab === 'calendar' ? 'orange' : '#dee2e6'  }}>
                Calendrier
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col className="d-flex justify-content-end">
          <Button variant="warning" style={{ backgroundColor: 'orange', borderColor: 'orange', color: '#FFFFFF' }} onClick={() => setShowAddModal(true)}>
            Ajouter Nouvel Événement
          </Button>
        </Col>
      </Row>
      {activeTab === 'events' ? (
        <Row>
            <Col xs={12}>
                <Card className="shadow-sm" style={{ borderColor: 'orange', width: '100%' }}>
                    <Card.Body style={{ padding: '10px', width: '100%' }}>
                        <h5>Événements du {currentDate}</h5>
                        {events.filter(e => e.date.toLocaleDateString('fr-FR') === currentDate).map((event) => (
                        <Card key={event.id} className="mb-2 mt-4 " style={{ borderColor: event.color, width: '100%' }}>
                            <Card.Body style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h6 style={{ fontSize: '16px', margin: '0', color: event.color }}>{event.title} ({event.time})</h6>
                                    <p style={{ fontSize: '14px', margin: '5px 0' }}>{event.description}</p>
                                    {event.type === 'visite' && event.client && <p style={{ fontSize: '14px', margin: '5px 0' }}>Client: {event.client.name}</p>}
                                    {event.type === 'visite' && event.dossier && <p style={{ fontSize: '14px', margin: '5px 0' }}>Dossier: {event.dossier}</p>}
                                    {event.type === 'réunion' && event.participants && <p style={{ fontSize: '14px', margin: '5px 0' }}>Participants: {event.participants.join(', ')}</p>}
                                </div>
                                <div>
                                    <Button variant="danger" size="sm" onClick={() => handleDeleteEvent(event.id)} style={{ padding: '2px 6px', fontSize: '12px', marginRight: '5px' }}>
                                    Supprimer
                                    </Button>
                                    <Button variant="warning" size="sm" onClick={() => { setSelectedEvent(event); setShowAddModal(true); }} style={{ padding: '2px 6px', fontSize: '12px' }}>
                                    Modifier
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                        ))}
                    </Card.Body>
                </Card>
            </Col>
        </Row>
      ) : (
        <Row>
            <Card className="border-0" style={{ width: '100%' }}>
                <Card.Body className="p-0">
                    <Calendar
                        onChange={setSelectedDate}
                        value={selectedDate}
                        tileContent={tileContent}
                        className="w-100"
                        style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}
                    />
                </Card.Body>
            </Card>
        </Row>
      )}
      <Modal show={showAddModal} onHide={() => { setShowAddModal(false); setSelectedEvent(null); }} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#F37B14', color: '#FFFFFF' }}>
          <Modal.Title>{selectedEvent ? 'Modifier Événement' : 'Ajouter un Nouvel Événement'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Titre</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entrez le titre de l'événement"
                style={{ borderColor: '#F37B14', width: '100%' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                style={{ borderColor: '#F37B14', width: '100%' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Heure</Form.Label>
              <Form.Control
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{ borderColor: '#F37B14', width: '100%' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Récurrence</Form.Label>
              <Form.Select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} style={{ borderColor: '#F37B14', width: '100%' }}>
                <option value="unique">Unique</option>
                <option value="monthly">Tous les jours de chaque mois</option>
                <option value="yearly">Tous les jours/mois de chaque année</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select value={type} onChange={(e) => setType(e.target.value)} style={{ borderColor: '#F37B14', width: '100%' }}>
                <option value="réunion">Réunion</option>
                <option value="visite">Visite</option>
                <option value="anniversaire">Anniversaire</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ borderColor: '#F37B14', width: '100%' }}
                placeholder="Entrez la description"
              />
            </Form.Group>
            {type === 'visite' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Client</Form.Label>
                  <Form.Select value={client || ''} onChange={(e) => { setClient(Number(e.target.value)); setDossier(null); }} style={{ borderColor: '#F37B14', width: '100%' }}>
                    <option value="">Choisir un client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                {client && (
                  <Form.Group className="mb-3">
                    <Form.Label>Dossier (optionnel)</Form.Label>
                    <Form.Select value={dossier || ''} onChange={(e) => setDossier(e.target.value)} style={{ borderColor: '#F37B14', width: '100%' }}>
                      <option value="">Aucun dossier</option>
                      {dossiers.filter(d => d.clientId === client).map((d) => (
                        <option key={d.id} value={d.id}>{d.id}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}
              </>
            )}
            {type === 'réunion' && (
              <Form.Group className="mb-3">
                <Form.Label>Participants</Form.Label>
                <Form.Control
                  as="select"
                  multiple
                  value={participants}
                  onChange={(e) => setParticipants(Array.from(e.target.selectedOptions, option => option.value))}
                  style={{ borderColor: '#F37B14', width: '100%', height: '100px' }}
                >
                  {people.map((person) => (
                    <option key={person} value={person}>{person}</option>
                  ))}
                </Form.Control>
              </Form.Group>
            )}
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={() => { setShowAddModal(false); setSelectedEvent(null); }} style={{ color: '#F37B14', borderColor: '#F37B14', marginRight: '10px' }}>
                Annuler
              </Button>
              <Button variant="primary" onClick={selectedEvent ? handleUpdateEvent : handleAddEvent} style={{ backgroundColor: '#F37B14', borderColor: '#F37B14', color: '#FFFFFF' }} disabled={!title || (type === 'visite' && !client)}>
                {selectedEvent ? 'Modifier' : 'Enregistrer'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AgendaTable;