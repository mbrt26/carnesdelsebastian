const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Database = require('../common/utils/database');
const { requestLogger, errorHandler } = require('../common/middleware/auth');
const logger = require('../common/utils/logger');
const inventariosRoutes = require('./routes/inventarios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

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
    service: 'inventarios',
    timestamp: new Date().toISOString() 
  });
});

// Rutas
app.use('/bodegas', inventariosRoutes);
app.use('/', inventariosRoutes); // Para compatibilidad con el proxy

// Middleware de manejo de errores
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Cerrando servicio de inventarios...');
  await db.close();
  process.exit(0);
});

app.listen(PORT, () => {
  logger.info(`Servicio de Inventarios iniciado en puerto ${PORT}`);
});

module.exports = app;