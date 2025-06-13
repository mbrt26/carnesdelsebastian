const express = require('express');
const CalidadController = require('../controllers/calidadController');

const router = express.Router();
const calidadController = new CalidadController();

// GET /programas - Listar programas de control de calidad
router.get('/', calidadController.obtenerProgramasQC);

// GET /programas/:programaId - Obtener detalles de un programa específico
router.get('/:programaId', calidadController.obtenerProgramaPorId);

// POST /programas/:programaId/registros - Crear un registro de control de calidad
router.post('/:programaId/registros', calidadController.crearRegistroQC);

// GET /programas/:programaId/registros - Obtener registros de un programa
router.get('/:programaId/registros', calidadController.obtenerRegistrosQC);

// GET /programas/:programaId/estadisticas - Obtener estadísticas de QC
router.get('/:programaId/estadisticas', calidadController.obtenerEstadisticasQC);

// POST /programas/:programaId/validar - Validar parámetros de QC
router.post('/:programaId/validar', calidadController.validarParametrosQC);

module.exports = router;