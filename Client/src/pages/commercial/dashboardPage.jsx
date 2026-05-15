import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import HeaderCommercial from '../../components/commercial/headerCommercial.jsx';
import SousHeaderCommercial from '../../components/commercial/sousHeaderCommercial.jsx';
import Footer from '../../components/footer';
import StatCards from '../../components/commercial/statCards.jsx';
import DynamicCharts from '../../components/commercial/graphes.jsx';
import TopClientsCritical from '../../components/commercial/topclient.jsx';
import AlertsNotifications from '../../components/commercial/alerteNotification.jsx';
import { NotificationProvider } from '../../components/manager/notificationContext.jsx';

const DashboardCommercialPage = () => {
  return (
    <div className="d-flex flex-column flex-md-row min-vh-100 w-100 overflow-hidden">
      {/* Sidebar à gauche avec largeur fixe sur md+ / navbar en haut sur petits écrans */}
      <div style={{ width: '250px', flexShrink: 0 }}>
        <HeaderCommercial />
      </div>

      {/* Contenu principal */}
      <div className="d-md-flex d-flex flex-column flex-grow-1 w-100">
        <main className="flex-grow-1 w-100 mt-5 mt-md-0">
          <NotificationProvider>
            <SousHeaderCommercial />
            <Container fluid className="p-3 mt-md-0" style={{ borderColor: 'white' }}>
              <StatCards />
              <DynamicCharts />
              <Row className="mt-4">
                <Col lg={7}>
                  <TopClientsCritical />
                </Col>
                <Col lg={5}>
                  <AlertsNotifications />
                </Col>
              </Row>
            </Container>
          </NotificationProvider>
        </main>

        <Footer className="mt-auto w-100" />
      </div>
    </div>
  );
};

export default DashboardCommercialPage;