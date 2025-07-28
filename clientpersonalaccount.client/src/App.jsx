// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PageNavigationProvider } from './context/PageNavigationContext';

import LoginPage from './pages/Authorize/LoginPage';
import HomePage from './pages/HomePage';
import FiscalDevicePage from './pages/FisacalDevices/FiscalDevicePage';
import 'bootstrap/dist/css/bootstrap.min.css';

const LoadingScreen = () => (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
    </div>
);

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isInitialized } = useAuth();
    if (!isInitialized) return <LoadingScreen />;
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
    const { isAuthenticated, isInitialized } = useAuth();
    if (!isInitialized) return <LoadingScreen />;
    return !isAuthenticated ? children : <Navigate to="/Main" />;
};

const AppRoutes = () => (
    <Routes>
        <Route
            path="/login"
            element={
                <PublicRoute>
                    <LoginPage />
                </PublicRoute>
            }
        />
        <Route
            path="/Main"
            element={
                <ProtectedRoute>
                    <HomePage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/fiscal-devices/fiscalDevice/:id"
            element={
                <ProtectedRoute>
                    <FiscalDevicePage />
                </ProtectedRoute>
            }
        />
        <Route path="*" element={<Navigate to="/Main" />} />
    </Routes>
);

function App() {
    return (
        <AuthProvider>
            <PageNavigationProvider>
                <AppRoutes />
            </PageNavigationProvider>
        </AuthProvider>
    );
}

export default App;
