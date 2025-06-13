import apiClient from './apiClient';
import { Orden, OrdenCreacion, FichaTrazabilidad, FichaCreacion } from '../types';

class OrdenesService {
  // Crear nueva orden de producción
  async crearOrden(orden: OrdenCreacion): Promise<Orden> {
    const response = await apiClient.post<Orden>('/api/ordenes', orden);
    return response.data;
  }

  // Obtener lista de órdenes con filtros opcionales
  async obtenerOrdenes(filtros?: {
    linea?: string;
    fecha?: string;
    estado?: string;
  }): Promise<Orden[]> {
    const params = new URLSearchParams();
    if (filtros?.linea) params.append('linea', filtros.linea);
    if (filtros?.fecha) params.append('fecha', filtros.fecha);
    if (filtros?.estado) params.append('estado', filtros.estado);

    const response = await apiClient.get<Orden[]>(`/api/ordenes?${params.toString()}`);
    return response.data;
  }

  // Obtener detalles de una orden específica
  async obtenerOrdenPorId(id: string): Promise<Orden> {
    const response = await apiClient.get<Orden>(`/api/ordenes/${id}`);
    return response.data;
  }

  // Actualizar estado de una orden
  async actualizarEstadoOrden(id: string, estado: string): Promise<Orden> {
    const response = await apiClient.patch<Orden>(`/api/ordenes/${id}`, { estado });
    return response.data;
  }

  // Crear ficha de trazabilidad
  async crearFichaTrazabilidad(ordenId: string, ficha: FichaCreacion): Promise<FichaTrazabilidad> {
    const response = await apiClient.post<FichaTrazabilidad>(`/api/ordenes/${ordenId}/fichas`, ficha);
    return response.data;
  }

  // Obtener fichas de trazabilidad de una orden
  async obtenerFichasTrazabilidad(ordenId: string): Promise<FichaTrazabilidad[]> {
    const response = await apiClient.get<FichaTrazabilidad[]>(`/api/ordenes/${ordenId}/fichas`);
    return response.data;
  }

  // ==================== INTEGRACIÓN CON DESPOSTE ====================

  // Actualizar estado de la orden basado en registros de Desposte
  async actualizarEstadoOrdenPorDesposte(ordenId: string): Promise<any> {
    const response = await apiClient.post(`/api/ordenes/${ordenId}/actualizar-estado-desposte`);
    return response.data;
  }

  // Obtener progreso detallado de una orden
  async obtenerProgresoOrden(ordenId: string): Promise<any> {
    const response = await apiClient.get(`/api/ordenes/${ordenId}/progreso`);
    return response.data.data ?? response.data;
  }

  // Obtener dashboard de progreso de todas las órdenes
  async obtenerDashboardProgreso(filtros?: { linea?: string; fechaInicio?: string; fechaFin?: string }): Promise<any> {
    const params = new URLSearchParams();
    if (filtros?.linea) params.append('linea', filtros.linea);
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
    const response = await apiClient.get(`/api/ordenes/dashboard/progreso?${params.toString()}`);
    return response.data.data ?? response.data;
  }
}

export default new OrdenesService();