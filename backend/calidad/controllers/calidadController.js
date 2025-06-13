const CalidadService = require('../services/calidadService');
const { registroQCSchema, uuidSchema } = require('../../common/models/schemas');
const logger = require('../../common/utils/logger');

class CalidadController {
  constructor() {
    // Bind methods para mantener contexto
    this.obtenerProgramasQC = this.obtenerProgramasQC.bind(this);
    this.obtenerProgramaPorId = this.obtenerProgramaPorId.bind(this);
    this.crearRegistroQC = this.crearRegistroQC.bind(this);
    this.obtenerRegistrosQC = this.obtenerRegistrosQC.bind(this);
    this.obtenerEstadisticasQC = this.obtenerEstadisticasQC.bind(this);
    this.validarParametrosQC = this.validarParametrosQC.bind(this);
  }

  async obtenerProgramasQC(req, res, next) {
    try {
      const calidadService = new CalidadService(req.db);
      const programas = await calidadService.obtenerProgramasQC();
      res.json(programas);
    } catch (error) {
      next(error);
    }
  }

  async obtenerProgramaPorId(req, res, next) {
    try {
      const { error } = uuidSchema.validate(req.params.programaId);
      if (error) {
        return res.status(400).json({ error: 'ID de programa inválido' });
      }

      const calidadService = new CalidadService(req.db);
      const programa = await calidadService.obtenerProgramaPorId(req.params.programaId);
      res.json(programa);
    } catch (error) {
      next(error);
    }
  }

  async crearRegistroQC(req, res, next) {
    try {
      const { error } = uuidSchema.validate(req.params.programaId);
      if (error) {
        return res.status(400).json({ error: 'ID de programa inválido' });
      }

      // Validar datos del registro
      const { error: validationError, value } = registroQCSchema.validate({
        ...req.body,
        programaId: req.params.programaId
      });
      
      if (validationError) {
        validationError.isJoi = true;
        return next(validationError);
      }

      const calidadService = new CalidadService(req.db);
      
      // Validar parámetros antes de crear el registro
      const validaciones = await calidadService.validarParametrosQC(
        req.params.programaId, 
        value.valores
      );

      const nuevoRegistro = await calidadService.crearRegistroQC(value);
      
      res.status(201).json({
        ...nuevoRegistro,
        validaciones
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerRegistrosQC(req, res, next) {
    try {
      const { error } = uuidSchema.validate(req.params.programaId);
      if (error) {
        return res.status(400).json({ error: 'ID de programa inválido' });
      }

      const filtros = {
        fechaInicio: req.query.fechaInicio,
        fechaFin: req.query.fechaFin,
        ordenId: req.query.ordenId,
        limit: req.query.limit ? parseInt(req.query.limit) : 50
      };

      // Remover filtros vacíos
      Object.keys(filtros).forEach(key => {
        if (!filtros[key]) delete filtros[key];
      });

      const calidadService = new CalidadService(req.db);
      const registros = await calidadService.obtenerRegistrosQC(
        req.params.programaId, 
        filtros
      );

      res.json(registros);
    } catch (error) {
      next(error);
    }
  }

  async obtenerEstadisticasQC(req, res, next) {
    try {
      const { error } = uuidSchema.validate(req.params.programaId);
      if (error) {
        return res.status(400).json({ error: 'ID de programa inválido' });
      }

      const { fechaInicio, fechaFin } = req.query;
      
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ 
          error: 'fechaInicio y fechaFin son requeridos' 
        });
      }

      const calidadService = new CalidadService(req.db);
      const estadisticas = await calidadService.obtenerEstadisticasQC(
        req.params.programaId,
        fechaInicio,
        fechaFin
      );

      res.json(estadisticas);
    } catch (error) {
      next(error);
    }
  }

  async validarParametrosQC(req, res, next) {
    try {
      const { error } = uuidSchema.validate(req.params.programaId);
      if (error) {
        return res.status(400).json({ error: 'ID de programa inválido' });
      }

      const { valores } = req.body;
      if (!valores || typeof valores !== 'object') {
        return res.status(400).json({ error: 'Valores son requeridos' });
      }

      const calidadService = new CalidadService(req.db);
      const validaciones = await calidadService.validarParametrosQC(
        req.params.programaId,
        valores
      );

      res.json({ validaciones });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CalidadController;