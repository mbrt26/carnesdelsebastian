import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ordenesService from '../../services/ordenesService';
import { Orden } from '../../types';

interface ReportesConsolidadosProps {
  ordenId?: string;
}

const ReportesConsolidados: React.FC<ReportesConsolidadosProps> = ({ ordenId }) => {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (ordenId) {
        // Cargar datos específicos de una orden
        const orden = await ordenesService.obtenerOrdenPorId(ordenId);
        setOrdenes([orden]);
      } else {
        // Cargar todas las órdenes
        const todasOrdenes = await ordenesService.obtenerOrdenes();
        setOrdenes(todasOrdenes);
      }
    } catch (err: any) {
      setError(err.error || 'Error al cargar datos para el reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [ordenId]);

  const exportarReporte = () => {
    // Generar CSV básico
    const headers = ['ID', 'Cliente', 'Línea', 'Fecha Planificada', 'Estado', 'Fichas Trazabilidad'];
    const csvData = ordenes.map(orden => [
      orden.id,
      orden.cliente,
      orden.linea,
      format(orden.fechaPlanificada, 'dd/MM/yyyy', { locale: es }),
      orden.estado,
      orden.fichaTrazabilidad ? orden.fichaTrazabilidad.length : 0
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_ordenes_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Cargando reportes...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          {ordenId ? `Reporte de Orden ${ordenId}` : 'Reportes Consolidados'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={cargarDatos}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportarReporte}
            disabled={ordenes.length === 0}
          >
            Exportar CSV
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Resumen estadístico */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total de Órdenes
            </Typography>
            <Typography variant="h4" component="h2">
              {ordenes.length}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Con Trazabilidad
            </Typography>
            <Typography variant="h4" component="h2" color="primary.main">
              {ordenes.filter(o => o.fichaTrazabilidad && o.fichaTrazabilidad.length > 0).length}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              En Proceso
            </Typography>
            <Typography variant="h4" component="h2" color="warning.main">
              {ordenes.filter(o => o.estado === 'EnProceso').length}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200, flex: 1 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Finalizadas
            </Typography>
            <Typography variant="h4" component="h2" color="success.main">
              {ordenes.filter(o => o.estado === 'Finalizada').length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabla detallada */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detalle de Órdenes
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Línea de Producción</TableCell>
                  <TableCell>Fecha Planificada</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Fichas Trazabilidad</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordenes.map((orden) => (
                  <TableRow key={orden.id}>
                    <TableCell>{orden.id}</TableCell>
                    <TableCell>{orden.cliente}</TableCell>
                    <TableCell>{orden.linea}</TableCell>
                    <TableCell>
                      {format(orden.fechaPlanificada, 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={
                          orden.estado === 'Finalizada' ? 'success.main' : 
                          orden.estado === 'EnProceso' ? 'warning.main' : 
                          'primary.main'
                        }
                      >
                        {orden.estado}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {orden.fichaTrazabilidad ? orden.fichaTrazabilidad.length : 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {ordenes.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="textSecondary">
                No hay órdenes para mostrar
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportesConsolidados;