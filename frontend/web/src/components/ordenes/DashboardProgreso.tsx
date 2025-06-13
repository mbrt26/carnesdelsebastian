import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import ordenesService from '../../services/ordenesService';

interface ProgresoStats {
  totalOrdenes: number;
  ordenesEnProceso: number;
  ordenesFinalizadas: number;
  registrosDesposte: number;
  productividad: number;
}

const DashboardProgreso: React.FC = () => {
  const [stats, setStats] = useState<ProgresoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarEstadisticas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulamos datos de progreso basados en las órdenes existentes
      const ordenes = await ordenesService.obtenerOrdenes();
      
      const estadisticas: ProgresoStats = {
        totalOrdenes: ordenes.length,
        ordenesEnProceso: ordenes.filter(o => o.estado === 'EnProceso').length,
        ordenesFinalizadas: ordenes.filter(o => o.estado === 'Finalizada').length,
        registrosDesposte: ordenes.filter(o => o.fichaTrazabilidad && o.fichaTrazabilidad.length > 0).length,
        productividad: ordenes.length > 0 ? Math.round((ordenes.filter(o => o.estado === 'Finalizada').length / ordenes.length) * 100) : 0
      };
      
      setStats(estadisticas);
    } catch (err: any) {
      setError(err.error || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando dashboard de progreso...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Dashboard de Progreso
        </Typography>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={cargarEstadisticas}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {stats && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Estadísticas principales */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Card sx={{ minWidth: 200, flex: 1 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total de Órdenes
                </Typography>
                <Typography variant="h4" component="h2">
                  {stats.totalOrdenes}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ minWidth: 200, flex: 1 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  En Proceso
                </Typography>
                <Typography variant="h4" component="h2" color="warning.main">
                  {stats.ordenesEnProceso}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ minWidth: 200, flex: 1 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Finalizadas
                </Typography>
                <Typography variant="h4" component="h2" color="success.main">
                  {stats.ordenesFinalizadas}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ minWidth: 200, flex: 1 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Con Trazabilidad
                </Typography>
                <Typography variant="h4" component="h2" color="primary.main">
                  {stats.registrosDesposte}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Métricas de productividad */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Productividad General
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h3" color="primary.main">
                  {stats.productividad}%
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  de órdenes completadas
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Resumen de actividades */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumen de Actividades
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Órdenes Creadas:</Typography>
                  <Typography color="primary.main">{stats.totalOrdenes}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Órdenes en Proceso:</Typography>
                  <Typography color="warning.main">{stats.ordenesEnProceso}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Órdenes Finalizadas:</Typography>
                  <Typography color="success.main">{stats.ordenesFinalizadas}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>Fichas de Trazabilidad:</Typography>
                  <Typography color="primary.main">{stats.registrosDesposte}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default DashboardProgreso;