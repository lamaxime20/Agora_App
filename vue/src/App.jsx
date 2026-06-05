import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { AuthorizationProvider } from './context/AuthorizationContext';

import RouteGuardAuth from './components/guards/RouteGuardAuth';
import RouteGuardAuthorization from './components/guards/RouteGuardAuthorization';
import RouteGuardGuest from './components/guards/RouteGuardGuest';
import RouteGuardShared from './components/guards/RouteGuardShared';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ChoixRolePage from './pages/ChoixRolePage';
import ApplicationPage from './pages/ApplicationPage';
import CreateEntreprisePage from './pages/createEntreprise';
import GestionStock from './pages/modules/gestionStock';
import ProduitPage from './pages/modules/produit';
import Ventes from './pages/modules/ventes';
import Finances from './pages/modules/finances';
import RessourcesHumaines from './pages/modules/ressourcesHumaines';

import {
    GESTION_STOCK_DASHBOARD, GESTION_STOCK_PERTES,
    GESTION_STOCK_PRODUITS, GESTION_STOCK_REAPPROVISIONNEMENT,
    GESTION_STOCK_RESERVATIONS,
    GESTION_STOCK_STATISTIQUES
} from "./services/gestionStock.js";

import {
    VENTES_DASHBOARD,
    VENTES_COMMANDES,
    VENTES_RESERVATIONS,
    VENTES_CLIENTS,
    VENTES_STATISTIQUES
} from "./services/ventes.js";

import './App.css';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AuthorizationProvider>
                    <Routes>
                        <Route element={<RouteGuardGuest />}>
                            <Route path="/"                element={<LoginPage />} />
                            <Route path="/login"           element={<LoginPage />} />
                            <Route path="/signup"          element={<SignupPage />} />
                            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        </Route>

                        <Route element={<RouteGuardAuth />}>
                            <Route path="/choix-role" element={<ChoixRolePage />} />
                        </Route>

                        <Route element={<RouteGuardShared />}>
                            <Route path="/create-entreprise" element={<CreateEntreprisePage />} />
                        </Route>

                        <Route element={<RouteGuardAuthorization />}>
                            <Route path="/application" element={<ApplicationPage />} />
                            <Route path="/application/stock" element={<GestionStock  onglet={GESTION_STOCK_DASHBOARD} />} />
                            <Route path="/application/stock/produits" element={<GestionStock  onglet={GESTION_STOCK_PRODUITS} />} />
                            <Route path="/application/stock/reapprovisionnement" element={<GestionStock  onglet={GESTION_STOCK_REAPPROVISIONNEMENT} />} />
                            <Route path="/application/stock/reservations" element={<GestionStock  onglet={GESTION_STOCK_RESERVATIONS} />} />
                            <Route path="/application/stock/pertes" element={<GestionStock  onglet={GESTION_STOCK_PERTES} />} />
                            <Route path="/application/stock/statistiques" element={<GestionStock  onglet={GESTION_STOCK_STATISTIQUES} />} />
                            <Route path="/application/produit/:id" element={<ProduitPage />} />
                            <Route path="/application/vente" element={<Ventes onglet={VENTES_DASHBOARD} />} />
                            <Route path="/application/vente/commandes" element={<Ventes onglet={VENTES_COMMANDES} />} />
                            <Route path="/application/vente/reservations" element={<Ventes onglet={VENTES_RESERVATIONS} />} />
                            <Route path="/application/vente/clients" element={<Ventes onglet={VENTES_CLIENTS} />} />
                            <Route path="/application/vente/statistiques" element={<Ventes onglet={VENTES_STATISTIQUES} />} />
                            <Route path="/application/finances" element={<Finances />} />
                            <Route path="/application/ressources-humaines" element={<RessourcesHumaines />} />
                        </Route>

                        <Route path="/404" element={<div>Page 404</div>} />
                        <Route path="*" element={<Navigate to="/404" replace />} />
                    </Routes>
                </AuthorizationProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
