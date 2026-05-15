import { Container, Row, Col, Card } from 'react-bootstrap';
import HeaderCommercial from '../../components/commercial/headerCommercial.jsx';
import Footer from '../../components/footer';
import SousHeader from '../../components/commercial/sousHeaderCommercial.jsx';
import { NotificationProvider } from '../../components/manager/notificationContext.jsx';
import Filters from '../../components/filters.jsx';
import RapportVisiteTable from '../../components/commercial/rapportTableCommercial.jsx';
import { createContext, useState } from 'react';

export const RapportVisiteContext = createContext();

const RapportVisitePageCommercial = ({ commercialId = 'Commercial 1' }) => {
  const [filters, setFilters] = useState({
    date: '',
    client: 'Tous',
  });

  const filterConfig = [
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'client', label: 'Client', type: 'select' },
  ];

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100 w-100 overflow-hidden">
      <div style={{ width: '250px', flexShrink: 0 }}>
        <HeaderCommercial />
      </div>
      <div className="d-md-flex d-flex flex-column flex-grow-1 w-100">
        <main className="flex-grow-1 w-100 mt-5 mt-md-0">
          <NotificationProvider>
            <SousHeader />
            <Container fluid className="p-3 mt-md-0">
              <Card className="shadow-sm border-light">
                <Card.Body>
                  <RapportVisiteContext.Provider value={{ filters, setFilters }}>
                    <Row className="mb-3 align-items-end">
                      <Filters filterConfig={filterConfig} context={RapportVisiteContext} />
                      <RapportVisiteTable commercialId={commercialId} />
                    </Row>
                  </RapportVisiteContext.Provider>
                </Card.Body>
              </Card>
            </Container>
          </NotificationProvider>
        </main>
        <Footer className="mt-auto w-100" />
      </div>
    </div>
  );
};

export default RapportVisitePageCommercial;