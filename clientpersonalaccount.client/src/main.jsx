import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import './styles/themes.css';
import store from './store.js';
import "./i18n";
import {
    createBrowserRouter,
    RouterProvider,
    Navigate,
} from "react-router-dom";

import App from './App';
import LoginPage from './pages/Authorize/LoginPage';
import ForgotPasswordPage from './pages/Authorize/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import FiscalDevicePage from './pages/FisacalDevices/FiscalDevicePage';
import FiscalDevicesListPage from './pages/FisacalDevices/FiscalDevicesListPage';
import AssortementPage from './pages/Assortement/AssortementPage';
import LicensePage from './pages/License/LicensePage';
import BankPage from './pages/Bank/BankPage';
import TransactionDKVPage from './pages/TransactionDKV/TransactionDKVPage';
import DashboardPage from './pages/DashboardPage';

import { AuthProvider, useAuth } from './context/AuthContext';

// Загрузка
const LoadingScreen = () => (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
    </div>
);

// Защищённый маршрут
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isInitialized } = useAuth();
    if (!isInitialized) return <LoadingScreen />;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Публичный маршрут
const PublicRoute = ({ children }) => {
    const { isAuthenticated, isInitialized } = useAuth();
    if (!isInitialized) return <LoadingScreen />;
    return !isAuthenticated ? children : <Navigate to="/Dashboard" replace />;
};

const router = createBrowserRouter(
    [
        {
            path: "/login",
            element: (
                <AuthProvider>
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                </AuthProvider>
            )
        },
        {
            path: "/forgot-password",
            element: (
                <AuthProvider>
                    <PublicRoute>
                        <ForgotPasswordPage />
                    </PublicRoute>
                </AuthProvider>
            )
        },
        {
            path: "/",
            element: (
                <AuthProvider>
                    <ProtectedRoute>
                        <App />  {/* здесь уже Sidebar, TopBar */}
                    </ProtectedRoute>
                </AuthProvider>
            ),
            children: [
                { path: "Dashboard", element: <DashboardPage /> },
                { path: "Assortement", element: <AssortementPage /> },
                { path: "License", element: <LicensePage /> },
                { path: "FiscalDevices", element: <FiscalDevicesListPage /> },
                { path: "FiscalDevices/:id", element: <FiscalDevicePage /> },
                { path: "Banks", element: <BankPage /> },
                { path: "TransactionDkv", element: <TransactionDKVPage /> },
            ]
        }
    ],
    {
        unstable_future: {
            v7_startTransition: true,
            v7_relativeSplatPath: true,
        },
    }
);

ReactDOM.createRoot(document.getElementById("root")).render(
    <RouterProvider router={router} />
);
