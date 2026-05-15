import React from 'react';
import { Card, Button, Modal } from 'react-bootstrap';
import NotificationsPage from '../../pages/manager/notificationPage';
import { useNotification } from './notificationContext';
import { useLocation } from 'react-router-dom';

const SousHeader = () => {
  const { showModal, openModal, closeModal, selectedNotification } = useNotification();
  const location = useLocation();

  // Mapper les chemins d'URL aux titres des pages
  const pageTitles = {
    '/manager/dashboard': 'DASHBOARD',
    '/manager/clients': 'CLIENTS & PROSPECTS',
    '/manager/dossiers': 'DOSSIERS',
    '/manager/factures': 'FACTURES',
    '/manager/fournisseurs': 'FOURNISSEURS',
    '/manager/commerciaux': 'COMMERCIAUX',
    '/manager/agenda': 'AGENDA',
  };

  // Obtenir le titre en fonction du chemin actuel, avec une valeur par défaut
  const pageTitle = pageTitles[location.pathname] || 'DASHBOARD';

  const handleNotificationsClick = (e) => {
    e.preventDefault();
    console.log('Icône de notification cliquée');
    openModal(); // Ouvre le modal sans notification sélectionnée
  };

  return (
    <Card className="shadow-sm mt-5 mt-md-2" style={{ marginLeft: '15px', marginRight: '15px', borderColor: 'white' }}>
      <Card.Body className="d-flex justify-content-between align-items-center shadow-sm">
        <h5 className="mb-0">{pageTitle}</h5>
        <div className="d-flex align-items-center gap-3">
          <Button
            variant="link"
            className="p-0"
            onClick={handleNotificationsClick}
          >
            <i className="bi bi-bell" style={{color: 'orange', fontSize: '24px'}}></i>
          </Button>
        </div>
      </Card.Body>
      <Modal show={showModal} onHide={closeModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Notifications & Alertes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNotification ? (
            <div>
              <h5>Détails de la notification</h5>
              <p>{selectedNotification.text}</p>
              <p>Date: {selectedNotification.date}</p>
            </div>
          ) : (
            <NotificationsPage />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Retour
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default SousHeader;