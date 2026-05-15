import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import HeaderManager from '../../components/manager/hearderManger.jsx';
import Footer from '../../components/footer';
import SousHeader from '../../components/manager/sousHeaderManager.jsx';
import StatCards from '../../components/manager/cartes';
import DynamicCharts from '../../components/manager/graphes.jsx';
import TopClientsCritical from '../../components/manager/topClientCritique.jsx';
import AlertsNotifications from '../../components/manager/alerteNotifications.jsx';
import { NotificationProvider } from '../../components/manager/notificationContext.jsx';

const DashboardManagerPage = () => {
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
                <SousHeader/>  
                <Container fluid className="p-3 mt-md-0" style={{  borderColor: 'white' }}>
                <StatCards/>  
                <DynamicCharts/>
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

export default DashboardManagerPage;