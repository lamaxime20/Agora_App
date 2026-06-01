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
import Ventes from './pages/modules/ventes';
import Finances from './pages/modules/finances';
import RessourcesHumaines from './pages/modules/ressourcesHumaines';

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
                            <Route path="/application/stock" element={<GestionStock />} />
                            <Route path="/application/vente" element={<Ventes />} />
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
