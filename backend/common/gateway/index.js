const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authenticateToken, requestLogger, errorHandler } = require('../middleware/auth');
const logger = require('../utils/logger');
const http = require('http');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad y logging
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// System health check
app.get('/health/system', async (req, res) => {
  const checkService = async (url) => {
    return new Promise((resolve) => {
      const request = http.get(`${url}/health`, { timeout: 3000 }, (response) => {
        resolve(response.statusCode === 200 ? 'healthy' : 'unhealthy');
      });
      
      request.on('error', () => {
        resolve('unhealthy');
      });
      
      request.on('timeout', () => {
        request.destroy();
        resolve('unhealthy');
      });
    });
  };

  const timestamp = new Date().toISOString();
  
  const [ordenesStatus, calidadStatus, inventariosStatus] = await Promise.all([
    checkService(process.env.ORDENES_SERVICE_URL || 'http://localhost:3001'),
    checkService(process.env.CALIDAD_SERVICE_URL || 'http://localhost:3002'),
    checkService(process.env.INVENTARIOS_SERVICE_URL || 'http://localhost:3003')
  ]);

  const services = {
    gateway: {
      service: 'Gateway',
      status: 'healthy',
      message: 'Gateway is responding',
      timestamp
    },
    ordenes: {
      service: 'Órdenes',
      status: ordenesStatus,
      message: ordenesStatus === 'healthy' ? 'Service is responding' : 'Service not responding',
      timestamp
    },
    calidad: {
      service: 'Calidad',
      status: calidadStatus,
      message: calidadStatus === 'healthy' ? 'Service is responding' : 'Service not responding',
      timestamp
    },
    inventarios: {
      service: 'Inventarios',
      status: inventariosStatus,
      message: inventariosStatus === 'healthy' ? 'Service is responding' : 'Service not responding',
      timestamp
    },
    database: {
      service: 'Database',
      status: 'healthy',
      message: 'Database connection assumed healthy',
      timestamp
    }
  };

  const healthyServices = Object.values(services).filter(s => s.status === 'healthy').length;
  const totalServices = Object.values(services).length;
  
  const overall = healthyServices === totalServices ? 'healthy' : 
                  healthyServices > totalServices / 2 ? 'degraded' : 'unhealthy';

  res.json({
    ...services,
    overall
  });
});

// Rutas públicas (sin autenticación)
app.post('/auth/login', (req, res) => {
  // Implementación básica de login (en producción usar un servicio de auth dedicado)
  const { username, password } = req.body;
  
  // Validación simple (en producción usar bcrypt y base de datos)
  if (username === 'admin' && password === 'admin123') {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: '1', username: 'admin', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, user: { id: '1', username: 'admin', role: 'admin' } });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Middleware de autenticación para rutas protegidas
app.use('/api', authenticateToken);

// Proxy para microservicio de Órdenes
app.use('/api/ordenes', createProxyMiddleware({
  target: process.env.ORDENES_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/ordenes': ''
  },
  onError: (err, req, res) => {
    logger.error('Error en proxy de órdenes', err);
    res.status(503).json({ error: 'Servicio de órdenes no disponible' });
  }
}));

// Proxy para microservicio de Calidad
app.use('/api/qc', createProxyMiddleware({
  target: process.env.CALIDAD_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/qc': ''
  },
  onError: (err, req, res) => {
    logger.error('Error en proxy de calidad', err);
    res.status(503).json({ error: 'Servicio de calidad no disponible' });
  }
}));

// Proxy para microservicio de Inventarios
app.use('/api/inventarios', createProxyMiddleware({
  target: process.env.INVENTARIOS_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/inventarios': ''
  },
  onError: (err, req, res) => {
    logger.error('Error en proxy de inventarios', err);
    res.status(503).json({ error: 'Servicio de inventarios no disponible' });
  }
}));

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`API Gateway iniciado en puerto ${PORT}`);
});

module.exports = app;