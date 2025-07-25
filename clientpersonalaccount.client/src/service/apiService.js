// ClientApp/src/services/apiService.js

class ApiService {
    constructor() {
        // ������ ������� URL - ��� ��� ASP.NET ������
        this.baseUrl = process.env.NODE_ENV === 'development'
            ? 'https://localhost:8080' // ���� ������ ASP.NET ���������� � development
            : window.location.origin;   // � production ���������� ��� �� �����
    }

    // �����������
    async login(email, password) {
        const response = await fetch(`${this.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // ����� ��� ������ � cookies
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '������ �����������');
        }

        return await response.json();
    }

    // ���������� ������
    async refreshToken() {
        const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('�� ������� �������� �����');
        }

        return await response.json();
    }

    // ��������� ���������� � ������������
    async getProfileInfo() {
        const response = await fetch(`${this.baseUrl}/api/auth/GetProfileInfo`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('�� ������� �������� ���������� � ������������');
        }

        return await response.json();
    }

    // �����
    async logout() {
        const response = await fetch(`${this.baseUrl}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });

        return await response.json();
    }

    // �������� ������
    async checkAuth() {
        const response = await fetch(`${this.baseUrl}/api/auth/me`, {
            credentials: 'include',
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    }

    // ������������� ����� ��� API �������� ����� ������
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

        // ��������� serviceId ���� ������
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