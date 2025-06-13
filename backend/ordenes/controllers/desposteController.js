const DesposteService = require('../services/desposteService');
const logger = require('../../common/utils/logger');

class DesposteController {
  constructor(db) {
    this.desposteService = new DesposteService(db);
  }

  // 1. REGISTRO PRINCIPAL DE DESPOSTE
  async crearRegistroDesposte(req, res) {
    try {
      const registroData = {
        ordenId: req.body.ordenId,
        producto: req.body.producto,
        lote: req.body.lote,
        fechaProduccion: req.body.fechaProduccion,
        fechaVencimiento: req.body.fechaVencimiento,
        fechaSacrificio: req.body.fechaSacrificio,
        pesoTrasladado: req.body.pesoTrasladado,
        pesoLanzado: req.body.pesoLanzado,
        pesoObtenido: req.body.pesoObtenido,
        usuarioRegistro: req.body.usuarioRegistro || req.user?.id,
        observaciones: req.body.observaciones
      };

      const registro = await this.desposteService.crearRegistroDesposte(registroData);
      
      res.status(201).json({
        success: true,
        message: 'Registro de Desposte creado exitosamente',
        data: registro
      });
    } catch (error) {
      logger.error('Error en crearRegistroDesposte controller', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // 2. DESENCAJADO / ALISTAMIENTO DE M.P.C.
  async crearDesencajadoMPC(req, res) {
    try {
      const { registroDesposteId } = req.params;
      const desencajadoData = {
        numeroMateriaPrimaCarnica: req.body.numeroMateriaPrimaCarnica,
        loteMateriaPrima: req.body.loteMateriaPrima,
        proveedor: req.body.proveedor,
        peso: req.body.peso,
        hora: req.body.hora,
        temperaturaT1: req.body.temperaturaT1,
        temperaturaT2: req.body.temperaturaT2,
        temperaturaT3: req.body.temperaturaT3,
        color: req.body.color,
        textura: req.body.textura,
        olor: req.body.olor,
        conformidad: req.body.conformidad,
        responsableDesencajado: req.body.responsableDesencajado,
        hallazgo: req.body.hallazgo,
        correccion: req.body.correccion
      };

      const desencajado = await this.desposteService.crearDesencajadoMPC(registroDesposteId, desencajadoData);
      
      res.status(201).json({
        success: true,
        message: 'Desencajado MPC registrado exitosamente',
        data: desencajado
      });
    } catch (error) {
      logger.error('Error en crearDesencajadoMPC controller', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // 3. PICADO / MOLIENDA
  async crearPicadoMolienda(req, res) {
    try {
      const { registroDesposteId } = req.params;
      const picadoData = {
        numeroMateriaPrima: req.body.numeroMateriaPrima,
        estadoSierra: req.body.estadoSierra,
        horaInicio: req.body.horaInicio,
        horaFin: req.body.horaFin,
        temperaturaT1: req.body.temperaturaT1,
        temperaturaT2: req.body.temperaturaT2,
        temperaturaT3: req.body.temperaturaT3,
        cantidadPicadaTajada: req.body.cantidadPicadaTajada,
        responsablePicado: req.body.responsablePicado,
        discoMolienda: req.body.discoMolienda,
        kgMolidos: req.body.kgMolidos,
        responsableMolienda: req.body.responsableMolienda,
        subproductos: req.body.subproductos || []
      };

      const picado = await this.desposteService.crearPicadoMolienda(registroDesposteId, picadoData);
      
      res.status(201).json({
        success: true,
        message: 'Picado/Molienda registrado exitosamente',
        data: picado
      });
    } catch (error) {
      logger.error('Error en crearPicadoMolienda controller', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // 4. EMPACADO / EMBUTIDO
  async crearEmpacadoEmbutido(req, res) {
    try {
      const { registroDesposteId } = req.params;
      const empacadoData = {
        presentacion: req.body.presentacion,
        horaInicio: req.body.horaInicio,
        horaFin: req.body.horaFin,
        temperaturaT1: req.body.temperaturaT1,
        temperaturaT2: req.body.temperaturaT2,
        temperaturaT3: req.body.temperaturaT3,
        arranqueMaquina: req.body.arranqueMaquina,
        tiras: req.body.tiras,
        bolsasAveriadas: req.body.bolsasAveriadas,
        unidadesEmpacadas: req.body.unidadesEmpacadas,
        conteoTotal: req.body.conteoTotal,
        conformidad: req.body.conformidad,
        responsableEmpacado: req.body.responsableEmpacado,
        responsableFechado: req.body.responsableFechado,
        materialEmpaque: req.body.materialEmpaque
      };

      const empacado = await this.desposteService.crearEmpacadoEmbutido(registroDesposteId, empacadoData);
      
      res.status(201).json({
        success: true,
        message: 'Empacado/Embutido registrado exitosamente',
        data: empacado
      });
    } catch (error) {
      logger.error('Error en crearEmpacadoEmbutido controller', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // 5. MUESTREO DE PESO
  async crearMuestreoPeso(req, res) {
    try {
      const { registroDesposteId } = req.params;
      const muestreoData = {
        pesoMuestreado: req.body.pesoMuestreado,
        numeroMuestra: req.body.numeroMuestra,
        hallazgo: req.body.hallazgo,
        correccion: req.body.correccion
      };

      const muestreo = await this.desposteService.crearMuestreoPeso(registroDesposteId, muestreoData);
      
      res.status(201).json({
        success: true,
        message: 'Muestreo de peso registrado exitosamente',
        data: muestreo
      });
    } catch (error) {
      logger.error('Error en crearMuestreoPeso controller', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // 6. LIBERACIÓN DE PRODUCTO
  async crearLiberacionProducto(req, res) {
    try {
      const { registroDesposteId } = req.params;
      const liberacionData = {
        criterioPresentacionPeso: req.body.criterioPresentacionPeso,
        criterioSellado: req.body.criterioSellado,
        criterioCodificado: req.body.criterioCodificado,
        criterioRotulado: req.body.criterioRotulado,
        itemAspecto: req.body.itemAspecto,
        itemOlor: req.body.itemOlor,
        itemSabor: req.body.itemSabor,
        libreMetales: req.body.libreMetales,
        resultado: req.body.resultado,
        responsable: req.body.responsable,
        correccion: req.body.correccion
      };

      const liberacion = await this.desposteService.crearLiberacionProducto(registroDesposteId, liberacionData);
      
      res.status(201).json({
        success: true,
        message: 'Liberación de producto registrada exitosamente',
        data: liberacion
      });
    } catch (error) {
      logger.error('Error en crearLiberacionProducto controller', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // 7. ALMACENAMIENTO
  async crearAlmacenamiento(req, res) {
    try {
      const { registroDesposteId } = req.params;
      const almacenamientoData = {
        producto: req.body.producto,
        numeroCanastillas: req.body.numeroCanastillas,
        temperaturaCuartoFrio: req.body.temperaturaCuartoFrio,
        responsable: req.body.responsable,
        horaInicio: req.body.horaInicio,
        horaFin: req.body.horaFin,
        temperaturaT1: req.body.temperaturaT1,
        temperaturaT2: req.body.temperaturaT2,
        temperaturaT3: req.body.temperaturaT3,
        averias: req.body.averias,
        hallazgo: req.body.hallazgo,
        correccion: req.body.correccion
      };

      const almacenamiento = await this.desposteService.crearAlmacenamiento(registroDesposteId, almacenamientoData);
      
      res.status(201).json({
        success: true,
        message: 'Almacenamiento registrado exitosamente',
        data: almacenamiento
      });
    } catch (error) {
      logger.error('Error en crearAlmacenamiento controller', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // 8. PARÁMETROS Y MÉTRICAS
  async crearParametrosMetricas(req, res) {
    try {
      const { registroDesposteId } = req.params;
      const parametrosData = {
        tipoProducto: req.body.tipoProducto,
        tiempoProduccion: req.body.tiempoProduccion,
        kgHoraHombre: req.body.kgHoraHombre,
        ordenProduccion: req.body.ordenProduccion,
        salidaAlmacenEPT: req.body.salidaAlmacenEPT,
        ordenEmpaque: req.body.ordenEmpaque,
        porcentajeMermaPesoBruto: req.body.porcentajeMermaPesoBruto,
        porcentajeMermaSubproductos: req.body.porcentajeMermaSubproductos
      };

      const parametros = await this.desposteService.crearParametrosMetricas(registroDesposteId, parametrosData);
      
      res.status(201).json({
        success: true,
        message: 'Parámetros y métricas registrados exitosamente',
        data: parametros
      });
    } catch (error) {
      logger.error('Error en crearParametrosMetricas controller', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // 9. FIRMAS Y SELLOS
  async crearFirmasSellos(req, res) {
    try {
      const { registroDesposteId } = req.params;
      const firmasData = {
        recibidoLogistica: req.body.recibidoLogistica,
        fechaRecibidoLogistica: req.body.fechaRecibidoLogistica,
        coordinadorDesposte: req.body.coordinadorDesposte,
        fechaCoordinadorDesposte: req.body.fechaCoordinadorDesposte,
        liberadoCalidad: req.body.liberadoCalidad,
        fechaLiberadoCalidad: req.body.fechaLiberadoCalidad,
        selloLogistica: req.body.selloLogistica,
        selloCoordinador: req.body.selloCoordinador,
        selloCalidad: req.body.selloCalidad
      };

      const firmas = await this.desposteService.crearFirmasSellos(registroDesposteId, firmasData);
      
      res.status(201).json({
        success: true,
        message: 'Firmas y sellos registrados exitosamente',
        data: firmas
      });
    } catch (error) {
      logger.error('Error en crearFirmasSellos controller', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // CONSULTAS Y OBTENCIÓN DE DATOS
  async obtenerRegistrosDesposte(req, res) {
    try {
      const filtros = {
        ordenId: req.query.ordenId,
        lote: req.query.lote,
        fechaInicio: req.query.fechaInicio,
        fechaFin: req.query.fechaFin,
        estado: req.query.estado
      };

      const registros = await this.desposteService.obtenerRegistrosDesposte(filtros);
      
      res.json({
        success: true,
        data: registros,
        total: registros.length
      });
    } catch (error) {
      logger.error('Error en obtenerRegistrosDesposte controller', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  async obtenerRegistroDesposteCompleto(req, res) {
    try {
      const { id } = req.params;
      const registroCompleto = await this.desposteService.obtenerRegistroDesposteCompleto(id);
      
      res.json({
        success: true,
        data: registroCompleto
      });
    } catch (error) {
      logger.error('Error en obtenerRegistroDesposteCompleto controller', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  async obtenerRegistroDespotePorId(req, res) {
    try {
      const { id } = req.params;
      const registro = await this.desposteService.obtenerRegistroDespotePorId(id);
      
      res.json({
        success: true,
        data: registro
      });
    } catch (error) {
      logger.error('Error en obtenerRegistroDespotePorId controller', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // ACTUALIZACIÓN DE ESTADO
  async actualizarEstadoRegistro(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!['En Proceso', 'Completado', 'Rechazado'].includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado no válido. Debe ser: En Proceso, Completado o Rechazado'
        });
      }

      const query = `
        UPDATE registro_desposte 
        SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await this.desposteService.db.query(query, [estado, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Registro de Desposte no encontrado'
        });
      }

      logger.info('Estado de registro Desposte actualizado', { registroId: id, estado });

      const registroActualizado = this.desposteService.formatearRegistroDesposte(result.rows[0]);
      
      // Actualizar estado de la orden automáticamente si está asociada
      await this.desposteService.actualizarEstadoOrdenSiNecesario(registroActualizado.ordenId);

      res.json({
        success: true,
        message: 'Estado actualizado exitosamente',
        data: registroActualizado
      });
    } catch (error) {
      logger.error('Error en actualizarEstadoRegistro controller', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }

  // ESTADÍSTICAS Y REPORTES
  async obtenerEstadisticasDesposte(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;

      const queryEstadisticas = `
        WITH estadisticas AS (
          SELECT 
            COUNT(*) as total_registros,
            COUNT(CASE WHEN estado = 'Completado' THEN 1 END) as completados,
            COUNT(CASE WHEN estado = 'En Proceso' THEN 1 END) as en_proceso,
            COUNT(CASE WHEN estado = 'Rechazado' THEN 1 END) as rechazados,
            AVG(peso_obtenido_kg) as promedio_peso_obtenido,
            SUM(peso_obtenido_kg) as total_peso_producido,
            AVG(peso_obtenido_kg / NULLIF(peso_lanzado_kg, 0) * 100) as promedio_rendimiento
          FROM registro_desposte
          WHERE ($1::date IS NULL OR fecha_produccion >= $1::date)
            AND ($2::date IS NULL OR fecha_produccion <= $2::date)
        )
        SELECT * FROM estadisticas
      `;

      const result = await this.desposteService.db.query(queryEstadisticas, [fechaInicio || null, fechaFin || null]);
      
      const estadisticas = {
        totalRegistros: parseInt(result.rows[0].total_registros),
        completados: parseInt(result.rows[0].completados),
        enProceso: parseInt(result.rows[0].en_proceso),
        rechazados: parseInt(result.rows[0].rechazados),
        promedioPesoObtenido: parseFloat(result.rows[0].promedio_peso_obtenido) || 0,
        totalPesoProducido: parseFloat(result.rows[0].total_peso_producido) || 0,
        promedioRendimiento: parseFloat(result.rows[0].promedio_rendimiento) || 0
      };

      res.json({
        success: true,
        data: estadisticas,
        periodo: {
          fechaInicio: fechaInicio || null,
          fechaFin: fechaFin || null
        }
      });
    } catch (error) {
      logger.error('Error en obtenerEstadisticasDesposte controller', { error: error.message });
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  }
}

module.exports = DesposteController;