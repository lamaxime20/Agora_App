import { Container, Row, Col, Card } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Enregistrer les composants nécessaires pour Chart.js, y compris Filler
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Composant DynamicCharts
const DynamicCharts = () => {
  // Données simulées pour le graphique (spécifiques au commercial)
  const caData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'], // Périodes (mois)
    datasets: [
      {
        label: 'Votre CA (€)',
        data: [10000, 12000, 11000, 14000, 13000, 16000],
        borderColor: '#FFA500',
        backgroundColor: 'rgba(246, 196, 59, 0.2)',
        fill: true,
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
      x: {
        title: { display: true, text: 'Période' },
      },
    },
  };

  return (
    <Row className="g-3 mt-2">
      <Col xs={12}>
        <Card className="shadow-sm" style={{ borderColor: 'orange' }}>
          <Card.Body>
            <Card.Title className="mb-4">Votre CA dans le temps</Card.Title>
            <div style={{ height: '300px', padding: '10px' }}>
              <Line data={caData} options={options} />
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default DynamicCharts;