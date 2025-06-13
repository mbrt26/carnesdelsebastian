import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Assignment as OrderIcon,
  Science as QualityIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ordenesService from '../services/ordenesService';
import calidadService from '../services/calidadService';
import inventariosService from '../services/inventariosService';
import SystemStatus from '../components/common/SystemStatus';
import { Orden, ProgramaQC, Bodega } from '../types';

interface DashboardStats {
  ordenes: {
    total: number;
    creadas: number;
    enProceso: number;
    finalizadas: number;
  };
  programasQC: number;
  bodegas: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    ordenes: { total: 0, creadas: 0, enProceso: 0, finalizadas: 0 },
    programasQC: 0,
    bodegas: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Orden[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Cargar órdenes
        const ordenes = await ordenesService.obtenerOrdenes();
        const ordenesStats = {
          total: ordenes.length,
          creadas: ordenes.filter(o => o.estado === 'Creada').length,
          enProceso: ordenes.filter(o => o.estado === 'EnProceso').length,
          finalizadas: ordenes.filter(o => o.estado === 'Finalizada').length,
        };

        // Cargar programas de QC
        const programas = await calidadService.obtenerProgramas();
        
        // Cargar bodegas
        const bodegas = await inventariosService.obtenerBodegas();

        setStats({
          ordenes: ordenesStats,
          programasQC: programas.length,
          bodegas: bodegas.length,
        });

        // Últimas 5 órdenes
        setRecentOrders(ordenes.slice(0, 5));
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: 'primary' | 'secondary' | 'success' | 'warning';
  }> = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`} sx={{ display: 'flex' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Creada': return 'primary';
      case 'EnProceso': return 'warning';
      case 'Finalizada': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Resumen del sistema de producción
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
        {/* Estadísticas principales */}
        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, minWidth: 0, flexShrink: 0 }}>
          <StatCard
            title="Total Órdenes"
            value={stats.ordenes.total}
            icon={<OrderIcon sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, minWidth: 0, flexShrink: 0 }}>
          <StatCard
            title="En Proceso"
            value={stats.ordenes.enProceso}
            icon={<TrendIcon sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, minWidth: 0, flexShrink: 0 }}>
          <StatCard
            title="Programas QC"
            value={stats.programasQC}
            icon={<QualityIcon sx={{ fontSize: 40 }} />}
            color="secondary"
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, minWidth: 0, flexShrink: 0 }}>
          <StatCard
            title="Bodegas"
            value={stats.bodegas}
            icon={<InventoryIcon sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Box>

        {/* Gráfico de estados de órdenes */}
        <Box sx={{ width: { xs: '100%', md: '50%' }, minWidth: 0, flexShrink: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado de Órdenes
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Creadas</Typography>
                  <Typography variant="body2">{stats.ordenes.creadas}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(stats.ordenes.creadas / stats.ordenes.total) * 100}
                  color="primary"
                  sx={{ mb: 2 }}
                />
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">En Proceso</Typography>
                  <Typography variant="body2">{stats.ordenes.enProceso}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(stats.ordenes.enProceso / stats.ordenes.total) * 100}
                  color="warning"
                  sx={{ mb: 2 }}
                />
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Finalizadas</Typography>
                  <Typography variant="body2">{stats.ordenes.finalizadas}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(stats.ordenes.finalizadas / stats.ordenes.total) * 100}
                  color="success"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Órdenes recientes */}
        <Box sx={{ width: { xs: '100%', md: '50%' }, minWidth: 0, flexShrink: 0 }}>
          <Card>
            <CardHeader title="Órdenes Recientes" />
            <CardContent>
              <List>
                {recentOrders.map((orden) => (
                  <ListItem key={orden.id}>
                    <ListItemText
                      primary={`${orden.cliente} - ${orden.linea}`}
                      secondary={format(orden.fechaPlanificada, 'dd/MM/yyyy', { locale: es })}
                    />
                    <Chip
                      label={orden.estado}
                      color={getEstadoColor(orden.estado) as any}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Estado del sistema */}
        <Box sx={{ width: { xs: '100%', md: '50%' }, minWidth: 0, flexShrink: 0 }}>
          <SystemStatus />
        </Box>

        {/* Accesos rápidos */}
        <Box sx={{ width: { xs: '100%', md: '50%' }, minWidth: 0, flexShrink: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accesos Rápidos
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: '100%' }}>
                  <Paper
                    sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'grey.100' } }}
                    onClick={() => window.location.href = '/ordenes/nueva'}
                  >
                    <OrderIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="subtitle1">
                      Nueva Orden
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Crear orden de producción
                    </Typography>
                  </Paper>
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, minWidth: 0, flexShrink: 0 }}>
                  <Paper
                    sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'grey.100' } }}
                    onClick={() => window.location.href = '/calidad'}
                  >
                    <QualityIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="subtitle1">
                      Control de Calidad
                    </Typography>
                  </Paper>
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '50%' }, minWidth: 0, flexShrink: 0 }}>
                  <Paper
                    sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'grey.100' } }}
                    onClick={() => window.location.href = '/inventarios'}
                  >
                    <InventoryIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="subtitle1">
                      Gestión Inventario
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;