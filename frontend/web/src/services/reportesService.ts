import apiClient from './apiClient';

export interface ReporteOrden {
  orden: any;
  registrosDesposte: any[];
  metricas: {
    produccion: {
      cantidadPlanificada: number;
      pesoTotalObtenido: number;
      pesoTotalLanzado: number;
      pesoTotalTrasladado: number;
      porcentajeCompletado: number;
      cumplimientoMeta: string;
    };
    calidad: {
      totalRegistros: number;
      registrosCompletados: number;
      registrosRechazados: number;
      porcentajeRegistrosCompletados: number;
      porcentajeRechazos: number;
      indiceCalidad: number;
    };
    eficiencia: {
      rendimientoGeneral: number;
      mermaTotal: number;
      porcentajeMerma: number;
      eficienciaTraslado: number;
      clasificacionRendimiento: string;
    };
    tiempos: {
      fechaInicio: string | null;
      fechaFin: string | null;
      diasProduccion: number;
      tiempoPromedioRegistro: number | null;
    };
  };
  analisisCalidad: {
    resumen: {
      conformes: number;
      noConformes: number;
      pendientes: number;
      porcentajeConformidad: number;
    };
    problemasCalidad: any[];
    recomendaciones: string[];
    tendenciaCalidad: any[];
  };
  cronologia: any[];
  resumenEjecutivo: {
    estado: string;
    calificacionGeneral: string;
    alertas: string[];
    fortalezas: string[];
    oportunidades: string[];
    conclusiones: string[];
  };
  fechaGeneracion: string;
  totalRegistros: number;
}

export interface ReportePeriodo {
  periodo: {
    fechaInicio?: string;
    fechaFin?: string;
    linea?: string;
    estado?: string;
  };
  ordenes: any[];
  metricasPeriodo: {
    resumen: {
      totalOrdenes: number;
      ordenesFinalizadas: number;
      ordenesEnProceso: number;
      porcentajeFinalizacion: number;
    };
    produccion: {
      pesoTotalPlanificado: number;
      pesoTotalObtenido: number;
      pesoTotalLanzado: number;
      eficienciaGeneral: number;
      rendimientoGeneral: number;
    };
    calidad: {
      totalRegistros: number;
      registrosCompletados: number;
      registrosRechazados: number;
      productosConformes: number;
      productosNoConformes: number;
    };
  };
  analisisComparativo: any[];
  tendencias: any[];
  fechaGeneracion: string;
  totalOrdenes: number;
}

export interface ReporteEficiencia {
  filtros: any;
  eficiencias: any[];
  rankings: {
    mejorRendimiento: any;
    menorVariabilidad: any;
    mayorVolumen: any;
    mejorCalidad: any;
  };
  benchmarks: {
    rendimientoPromedio: number;
    rendimientoMinimo: number;
    rendimientoMaximo: number;
    cuartil25: number;
    mediana: number;
    cuartil75: number;
  };
  fechaGeneracion: string;
}

class ReportesService {
  private readonly baseUrl = '/api/reportes';

  // ==================== GENERACIÓN DE REPORTES ====================

  /**
   * Genera un reporte consolidado de una orden específica
   */
  async generarReporteOrden(ordenId: string): Promise<ReporteOrden> {
    const response = await apiClient.get(`${this.baseUrl}/orden/${ordenId}`);
    return response.data.data;
  }

  /**
   * Genera un reporte de múltiples órdenes en un período
   */
  async generarReportePeriodo(filtros?: {
    fechaInicio?: string;
    fechaFin?: string;
    linea?: string;
    estado?: string;
  }): Promise<ReportePeriodo> {
    const params = new URLSearchParams();
    
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros?.linea) params.append('linea', filtros.linea);
    if (filtros?.estado) params.append('estado', filtros.estado);

