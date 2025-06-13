const logger = require('../../common/utils/logger');

class OrdenesService {
  constructor(db) {
    this.db = db;
  }

  async crearOrden(ordenData) {
    try {
      const query = `
        INSERT INTO ordenes 
        (cliente, linea, turno, fecha_planificada, cantidad_planificada)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const valores = [
        ordenData.cliente,
        ordenData.linea,
        ordenData.turno,
        ordenData.fechaPlanificada,
        ordenData.cantidadPlanificada
      ];

      const result = await this.db.query(query, valores);
      logger.info('Orden de producción creada', { 
        ordenId: result.rows[0].id, 
        cliente: ordenData.cliente 
      });

      return this.formatearOrden(result.rows[0]);
    } catch (error) {
      logger.error('Error creando orden', { error: error.message, ordenData });
      throw error;
    }
  }

  async obtenerOrdenes(filtros = {}) {
    try {
      let query = 'SELECT * FROM ordenes WHERE 1=1';
      const valores = [];
      let paramCount = 0;

      if (filtros.linea) {
        paramCount++;
        query += ` AND linea = $${paramCount}`;
        valores.push(filtros.linea);
      }

      if (filtros.fecha) {
        paramCount++;
        query += ` AND fecha_planificada = $${paramCount}`;
        valores.push(filtros.fecha);
      }

      if (filtros.estado) {
        paramCount++;
        query += ` AND estado = $${paramCount}`;
        valores.push(filtros.estado);
      }

      query += ' ORDER BY fecha_creacion DESC';

      const result = await this.db.query(query, valores);
      return result.rows.map(orden => this.formatearOrden(orden));
    } catch (error) {
      logger.error('Error obteniendo órdenes', { error: error.message, filtros });
      throw error;
    }
  }

  async obtenerOrdenPorId(id) {
    try {
      const query = 'SELECT * FROM ordenes WHERE id = $1';
      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        const error = new Error('Orden no encontrada');
        error.status = 404;
        throw error;
      }

      return this.formatearOrden(result.rows[0]);
    } catch (error) {
      logger.error('Error obteniendo orden por ID', { error: error.message, id });
      throw error;
    }
  }

  async actualizarEstadoOrden(id, nuevoEstado) {
    try {
      const query = `
        UPDATE ordenes 
        SET estado = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await this.db.query(query, [nuevoEstado, id]);

      if (result.rows.length === 0) {
        const error = new Error('Orden no encontrada');
        error.status = 404;
        throw error;
      }

      logger.info('Estado de orden actualizado', { 
        ordenId: id, 
        nuevoEstado 
      });

      return this.formatearOrden(result.rows[0]);
    } catch (error) {
      logger.error('Error actualizando estado de orden', { 
        error: error.message, 
        id, 
        nuevoEstado 
      });
      throw error;
    }
  }

