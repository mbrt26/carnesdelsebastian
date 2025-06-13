import apiClient from './apiClient';
import { Bodega, StockItem, MovimientoInventario, MovimientoCreacion, ItemInventario } from '../types';

class InventariosService {
  // Obtener lista de bodegas
  async obtenerBodegas(): Promise<Bodega[]> {
    const response = await apiClient.get<Bodega[]>('/api/inventarios/bodegas');
    return response.data;
  }

  // Crear bodega
  async crearBodega(bodega: Partial<Bodega>): Promise<Bodega> {
    const response = await apiClient.post<Bodega>('/api/inventarios/bodegas', bodega);
    return response.data;
  }

  // Actualizar bodega
  async actualizarBodega(id: string, bodega: Partial<Bodega>): Promise<Bodega> {
    const response = await apiClient.put<Bodega>(`/api/inventarios/bodegas/${id}`, bodega);
    return response.data;
  }

  // Obtener detalles de una bodega específica
  async obtenerBodegaPorId(id: string): Promise<Bodega> {
    const response = await apiClient.get<Bodega>(`/api/inventarios/bodegas/${id}`);
    return response.data;
  }

  // Obtener inventario general
  async obtenerInventario(): Promise<ItemInventario[]> {
    const response = await apiClient.get<ItemInventario[]>('/api/inventarios/articulos');
    return response.data;
  }

  // Crear artículo de inventario
  async crearItem(item: Partial<ItemInventario>): Promise<ItemInventario> {
    const response = await apiClient.post<ItemInventario>('/api/inventarios/articulos', item);
    return response.data;
  }

  // Actualizar artículo de inventario
  async actualizarItem(id: string, item: Partial<ItemInventario>): Promise<ItemInventario> {
    const response = await apiClient.put<ItemInventario>(`/api/inventarios/articulos/${id}`, item);
    return response.data;
  }

  // Obtener stock de una bodega
  async obtenerStock(bodegaId: string): Promise<StockItem[]> {
    const response = await apiClient.get<StockItem[]>(`/api/inventarios/bodegas/${bodegaId}/stock`);
    return response.data;
  }

  // Crear movimiento de inventario
  async crearMovimiento(itemId: string, movimiento: MovimientoCreacion): Promise<MovimientoInventario> {
    const response = await apiClient.post<MovimientoInventario>(`/api/inventarios/articulos/${itemId}/movimientos`, movimiento);
    return response.data;
  }

  // Registrar movimiento de inventario (método legacy)
  async registrarMovimiento(bodegaId: string, movimiento: MovimientoCreacion): Promise<MovimientoInventario> {
    const response = await apiClient.post<MovimientoInventario>(`/api/inventarios/bodegas/${bodegaId}/movimientos`, movimiento);
    return response.data;
  }

  // Obtener movimientos
  async obtenerMovimientos(filtros?: {
    fechaInicio?: string;
    fechaFin?: string;
    tipo?: string;
    articulo?: string;
    limit?: number;
  }): Promise<MovimientoInventario[]> {
    const params = new URLSearchParams();
    if (filtros?.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros?.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.articulo) params.append('articulo', filtros.articulo);
    if (filtros?.limit) params.append('limit', filtros.limit.toString());

    const response = await apiClient.get<MovimientoInventario[]>(`/api/inventarios/movimientos?${params.toString()}`);
    return response.data;
  }

  // Obtener reporte de inventario
  async obtenerReporte(bodegaId: string): Promise<any> {
    const response = await apiClient.get(`/api/inventarios/bodegas/${bodegaId}/reporte`);
    return response.data;
  }
}

export default new InventariosService();