const express = require('express');
const InventariosController = require('../controllers/inventariosController');

const router = express.Router();
const inventariosController = new InventariosController();

// GET /bodegas - Listar todas las bodegas
router.get('/', inventariosController.obtenerBodegas);

// GET /bodegas/:bodegaId - Obtener detalles de una bodega específica
router.get('/:bodegaId', inventariosController.obtenerBodegaPorId);

// GET /bodegas/:bodegaId/stock - Obtener stock actual de una bodega
router.get('/:bodegaId/stock', inventariosController.obtenerStockBodega);

// POST /bodegas/:bodegaId/movimientos - Registrar un movimiento de inventario
router.post('/:bodegaId/movimientos', inventariosController.registrarMovimiento);

// GET /bodegas/:bodegaId/movimientos - Obtener movimientos de una bodega
router.get('/:bodegaId/movimientos', inventariosController.obtenerMovimientos);

// GET /bodegas/:bodegaId/reporte - Obtener reporte de inventario
router.get('/:bodegaId/reporte', inventariosController.obtenerReporteInventario);

module.exports = router;