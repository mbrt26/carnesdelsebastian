const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Middleware de autenticación JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Token inválido', { error: err.message, ip: req.ip });
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Middleware de validación de roles
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      logger.warn('Acceso denegado por rol', { 
        user: req.user.id, 
        role: req.user.role, 
        requiredRoles: roles 
      });
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    next();
  };
};

// Middleware de logging de requests
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request procesado', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });

  next();
};

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  logger.error('Error en request', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });

  // Error de validación
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: err.details.map(detail => detail.message)
    });
  }

  // Error de base de datos
  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({ error: 'El recurso ya existe' });
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({ error: 'Referencia inválida' });
  }

  // Error genérico
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message
  });
};

module.exports = {
  authenticateToken,
  authorize,
  requestLogger,
  errorHandler
};