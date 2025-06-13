import apiClient from './apiClient';
import { ProgramaQC, RegistroQC, RegistroQCCreacion } from '../types';

class CalidadService {
  // Obtener programas de control de calidad
  async obtenerProgramas(): Promise<ProgramaQC[]> {
    const response = await apiClient.get<ProgramaQC[]>('/api/qc/programas');
    return response.data;
  }

  // Obtener detalles de un programa específico
  async obtenerProgramaPorId(id: string): Promise<ProgramaQC> {
    const response = await apiClient.get<ProgramaQC>(`/api/qc/programas/${id}`);
    return response.data;
  }

  // Crear registro de control de calidad
  async crearRegistroQC(programaId: string, registro: Omit<RegistroQCCreacion, 'programaId'>): Promise<RegistroQC> {
    const response = await apiClient.post<RegistroQC>(`/api/qc/programas/${programaId}/registros`, {
      ...registro,
      programaId
    });
    return response.data;
  }

  // Obtener registros de un programa
  async obtenerRegistrosQC(programaId: string, filtros?: {
    fechaInicio?: string;
    fechaFin?: string;
    ordenId?: string;
    limit?: number;
  }): Promise<RegistroQC[]> {
    const params = new URLSearchParams();
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros?.ordenId) params.append('ordenId', filtros.ordenId);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());

    const response = await apiClient.get<RegistroQC[]>(`/api/qc/programas/${programaId}/registros?${params.toString()}`);
    return response.data;
  }

  // Obtener estadísticas de QC
  async obtenerEstadisticas(programaId: string, fechaInicio: string, fechaFin: string): Promise<any> {
    const params = new URLSearchParams({
      fechaInicio,
      fechaFin
    });
    const response = await apiClient.get(`/api/qc/programas/${programaId}/estadisticas?${params.toString()}`);
    return response.data;
  }

  // Validar parámetros de QC
  async validarParametros(programaId: string, valores: Record<string, any>): Promise<any> {
    const response = await apiClient.post(`/api/qc/programas/${programaId}/validar`, { valores });
    return response.data;
  }
}

export default new CalidadService();