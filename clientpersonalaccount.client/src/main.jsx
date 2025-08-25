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
    return !isAuthenticated ? children : <Navigate to="/Main" replace />;
};

const router = createBrowserRouter(
    [
        {
            path: "/",
            element: (
                <Provider store={store}>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </Provider>
            ),
            children: [
                {
                    path: "",
                    element: <Navigate to="/Main" replace />
                },
                {
                    path: "login",
                    element: (
                        <PublicRoute>
                            <LoginPage />
                        </PublicRoute>
                    ),
                },
                {
                    path: "*",
                    element: (
                        <ProtectedRoute>
                            <HomePage />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "forgot-password",
                    element: <ForgotPasswordPage />,
                },
                { path: "fiscalDevices/fiscalDevice/:id", element: <FiscalDevicePage /> },
            ],
        },
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
