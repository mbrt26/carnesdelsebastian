const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Database = require('../common/utils/database');
const { requestLogger, errorHandler } = require('../common/middleware/auth');
const logger = require('../common/utils/logger');
const ordenesRoutes = require('./routes/ordenes');
const desposteRoutes = require('./routes/desposte');
const reportesRoutes = require('./routes/reportes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar base de datos
const db = new Database(process.env.DATABASE_URL);

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Hacer disponible la conexión a DB en todas las rutas
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'ordenes',
    timestamp: new Date().toISOString() 
  });
});

// Rutas
app.use('/ordenes', ordenesRoutes(db));
app.use('/desposte', desposteRoutes(db));
app.use('/reportes', reportesRoutes(db));
app.use('/', ordenesRoutes(db)); // Para compatibilidad con el proxy

// Middleware de manejo de errores
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Cerrando servicio de órdenes...');
  await db.close();
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`Servicio de Órdenes iniciado en puerto ${PORT}`);
});

module.exports = app;