import { Container, Row, Col, Card } from 'react-bootstrap';
import HeaderCommercial from '../../components/commercial/headerCommercial.jsx';
import Footer from '../../components/footer';
import SousHeader from '../../components/commercial/sousHeaderCommercial.jsx';
import { NotificationProvider } from '../../components/manager/notificationContext.jsx';
import AgendaTable from '../../components/commercial/agendaTableCommercial.jsx';
import { createContext, useState } from 'react';

export const AgendaContext = createContext();

const AgendaPageCommercial = ({ commercialId = 'Commercial 1' }) => {
  const [filters, setFilters] = useState({});

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
              <Card className="shadow-sm border-light" style={{ borderColor: '#F37B14' }}>
                <Card.Body className="p-0">
                  <AgendaContext.Provider value={{ filters, setFilters }}>
                    <AgendaTable commercialId={commercialId} />
                  </AgendaContext.Provider>
                </Card.Body>
              </Card>
            </Container>
          </NotificationProvider>
        </main>
        <Footer className="mt-auto w-100" style={{ backgroundColor: '#F37B14', color: '#FFFFFF' }} />
      </div>
    </div>
  );
};

export default AgendaPageCommercial;