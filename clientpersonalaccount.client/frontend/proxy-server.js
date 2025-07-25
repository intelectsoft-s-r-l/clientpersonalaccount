// proxy-server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const AuthProxy = require('./proxy/AuthProxy');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 5001;

// ⚙️ Настрой путь к API (без завершающего /)
const authProxy = new AuthProxy('https://dev.edi.md');

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Вставляем token перед каждым запросом
app.use((req, res, next) => {
  const tokenFromCookie = req.cookies.auth_token;
  if (tokenFromCookie) {
    authProxy.setTokens({ token: tokenFromCookie });
  }else {
    authProxy.setTokens({ token: null });
  }
  next();
});

// 🔐 Авторизация
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authProxy.login(email, password);

    if (result.ok && result.data?.Token) {
      res.cookie('auth_token', result.data.Token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        maxAge: 2 * 60 * 60 * 1000
      });

      return res.json({ message: 'Успешный вход' });
    } else {
      return res.status(result.status).json(result.data);
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка авторизации', error: error.message });
  }
});

// 🔁 Обновление токена
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'Отсутствует token' });

    authProxy.setTokens({ token });
    const response = await authProxy.refreshTokenRequest(req, res);

    if (response?.ok && response.data?.Token) {
      res.cookie('auth_token', response.data.Token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        maxAge: 2 * 60 * 60 * 1000
      });
      return res.json({ message: 'Обновление успешно' });
    }

    return res.status(401).json({ message: 'Не удалось обновить токен' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления токена', error: error.message });
  }
});

app.post('/api/auth/GetProfileInfo', async (req, res) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ message: 'Нет токена' });

    authProxy.setTokens({ token });
    const user = await authProxy.getProfileInfo(req, res);
    if (user) return res.json({ user });

    return res.status(401).json({ message: 'Не удалось получить пользователя' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения пользователя', error: error.message });
  }
});

// 🌐 Универсальный прокси
app.all('/api/proxy/*', async (req, res) => {
  try {
    let rawPathWithQuery = req.originalUrl.replace(/^\/api\/proxy/, '');
    if (!rawPathWithQuery.startsWith('/')) {
      throw new Error('Некорректный путь запроса: путь должен начинаться с /');
    }

    rawPathWithQuery = decodeURIComponent(rawPathWithQuery);

    const method = req.method;
    const body = ['POST', 'PUT', 'PATCH'].includes(method) ? req.body : null;

    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;

    const serviceId = headers['x-service-id'];
    delete headers['x-service-id'];

    const result = await authProxy.request({
      path: rawPathWithQuery,
      method,
      body,
      headers,
      serviceId,
      req,
      res,
    });

    res.status(result.status).json(result.data);
  } catch (error) {
    console.error('[Proxy Error]', error);
    res.status(500).json({ message: 'Ошибка прокси', error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  });
  authProxy.setTokens({ token: null });
  return res.json({ message: 'Выход выполнен' });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ message: 'Token отсутствует' });
  }

  return res.json({ token });
});

app.listen(PORT, () => {
  console.log(`🚀 Прокси работает на http://localhost:${PORT}`);
});
