import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [refreshTimer, setRefreshTimer] = useState(null);

    // Запланировать обновление токена с правильным ожиданием
    const scheduleTokenRefresh = () => {
        if (refreshTimer) clearTimeout(refreshTimer);

        const timer = setTimeout(async () => {
            const success = await refreshToken();
            if (success) {
                scheduleTokenRefresh(); // Рекурсивно запускаем следующий таймер
            } else {
                await logout(); // При ошибке обновления — делаем logout
            }
        }, 110000); // 110 секунд
        setRefreshTimer(timer);
    };

    const refreshToken = async () => {
        try {
            await apiService.refreshToken();
            return true;
        } catch (error) {
            console.error('Ошибка обновления токена:', error);
            return false;
        }
    };

    // Получение информации о пользователе (токен в cookie)
    const getUserInfo = async () => {
        try {
            const userInfo = await apiService.getProfileInfo();

            setUser(userInfo.user);
            setIsAuthenticated(true);

            return true;
        } catch (error) {
            console.error('Ошибка при получении пользователя:', error);
            return false;
        }
    };

    // Логин — отправляем email и пароль, токен приходит в cookie от прокси
    const login = async (email, password) => {
        try {
            await apiService.login(email, password);
            await new Promise(resolve => setTimeout(resolve, 100));
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

    const forgotPassword = async (email) => {
        try {
            const response = await fetch('http://localhost:5001/api/auth/reset', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();
            if (response.ok) {
                return { success: true };
            }

            return { success: false, error: result.error || 'Ошибка восстановаления пароля' };
        } catch {
            return { success: false, error: 'Ошибка сети' };
        }
    };

    // Выход — очищаем состояние и таймер
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

    // Инициализация — обновляем токен и получаем профиль при загрузке
    const initialize = async () => {
        try {
            const refreshed = await refreshToken();
            if (refreshed) {
                const user = await getUserInfo();
                if (user) {
                    setIsAuthenticated(true);
                    scheduleTokenRefresh();
                } else {
                }
            } else {
            }
        } catch (err) {
            console.error('Ошибка в initialize:', err);
        } finally {
            setIsInitialized(true);
        }
    };

    const getTokenFromServer = async () => {
        try {
            let resp = await apiService.checkAuth();
            const token = resp.token;
            return token;
        } catch (error) {
            console.error('Ошибка получения токена:', error);
        }
    };

    useEffect(() => {
        initialize();
        return () => {
            if (refreshTimer) clearTimeout(refreshTimer);
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isInitialized,
                isAuthenticated,
                user,
                login,
                forgotPassword,
                logout,
                getTokenFromServer,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
