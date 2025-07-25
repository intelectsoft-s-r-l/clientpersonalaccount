// ClientApp/src/services/apiService.js

class ApiService {
    constructor() {
        // Теперь базовый URL - это ваш ASP.NET сервер
        this.baseUrl = process.env.NODE_ENV === 'development'
            ? 'https://localhost:8080' // Порт вашего ASP.NET приложения в development
            : window.location.origin;   // В production используем тот же домен
    }

    // Авторизация
    async login(email, password) {
        const response = await fetch(`${this.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Важно для работы с cookies
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка авторизации');
        }

        return await response.json();
    }

    // Обновление токена
    async refreshToken() {
        const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Не удалось обновить токен');
        }

        return await response.json();
    }

    // Получение информации о пользователе
    async getProfileInfo() {
        const response = await fetch(`${this.baseUrl}/api/auth/GetProfileInfo`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Не удалось получить информацию о пользователе');
        }

        return await response.json();
    }

    // Выход
    async logout() {
        const response = await fetch(`${this.baseUrl}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });

        return await response.json();
    }

    // Проверка токена
    async checkAuth() {
        const response = await fetch(`${this.baseUrl}/api/auth/me`, {
            credentials: 'include',
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    }

    // Универсальный метод для API запросов через прокси
    async proxyRequest(path, options = {}) {
        const {
            method = 'GET',
            body,
            headers = {},
            serviceId
        } = options;

        const requestHeaders = {
            'Content-Type': 'application/json',
            ...headers,
        };

        // Добавляем serviceId если указан
        if (serviceId) {
            requestHeaders['x-service-id'] = serviceId;
        }

        const fetchOptions = {
            method,
            headers: requestHeaders,
            credentials: 'include',
        };

        if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}/api/proxy${path}`, fetchOptions);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return await response.json();
    }
}

export default new ApiService();