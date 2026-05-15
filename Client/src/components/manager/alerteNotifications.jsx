import { Card, ListGroup } from 'react-bootstrap';
import { useNotification } from './notificationContext';

const getAlertStyle = (text) => {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('facture')) {
    return {
      icon: 'bi bi-receipt',
      bgColor: '#FFF3CD',
    };
  }
  if (lowerText.includes('réunion')) {
    return {
      icon: 'bi bi-calendar-event',
      bgColor: '#D1ECF1',
    };
  }
  if (lowerText.includes('livraison')) {
    return {
      icon: 'bi bi-truck',
      bgColor: '#F8D7DA',
    };
  }
  if (lowerText.includes('paiement')) {
    return {
      icon: 'bi bi-credit-card',
      bgColor: '#D4EDDA',
    };
  }
  if (lowerText.includes('rappel')) {
    return {
      icon: 'bi bi-bell',
      bgColor: '#E2E3E5',
    };
  }

  return {
    icon: 'bi bi-info-circle',
    bgColor: '#ffffff',
  };
};

const AlertsNotifications = () => {
  const { openModal } = useNotification();

  const alerts = [
    { id: 1, text: 'Facture #123 à valider', date: '12/06/2025' },
    { id: 2, text: 'Réunion 14/06 à 10h', date: '12/06/2025' },
    { id: 3, text: 'Retard livraison #456', date: '11/06/2025' },
    { id: 4, text: 'Alerte paiement #789', date: '10/06/2025' },
    { id: 5, text: 'Rappel client X', date: '09/06/2025' },
    { id: 6, text: 'Facture #124 à valider', date: '08/06/2025' },
  ].slice(0, 6);

  return (
    <Card className="shadow-sm " style={{ position: 'sticky', top: '20px', overflowY: 'auto', borderColor: "orange" }}>
      <Card.Body>
        <Card.Title className="mb-4">Alertes & Notifications</Card.Title>
        <ListGroup variant="flush">
          {alerts.map((alert) => {
            const { icon, bgColor } = getAlertStyle(alert.text);

            return (
              <ListGroup.Item
                key={alert.id}
                action
                onClick={() => {
                  console.log('Notification cliquée:', alert);
                  openModal(alert); // Ouvre le modal avec la notification sélectionnée
                }}
                className="d-flex justify-content-between align-items-center"
                style={{ backgroundColor: bgColor }}
              >
                <div className="d-flex align-items-center gap-2">
                  <i className={`${icon} text-secondary`} style={{ fontSize: '1.1rem' }}></i>
                  <span>{alert.text}</span>
                </div>
                <small className="text-muted">{alert.date}</small>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default AlertsNotifications;