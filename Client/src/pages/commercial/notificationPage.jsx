import React, { useState } from 'react';
import { Card, Table, Form, Button } from 'react-bootstrap';
import { useNotification } from '../../components/manager/notificationContext';

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

const NotificationsPage = () => {
  const { openModal } = useNotification();
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const alerts = [
    { id: 1, text: 'Facture #123 à valider', date: '12/06/2025' },
    { id: 2, text: 'Réunion 14/06 à 10h', date: '12/06/2025' },
    { id: 3, text: 'Retard livraison #456', date: '11/06/2025' },
    { id: 4, text: 'Alerte paiement #789', date: '10/06/2025' },
    { id: 5, text: 'Rappel client X', date: '09/06/2025' },
    { id: 6, text: 'Facture #124 à valider', date: '08/06/2025' },
  ];

  const handleDelete = (id) => {
    console.log(`Supprimer alerte ${id}`);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredAlerts = alerts.filter((alert) =>
    alert.text.toLowerCase().includes(search.toLowerCase())
  );

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (!sortColumn) return 0;
    const valueA = a[sortColumn] || '';
    const valueB = b[sortColumn] || '';
    return sortDirection === 'asc'
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  return (
    <Card className="shadow-sm border-light">
      <Card.Body>
        <Form.Control
          type="text"
          placeholder="Rechercher une notification..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
          style={{ width: '300px' }}
        />
        <Table striped bordered hover>
          <thead>
            <tr>
              <th onClick={() => handleSort('text')}>
                Notification {sortColumn === 'text' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('date')}>
                Date {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedAlerts.map((alert) => {
              const { icon, bgColor } = getAlertStyle(alert.text);
              return (
                <tr key={alert.id} style={{ backgroundColor: bgColor }}>
                  <td>
                    <i className={`${icon} text-secondary me-2`} style={{ fontSize: '1.1rem' }}></i>
                    {alert.text}
                  </td>
                  <td>{alert.date}</td>
                  <td>
                    <Button
                      variant="link"
                      className="p-0 me-2"
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Détails cliqués:', alert);
                        openModal(alert); // Ouvre le modal avec les détails
                      }}
                    >
                      <i className="bi bi-eye" style={{ color: '#007bff' }}></i>
                    </Button>
                    <Button
                      variant="link"
                      className="p-0"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(alert.id);
                      }}
                    >
                      <i className="bi bi-trash" style={{ color: '#dc3545' }}></i>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default NotificationsPage;