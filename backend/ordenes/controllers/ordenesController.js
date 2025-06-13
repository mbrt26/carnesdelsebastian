const OrdenesService = require('../services/ordenesService');
const { ordenCreacionSchema, fichaCreacionSchema, uuidSchema } = require('../../common/models/schemas');
const logger = require('../../common/utils/logger');

class OrdenesController {
  constructor() {
    // Los métodos se bindean para mantener el contexto de 'this'
    this.crearOrden = this.crearOrden.bind(this);
    this.obtenerOrdenes = this.obtenerOrdenes.bind(this);
    this.obtenerOrdenPorId = this.obtenerOrdenPorId.bind(this);
    this.actualizarEstadoOrden = this.actualizarEstadoOrden.bind(this);
    this.crearFichaTrazabilidad = this.crearFichaTrazabilidad.bind(this);
    this.obtenerFichasTrazabilidad = this.obtenerFichasTrazabilidad.bind(this);
    this.actualizarEstadoOrdenPorDesposte = this.actualizarEstadoOrdenPorDesposte.bind(this);
    this.obtenerProgresoOrden = this.obtenerProgresoOrden.bind(this);
    this.obtenerDashboardProgreso = this.obtenerDashboardProgreso.bind(this);
  }

  async crearOrden(req, res, next) {
    try {
      // Validar datos de entrada
      const { error, value } = ordenCreacionSchema.validate(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const ordenesService = new OrdenesService(req.db);
      const nuevaOrden = await ordenesService.crearOrden(value);

      res.status(201).json(nuevaOrden);
    } catch (error) {
      next(error);
    }
  }

  async obtenerOrdenes(req, res, next) {
    try {
      const filtros = {
        linea: req.query.linea,
        fecha: req.query.fecha,
        estado: req.query.estado
      };

      // Remover filtros vacíos
      Object.keys(filtros).forEach(key => {
        if (!filtros[key]) delete filtros[key];
      });

      const ordenesService = new OrdenesService(req.db);
      const ordenes = await ordenesService.obtenerOrdenes(filtros);

      res.json(ordenes);
    } catch (error) {
      next(error);
    }
  }

  async obtenerOrdenPorId(req, res, next) {
    try {
      // Validar UUID
      const { error } = uuidSchema.validate(req.params.ordenId);
      if (error) {
        return res.status(400).json({ error: 'ID de orden inválido' });
      }

      const ordenesService = new OrdenesService(req.db);
      const orden = await ordenesService.obtenerOrdenPorId(req.params.ordenId);

      res.json(orden);
    } catch (error) {
      next(error);
    }
  }

  async actualizarEstadoOrden(req, res, next) {
    try {
      // Validar UUID
      const { error } = uuidSchema.validate(req.params.ordenId);
      if (error) {
        return res.status(400).json({ error: 'ID de orden inválido' });
      }

      const { estado } = req.body;
      const estadosValidos = ['Creada', 'EnProceso', 'Finalizada'];
      
      if (!estado || !estadosValidos.includes(estado)) {
        return res.status(400).json({ 
          error: 'Estado inválido', 
          estadosValidos 
        });
      }

      const ordenesService = new OrdenesService(req.db);
      const ordenActualizada = await ordenesService.actualizarEstadoOrden(
        req.params.ordenId, 
        estado
      );

      res.json(ordenActualizada);
    } catch (error) {
      next(error);
    }
  }

  async crearFichaTrazabilidad(req, res, next) {
    try {
      // Validar UUID de la orden
      const { error: uuidError } = uuidSchema.validate(req.params.ordenId);
      if (uuidError) {
        return res.status(400).json({ error: 'ID de orden inválido' });
      }

      // Validar datos de la ficha
      const { error, value } = fichaCreacionSchema.validate(req.body);
      if (error) {
        error.isJoi = true;
        return next(error);
      }

      const ordenesService = new OrdenesService(req.db);
      const nuevaFicha = await ordenesService.crearFichaTrazabilidad(
        req.params.ordenId, 
        value
      );

      res.status(201).json(nuevaFicha);
    } catch (error) {
      next(error);
    }
  }

  async obtenerFichasTrazabilidad(req, res, next) {
    try {
      // Validar UUID
      const { error } = uuidSchema.validate(req.params.ordenId);
      if (error) {
        return res.status(400).json({ error: 'ID de orden inválido' });
      }

      const ordenesService = new OrdenesService(req.db);
      const fichas = await ordenesService.obtenerFichasTrazabilidad(req.params.ordenId);

      res.json(fichas);
    } catch (error) {
      next(error);
    }
  }

  // ==================== INTEGRACIÓN CON DESPOSTE ====================

  async actualizarEstadoOrdenPorDesposte(req, res, next) {
    try {
      // Validar UUID
      const { error } = uuidSchema.validate(req.params.ordenId);
      if (error) {
        return res.status(400).json({ error: 'ID de orden inválido' });
      }

      const ordenesService = new OrdenesService(req.db);
      const resultado = await ordenesService.actualizarEstadoOrdenPorDesposte(req.params.ordenId);
      
      res.json({
        success: true,
        message: resultado.actualizado ? 'Estado de orden actualizado' : 'Estado de orden sin cambios',
        data: resultado
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerProgresoOrden(req, res, next) {
    try {
      // Validar UUID
      const { error } = uuidSchema.validate(req.params.ordenId);
      if (error) {
        return res.status(400).json({ error: 'ID de orden inválido' });
      }

      const ordenesService = new OrdenesService(req.db);
      const progreso = await ordenesService.obtenerProgresoOrden(req.params.ordenId);
      
      res.json({
        success: true,
        data: progreso
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerDashboardProgreso(req, res, next) {
    try {
      const filtros = {
        linea: req.query.linea,
        fechaInicio: req.query.fechaInicio,
        fechaFin: req.query.fechaFin
      };

      // Remover filtros vacíos
      Object.keys(filtros).forEach(key => {
        if (!filtros[key]) delete filtros[key];
      });

      const ordenesService = new OrdenesService(req.db);
      const dashboard = await ordenesService.obtenerDashboardProgreso(filtros);
      
      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrdenesController;