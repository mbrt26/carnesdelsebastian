const express = require('express');
const DesposteController = require('../controllers/desposteController');
const router = express.Router();

// Middleware para validación básica (opcional - se puede expandir con Joi)
const validateRegistroDesposte = (req, res, next) => {
  const required = ['producto', 'lote', 'fechaProduccion', 'fechaVencimiento', 'fechaSacrificio', 
                   'pesoTrasladado', 'pesoLanzado', 'pesoObtenido'];
  
  for (const field of required) {
    if (!req.body[field]) {
      return res.status(400).json({
        success: false,
        message: `Campo requerido: ${field}`
      });
    }
  }
  next();
};

module.exports = (db) => {
  const desposteController = new DesposteController(db);

  // ==================== REGISTRO PRINCIPAL ====================
  
  /**
   * @route POST /api/desposte/registros
   * @desc Crear nuevo registro de Desposte
   * @access Private
   */
  router.post('/registros', validateRegistroDesposte, (req, res) => {
    desposteController.crearRegistroDesposte(req, res);
  });

  /**
   * @route GET /api/desposte/registros
   * @desc Obtener todos los registros de Desposte con filtros opcionales
   * @access Private
   * @query {string} ordenId - Filtrar por ID de orden de producción
   * @query {string} lote - Filtrar por lote
   * @query {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @query {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   * @query {string} estado - Filtrar por estado (En Proceso, Completado, Rechazado)
   */
  router.get('/registros', (req, res) => {
    desposteController.obtenerRegistrosDesposte(req, res);
  });

  /**
   * @route GET /api/desposte/registros/:id
   * @desc Obtener registro de Desposte por ID (solo encabezado)
   * @access Private
   */
  router.get('/registros/:id', (req, res) => {
    desposteController.obtenerRegistroDespotePorId(req, res);
  });

  /**
   * @route GET /api/desposte/registros/:id/completo
   * @desc Obtener registro completo de Desposte con todos los componentes
   * @access Private
   */
  router.get('/registros/:id/completo', (req, res) => {
    desposteController.obtenerRegistroDesposteCompleto(req, res);
  });

  /**
   * @route PUT /api/desposte/registros/:id/estado
   * @desc Actualizar estado de registro de Desposte
   * @access Private
   */
  router.put('/registros/:id/estado', (req, res) => {
    desposteController.actualizarEstadoRegistro(req, res);
  });

  // ==================== COMPONENTES DEL PROCESO ====================

  /**
   * @route POST /api/desposte/registros/:registroDesposteId/desencajado
   * @desc Registrar Desencajado/Alistamiento de M.P.C.
   * @access Private
   */
  router.post('/registros/:registroDesposteId/desencajado', (req, res) => {
    desposteController.crearDesencajadoMPC(req, res);
  });

  /**
   * @route POST /api/desposte/registros/:registroDesposteId/picado
   * @desc Registrar Picado/Tajado y Molienda
   * @access Private
   */
  router.post('/registros/:registroDesposteId/picado', (req, res) => {
    desposteController.crearPicadoMolienda(req, res);
  });

  /**
   * @route POST /api/desposte/registros/:registroDesposteId/empacado
   * @desc Registrar Empacado/Embutido
   * @access Private
   */
  router.post('/registros/:registroDesposteId/empacado', (req, res) => {
    desposteController.crearEmpacadoEmbutido(req, res);
  });

  /**
   * @route POST /api/desposte/registros/:registroDesposteId/muestreo
   * @desc Registrar Muestreo de Peso
   * @access Private
   */
  router.post('/registros/:registroDesposteId/muestreo', (req, res) => {
    desposteController.crearMuestreoPeso(req, res);
  });

  /**
   * @route POST /api/desposte/registros/:registroDesposteId/liberacion
   * @desc Registrar Liberación de Producto Terminado / Análisis Sensorial
   * @access Private
   */
  router.post('/registros/:registroDesposteId/liberacion', (req, res) => {
    desposteController.crearLiberacionProducto(req, res);
  });

  /**
   * @route POST /api/desposte/registros/:registroDesposteId/almacenamiento
   * @desc Registrar Almacenamiento/Encajado
   * @access Private
   */
  router.post('/registros/:registroDesposteId/almacenamiento', (req, res) => {
    desposteController.crearAlmacenamiento(req, res);
  });

  /**
   * @route POST /api/desposte/registros/:registroDesposteId/parametros
   * @desc Registrar Parámetros Adicionales y Métricas
   * @access Private
   */
  router.post('/registros/:registroDesposteId/parametros', (req, res) => {
    desposteController.crearParametrosMetricas(req, res);
  });

  /**
   * @route POST /api/desposte/registros/:registroDesposteId/firmas
   * @desc Registrar Firmas y Sellos
   * @access Private
   */
  router.post('/registros/:registroDesposteId/firmas', (req, res) => {
    desposteController.crearFirmasSellos(req, res);
  });

  // ==================== ESTADÍSTICAS Y REPORTES ====================

  /**
   * @route GET /api/desposte/estadisticas
   * @desc Obtener estadísticas del proceso de Desposte
   * @access Private
   * @query {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
   * @query {string} fechaFin - Fecha de fin (YYYY-MM-DD)
   */
  router.get('/estadisticas', (req, res) => {
    desposteController.obtenerEstadisticasDesposte(req, res);
  });

  // ==================== INTEGRACIÓN CON ÓRDENES ====================

  /**
   * @route GET /api/desposte/ordenes/:ordenId/registros
   * @desc Obtener registros de Desposte de una orden específica
   * @access Private
   */
  router.get('/ordenes/:ordenId/registros', (req, res) => {
    req.query.ordenId = req.params.ordenId;
    desposteController.obtenerRegistrosDesposte(req, res);
  });

  // ==================== INFORMACIÓN DEL SISTEMA ====================

  /**
   * @route GET /api/desposte/tipos-temperatura
   * @desc Obtener rangos válidos de temperatura por tipo de producto
   * @access Private
   */
  router.get('/tipos-temperatura', (req, res) => {
    const { validacionesTemperatura } = require('../../common/models/desposte-schemas');
    res.json({
      success: true,
      data: validacionesTemperatura
    });
  });

  /**
   * @route GET /api/desposte/estados
   * @desc Obtener estados válidos para registros de Desposte
   * @access Private
   */
  router.get('/estados', (req, res) => {
    res.json({
      success: true,
      data: ['En Proceso', 'Completado', 'Rechazado']
    });
  });

  /**
   * @route GET /api/desposte/resultados-liberacion
   * @desc Obtener resultados válidos para liberación de producto
   * @access Private
   */
  router.get('/resultados-liberacion', (req, res) => {
    res.json({
      success: true,
      data: ['Conforme', 'No conforme']
    });
  });

  return router;
};