const express = require('express');
const OrdenesController = require('../controllers/ordenesController');

module.exports = (db) => {
  const router = express.Router();
  const ordenesController = new OrdenesController(db);

  // POST /ordenes - Crear nueva orden de producción
  router.post('/', ordenesController.crearOrden);

  // GET /ordenes - Listar órdenes con filtros opcionales
  router.get('/', ordenesController.obtenerOrdenes);

  // GET /ordenes/:ordenId - Obtener detalles de una orden específica
  router.get('/:ordenId', ordenesController.obtenerOrdenPorId);

  // PATCH /ordenes/:ordenId - Actualizar estado de la orden
  router.patch('/:ordenId', ordenesController.actualizarEstadoOrden);

  // POST /ordenes/:ordenId/fichas - Crear ficha de trazabilidad
  router.post('/:ordenId/fichas', ordenesController.crearFichaTrazabilidad);

  // GET /ordenes/:ordenId/fichas - Obtener fichas de trazabilidad de una orden
  router.get('/:ordenId/fichas', ordenesController.obtenerFichasTrazabilidad);

  // ==================== INTEGRACIÓN CON DESPOSTE ====================
  
  // GET /ordenes/dashboard/progreso - Obtener dashboard de progreso de todas las órdenes
  router.get('/dashboard/progreso', ordenesController.obtenerDashboardProgreso);

  // POST /ordenes/:ordenId/actualizar-estado-desposte - Actualizar estado basado en progreso de Desposte
  router.post('/:ordenId/actualizar-estado-desposte', ordenesController.actualizarEstadoOrdenPorDesposte);

  // GET /ordenes/:ordenId/progreso - Obtener progreso detallado de la orden
  router.get('/:ordenId/progreso', ordenesController.obtenerProgresoOrden);

  return router;
};