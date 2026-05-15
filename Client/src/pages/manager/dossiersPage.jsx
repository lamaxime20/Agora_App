import { Container, Row, Col, Card } from 'react-bootstrap';
import HeaderManager from '../../components/manager/hearderManger.jsx';
import Footer from '../../components/footer';
import SousHeader from '../../components/manager/sousHeaderManager.jsx';
import { NotificationProvider } from '../../components/manager/notificationContext.jsx';
import Filters from '../../components/filters.jsx';
import DossierTable from '../../components/manager/dossierTable.jsx';
import { createContext, useState } from 'react';

export const DossierContext = createContext();

const DossierPage = () => {
  const [filters, setFilters] = useState({
    date: '',
    status: 'Tous',
    commercial: 'Tous',
    client: 'Tous',
  });

  // Configuration des filtres pour la page Dossiers
  const filterConfig = [
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'status', label: 'Statut', type: 'select', statusType: 'dossiers' },
    { name: 'commercial', label: 'Commercial', type: 'select' },
    { name: 'client', label: 'Client', type: 'select' },
  ];

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100 w-100 overflow-hidden">
      {/* Sidebar à gauche avec largeur fixe sur md+ / navbar en haut sur petits écrans */}
      <div style={{ width: '250px', flexShrink: 0 }}>
        <HeaderManager />
      </div>

      {/* Contenu principal */}
      <div className="d-md-flex d-flex flex-column flex-grow-1 w-100">
        <main className="flex-grow-1 w-100 mt-5 mt-md-0">
          <NotificationProvider>
            <SousHeader />
            <Container fluid className="p-3 mt-md-0" style={{ borderColor: 'white' }}>
              <Card className="shadow-sm border-light">
                <Card.Body>
                  <DossierContext.Provider value={{ filters, setFilters }}>
                    <Filters filterConfig={filterConfig} context={DossierContext} />
                    <DossierTable />
                  </DossierContext.Provider>
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

export default DossierPage;