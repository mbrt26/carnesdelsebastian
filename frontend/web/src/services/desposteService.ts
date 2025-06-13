import apiClient from './apiClient';
import {
  RegistroDesposte,
  RegistroDesposteCreacion,
  RegistroDesposteCompleto,
  DesencajadoMPC,
  DesencajadoMPCCreacion,
  PicadoMolienda,
  PicadoMoliendaCreacion,
  EmpacadoEmbutido,
  EmpacadoEmbutidoCreacion,
  MuestreoPeso,
  MuestreoPesoCreacion,
  LiberacionProducto,
  LiberacionProductoCreacion,
  Almacenamiento,
  AlmacenamientoCreacion,
  ParametrosMetricas,
  ParametrosMetricasCreacion,
  FirmasSellos,
  FirmasSellosCreacion,
  EstadisticasDesposte,
  ValidacionesTemperatura,
  FiltrosDesposte
} from '../types';

class DesposteService {
  private readonly baseUrl = '/api/ordenes';

  // ==================== REGISTRO PRINCIPAL ====================
  
  async crearRegistroDesposte(registro: RegistroDesposteCreacion): Promise<any> {
    // Convertir registro de desposte a formato de ficha de trazabilidad compatible con backend
    const fichaData = {
      proceso: 'Desposte',
      materialConsumido: registro.producto,
      cantidad: registro.pesoObtenido || registro.pesoTrasladado,
      tiempoProceso: 60, // tiempo estimado en minutos
      condiciones: {
        // Datos del registro principal
        lote: registro.lote,
        fechaProduccion: registro.fechaProduccion,
        fechaVencimiento: registro.fechaVencimiento,
        fechaSacrificio: registro.fechaSacrificio,
        canastillasRecibidas: registro.canastillasRecibidas,
        pesoTrasladado: registro.pesoTrasladado,
        temperaturaCarne: registro.temperaturaCarne,
        tipoCanal: registro.tipoCanal,
        
        // Datos del proceso
        pesoLanzado: registro.pesoLanzado,
        pesoObtenido: registro.pesoObtenido,
        rendimiento: registro.rendimiento,
        merma: registro.merma,
        
        // Datos de liberación
        numeroLote: registro.numeroLote,
        numeroGuia: registro.numeroGuia,
        
        // Observaciones
        observaciones: registro.observaciones,
        estado: registro.estado,
        
        // Metadatos del proceso
        seccionesCompletadas: [
          'Registro Principal',
          'Desencajado/Alistamiento MPC',
          'Picado y Molienda',
          'Empacado/Embutido',
          'Muestreo y Peso',
          'Parámetros y Métricas',
          'Almacenamiento',
          'Liberación del Producto',
          'Firmas y Sellos'
        ]
      }
    };
    
    const response = await apiClient.post(`${this.baseUrl}/${registro.ordenId}/fichas`, fichaData);
    return response.data;
  }

  async obtenerRegistrosDesposte(filtros?: FiltrosDesposte): Promise<RegistroDesposte[]> {
    const params = new URLSearchParams();
    
    if (filtros?.ordenId) params.append('ordenId', filtros.ordenId);
    if (filtros?.lote) params.append('lote', filtros.lote);
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros?.estado) params.append('estado', filtros.estado);

