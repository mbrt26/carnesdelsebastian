import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  Update as UpdateIcon,
  Close as CloseIcon 
} from '@mui/icons-material';
import ordenesService from '../../services/ordenesService';
import desposteService from '../../services/desposteService';

interface ProgresoDetallado {
  id: string;
  cliente: string;
  linea: string;
  turno?: string;
  fechaPlanificada: string;
  cantidadPlanificada: number;
  estado: string;
  progreso: {
    totalRegistros: number;
    registrosCompletados: number;
    registrosEnProceso: number;
    registrosRechazados: number;
    pesoTotalObtenido: number;
    pesoTotalLanzado: number;
    pesoTotalTrasladado: number;
    mermaTotal: number;
    porcentajeCompletado: number;
    porcentajeRendimiento: number;
    porcentajeRegistrosCompletados: number;
    porcentajeMerma: number;
    eficienciaTraslado: number;
    estadoCalculado: string;
    fechaInicioProduccion?: string;
    fechaUltimaActualizacion?: string;
    calidadGeneral: {
      puntuacion: number;
      categoria: string;
    };
    resumen: {
      estado: string;
      avanceGeneral: number;
      rendimiento: number;
      calidad: string;
    };
  };
}

interface DetalleProgresoOrdenProps {
  ordenId: string;
  onClose?: () => void;
}

const DetalleProgresoOrden: React.FC<DetalleProgresoOrdenProps> = ({ ordenId, onClose }) => {
  const [progreso, setProgreso] = useState<ProgresoDetallado | null>(null);
  const [registrosDesposte, setRegistrosDesposte] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [progresoData, registrosData] = await Promise.all([
        ordenesService.obtenerProgresoOrden(ordenId),
        desposteService.obtenerRegistrosDespostePorOrden(ordenId)
      ]);
      
      setProgreso(progresoData);
      setRegistrosDesposte(registrosData);
      setError(null);
    } catch (err) {
      setError('Error cargando datos del progreso');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstadoOrden = async () => {
    try {
      setActualizandoEstado(true);
      await ordenesService.actualizarEstadoOrdenPorDesposte(ordenId);
      await cargarDatos(); // Recargar datos
    } catch (err) {
      console.error('Error actualizando estado:', err);
    } finally {
      setActualizandoEstado(false);
    }
  };

  useEffect(() => {
    if (ordenId) {
      cargarDatos();
    }
  }, [ordenId]);

  const getCalidadColor = (categoria: string) => {
    switch (categoria) {
      case 'Excelente':
        return 'text-green-600 bg-green-100';
      case 'Buena':
        return 'text-blue-600 bg-blue-100';
      case 'Regular':
        return 'text-yellow-600 bg-yellow-100';
      case 'Deficiente':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Finalizada':
        return 'text-green-600 bg-green-100';
      case 'EnProceso':
        return 'text-yellow-600 bg-yellow-100';
      case 'Creada':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !progreso) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error || 'No se pudo cargar el progreso'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{progreso.cliente}</h2>
            <p className="text-gray-600">{progreso.linea} - {progreso.turno}</p>
            <p className="text-sm text-gray-500">
              Planificada: {new Date(progreso.fechaPlanificada).toLocaleDateString()} | 
              {progreso.cantidadPlanificada} kg
            </p>
          </div>
          <div className="flex space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(progreso.estado)}`}>
              {progreso.estado}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCalidadColor(progreso.progreso.calidadGeneral.categoria)}`}>
              {progreso.progreso.calidadGeneral.categoria}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-semibold text-gray-700">Avance General</h4>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progreso</span>
              <span>{progreso.progreso.porcentajeCompletado.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 bg-blue-500 rounded-full"
                style={{ width: `${Math.min(progreso.progreso.porcentajeCompletado, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-semibold text-gray-700">Peso Obtenido</h4>
          <p className="text-2xl font-bold text-gray-900">
            {progreso.progreso.pesoTotalObtenido.toFixed(0)} kg
          </p>
          <p className="text-sm text-gray-500">
            de {progreso.cantidadPlanificada} kg planificados
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-semibold text-gray-700">Rendimiento</h4>
          <p className="text-2xl font-bold text-gray-900">
            {progreso.progreso.porcentajeRendimiento.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500">
            Merma: {progreso.progreso.porcentajeMerma.toFixed(1)}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-semibold text-gray-700">Registros</h4>
          <p className="text-2xl font-bold text-gray-900">
            {progreso.progreso.registrosCompletados}/{progreso.progreso.totalRegistros}
          </p>
          <p className="text-sm text-gray-500">
            {progreso.progreso.porcentajeRegistrosCompletados.toFixed(1)}% completados
          </p>
        </div>
      </div>

      {/* Métricas Detalladas */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Métricas Detalladas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Pesos (kg)</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Trasladado:</span>
                <span>{progreso.progreso.pesoTotalTrasladado.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Lanzado:</span>
                <span>{progreso.progreso.pesoTotalLanzado.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Obtenido:</span>
                <span>{progreso.progreso.pesoTotalObtenido.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Merma:</span>
                <span>{progreso.progreso.mermaTotal.toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Eficiencias (%)</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Traslado:</span>
                <span>{progreso.progreso.eficienciaTraslado.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Rendimiento:</span>
                <span>{progreso.progreso.porcentajeRendimiento.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Merma:</span>
                <span>{progreso.progreso.porcentajeMerma.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Estado de Registros</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Completados:</span>
                <span className="text-green-600">{progreso.progreso.registrosCompletados}</span>
              </div>
              <div className="flex justify-between">
                <span>En Proceso:</span>
                <span className="text-yellow-600">{progreso.progreso.registrosEnProceso}</span>
              </div>
              <div className="flex justify-between">
                <span>Rechazados:</span>
                <span className="text-red-600">{progreso.progreso.registrosRechazados}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calidad General */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Evaluación de Calidad</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Puntuación de Calidad</span>
              <span>{progreso.progreso.calidadGeneral.puntuacion}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  progreso.progreso.calidadGeneral.puntuacion >= 90 ? 'bg-green-500' :
                  progreso.progreso.calidadGeneral.puntuacion >= 75 ? 'bg-blue-500' :
                  progreso.progreso.calidadGeneral.puntuacion >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${progreso.progreso.calidadGeneral.puntuacion}%` }}
              ></div>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCalidadColor(progreso.progreso.calidadGeneral.categoria)}`}>
            {progreso.progreso.calidadGeneral.categoria}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones</h3>
        <div className="flex space-x-3">
          <button
            onClick={actualizarEstadoOrden}
            disabled={actualizandoEstado}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {actualizandoEstado ? 'Actualizando...' : 'Actualizar Estado Automático'}
          </button>
          <button
            onClick={cargarDatos}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Recargar Datos
          </button>
        </div>
      </div>

      {/* Registros de Desposte Asociados */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Registros de Desposte ({registrosDesposte.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Peso Obtenido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rendimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registrosDesposte.map((registro) => (
                <tr key={registro.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {registro.lote}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {registro.producto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {registro.pesoObtenido.toFixed(0)} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {((registro.pesoObtenido / registro.pesoLanzado) * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(registro.estado)}`}>
                      {registro.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(registro.fechaProduccion).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DetalleProgresoOrden;