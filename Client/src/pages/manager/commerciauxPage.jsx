import { Container, Card } from 'react-bootstrap';
import HeaderManager from '../../components/manager/hearderManger.jsx';
import Footer from '../../components/footer';
import SousHeader from '../../components/manager/sousHeaderManager.jsx';
import { NotificationProvider } from '../../components/manager/notificationContext.jsx';
//import CommerciauxFilters from '../../components/manager/commerciauxFiltre.jsx';
import CommerciauxTable from '../../components/manager/commerciauxTable.jsx';
import { createContext, useState } from 'react';

export const CommerciauxContext = createContext();

const CommerciauxPage = () => {
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    date: '',
  });

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100 w-100 overflow-hidden">
      <div style={{ width: '250px', flexShrink: 0 }}>
        <HeaderManager />
      </div>
      <div className="d-md-flex d-flex flex-column flex-grow-1 w-100">
        <main className="flex-grow-1 w-100 mt-5 mt-md-0">
          <NotificationProvider>
            <SousHeader />
            <Container fluid className="p-3 mt-md-0" style={{ borderColor: 'white' }}>
              <Card className="shadow-sm border-light">
                <Card.Body>
                  <CommerciauxContext.Provider value={{ filters, setFilters }}>
                    <CommerciauxTable />
                  </CommerciauxContext.Provider>
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

export default CommerciauxPage;