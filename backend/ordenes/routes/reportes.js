const express = require('express');
const ReportesController = require('../controllers/reportesController');

module.exports = (db) => {
  const router = express.Router();
  const reportesController = new ReportesController(db);

  // ==================== GENERACIÓN DE REPORTES ====================
  
  // GET /reportes/orden/:ordenId - Generar reporte consolidado de una orden específica
  router.get('/orden/:ordenId', reportesController.generarReporteOrden);

  // GET /reportes/periodo - Generar reporte consolidado de múltiples órdenes en un período
  router.get('/periodo', reportesController.generarReportePeriodo);

  // GET /reportes/eficiencia - Generar reporte de eficiencia y rendimiento
  router.get('/eficiencia', reportesController.generarReporteEficiencia);

  // ==================== EXPORTACIÓN DE REPORTES ====================

  // GET /reportes/orden/:ordenId/exportar - Exportar reporte de orden en diferentes formatos
  router.get('/orden/:ordenId/exportar', reportesController.exportarReporteOrden);

  // GET /reportes/periodo/exportar - Exportar reporte de período en diferentes formatos
  router.get('/periodo/exportar', reportesController.exportarReportePeriodo);

  return router;
};