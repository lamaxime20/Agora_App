import { Card, Row, Col } from 'react-bootstrap';

const TopClientsCritical = () => {
  const clients = [
    { rank: 1, name: "Client A", amount: "10 000 €", detail: "en attente" },
    { rank: 2, name: "Client B", amount: "8 000 €", detail: "Livraison retard" },
    { rank: 3, name: "Client C", amount: "5 000 €", detail: "Litige" },
    { rank: 4, name: "Client D", amount: "4 000 €", detail: "en attente" },
    { rank: 5, name: "Client E", amount: "3 000 €", detail: "Livraison retard" },
  ];

  return (
    <Card className="shadow-sm mb-4" style={{ borderColor: 'orange' }}>
      <Card.Body>
        <div style={{ background: 'rgba(255, 170, 0, 0.35)', padding: '10px', borderRadius: '5px' }}>
          <h4 style={{ color: '#dc3545', textAlign: 'center', margin: '0' }}>
            Top 5 de vos Clients Critiques
          </h4>
          {clients.map((client, index) => (
            <Row
              key={index}
              className="py-2 border-bottom"
              style={{ fontSize: '16px' }}
            >
              <Col xs={2} style={{ color: '#dc3545', fontWeight: 'bold' }}>
                {client.rank}
              </Col>
              <Col xs={4}>{client.name}</Col>
              <Col xs={6}>
                {client.amount} ({client.detail})
              </Col>
            </Row>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

export default TopClientsCritical;