  async crearFichaTrazabilidad(ordenId, fichaData) {
    try {
      // Verificar que la orden existe
      await this.obtenerOrdenPorId(ordenId);

      const query = `
        INSERT INTO fichas_trazabilidad 
        (orden_id, proceso, material_consumido, cantidad, tiempo_proceso, condiciones)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const valores = [
        ordenId,
        fichaData.proceso,
        fichaData.materialConsumido,
        fichaData.cantidad,
        fichaData.tiempoProceso,
        fichaData.condiciones ? JSON.stringify(fichaData.condiciones) : null
      ];

      const result = await this.db.query(query, valores);
      logger.info('Ficha de trazabilidad creada', { 
        fichaId: result.rows[0].id, 
        ordenId 
      });

      return this.formatearFicha(result.rows[0]);
    } catch (error) {
      logger.error('Error creando ficha de trazabilidad', { 
        error: error.message, 
        ordenId, 
        fichaData 
      });
      throw error;
    }
  }

  async obtenerFichasTrazabilidad(ordenId) {
    try {
      // Verificar que la orden existe
      await this.obtenerOrdenPorId(ordenId);

      const query = `
        SELECT * FROM fichas_trazabilidad 
        WHERE orden_id = $1 
        ORDER BY timestamp DESC
      `;

      const result = await this.db.query(query, [ordenId]);
      return result.rows.map(ficha => this.formatearFicha(ficha));
    } catch (error) {
      logger.error('Error obteniendo fichas de trazabilidad', { 
        error: error.message, 
        ordenId 
      });
      throw error;
    }
  }

  // ==================== INTEGRACIÓN CON DESPOSTE ====================

  async actualizarEstadoOrdenPorDesposte(ordenId) {
    try {
      // Obtener estadísticas de los registros de Desposte para esta orden
      const statsQuery = `
        SELECT 
          COUNT(*) as total_registros,
          COUNT(CASE WHEN estado = 'Completado' THEN 1 END) as completados,
          COUNT(CASE WHEN estado = 'En Proceso' THEN 1 END) as en_proceso,
          COUNT(CASE WHEN estado = 'Rechazado' THEN 1 END) as rechazados,
          SUM(peso_obtenido_kg) as peso_total_obtenido,
          AVG(peso_obtenido_kg / NULLIF(peso_lanzado_kg, 0) * 100) as rendimiento_promedio
        FROM registro_desposte 
        WHERE orden_id = $1
      `;

      const statsResult = await this.db.query(statsQuery, [ordenId]);
      const stats = statsResult.rows[0];

      // Obtener información de la orden
      const ordenResult = await this.db.query('SELECT * FROM ordenes WHERE id = $1', [ordenId]);
      if (ordenResult.rows.length === 0) {
        throw new Error('Orden no encontrada');
      }

      const orden = ordenResult.rows[0];
      let nuevoEstado = orden.estado;

      // Determinar el nuevo estado basado en los registros de Desposte
      if (parseInt(stats.total_registros) === 0) {
        nuevoEstado = 'Creada';
      } else if (parseInt(stats.en_proceso) > 0) {
        nuevoEstado = 'EnProceso';
      } else if (parseInt(stats.completados) > 0 && parseInt(stats.en_proceso) === 0) {
        // Si hay peso total obtenido que se acerca a la cantidad planificada
        const porcentajeCompletado = (parseFloat(stats.peso_total_obtenido) / orden.cantidad_planificada) * 100;
        if (porcentajeCompletado >= 90) {
          nuevoEstado = 'Finalizada';
        } else {
          nuevoEstado = 'EnProceso';
        }
      }

      // Actualizar el estado de la orden si es diferente
      if (nuevoEstado !== orden.estado) {
        await this.actualizarEstadoOrden(ordenId, nuevoEstado);
        logger.info('Estado de orden actualizado automáticamente', { 
          ordenId, 
          estadoAnterior: orden.estado, 
          estadoNuevo: nuevoEstado,
          stats: {
            totalRegistros: parseInt(stats.total_registros),
            completados: parseInt(stats.completados),
            enProceso: parseInt(stats.en_proceso),
            pesoTotalObtenido: parseFloat(stats.peso_total_obtenido) || 0
          }
        });
      }

      return {
        ordenId,
        estadoAnterior: orden.estado,
        estadoNuevo: nuevoEstado,
        actualizado: nuevoEstado !== orden.estado,
        estadisticas: {
          totalRegistros: parseInt(stats.total_registros),
          completados: parseInt(stats.completados),
          enProceso: parseInt(stats.en_proceso),
          rechazados: parseInt(stats.rechazados),
          pesoTotalObtenido: parseFloat(stats.peso_total_obtenido) || 0,
          rendimientoPromedio: parseFloat(stats.rendimiento_promedio) || 0,
          porcentajeCompletado: ((parseFloat(stats.peso_total_obtenido) || 0) / orden.cantidad_planificada) * 100
        }
      };
    } catch (error) {
      logger.error('Error actualizando estado de orden por Desposte', { 
        error: error.message, 
        ordenId 
      });
      throw error;
    }
  }

  async obtenerProgresoOrden(ordenId) {
    try {
      // Obtener información completa de la orden con progreso de Desposte
      const query = `
        SELECT 
          o.*,
          COUNT(rd.id) as total_registros_desposte,
          COUNT(CASE WHEN rd.estado = 'Completado' THEN 1 END) as registros_completados,
          COUNT(CASE WHEN rd.estado = 'En Proceso' THEN 1 END) as registros_en_proceso,
          COUNT(CASE WHEN rd.estado = 'Rechazado' THEN 1 END) as registros_rechazados,
          SUM(rd.peso_obtenido_kg) as peso_total_obtenido,
          SUM(rd.peso_lanzado_kg) as peso_total_lanzado,
          SUM(rd.peso_trasladado_kg) as peso_total_trasladado,
          AVG(rd.peso_obtenido_kg / NULLIF(rd.peso_lanzado_kg, 0) * 100) as rendimiento_promedio,
          MIN(rd.fecha_produccion) as fecha_inicio_produccion,
          MAX(rd.fecha_actualizacion) as fecha_ultima_actualizacion
        FROM ordenes o
        LEFT JOIN registro_desposte rd ON o.id = rd.orden_id
        WHERE o.id = $1
        GROUP BY o.id
      `;

      const result = await this.db.query(query, [ordenId]);
      if (result.rows.length === 0) {
        throw new Error('Orden no encontrada');
      }

      const datos = result.rows[0];
      const orden = this.formatearOrden(datos);

      // Calcular métricas de progreso avanzadas
      const totalRegistros = parseInt(datos.total_registros_desposte) || 0;
      const registrosCompletados = parseInt(datos.registros_completados) || 0;
      const registrosEnProceso = parseInt(datos.registros_en_proceso) || 0;
      const registrosRechazados = parseInt(datos.registros_rechazados) || 0;
      
      const pesoTotalObtenido = parseFloat(datos.peso_total_obtenido) || 0;
      const pesoTotalLanzado = parseFloat(datos.peso_total_lanzado) || 0;
      const pesoTotalTrasladado = parseFloat(datos.peso_total_trasladado) || 0;
      
      const porcentajeCompletado = (pesoTotalObtenido / orden.cantidadPlanificada) * 100;
      const porcentajeRendimiento = parseFloat(datos.rendimiento_promedio) || 0;
      const porcentajeRegistrosCompletados = totalRegistros > 0 ? (registrosCompletados / totalRegistros) * 100 : 0;
      
      // Métricas de eficiencia
      const mermaTotal = pesoTotalLanzado - pesoTotalObtenido;
      const porcentajeMerma = pesoTotalLanzado > 0 ? (mermaTotal / pesoTotalLanzado) * 100 : 0;
      const eficienciaTraslado = pesoTotalTrasladado > 0 ? (pesoTotalLanzado / pesoTotalTrasladado) * 100 : 0;

      // Determinar estado calculado
      let estadoCalculado = 'Creada';
      if (totalRegistros === 0) {
        estadoCalculado = 'Creada';
      } else if (registrosEnProceso > 0) {
        estadoCalculado = 'EnProceso';
      } else if (registrosCompletados === totalRegistros && porcentajeCompletado >= 90) {
        estadoCalculado = 'Finalizada';
      } else {
        estadoCalculado = 'EnProceso';
      }

      return {
        ...orden,
        progreso: {
          // Métricas básicas
          totalRegistros,
          registrosCompletados,
          registrosEnProceso,
          registrosRechazados,
          
          // Métricas de peso
          pesoTotalObtenido,
          pesoTotalLanzado,
          pesoTotalTrasladado,
          mermaTotal,
          
          // Porcentajes
          porcentajeCompletado: Math.min(porcentajeCompletado, 100),
          porcentajeRendimiento,
          porcentajeRegistrosCompletados,
          porcentajeMerma,
          eficienciaTraslado,
          
          // Estado y fechas
          estadoCalculado,
          fechaInicioProduccion: datos.fecha_inicio_produccion,
          fechaUltimaActualizacion: datos.fecha_ultima_actualizacion,
          
          // Métricas de calidad
          calidadGeneral: this.calcularCalidadGeneral({
            porcentajeRendimiento,
            porcentajeMerma,
            registrosRechazados,
            totalRegistros
          }),
          
          // Resumen ejecutivo
          resumen: {
            estado: estadoCalculado,
            avanceGeneral: Math.min(porcentajeCompletado, 100),
            rendimiento: porcentajeRendimiento,
            calidad: registrosRechazados === 0 ? 'Excelente' : 
                    registrosRechazados / totalRegistros < 0.1 ? 'Buena' : 'Regular'
          }
        }
      };
    } catch (error) {
      logger.error('Error obteniendo progreso de orden', { error: error.message, ordenId });
      throw error;
    }
  }

  calcularCalidadGeneral({ porcentajeRendimiento, porcentajeMerma, registrosRechazados, totalRegistros }) {
    let puntuacion = 100;
    
    // Penalizar por bajo rendimiento
    if (porcentajeRendimiento < 70) puntuacion -= 20;
    else if (porcentajeRendimiento < 80) puntuacion -= 10;
    
    // Penalizar por alta merma
    if (porcentajeMerma > 20) puntuacion -= 20;
    else if (porcentajeMerma > 15) puntuacion -= 10;
    
    // Penalizar por registros rechazados
    const porcentajeRechazos = totalRegistros > 0 ? (registrosRechazados / totalRegistros) * 100 : 0;
    if (porcentajeRechazos > 10) puntuacion -= 30;
    else if (porcentajeRechazos > 5) puntuacion -= 15;
    
    return {
      puntuacion: Math.max(puntuacion, 0),
      categoria: puntuacion >= 90 ? 'Excelente' :
                puntuacion >= 75 ? 'Buena' :
                puntuacion >= 60 ? 'Regular' : 'Deficiente'
    };
  }

  async obtenerDashboardProgreso(filtros = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const valores = [];
      let paramCount = 0;

      if (filtros.linea) {
        paramCount++;
        whereClause += ` AND o.linea = $${paramCount}`;
        valores.push(filtros.linea);
      }

      if (filtros.fechaInicio && filtros.fechaFin) {
        paramCount++;
        whereClause += ` AND o.fecha_planificada BETWEEN $${paramCount}`;
        valores.push(filtros.fechaInicio);
        paramCount++;
        whereClause += ` AND $${paramCount}`;
        valores.push(filtros.fechaFin);
      }

      const query = `
        SELECT 
          o.*,
          COUNT(rd.id) as total_registros_desposte,
          COUNT(CASE WHEN rd.estado = 'Completado' THEN 1 END) as registros_completados,
          COUNT(CASE WHEN rd.estado = 'En Proceso' THEN 1 END) as registros_en_proceso,
          COUNT(CASE WHEN rd.estado = 'Rechazado' THEN 1 END) as registros_rechazados,
          SUM(rd.peso_obtenido_kg) as peso_total_obtenido,
          SUM(rd.peso_lanzado_kg) as peso_total_lanzado,
          AVG(rd.peso_obtenido_kg / NULLIF(rd.peso_lanzado_kg, 0) * 100) as rendimiento_promedio
        FROM ordenes o
        LEFT JOIN registro_desposte rd ON o.id = rd.orden_id
        ${whereClause}
        GROUP BY o.id
        ORDER BY o.fecha_planificada DESC
      `;

      const result = await this.db.query(query, valores);
      
      const ordenes = result.rows.map(row => {
        const orden = this.formatearOrden(row);
        const totalRegistros = parseInt(row.total_registros_desposte) || 0;
        const pesoTotalObtenido = parseFloat(row.peso_total_obtenido) || 0;
        const porcentajeCompletado = (pesoTotalObtenido / orden.cantidadPlanificada) * 100;
        
        return {
          ...orden,
          progreso: {
            totalRegistros,
            registrosCompletados: parseInt(row.registros_completados) || 0,
            registrosEnProceso: parseInt(row.registros_en_proceso) || 0,
            registrosRechazados: parseInt(row.registros_rechazados) || 0,
            pesoTotalObtenido,
            porcentajeCompletado: Math.min(porcentajeCompletado, 100),
            porcentajeRendimiento: parseFloat(row.rendimiento_promedio) || 0
          }
        };
      });

      // Calcular métricas generales del dashboard
      const totalOrdenes = ordenes.length;
      const ordenesFinalizadas = ordenes.filter(o => o.estado === 'Finalizada').length;
      const ordenesEnProceso = ordenes.filter(o => o.estado === 'EnProceso').length;
      const ordenesCreadas = ordenes.filter(o => o.estado === 'Creada').length;

      const pesoTotalPlanificado = ordenes.reduce((sum, o) => sum + o.cantidadPlanificada, 0);
      const pesoTotalObtenido = ordenes.reduce((sum, o) => sum + o.progreso.pesoTotalObtenido, 0);
      const rendimientoGeneral = pesoTotalPlanificado > 0 ? (pesoTotalObtenido / pesoTotalPlanificado) * 100 : 0;

      return {
        resumen: {
          totalOrdenes,
          ordenesFinalizadas,
          ordenesEnProceso,
          ordenesCreadas,
          pesoTotalPlanificado,
          pesoTotalObtenido,
          rendimientoGeneral,
          porcentajeFinalizacion: totalOrdenes > 0 ? (ordenesFinalizadas / totalOrdenes) * 100 : 0
        },
        ordenes
      };
    } catch (error) {
      logger.error('Error obteniendo dashboard de progreso', { error: error.message, filtros });
      throw error;
    }
  }

  // Métodos auxiliares para formatear respuestas
  formatearOrden(orden) {
    return {
      id: orden.id,
      cliente: orden.cliente,
      linea: orden.linea,
      turno: orden.turno,
      fechaPlanificada: orden.fecha_planificada,
      cantidadPlanificada: orden.cantidad_planificada,
      estado: orden.estado,
      fechaCreacion: orden.fecha_creacion,
      createdAt: orden.created_at,
      updatedAt: orden.updated_at
    };
  }

  formatearFicha(ficha) {
    return {
      id: ficha.id,
      ordenId: ficha.orden_id,
      proceso: ficha.proceso,
      materialConsumido: ficha.material_consumido,
      cantidad: parseFloat(ficha.cantidad),
      tiempoProceso: ficha.tiempo_proceso,
      condiciones: ficha.condiciones ? JSON.parse(ficha.condiciones) : null,
      timestamp: ficha.timestamp,
      createdAt: ficha.created_at
    };
  }
}

module.exports = OrdenesService;