import { useState } from 'react';
import { Card, Row, Col, Dropdown } from 'react-bootstrap';

const TopClientsCritical = () => {
  const [filter, setFilter] = useState('Global');
  const clients = [
    { rank: 1, name: "Client A", amount: "50 000 €", detail: "en attente" },
    { rank: 2, name: "Client B", amount: "30 000 €", detail: "Livraison retard" },
    { rank: 3, name: "Client C", amount: "20 000 €", detail: "Litige" },
    { rank: 4, name: "Client D", amount: "15 000 €", detail: "en attente" },
    { rank: 5, name: "Client E", amount: "10 000 €", detail: "Livraison retard" },
  ];

  return (
    <Card className="shadow-sm  mb-4" style={{borderColor: 'orange'}}>
      <Card.Body>
        <Dropdown className="mb-3">
          <Dropdown.Toggle variant="secondary" id="dropdown-basic" style={{backgroundColor: "orange", borderColor: "orange"}}>
            {filter}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => setFilter('Global')}>Global</Dropdown.Item>
            <Dropdown.Item onClick={() => setFilter('Commercial 1')}>Commercial 1</Dropdown.Item>
            <Dropdown.Item onClick={() => setFilter('Commercial 2')}>Commercial 2</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <div style={{ background: 'rgba(255, 170, 0, 0.35)', padding: '10px', borderRadius: '5px' }}>
          <h4 style={{ color: '#dc3545', textAlign: 'center', margin: '0' }}>Top 5 Clients Critiques</h4>
          {clients.map((client, index) => (
            <Row key={index} className="py-2 border-bottom" style={{ fontSize: '16px'}}>
              <Col xs={2} style={{ color: '#dc3545', fontWeight: 'bold' }}>{client.rank}</Col>
              <Col xs={4} >{client.name}</Col>
              <Col xs={6}>{client.amount} ({client.detail})</Col>
            </Row>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

export default TopClientsCritical;