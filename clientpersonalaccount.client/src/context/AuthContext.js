// ClientApp/src/hooks/useAuth.js
import { useState, useEffect, useContext, createContext } from 'react';
import apiService from '../services/apiService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Проверка авторизации при загрузке приложения
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            setLoading(true);
            const authData = await apiService.checkAuth();

            if (authData?.token) {
                const userInfo = await apiService.getProfileInfo();
                setUser(userInfo.user);
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            await apiService.login(email, password);
            const userInfo = await apiService.getProfileInfo();

            setUser(userInfo.user);
            setIsAuthenticated(true);

            return { success: true };
        } catch (error) {
            console.error('Ошибка входа:', error);
            return {
                success: false,
                error: error.message || 'Ошибка авторизации'
            };
        }
    };

    const logout = async () => {
        try {
            await apiService.logout();
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const refreshToken = async () => {
        try {
            await apiService.refreshToken();
            return true;
        } catch (error) {
            console.error('Ошибка обновления токена:', error);
            // Если не удалось обновить токен, разлогиниваем пользователя
            await logout();
            return false;
        }
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshToken,
        checkAuthStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth должен использоваться внутри AuthProvider');
    }
    return context;
};