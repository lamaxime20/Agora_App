import { Container, Row, Col, Card } from 'react-bootstrap';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Enregistrer les composants nécessaires pour Chart.js, y compris Filler
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

// Composant DynamicCharts
const DynamicCharts = () => {
  // Données simulées pour les graphiques
  const caData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'], // Périodes (mois)
    datasets: [
      {
        label: 'CA (€)',
        data: [50000, 60000, 55000, 70000, 65000, 80000],
        borderColor: '#FFA500',
        backgroundColor: 'rgba(246, 196, 59, 0.2)',
        fill: true, // Cette option nécessite le plugin Filler
      },
    ],
  };

  const commercialData = {
    labels: ['Comm 1', 'Comm 2', 'Comm 3', 'Comm 4'], // Commerciaux
    datasets: [
      {
        label: 'CA par Commercial (€)',
        data: [120000, 90000, 150000, 80000],
        backgroundColor: '#FFF3CD',
        borderColor: 'orange',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Montant (€)' },
      },
    },
  };

  return (
    <Row className="g-3 mt-2">
      <Col xs={12} lg={6}>
        <Card className="shadow-sm" style={{ borderColor: 'orange' }}>
          <Card.Body>
            <Card.Title className="mb-4">CA dans le temps</Card.Title>
            <div style={{ height: '300px', padding: '10px' }}>
              <Line data={caData} options={{ ...options, scales: { ...options.scales, x: { title: { display: true, text: 'Période' } } } }} />
            </div>
          </Card.Body>
        </Card>
      </Col>
      <Col xs={12} lg={6}>
        <Card className="shadow-sm" style={{ borderColor: 'orange' }}>
          <Card.Body>
            <Card.Title className="mb-4">CA par Commercial</Card.Title>
            <div style={{ height: '300px', padding: '10px' }}>
              <Bar data={commercialData} options={{ ...options, scales: { ...options.scales, x: { title: { display: true, text: 'Commercial' } } } }} />
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default DynamicCharts;