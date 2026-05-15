import { Row, Col, Card } from 'react-bootstrap';

const StatCards = () => {
  const stats = [
    {
      title: "CA Mensuel",
      value: "30 000 €",
      detail: "+3%",
      icon: "bi bi-currency-exchange",
    },
    {
      title: "Factures",
      value: "3 non payées",
      detail: "2 à valider",
      icon: "bi bi-receipt",
    },
    {
      title: "Livraisons",
      value: "20 dans délais",
      detail: "1 hors délais",
      icon: "bi bi-truck",
    },
    {
      title: "Clients",
      value: "40 clients",
      detail: "Vos clients",
      icon: "bi bi-file-person",
    },
  ];

  return (
    <Row className="g-4">
      {stats.map((stat, index) => (
        <Col key={index} md={3} className="d-flex">
          <Card
            className="flex-grow-1 shadow-sm rounded-1"
            style={{ transition: 'border-color 0.3s', borderColor: 'orange' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#FFA500')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
          >
            <Card.Body className="position-relative">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted" style={{ fontSize: '14px' }}>
                    {stat.title}
                  </div>
                  <div className="fw-bold" style={{ fontSize: '24px' }}>
                    {stat.value}
                  </div>
                  {stat.detail && (
                    <div className="text-success" style={{ fontSize: '14px' }}>
                      {stat.detail}
                    </div>
                  )}
                </div>
                <i
                  className={`${stat.icon} text-secondary`}
                  style={{ fontSize: '28px' }}
                ></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default StatCards;