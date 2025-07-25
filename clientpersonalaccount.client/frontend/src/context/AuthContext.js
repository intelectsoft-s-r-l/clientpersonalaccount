import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setToken } from '../api/apiClient';

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

  // Обновление токена (токен в cookie, без тела запроса)
  const refreshToken = async () => {
    try {
      const response = await api.post('http://localhost:5001/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) return false;

      const result = await response.json();

      if (result.message) {
        return true;
      }

      return false;
    } catch (err) {
      console.error('Ошибка обновления токена:', err);
      return false;
    }
  };

  // Получение информации о пользователе (токен в cookie)
  const getUserInfo = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/GetProfileInfo', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) return null;

      const result = await response.json();

      if (result.user) {
        setUser(result.user);
        return result.user;
      }

      return null;
    } catch (error) {
      console.error('Ошибка при получении пользователя:', error);
      return null;
    }
  };

  // Логин — отправляем email и пароль, токен приходит в cookie от прокси
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (response.ok) {
        const user = await getUserInfo();
        if (user) {
          setIsAuthenticated(true);
          scheduleTokenRefresh();
          return { success: true };
        }
      }

      return { success: false, error: result.error || 'Ошибка авторизации' };
    } catch {
      return { success: false, error: 'Ошибка сети' };
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
      await fetch('http://localhost:5001/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Ошибка logout:', e);
    }
    setIsAuthenticated(false);
    setUser(null);
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      setRefreshTimer(null);
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
          await logout();
        }
      } else {
        await logout();
      }
    } catch (err) {
      console.error('Ошибка в initialize:', err);
      await logout();
    } finally {
      setIsInitialized(true);
    }
  };

  const getTokenFromServer = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const json = await response.json();
        return json.token;
      }

      return null;
    } catch (err) {
      console.error('Ошибка получения токена:', err);
      return null;
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
