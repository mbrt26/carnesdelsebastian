const InventariosService = require('../services/inventariosService');
const { movimientoInventarioSchema, uuidSchema } = require('../../common/models/schemas');
const logger = require('../../common/utils/logger');

class InventariosController {
  constructor() {
    // Bind methods para mantener contexto
    this.obtenerBodegas = this.obtenerBodegas.bind(this);
    this.obtenerBodegaPorId = this.obtenerBodegaPorId.bind(this);
    this.obtenerStockBodega = this.obtenerStockBodega.bind(this);
    this.registrarMovimiento = this.registrarMovimiento.bind(this);
    this.obtenerMovimientos = this.obtenerMovimientos.bind(this);
    this.obtenerReporteInventario = this.obtenerReporteInventario.bind(this);
  }

  async obtenerBodegas(req, res, next) {
    try {
      const inventariosService = new InventariosService(req.db);
      const bodegas = await inventariosService.obtenerBodegas();
      res.json(bodegas);
    } catch (error) {
      next(error);
    }
  }

  async obtenerBodegaPorId(req, res, next) {
    try {
      const { error } = uuidSchema.validate(req.params.bodegaId);
      if (error) {
        return res.status(400).json({ error: 'ID de bodega inválido' });
      }

      const inventariosService = new InventariosService(req.db);
      const bodega = await inventariosService.obtenerBodegaPorId(req.params.bodegaId);
      res.json(bodega);
    } catch (error) {
      next(error);
    }
  }

  async obtenerStockBodega(req, res, next) {
    try {
      const { error } = uuidSchema.validate(req.params.bodegaId);
      if (error) {
        return res.status(400).json({ error: 'ID de bodega inválido' });
      }

      const inventariosService = new InventariosService(req.db);
      const stock = await inventariosService.obtenerStockBodega(req.params.bodegaId);
      res.json(stock);
    } catch (error) {
      next(error);
    }
  }

  async registrarMovimiento(req, res, next) {
    try {
      const { error: uuidError } = uuidSchema.validate(req.params.bodegaId);
      if (uuidError) {
        return res.status(400).json({ error: 'ID de bodega inválido' });
      }

      // Validar datos del movimiento
      const { error, value } = movimientoInventarioSchema.validate(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      // Agregar información del usuario si está disponible
      if (req.user) {
        value.usuario = req.user.username;
      }

      const inventariosService = new InventariosService(req.db);
      const nuevoMovimiento = await inventariosService.registrarMovimiento(
        req.params.bodegaId,
        value
      );

      res.status(201).json(nuevoMovimiento);
    } catch (error) {
      next(error);
    }
  }

  async obtenerMovimientos(req, res, next) {
    try {
      const { error } = uuidSchema.validate(req.params.bodegaId);
      if (error) {
        return res.status(400).json({ error: 'ID de bodega inválido' });
      }

      const filtros = {
        fechaInicio: req.query.fechaInicio,
        fechaFin: req.query.fechaFin,
        tipo: req.query.tipo,
        articulo: req.query.articulo,
        limit: req.query.limit ? parseInt(req.query.limit) : 100
      };

      // Validar tipo si se proporciona
      if (filtros.tipo && !['entrada', 'salida', 'ajuste'].includes(filtros.tipo)) {
        return res.status(400).json({ 
          error: 'Tipo inválido. Debe ser: entrada, salida o ajuste' 
        });
      }

      // Remover filtros vacíos
      Object.keys(filtros).forEach(key => {
        if (!filtros[key]) delete filtros[key];
      });

      const inventariosService = new InventariosService(req.db);
      const movimientos = await inventariosService.obtenerMovimientos(
        req.params.bodegaId,
        filtros
      );

      res.json(movimientos);
    } catch (error) {
      next(error);
    }
  }

  async obtenerReporteInventario(req, res, next) {
    try {
      const { error } = uuidSchema.validate(req.params.bodegaId);
      if (error) {
        return res.status(400).json({ error: 'ID de bodega inválido' });
      }

      const inventariosService = new InventariosService(req.db);
      const reporte = await inventariosService.obtenerReporteInventario(req.params.bodegaId);

      res.json(reporte);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InventariosController;