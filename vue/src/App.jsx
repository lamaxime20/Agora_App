import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { AuthorizationProvider } from './context/AuthorizationContext';

import RouteGuardAuth from './components/guards/RouteGuardAuth';
import RouteGuardAuthorization from './components/guards/RouteGuardAuthorization';
import RouteGuardGuest from './components/guards/RouteGuardGuest';
import RouteGuardShared from './components/guards/RouteGuardShared';

import './App.css';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AuthorizationProvider>
                    <Routes>
                        <Route element={<RouteGuardGuest />}>
                            <Route path="/" element={<div>Page Login</div>} />
                            <Route path="/login" element={<div>Page Login</div>} />
                            <Route path="/signup" element={<div>Page Signup</div>} />
                        </Route>

                        <Route element={<RouteGuardAuth />}>
                            <Route path="/choix-role" element={<div>Page Choix de rôle</div>} />
                        </Route>

                        <Route element={<RouteGuardShared />}>
                            <Route path="/create-entreprise" element={<div>Page Créer une entreprise</div>} />
                        </Route>

                        <Route element={<RouteGuardAuthorization />}>
                            <Route path="/application" element={<div>Page Application</div>} />
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
