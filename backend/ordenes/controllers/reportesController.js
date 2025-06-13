const ReportesService = require('../services/reportesService');
const { uuidSchema } = require('../../common/models/schemas');
const logger = require('../../common/utils/logger');

class ReportesController {
  constructor(db) {
    this.db = db;
    // Los métodos se bindean para mantener el contexto de 'this'
    this.generarReporteOrden = this.generarReporteOrden.bind(this);
    this.generarReportePeriodo = this.generarReportePeriodo.bind(this);
    this.generarReporteEficiencia = this.generarReporteEficiencia.bind(this);
    this.exportarReporteOrden = this.exportarReporteOrden.bind(this);
    this.exportarReportePeriodo = this.exportarReportePeriodo.bind(this);
  }

  async generarReporteOrden(req, res, next) {
    try {
      // Validar UUID
      const { error } = uuidSchema.validate(req.params.ordenId);
      if (error) {
        return res.status(400).json({ error: 'ID de orden inválido' });
      }

      const reportesService = new ReportesService(this.db);
      const reporte = await reportesService.generarReporteOrden(req.params.ordenId);

      logger.info('Reporte de orden generado', { 
        ordenId: req.params.ordenId,
        totalRegistros: reporte.totalRegistros
      });

      res.json({
        success: true,
        data: reporte
      });
    } catch (error) {
      logger.error('Error generando reporte de orden', { 
        error: error.message, 
        ordenId: req.params.ordenId 
      });
      
      if (error.message === 'Orden no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      
      next(error);
    }
  }

  async generarReportePeriodo(req, res, next) {
    try {
      const filtros = {
        fechaInicio: req.query.fechaInicio,
        fechaFin: req.query.fechaFin,
        linea: req.query.linea,
        estado: req.query.estado
      };

      // Validar fechas si se proporcionan
      if (filtros.fechaInicio && isNaN(Date.parse(filtros.fechaInicio))) {
        return res.status(400).json({ error: 'Fecha de inicio inválida' });
      }
      
      if (filtros.fechaFin && isNaN(Date.parse(filtros.fechaFin))) {
        return res.status(400).json({ error: 'Fecha de fin inválida' });
      }

      // Remover filtros vacíos
      Object.keys(filtros).forEach(key => {
        if (!filtros[key]) delete filtros[key];
      });

      const reportesService = new ReportesService(this.db);
      const reporte = await reportesService.generarReportePeriodo(filtros);

      logger.info('Reporte de período generado', { 
        filtros,
        totalOrdenes: reporte.totalOrdenes
      });

      res.json({
        success: true,
        data: reporte
      });
    } catch (error) {
      logger.error('Error generando reporte de período', { 
        error: error.message, 
        filtros: req.query 
      });
      next(error);
    }
  }

  async generarReporteEficiencia(req, res, next) {
    try {
      const filtros = {
        fechaInicio: req.query.fechaInicio,
        fechaFin: req.query.fechaFin,
        linea: req.query.linea,
        turno: req.query.turno
      };

      // Validar fechas si se proporcionan
      if (filtros.fechaInicio && isNaN(Date.parse(filtros.fechaInicio))) {
        return res.status(400).json({ error: 'Fecha de inicio inválida' });
      }
      
      if (filtros.fechaFin && isNaN(Date.parse(filtros.fechaFin))) {
        return res.status(400).json({ error: 'Fecha de fin inválida' });
      }

      // Remover filtros vacíos
      Object.keys(filtros).forEach(key => {
        if (!filtros[key]) delete filtros[key];
      });

      const reportesService = new ReportesService(this.db);
      const reporte = await reportesService.generarReporteEficiencia(filtros);

      logger.info('Reporte de eficiencia generado', { 
        filtros,
        totalEficiencias: reporte.eficiencias.length
      });

      res.json({
        success: true,
        data: reporte
      });
    } catch (error) {
      logger.error('Error generando reporte de eficiencia', { 
        error: error.message, 
        filtros: req.query 
      });
      next(error);
    }
  }

  async exportarReporteOrden(req, res, next) {
    try {
      // Validar UUID
      const { error } = uuidSchema.validate(req.params.ordenId);
      if (error) {
        return res.status(400).json({ error: 'ID de orden inválido' });
      }

      const formato = req.query.formato || 'json';
      if (!['json', 'excel', 'pdf'].includes(formato)) {
        return res.status(400).json({ error: 'Formato de exportación no válido. Use: json, excel, pdf' });
      }

      const reportesService = new ReportesService(this.db);
      const reporte = await reportesService.generarReporteOrden(req.params.ordenId);

      switch (formato) {
        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename=reporte_orden_${req.params.ordenId}.json`);
          return res.json(reporte);

        case 'excel':
          const excelBuffer = await this.generarExcel(reporte);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename=reporte_orden_${req.params.ordenId}.xlsx`);
          return res.send(excelBuffer);

        case 'pdf':
          const pdfBuffer = await this.generarPDF(reporte);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=reporte_orden_${req.params.ordenId}.pdf`);
          return res.send(pdfBuffer);

        default:
          return res.status(400).json({ error: 'Formato no soportado' });
      }
    } catch (error) {
      logger.error('Error exportando reporte de orden', { 
        error: error.message, 
        ordenId: req.params.ordenId,
        formato: req.query.formato 
      });
      
      if (error.message === 'Orden no encontrada') {
        return res.status(404).json({ error: error.message });
      }
      
      next(error);
    }
  }

  async exportarReportePeriodo(req, res, next) {
    try {
      const filtros = {
        fechaInicio: req.query.fechaInicio,
        fechaFin: req.query.fechaFin,
        linea: req.query.linea,
        estado: req.query.estado
      };

      const formato = req.query.formato || 'json';
      if (!['json', 'excel', 'pdf'].includes(formato)) {
        return res.status(400).json({ error: 'Formato de exportación no válido. Use: json, excel, pdf' });
      }

      // Remover filtros vacíos
      Object.keys(filtros).forEach(key => {
        if (!filtros[key]) delete filtros[key];
      });

      const reportesService = new ReportesService(this.db);
      const reporte = await reportesService.generarReportePeriodo(filtros);

      const nombreArchivo = `reporte_periodo_${filtros.fechaInicio || 'todas'}_${filtros.fechaFin || 'fechas'}`;

      switch (formato) {
        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}.json`);
          return res.json(reporte);

        case 'excel':
          const excelBuffer = await this.generarExcelPeriodo(reporte);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}.xlsx`);
          return res.send(excelBuffer);

        case 'pdf':
          const pdfBuffer = await this.generarPDFPeriodo(reporte);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}.pdf`);
          return res.send(pdfBuffer);

