import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Connexion from './pages/connexion';
import DashboardManagerPage from './pages/manager/dashboardPage';
import ClientsPage from './pages/manager/clientPage';
import DossiersPage from './pages/manager/dossiersPage';
import FacturesPage from './pages/manager/facturePage';
import FournisseursPage from './pages/manager/fournisseurPage';
import CommerciauxPage from './pages/manager/commerciauxPage';
import AgendaPage from './pages/manager/agendaPage';

import DashboardCommercialPage from './pages/commercial/dashboardPage';
import ClientsPageCommercial from './pages/commercial/clientsPage';
import DossierCommercialPage from './pages/commercial/dossierPageCommercial';
import CommandePageCommercial from './pages/commercial/commandePageCommercial';
import FacturePageCommercial from './pages/commercial/facturePageCommercial';
import LivraisonPageCommercial from './pages/commercial/livraisonPageCommercial';
import RapportVisitePageCommercial from './pages/commercial/rapportPageCommercial';
import AgendaPageCommercial from './pages/commercial/agendaPageCommercial';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Connexion />} />
        <Route path="/connexion" element={<Connexion />} />

        <Route
          path="/manager/dashboard"
          element={
            <PrivateRoute allowedRole="Manager">
              <DashboardManagerPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/clients"
          element={
            <PrivateRoute allowedRole="Manager">
              <ClientsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/dossiers"
          element={
            <PrivateRoute allowedRole="Manager">
              <DossiersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/factures"
          element={
            <PrivateRoute allowedRole="Manager">
              <FacturesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/fournisseurs"
          element={
            <PrivateRoute allowedRole="Manager">
              <FournisseursPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/commerciaux"
          element={
            <PrivateRoute allowedRole="Manager">
              <CommerciauxPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/manager/agenda"
          element={
            <PrivateRoute allowedRole="Manager">
              <AgendaPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/commercial/dashboard"
          element={
            <PrivateRoute allowedRole="Commercial">
              <DashboardCommercialPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/commercial/clients"
          element={
            <PrivateRoute allowedRole="Commercial">
              <ClientsPageCommercial />
            </PrivateRoute>
          }
        />
        <Route
          path="/commercial/dossiers"
          element={
            <PrivateRoute allowedRole="Commercial">
              <DossierCommercialPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/commercial/commandes"
          element={
            <PrivateRoute allowedRole="Commercial">
              <CommandePageCommercial />
            </PrivateRoute>
          }
        />
        <Route
          path="/commercial/factures"
          element={
            <PrivateRoute allowedRole="Commercial">
              <FacturePageCommercial />
            </PrivateRoute>
          }
        />
        <Route
          path="/commercial/livraisons"
          element={
            <PrivateRoute allowedRole="Commercial">
              <LivraisonPageCommercial />
            </PrivateRoute>
          }
        />
        <Route
          path="/commercial/rapports"
          element={
            <PrivateRoute allowedRole="Commercial">
              <RapportVisitePageCommercial />
            </PrivateRoute>
          }
        />
        <Route
          path="/commercial/agenda"
          element={
            <PrivateRoute allowedRole="Commercial">
              <AgendaPageCommercial />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;