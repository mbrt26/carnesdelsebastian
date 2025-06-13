const logger = require('../../common/utils/logger');

class ReportesService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Genera un reporte consolidado de una orden de producción específica
   */
  async generarReporteOrden(ordenId) {
    try {
      // Obtener información básica de la orden
      const ordenQuery = `
        SELECT * FROM ordenes WHERE id = $1
      `;
      const ordenResult = await this.db.query(ordenQuery, [ordenId]);
      
      if (ordenResult.rows.length === 0) {
        throw new Error('Orden no encontrada');
      }
      
      const orden = ordenResult.rows[0];

      // Obtener todos los registros de Desposte asociados
      const desposteQuery = `
        SELECT 
          rd.*,
          lp.resultado as resultado_liberacion,
          lp.responsable as responsable_liberacion,
          fs.coordinador_desposte as responsable_produccion,
          fs.liberado_calidad as responsable_calidad
        FROM registro_desposte rd
        LEFT JOIN liberacion_producto lp ON rd.id = lp.registro_desposte_id
        LEFT JOIN firmas_sellos fs ON rd.id = fs.registro_desposte_id
        WHERE rd.orden_id = $1
        ORDER BY rd.fecha_produccion ASC
      `;
      
      const desposteResult = await this.db.query(desposteQuery, [ordenId]);
      const registrosDesposte = desposteResult.rows;

      // Calcular métricas consolidadas
      const metricas = this.calcularMetricasConsolidadas(orden, registrosDesposte);

      // Generar análisis de calidad
      const analisisCalidad = this.generarAnalisisCalidad(registrosDesposte);

      // Generar cronología de producción
      const cronologia = this.generarCronologia(registrosDesposte);

      // Generar resumen ejecutivo
      const resumenEjecutivo = this.generarResumenEjecutivo(orden, metricas, analisisCalidad);

      return {
        orden: this.formatearOrden(orden),
        registrosDesposte: registrosDesposte.map(r => this.formatearRegistroDesposte(r)),
        metricas,
        analisisCalidad,
        cronologia,
        resumenEjecutivo,
        fechaGeneracion: new Date().toISOString(),
        totalRegistros: registrosDesposte.length
      };

    } catch (error) {
      logger.error('Error generando reporte de orden', { error: error.message, ordenId });
      throw error;
    }
  }

  /**
   * Genera un reporte consolidado de múltiples órdenes en un período
   */
  async generarReportePeriodo(filtros = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const valores = [];
      let paramCount = 0;

      if (filtros.fechaInicio && filtros.fechaFin) {
        paramCount++;
        whereClause += ` AND o.fecha_planificada BETWEEN $${paramCount}`;
        valores.push(filtros.fechaInicio);
        paramCount++;
        whereClause += ` AND $${paramCount}`;
        valores.push(filtros.fechaFin);
      }

      if (filtros.linea) {
        paramCount++;
        whereClause += ` AND o.linea = $${paramCount}`;
        valores.push(filtros.linea);
      }

      if (filtros.estado) {
        paramCount++;
        whereClause += ` AND o.estado = $${paramCount}`;
        valores.push(filtros.estado);
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
          SUM(rd.peso_trasladado_kg) as peso_total_trasladado,
          AVG(rd.peso_obtenido_kg / NULLIF(rd.peso_lanzado_kg, 0) * 100) as rendimiento_promedio,
          MIN(rd.fecha_produccion) as fecha_inicio_produccion,
          MAX(rd.fecha_actualizacion) as fecha_ultima_actualizacion,
          COUNT(CASE WHEN lp.resultado = 'Conforme' THEN 1 END) as productos_conformes,
          COUNT(CASE WHEN lp.resultado = 'No conforme' THEN 1 END) as productos_no_conformes
        FROM ordenes o
        LEFT JOIN registro_desposte rd ON o.id = rd.orden_id
        LEFT JOIN liberacion_producto lp ON rd.id = lp.registro_desposte_id
        ${whereClause}
        GROUP BY o.id
        ORDER BY o.fecha_planificada DESC
      `;

      const result = await this.db.query(query, valores);
      const ordenes = result.rows;

      // Calcular métricas del período
      const metricasPeriodo = this.calcularMetricasPeriodo(ordenes);

      // Generar análisis comparativo
      const analisisComparativo = this.generarAnalisisComparativo(ordenes);

      // Generar tendencias
      const tendencias = this.generarTendencias(ordenes);

      return {
        periodo: {
          fechaInicio: filtros.fechaInicio,
          fechaFin: filtros.fechaFin,
          linea: filtros.linea,
          estado: filtros.estado
        },
        ordenes: ordenes.map(o => this.formatearOrdenParaReporte(o)),
        metricasPeriodo,
        analisisComparativo,
        tendencias,
        fechaGeneracion: new Date().toISOString(),
        totalOrdenes: ordenes.length
      };

    } catch (error) {
      logger.error('Error generando reporte de período', { error: error.message, filtros });
      throw error;
    }
  }

  /**
   * Genera un reporte de eficiencia y rendimiento
   */
  async generarReporteEficiencia(filtros = {}) {
    try {
      let whereClause = 'WHERE rd.estado = \'Completado\'';
      const valores = [];
      let paramCount = 0;

      if (filtros.fechaInicio && filtros.fechaFin) {
        paramCount++;
        whereClause += ` AND rd.fecha_produccion BETWEEN $${paramCount}`;
        valores.push(filtros.fechaInicio);
        paramCount++;
        whereClause += ` AND $${paramCount}`;
        valores.push(filtros.fechaFin);
      }

      const query = `
        SELECT 
          o.linea,
          o.turno,
          COUNT(rd.id) as total_registros,
          AVG(rd.peso_obtenido_kg / NULLIF(rd.peso_lanzado_kg, 0) * 100) as rendimiento_promedio,
          MIN(rd.peso_obtenido_kg / NULLIF(rd.peso_lanzado_kg, 0) * 100) as rendimiento_minimo,
          MAX(rd.peso_obtenido_kg / NULLIF(rd.peso_lanzado_kg, 0) * 100) as rendimiento_maximo,
          STDDEV(rd.peso_obtenido_kg / NULLIF(rd.peso_lanzado_kg, 0) * 100) as desviacion_rendimiento,
          SUM(rd.peso_obtenido_kg) as peso_total_obtenido,
          SUM(rd.peso_lanzado_kg) as peso_total_lanzado,
          SUM(rd.peso_trasladado_kg) as peso_total_trasladado,
          0 as tiempo_promedio_proceso,
          COUNT(CASE WHEN lp.resultado = 'Conforme' THEN 1 END) as conformes,
          COUNT(CASE WHEN lp.resultado = 'No conforme' THEN 1 END) as no_conformes
        FROM registro_desposte rd
        INNER JOIN ordenes o ON rd.orden_id = o.id
        LEFT JOIN liberacion_producto lp ON rd.id = lp.registro_desposte_id
        ${whereClause}
        GROUP BY o.linea, o.turno
        ORDER BY rendimiento_promedio DESC
      `;

      const result = await this.db.query(query, valores);
      const eficiencias = result.rows;

      // Calcular rankings y benchmarks
      const rankings = this.calcularRankings(eficiencias);
      const benchmarks = this.calcularBenchmarks(eficiencias);

      return {
        filtros,
        eficiencias: eficiencias.map(e => this.formatearEficiencia(e)),
        rankings,
        benchmarks,
        fechaGeneracion: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error generando reporte de eficiencia', { error: error.message, filtros });
      throw error;
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  calcularMetricasConsolidadas(orden, registros) {
    const totalRegistros = registros.length;
    const registrosCompletados = registros.filter(r => r.estado === 'Completado').length;
    const registrosRechazados = registros.filter(r => r.estado === 'Rechazado').length;

    const pesoTotalLanzado = registros.reduce((sum, r) => sum + (parseFloat(r.peso_lanzado_kg) || 0), 0);
    const pesoTotalObtenido = registros.reduce((sum, r) => sum + (parseFloat(r.peso_obtenido_kg) || 0), 0);
    const pesoTotalTrasladado = registros.reduce((sum, r) => sum + (parseFloat(r.peso_trasladado_kg) || 0), 0);

    const rendimientoGeneral = pesoTotalLanzado > 0 ? (pesoTotalObtenido / pesoTotalLanzado) * 100 : 0;
    const mermaTotal = pesoTotalLanzado - pesoTotalObtenido;
    const porcentajeMerma = pesoTotalLanzado > 0 ? (mermaTotal / pesoTotalLanzado) * 100 : 0;
    const eficienciaTraslado = pesoTotalTrasladado > 0 ? (pesoTotalLanzado / pesoTotalTrasladado) * 100 : 0;

    const porcentajeCompletado = (pesoTotalObtenido / orden.cantidad_planificada) * 100;
    const porcentajeRegistrosCompletados = totalRegistros > 0 ? (registrosCompletados / totalRegistros) * 100 : 0;

    return {
      produccion: {
        cantidadPlanificada: orden.cantidad_planificada,
        pesoTotalObtenido,
        pesoTotalLanzado,
        pesoTotalTrasladado,
        porcentajeCompletado: Math.min(porcentajeCompletado, 100),
        cumplimientoMeta: porcentajeCompletado >= 95 ? 'Excelente' : 
                          porcentajeCompletado >= 85 ? 'Bueno' : 
                          porcentajeCompletado >= 75 ? 'Regular' : 'Deficiente'
      },
      calidad: {
        totalRegistros,
        registrosCompletados,
        registrosRechazados,
        porcentajeRegistrosCompletados,
        porcentajeRechazos: totalRegistros > 0 ? (registrosRechazados / totalRegistros) * 100 : 0,
        indiceCalidad: this.calcularIndiceCalidad(registros)
      },
      eficiencia: {
        rendimientoGeneral,
        mermaTotal,
        porcentajeMerma,
        eficienciaTraslado,
        clasificacionRendimiento: rendimientoGeneral >= 90 ? 'Excelente' :
                                 rendimientoGeneral >= 80 ? 'Bueno' :
                                 rendimientoGeneral >= 70 ? 'Regular' : 'Deficiente'
      },
      tiempos: {
        fechaInicio: registros.length > 0 ? Math.min(...registros.map(r => new Date(r.fecha_produccion).getTime())) : null,
        fechaFin: registros.length > 0 ? Math.max(...registros.map(r => new Date(r.fecha_actualizacion || r.fecha_produccion).getTime())) : null,
        diasProduccion: this.calcularDiasProduccion(registros),
        tiempoPromedioRegistro: this.calcularTiempoPromedioRegistro(registros)
      }
    };
  }

  generarAnalisisCalidad(registros) {
    const conformes = registros.filter(r => r.resultado_liberacion === 'Conforme').length;
    const noConformes = registros.filter(r => r.resultado_liberacion === 'No conforme').length;
    const pendientes = registros.filter(r => !r.resultado_liberacion).length;

    const problemasCalidad = registros
      .filter(r => r.resultado_liberacion === 'No conforme')
      .map(r => ({
        lote: r.lote,
        producto: r.producto,
        fechaProduccion: r.fecha_produccion,
        observaciones: r.observaciones_liberacion || 'Sin observaciones'
      }));

    return {
      resumen: {
        conformes,
        noConformes,
        pendientes,
        porcentajeConformidad: registros.length > 0 ? (conformes / registros.length) * 100 : 0
      },
      problemasCalidad,
      recomendaciones: this.generarRecomendacionesCalidad(registros),
      tendenciaCalidad: this.calcularTendenciaCalidad(registros)
    };
  }

  generarCronologia(registros) {
    return registros
      .sort((a, b) => new Date(a.fecha_produccion) - new Date(b.fecha_produccion))
      .map(registro => ({
        fecha: registro.fecha_produccion,
        lote: registro.lote,
        producto: registro.producto,
        estado: registro.estado,
        pesoObtenido: registro.peso_obtenido_kg,
        rendimiento: registro.peso_lanzado_kg > 0 ? 
          ((registro.peso_obtenido_kg / registro.peso_lanzado_kg) * 100).toFixed(2) : 0,
        responsableCalidad: registro.responsable_calidad,
        responsableProduccion: registro.responsable_produccion,
        observaciones: registro.observaciones
      }));
  }

  generarResumenEjecutivo(orden, metricas, analisisCalidad) {
    const alertas = [];
    const fortalezas = [];
    const oportunidades = [];

    // Evaluar alertas
    if (metricas.eficiencia.porcentajeMerma > 15) {
      alertas.push(`Alta merma detectada: ${metricas.eficiencia.porcentajeMerma.toFixed(1)}%`);
    }
    if (analisisCalidad.resumen.porcentajeConformidad < 95) {
      alertas.push(`Baja conformidad de calidad: ${analisisCalidad.resumen.porcentajeConformidad.toFixed(1)}%`);
    }
    if (metricas.produccion.porcentajeCompletado < 90) {
      alertas.push(`Baja eficiencia de producción: ${metricas.produccion.porcentajeCompletado.toFixed(1)}%`);
    }

    // Evaluar fortalezas
    if (metricas.eficiencia.rendimientoGeneral >= 85) {
      fortalezas.push(`Excelente rendimiento: ${metricas.eficiencia.rendimientoGeneral.toFixed(1)}%`);
    }
    if (analisisCalidad.resumen.porcentajeConformidad >= 95) {
      fortalezas.push(`Alta calidad del producto: ${analisisCalidad.resumen.porcentajeConformidad.toFixed(1)}% conformidad`);
    }
    if (metricas.calidad.porcentajeRechazos < 5) {
      fortalezas.push(`Bajo índice de rechazos: ${metricas.calidad.porcentajeRechazos.toFixed(1)}%`);
    }

    // Evaluar oportunidades
    if (metricas.eficiencia.rendimientoGeneral < 80) {
      oportunidades.push('Optimizar procesos para mejorar rendimiento');
    }
    if (metricas.eficiencia.porcentajeMerma > 10) {
      oportunidades.push('Implementar medidas de reducción de merma');
    }
    if (analisisCalidad.resumen.noConformes > 0) {
      oportunidades.push('Revisar y fortalecer controles de calidad');
    }

    return {
      estado: orden.estado,
      calificacionGeneral: this.calcularCalificacionGeneral(metricas, analisisCalidad),
      alertas,
      fortalezas,
      oportunidades,
      conclusiones: this.generarConclusiones(orden, metricas, analisisCalidad)
    };
  }

  calcularMetricasPeriodo(ordenes) {
    const totalOrdenes = ordenes.length;
    const ordenesFinalizadas = ordenes.filter(o => o.estado === 'Finalizada').length;
    const ordenesEnProceso = ordenes.filter(o => o.estado === 'EnProceso').length;

    const pesoTotalPlanificado = ordenes.reduce((sum, o) => sum + (parseFloat(o.cantidad_planificada) || 0), 0);
    const pesoTotalObtenido = ordenes.reduce((sum, o) => sum + (parseFloat(o.peso_total_obtenido) || 0), 0);
    const pesoTotalLanzado = ordenes.reduce((sum, o) => sum + (parseFloat(o.peso_total_lanzado) || 0), 0);

    const rendimientoGeneral = pesoTotalLanzado > 0 ? (pesoTotalObtenido / pesoTotalLanzado) * 100 : 0;
    const eficienciaGeneral = pesoTotalPlanificado > 0 ? (pesoTotalObtenido / pesoTotalPlanificado) * 100 : 0;

    return {
      resumen: {
        totalOrdenes,
        ordenesFinalizadas,
        ordenesEnProceso,
        porcentajeFinalizacion: totalOrdenes > 0 ? (ordenesFinalizadas / totalOrdenes) * 100 : 0
      },
      produccion: {
        pesoTotalPlanificado,
        pesoTotalObtenido,
        pesoTotalLanzado,
        eficienciaGeneral,
        rendimientoGeneral
      },
      calidad: {
        totalRegistros: ordenes.reduce((sum, o) => sum + (parseInt(o.total_registros_desposte) || 0), 0),
        registrosCompletados: ordenes.reduce((sum, o) => sum + (parseInt(o.registros_completados) || 0), 0),
        registrosRechazados: ordenes.reduce((sum, o) => sum + (parseInt(o.registros_rechazados) || 0), 0),
        productosConformes: ordenes.reduce((sum, o) => sum + (parseInt(o.productos_conformes) || 0), 0),
        productosNoConformes: ordenes.reduce((sum, o) => sum + (parseInt(o.productos_no_conformes) || 0), 0)
      }
    };
  }

  // Métodos auxiliares adicionales...
  calcularIndiceCalidad(registros) {
    if (registros.length === 0) return 0;
    
    const conformes = registros.filter(r => r.resultado_liberacion === 'Conforme').length;
    const rechazados = registros.filter(r => r.estado === 'Rechazado').length;
    
    let indice = 100;
    indice -= (rechazados / registros.length) * 30; // Penalización por rechazos
    indice -= ((registros.length - conformes) / registros.length) * 20; // Penalización por no conformes
    
    return Math.max(indice, 0);
  }

  calcularDiasProduccion(registros) {
    if (registros.length === 0) return 0;
    
    const fechas = registros.map(r => new Date(r.fecha_produccion).toDateString());
    const fechasUnicas = [...new Set(fechas)];
    return fechasUnicas.length;
  }

  calcularTiempoPromedioRegistro(registros) {
    const tiempos = registros
      .map(r => r.tiempo_total_minutos)
      .filter(t => t && t > 0);
    
    if (tiempos.length === 0) return null;
    return tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length;
  }

  calcularCalificacionGeneral(metricas, analisisCalidad) {
    let puntuacion = 0;
    
    // Puntuación por eficiencia (40%)
    if (metricas.eficiencia.rendimientoGeneral >= 90) puntuacion += 40;
    else if (metricas.eficiencia.rendimientoGeneral >= 80) puntuacion += 32;
    else if (metricas.eficiencia.rendimientoGeneral >= 70) puntuacion += 24;
    else puntuacion += 16;
    
    // Puntuación por calidad (40%)
    if (analisisCalidad.resumen.porcentajeConformidad >= 95) puntuacion += 40;
    else if (analisisCalidad.resumen.porcentajeConformidad >= 90) puntuacion += 32;
    else if (analisisCalidad.resumen.porcentajeConformidad >= 85) puntuacion += 24;
    else puntuacion += 16;
    
    // Puntuación por cumplimiento (20%)
    if (metricas.produccion.porcentajeCompletado >= 95) puntuacion += 20;
    else if (metricas.produccion.porcentajeCompletado >= 90) puntuacion += 16;
    else if (metricas.produccion.porcentajeCompletado >= 85) puntuacion += 12;
    else puntuacion += 8;
    
    if (puntuacion >= 90) return 'Excelente';
    if (puntuacion >= 80) return 'Bueno';
    if (puntuacion >= 70) return 'Regular';
    return 'Deficiente';
  }

  generarConclusiones(orden, metricas, analisisCalidad) {
    const conclusiones = [];
    
    conclusiones.push(`La orden ${orden.cliente} alcanzó un ${metricas.produccion.porcentajeCompletado.toFixed(1)}% de cumplimiento.`);
    conclusiones.push(`El rendimiento general fue de ${metricas.eficiencia.rendimientoGeneral.toFixed(1)}% con una merma de ${metricas.eficiencia.porcentajeMerma.toFixed(1)}%.`);
    conclusiones.push(`La conformidad de calidad fue del ${analisisCalidad.resumen.porcentajeConformidad.toFixed(1)}%.`);
    
    if (metricas.eficiencia.rendimientoGeneral >= 85 && analisisCalidad.resumen.porcentajeConformidad >= 95) {
      conclusiones.push('La orden cumplió con los estándares de excelencia operacional.');
    } else {
      conclusiones.push('Se identificaron oportunidades de mejora en los procesos.');
    }
    
    return conclusiones;
  }

  generarRecomendacionesCalidad(registros) {
    const recomendaciones = [];
    
    const rechazados = registros.filter(r => r.estado === 'Rechazado');
    if (rechazados.length > 0) {
      recomendaciones.push('Revisar los procesos que generaron productos rechazados');
    }
    
    const noConformes = registros.filter(r => r.resultado_liberacion === 'No conforme');
    if (noConformes.length > 0) {
      recomendaciones.push('Fortalecer los controles de calidad en liberación de productos');
    }
    
    const mermaAlta = registros.filter(r => {
      const rendimiento = (r.peso_obtenido_kg / r.peso_lanzado_kg) * 100;
      return rendimiento < 80;
    });
    
    if (mermaAlta.length > 0) {
      recomendaciones.push('Implementar medidas para reducir merma en los procesos identificados');
    }
    
    return recomendaciones;
  }

  calcularTendenciaCalidad(registros) {
    // Implementar análisis de tendencia temporal de calidad
    const registrosPorFecha = registros
      .sort((a, b) => new Date(a.fecha_produccion) - new Date(b.fecha_produccion))
      .reduce((acc, registro) => {
        const fecha = new Date(registro.fecha_produccion).toDateString();
        if (!acc[fecha]) acc[fecha] = [];
        acc[fecha].push(registro);
        return acc;
      }, {});
    
    return Object.entries(registrosPorFecha).map(([fecha, regs]) => ({
      fecha,
      conformes: regs.filter(r => r.resultado_liberacion === 'Conforme').length,
      noConformes: regs.filter(r => r.resultado_liberacion === 'No conforme').length,
      porcentajeConformidad: (regs.filter(r => r.resultado_liberacion === 'Conforme').length / regs.length) * 100
    }));
  }

  generarAnalisisComparativo(ordenes) {
    const porLinea = ordenes.reduce((acc, orden) => {
      if (!acc[orden.linea]) {
        acc[orden.linea] = [];
      }
      acc[orden.linea].push(orden);
      return acc;
    }, {});

    return Object.entries(porLinea).map(([linea, ordenesLinea]) => ({
      linea,
      totalOrdenes: ordenesLinea.length,
      rendimientoPromedio: ordenesLinea.reduce((sum, o) => sum + (parseFloat(o.rendimiento_promedio) || 0), 0) / ordenesLinea.length,
      pesoTotalObtenido: ordenesLinea.reduce((sum, o) => sum + (parseFloat(o.peso_total_obtenido) || 0), 0),
      conformidadPromedio: this.calcularConformidadPromedio(ordenesLinea)
    }));
  }

  generarTendencias(ordenes) {
    const ordenesOrdenadas = ordenes.sort((a, b) => new Date(a.fecha_planificada) - new Date(b.fecha_planificada));
    
    return ordenesOrdenadas.map(orden => ({
      fecha: orden.fecha_planificada,
      rendimiento: parseFloat(orden.rendimiento_promedio) || 0,
      pesoObtenido: parseFloat(orden.peso_total_obtenido) || 0,
      registrosCompletados: parseInt(orden.registros_completados) || 0,
      registrosRechazados: parseInt(orden.registros_rechazados) || 0
    }));
  }

  calcularRankings(eficiencias) {
    return {
      mejorRendimiento: eficiencias.sort((a, b) => b.rendimiento_promedio - a.rendimiento_promedio)[0],
      menorVariabilidad: eficiencias.sort((a, b) => a.desviacion_rendimiento - b.desviacion_rendimiento)[0],
      mayorVolumen: eficiencias.sort((a, b) => b.peso_total_obtenido - a.peso_total_obtenido)[0],
      mejorCalidad: eficiencias.sort((a, b) => b.conformes - a.conformes)[0]
    };
  }

  calcularBenchmarks(eficiencias) {
    const rendimientos = eficiencias.map(e => e.rendimiento_promedio).filter(r => r > 0);
    
    return {
      rendimientoPromedio: rendimientos.reduce((sum, r) => sum + r, 0) / rendimientos.length,
      rendimientoMinimo: Math.min(...rendimientos),
      rendimientoMaximo: Math.max(...rendimientos),
      cuartil25: this.calcularPercentil(rendimientos, 25),
      mediana: this.calcularPercentil(rendimientos, 50),
      cuartil75: this.calcularPercentil(rendimientos, 75)
    };
  }

  calcularPercentil(valores, percentil) {
    const sorted = valores.sort((a, b) => a - b);
    const index = (percentil / 100) * (sorted.length - 1);
    
    if (index % 1 === 0) {
      return sorted[index];
    } else {
      const lower = sorted[Math.floor(index)];
      const upper = sorted[Math.ceil(index)];
      return lower + (upper - lower) * (index % 1);
    }
  }

  calcularConformidadPromedio(ordenes) {
    const totalConformes = ordenes.reduce((sum, o) => sum + (parseInt(o.productos_conformes) || 0), 0);
    const totalProductos = ordenes.reduce((sum, o) => sum + (parseInt(o.productos_conformes) || 0) + (parseInt(o.productos_no_conformes) || 0), 0);
    
    return totalProductos > 0 ? (totalConformes / totalProductos) * 100 : 0;
  }

  // Métodos de formateo
  formatearOrden(orden) {
    return {
      id: orden.id,
      cliente: orden.cliente,
      linea: orden.linea,
      turno: orden.turno,
      fechaPlanificada: orden.fecha_planificada,
      cantidadPlanificada: parseFloat(orden.cantidad_planificada),
      estado: orden.estado,
      fechaCreacion: orden.fecha_creacion
    };
  }

  formatearRegistroDesposte(registro) {
    return {
      id: registro.id,
      lote: registro.lote,
      producto: registro.producto,
      fechaProduccion: registro.fecha_produccion,
      pesoTrasladado: parseFloat(registro.peso_trasladado_kg),
      pesoLanzado: parseFloat(registro.peso_lanzado_kg),
      pesoObtenido: parseFloat(registro.peso_obtenido_kg),
      rendimiento: registro.peso_lanzado_kg > 0 ? 
        ((registro.peso_obtenido_kg / registro.peso_lanzado_kg) * 100).toFixed(2) : 0,
      estado: registro.estado,
      temperaturaCanal: parseFloat(registro.temperatura_carne_celcius),
      tipoCanal: registro.tipo_canal,
      observaciones: registro.observaciones,
      responsableCalidad: registro.responsable_calidad,
      responsableProduccion: registro.responsable_produccion,
      resultadoLiberacion: registro.resultado_liberacion
    };
  }

  formatearOrdenParaReporte(orden) {
    return {
      ...this.formatearOrden(orden),
      totalRegistros: parseInt(orden.total_registros_desposte) || 0,
      registrosCompletados: parseInt(orden.registros_completados) || 0,
      registrosRechazados: parseInt(orden.registros_rechazados) || 0,
      pesoTotalObtenido: parseFloat(orden.peso_total_obtenido) || 0,
      pesoTotalLanzado: parseFloat(orden.peso_total_lanzado) || 0,
      rendimientoPromedio: parseFloat(orden.rendimiento_promedio) || 0,
      productosConformes: parseInt(orden.productos_conformes) || 0,
      productosNoConformes: parseInt(orden.productos_no_conformes) || 0
    };
  }

  formatearEficiencia(eficiencia) {
    return {
      linea: eficiencia.linea,
      turno: eficiencia.turno,
      totalRegistros: parseInt(eficiencia.total_registros),
      rendimientoPromedio: parseFloat(eficiencia.rendimiento_promedio).toFixed(2),
      rendimientoMinimo: parseFloat(eficiencia.rendimiento_minimo).toFixed(2),
      rendimientoMaximo: parseFloat(eficiencia.rendimiento_maximo).toFixed(2),
      desviacionRendimiento: parseFloat(eficiencia.desviacion_rendimiento).toFixed(2),
      pesoTotalObtenido: parseFloat(eficiencia.peso_total_obtenido),
      pesoTotalLanzado: parseFloat(eficiencia.peso_total_lanzado),
      tiempoPromedioMinutos: parseFloat(eficiencia.tiempo_promedio_proceso) || 0,
      conformes: parseInt(eficiencia.conformes),
      noConformes: parseInt(eficiencia.no_conformes),
      porcentajeConformidad: eficiencia.conformes > 0 ? 
        ((eficiencia.conformes / (eficiencia.conformes + eficiencia.no_conformes)) * 100).toFixed(2) : 0
    };
  }
}

module.exports = ReportesService;