        default:
          return res.status(400).json({ error: 'Formato no soportado' });
      }
    } catch (error) {
      logger.error('Error exportando reporte de período', { 
        error: error.message, 
        filtros: req.query 
      });
      next(error);
    }
  }

  // ==================== MÉTODOS AUXILIARES DE EXPORTACIÓN ====================

  async generarExcel(reporte) {
    // Placeholder para implementación de exportación a Excel
    // Se puede usar bibliotecas como 'xlsx' o 'exceljs'
    logger.info('Generación de Excel pendiente de implementar', { ordenId: reporte.orden.id });
    
    // Por ahora, devolvemos el JSON como buffer
    return Buffer.from(JSON.stringify(reporte, null, 2));
  }

  async generarPDF(reporte) {
    // Placeholder para implementación de exportación a PDF
    // Se puede usar bibliotecas como 'pdfkit' o 'puppeteer'
    logger.info('Generación de PDF pendiente de implementar', { ordenId: reporte.orden.id });
    
    // Por ahora, devolvemos el JSON como buffer
    return Buffer.from(JSON.stringify(reporte, null, 2));
  }

  async generarExcelPeriodo(reporte) {
    // Placeholder para implementación de exportación a Excel para período
    logger.info('Generación de Excel de período pendiente de implementar', { 
      totalOrdenes: reporte.totalOrdenes 
    });
    
    return Buffer.from(JSON.stringify(reporte, null, 2));
  }

  async generarPDFPeriodo(reporte) {
    // Placeholder para implementación de exportación a PDF para período
    logger.info('Generación de PDF de período pendiente de implementar', { 
      totalOrdenes: reporte.totalOrdenes 
    });
    
    return Buffer.from(JSON.stringify(reporte, null, 2));
  }

  // ==================== MÉTODOS DE UTILIDAD ====================

  validarParametrosReporte(req) {
    const errores = [];

    // Validar formato si se especifica
    if (req.query.formato && !['json', 'excel', 'pdf'].includes(req.query.formato)) {
      errores.push('Formato no válido. Use: json, excel, pdf');
    }

    // Validar fechas si se especifican
    if (req.query.fechaInicio && isNaN(Date.parse(req.query.fechaInicio))) {
      errores.push('Fecha de inicio inválida');
    }

    if (req.query.fechaFin && isNaN(Date.parse(req.query.fechaFin))) {
      errores.push('Fecha de fin inválida');
    }

    // Validar que fecha inicio sea menor que fecha fin
    if (req.query.fechaInicio && req.query.fechaFin) {
      const fechaInicio = new Date(req.query.fechaInicio);
      const fechaFin = new Date(req.query.fechaFin);
      
      if (fechaInicio > fechaFin) {
        errores.push('La fecha de inicio debe ser anterior a la fecha de fin');
      }
    }

    // Validar línea si se especifica
    if (req.query.linea && !['Desposte', 'Derivados'].includes(req.query.linea)) {
      errores.push('Línea no válida. Use: Desposte, Derivados');
    }

    // Validar estado si se especifica
    if (req.query.estado && !['Creada', 'EnProceso', 'Finalizada'].includes(req.query.estado)) {
      errores.push('Estado no válido. Use: Creada, EnProceso, Finalizada');
    }

    return errores;
  }

  formatearErrorValidacion(errores) {
    return {
      error: 'Parámetros de consulta inválidos',
      detalles: errores
    };
  }
}

module.exports = ReportesController;