    const response = await apiClient.get(`${this.baseUrl}/registros?${params}`);
    return response.data.data;
  }

  async obtenerRegistrosDespostePorOrden(ordenId: string): Promise<RegistroDesposte[]> {
    const response = await apiClient.get(`${this.baseUrl}/ordenes/${ordenId}/registros`);
    return response.data.data;
  }

  async obtenerRegistroDespotePorId(id: string): Promise<RegistroDesposte> {
    const response = await apiClient.get(`${this.baseUrl}/registros/${id}`);
    return response.data.data;
  }

  async obtenerRegistroDesposteCompleto(id: string): Promise<RegistroDesposteCompleto> {
    const response = await apiClient.get(`${this.baseUrl}/registros/${id}/completo`);
    return response.data.data;
  }

  async actualizarEstadoRegistro(id: string, estado: 'En Proceso' | 'Completado' | 'Rechazado'): Promise<RegistroDesposte> {
    const response = await apiClient.put(`${this.baseUrl}/desposte/registros/${id}/estado`, { estado });
    return response.data.data;
  }

  // ==================== COMPONENTES DEL PROCESO ====================

  async crearDesencajadoMPC(registroDesposteId: string, data: DesencajadoMPCCreacion): Promise<DesencajadoMPC> {
    const response = await apiClient.post(`${this.baseUrl}/desposte/registros/${registroDesposteId}/desencajado`, data);
    return response.data.data;
  }

  async crearPicadoMolienda(registroDesposteId: string, data: PicadoMoliendaCreacion): Promise<PicadoMolienda> {
    const response = await apiClient.post(`${this.baseUrl}/desposte/registros/${registroDesposteId}/picado`, data);
    return response.data.data;
  }

  async crearEmpacadoEmbutido(registroDesposteId: string, data: EmpacadoEmbutidoCreacion): Promise<EmpacadoEmbutido> {
    const response = await apiClient.post(`${this.baseUrl}/desposte/registros/${registroDesposteId}/empacado`, data);
    return response.data.data;
  }

  async crearMuestreoPeso(registroDesposteId: string, data: MuestreoPesoCreacion): Promise<MuestreoPeso> {
    const response = await apiClient.post(`${this.baseUrl}/desposte/registros/${registroDesposteId}/muestreo`, data);
    return response.data.data;
  }

  async crearLiberacionProducto(registroDesposteId: string, data: LiberacionProductoCreacion): Promise<LiberacionProducto> {
    const response = await apiClient.post(`${this.baseUrl}/desposte/registros/${registroDesposteId}/liberacion`, data);
    return response.data.data;
  }

  async crearAlmacenamiento(registroDesposteId: string, data: AlmacenamientoCreacion): Promise<Almacenamiento> {
    const response = await apiClient.post(`${this.baseUrl}/desposte/registros/${registroDesposteId}/almacenamiento`, data);
    return response.data.data;
  }

  async crearParametrosMetricas(registroDesposteId: string, data: ParametrosMetricasCreacion): Promise<ParametrosMetricas> {
    const response = await apiClient.post(`${this.baseUrl}/desposte/registros/${registroDesposteId}/parametros`, data);
    return response.data.data;
  }

  async crearFirmasSellos(registroDesposteId: string, data: FirmasSellosCreacion): Promise<FirmasSellos> {
    const response = await apiClient.post(`${this.baseUrl}/desposte/registros/${registroDesposteId}/firmas`, data);
    return response.data.data;
  }

  // ==================== ESTADÍSTICAS Y REPORTES ====================

  async obtenerEstadisticasDesposte(fechaInicio?: string, fechaFin?: string): Promise<EstadisticasDesposte> {
    const params = new URLSearchParams();
    
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);

    const response = await apiClient.get(`${this.baseUrl}/estadisticas?${params}`);
    return response.data.data;
  }

  // ==================== INFORMACIÓN DEL SISTEMA ====================

  async obtenerValidacionesTemperatura(): Promise<ValidacionesTemperatura> {
    const response = await apiClient.get(`${this.baseUrl}/tipos-temperatura`);
    return response.data.data;
  }

  async obtenerEstadosValidos(): Promise<string[]> {
    const response = await apiClient.get(`${this.baseUrl}/estados`);
    return response.data.data;
  }

  async obtenerResultadosLiberacion(): Promise<string[]> {
    const response = await apiClient.get(`${this.baseUrl}/resultados-liberacion`);
    return response.data.data;
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Calcula el rendimiento del proceso de Desposte
   */
  calcularRendimiento(pesoLanzado: number, pesoObtenido: number): number {
    if (pesoLanzado === 0) return 0;
    return (pesoObtenido / pesoLanzado) * 100;
  }

  /**
   * Valida si una temperatura está dentro del rango permitido para un tipo de producto
   */
  validarTemperatura(temperatura: number, tipoProducto: 'bovino' | 'porcino' | 'avicola' | 'congelado', validaciones: ValidacionesTemperatura): boolean {
    const rango = validaciones[tipoProducto];
    return temperatura >= rango.min && temperatura <= rango.max;
  }

  /**
   * Formatea un registro de Desposte para mostrar en la UI
   */
  formatearRegistroParaUI(registro: RegistroDesposte) {
    return {
      ...registro,
      rendimiento: this.calcularRendimiento(registro.pesoLanzado, registro.pesoObtenido),
      fechaProduccionFormatted: new Date(registro.fechaProduccion).toLocaleDateString('es-CO'),
      fechaVencimientoFormatted: new Date(registro.fechaVencimiento).toLocaleDateString('es-CO'),
      fechaSacrificioFormatted: new Date(registro.fechaSacrificio).toLocaleDateString('es-CO'),
      pesoTrasladado: Number(registro.pesoTrasladado).toFixed(2),
      pesoLanzado: Number(registro.pesoLanzado).toFixed(2),
      pesoObtenido: Number(registro.pesoObtenido).toFixed(2)
    };
  }

  /**
   * Genera un reporte resumido del proceso de Desposte
   */
  generarReporteResumido(registroCompleto: RegistroDesposteCompleto) {
    const { registro, desencajado, picado, empacado, liberacion, almacenamiento } = registroCompleto;
    
    return {
      lote: registro.lote,
      producto: registro.producto,
      rendimiento: this.calcularRendimiento(registro.pesoLanzado, registro.pesoObtenido),
      estado: registro.estado,
      totalDesencajado: desencajado.length,
      totalPicado: picado.length,
      totalEmpacado: empacado.length,
      resultadoLiberacion: liberacion.length > 0 ? liberacion[0].resultado : 'Pendiente',
      almacenamientoCompleto: almacenamiento.length > 0,
      fechaProduccion: registro.fechaProduccion,
      observaciones: registro.observaciones
    };
  }

  /**
   * Valida si un registro está completo (tiene todos los componentes requeridos)
   */
  validarRegistroCompleto(registroCompleto: RegistroDesposteCompleto): { 
    completo: boolean; 
    faltantes: string[] 
  } {
    const faltantes: string[] = [];
    
    if (registroCompleto.desencajado.length === 0) {
      faltantes.push('Desencajado/Alistamiento de M.P.C.');
    }
    
    if (registroCompleto.picado.length === 0) {
      faltantes.push('Picado/Tajado y Molienda');
    }
    
    if (registroCompleto.empacado.length === 0) {
      faltantes.push('Empacado/Embutido');
    }
    
    if (registroCompleto.liberacion.length === 0) {
      faltantes.push('Liberación de Producto Terminado');
    }
    
    if (registroCompleto.almacenamiento.length === 0) {
      faltantes.push('Almacenamiento/Encajado');
    }
    
    if (registroCompleto.firmas.length === 0) {
      faltantes.push('Firmas y Sellos');
    }

    return {
      completo: faltantes.length === 0,
      faltantes
    };
  }

  /**
   * Obtiene el color del estado para la UI
   */
  obtenerColorEstado(estado: 'En Proceso' | 'Completado' | 'Rechazado'): string {
    switch (estado) {
      case 'En Proceso':
        return 'orange';
      case 'Completado':
        return 'green';
      case 'Rechazado':
        return 'red';
      default:
        return 'gray';
    }
  }

  /**
   * Genera una etiqueta de identificación única para el lote
   */
  generarEtiquetaLote(registro: RegistroDesposte): string {
    const fecha = new Date(registro.fechaProduccion);
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    
    return `${registro.lote}-${año}${mes}${dia}`;
  }
}

export default new DesposteService();