    const response = await apiClient.get(`${this.baseUrl}/periodo?${params}`);
    return response.data.data;
  }

  /**
   * Genera un reporte de eficiencia y rendimiento
   */
  async generarReporteEficiencia(filtros?: {
    fechaInicio?: string;
    fechaFin?: string;
    linea?: string;
    turno?: string;
  }): Promise<ReporteEficiencia> {
    const params = new URLSearchParams();
    
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros?.linea) params.append('linea', filtros.linea);
    if (filtros?.turno) params.append('turno', filtros.turno);

    const response = await apiClient.get(`${this.baseUrl}/eficiencia?${params}`);
    return response.data.data;
  }

  // ==================== EXPORTACIÓN DE REPORTES ====================

  /**
   * Exporta un reporte de orden en el formato especificado
   */
  async exportarReporteOrden(
    ordenId: string, 
    formato: 'json' | 'excel' | 'pdf' = 'json'
  ): Promise<Blob> {
    const response = await apiClient.get(
      `${this.baseUrl}/orden/${ordenId}/exportar?formato=${formato}`,
      { 
        responseType: 'blob' 
      }
    );
    return response.data;
  }

  /**
   * Exporta un reporte de período en el formato especificado
   */
  async exportarReportePeriodo(
    filtros?: {
      fechaInicio?: string;
      fechaFin?: string;
      linea?: string;
      estado?: string;
    },
    formato: 'json' | 'excel' | 'pdf' = 'json'
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('formato', formato);
    
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros?.linea) params.append('linea', filtros.linea);
    if (filtros?.estado) params.append('estado', filtros.estado);

    const response = await apiClient.get(
      `${this.baseUrl}/periodo/exportar?${params}`,
      { 
        responseType: 'blob' 
      }
    );
    return response.data;
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Descarga un blob como archivo
   */
  descargarArchivo(blob: Blob, nombreArchivo: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Formatea números para mostrar en reportes
   */
  formatearNumero(numero: number, decimales: number = 2): string {
    return numero.toLocaleString('es-CO', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales
    });
  }

  /**
   * Formatea porcentajes para mostrar en reportes
   */
  formatearPorcentaje(porcentaje: number, decimales: number = 1): string {
    return `${porcentaje.toFixed(decimales)}%`;
  }

  /**
   * Formatea fechas para mostrar en reportes
   */
  formatearFecha(fecha: string | Date, incluirHora: boolean = false): string {
    const date = new Date(fecha);
    
    if (incluirHora) {
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Obtiene el color para un indicador de rendimiento
   */
  obtenerColorRendimiento(rendimiento: number): string {
    if (rendimiento >= 90) return '#10B981'; // Verde
    if (rendimiento >= 80) return '#3B82F6'; // Azul
    if (rendimiento >= 70) return '#F59E0B'; // Amarillo
    return '#EF4444'; // Rojo
  }

  /**
   * Obtiene el color para un indicador de calidad
   */
  obtenerColorCalidad(porcentajeConformidad: number): string {
    if (porcentajeConformidad >= 95) return '#10B981'; // Verde
    if (porcentajeConformidad >= 90) return '#3B82F6'; // Azul
    if (porcentajeConformidad >= 85) return '#F59E0B'; // Amarillo
    return '#EF4444'; // Rojo
  }

  /**
   * Calcula el índice de eficiencia general
   */
  calcularIndiceEficiencia(metricas: ReporteOrden['metricas']): {
    valor: number;
    categoria: string;
    color: string;
  } {
    const rendimiento = metricas.eficiencia.rendimientoGeneral;
    const calidad = metricas.calidad.porcentajeRegistrosCompletados;
    const cumplimiento = metricas.produccion.porcentajeCompletado;
    
    // Promedio ponderado: 40% rendimiento, 30% calidad, 30% cumplimiento
    const indice = (rendimiento * 0.4) + (calidad * 0.3) + (cumplimiento * 0.3);
    
    let categoria: string;
    let color: string;
    
    if (indice >= 90) {
      categoria = 'Excelente';
      color = '#10B981';
    } else if (indice >= 80) {
      categoria = 'Bueno';
      color = '#3B82F6';
    } else if (indice >= 70) {
      categoria = 'Regular';
      color = '#F59E0B';
    } else {
      categoria = 'Deficiente';
      color = '#EF4444';
    }
    
    return { valor: indice, categoria, color };
  }

  /**
   * Genera datos para gráficos de tendencia
   */
  generarDatosTendencia(tendencias: any[]): {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
    }[];
  } {
    const labels = tendencias.map(t => this.formatearFecha(t.fecha));
    
    return {
      labels,
      datasets: [
        {
          label: 'Rendimiento (%)',
          data: tendencias.map(t => t.rendimiento),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true
        },
        {
          label: 'Peso Obtenido (kg)',
          data: tendencias.map(t => t.pesoObtenido),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false
        }
      ]
    };
  }

  /**
   * Valida los filtros de fechas
   */
  validarFiltrosFecha(fechaInicio?: string, fechaFin?: string): string[] {
    const errores: string[] = [];
    
    if (fechaInicio && isNaN(Date.parse(fechaInicio))) {
      errores.push('Fecha de inicio inválida');
    }
    
    if (fechaFin && isNaN(Date.parse(fechaFin))) {
      errores.push('Fecha de fin inválida');
    }
    
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      
      if (inicio > fin) {
        errores.push('La fecha de inicio debe ser anterior a la fecha de fin');
      }
      
      // Validar que el período no sea mayor a 1 año
      const diferenciaDias = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
      if (diferenciaDias > 365) {
        errores.push('El período de consulta no puede ser mayor a 1 año');
      }
    }
    
    return errores;
  }

  /**
   * Genera nombre de archivo para exportación
   */
  generarNombreArchivo(
    tipo: 'orden' | 'periodo' | 'eficiencia',
    identificador?: string,
    formato: 'json' | 'excel' | 'pdf' = 'json'
  ): string {
    const fecha = new Date().toISOString().slice(0, 10);
    const extension = formato === 'excel' ? 'xlsx' : formato;
    
    switch (tipo) {
      case 'orden':
        return `reporte_orden_${identificador}_${fecha}.${extension}`;
      case 'periodo':
        return `reporte_periodo_${fecha}.${extension}`;
      case 'eficiencia':
        return `reporte_eficiencia_${fecha}.${extension}`;
      default:
        return `reporte_${fecha}.${extension}`;
    }
  }
}

export default new ReportesService();