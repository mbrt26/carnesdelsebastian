import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Error as UnhealthyIcon,
  Warning as DegradedIcon,
  Refresh as RefreshIcon,
  HelpOutline as UnknownIcon,
} from '@mui/icons-material';
import healthService from '../../services/healthService';

interface SystemHealth {
  gateway: HealthStatus;
  ordenes: HealthStatus;
  calidad: HealthStatus;
  inventarios: HealthStatus;
  database: HealthStatus;
  overall: 'healthy' | 'degraded' | 'unhealthy';
}

interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  message?: string;
  timestamp: string;
}

const SystemStatus: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      const healthData = await healthService.checkSystemHealth();
      setHealth(healthData);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Error checking system health:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSystemHealth();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <HealthyIcon color="success" />;
      case 'unhealthy':
        return <UnhealthyIcon color="error" />;
      case 'degraded':
        return <DegradedIcon color="warning" />;
      default:
        return <UnknownIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'unhealthy':
        return 'error';
      case 'degraded':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading && !health) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" p={4}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Verificando estado del sistema...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Estado del Sistema</Typography>
          <Box>
            {health && (
              <Chip
                label={health.overall}
                color={getStatusColor(health.overall) as any}
                icon={getStatusIcon(health.overall)}
                sx={{ mr: 1 }}
              />
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={checkSystemHealth}
              disabled={loading}
            >
              Actualizar
            </Button>
          </Box>
        </Box>

        {lastCheck && (
          <Typography variant="caption" color="textSecondary" gutterBottom>
            Última verificación: {lastCheck.toLocaleTimeString()}
          </Typography>
        )}

        {health && (
          <>
            {health.overall === 'unhealthy' && (
              <Alert severity="error" sx={{ mb: 2 }}>
                El sistema no está disponible. Verifique que el backend esté ejecutándose.
              </Alert>
            )}

            {health.overall === 'degraded' && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                El sistema está funcionando con capacidad limitada.
              </Alert>
            )}

            <List dense>
              {Object.entries(health)
                .filter(([key]) => key !== 'overall')
                .map(([serviceName, serviceHealth]) => {
                  const status = serviceHealth as HealthStatus;
                  return (
                    <ListItem key={serviceName}>
                      <ListItemIcon>
                        {getStatusIcon(status.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={status.service}
                        secondary={status.message || `Estado: ${status.status}`}
                      />
                      <Chip
                        label={status.status}
                        size="small"
                        color={getStatusColor(status.status) as any}
                      />
                    </ListItem>
                  );
                })}
            </List>
          </>
        )}

        {!health && !loading && (
          <Alert severity="error">
            No se pudo verificar el estado del sistema.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemStatus;