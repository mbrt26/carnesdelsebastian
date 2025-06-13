import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  Assessment as ReportsIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ordenesService from '../services/ordenesService';
import { Orden, OrdenCreacion, FichaTrazabilidad, FichaCreacion } from '../types';
import DashboardProgreso from '../components/ordenes/DashboardProgreso';
import DetalleProgresoOrden from '../components/ordenes/DetalleProgresoOrden';
import CrearDesposteParaOrden from '../components/ordenes/CrearDesposteParaOrden';
import DesposteWizardMejorado from '../components/ordenes/DesposteWizardMejorado';
import ReportesConsolidados from '../components/ordenes/ReportesConsolidados';

const OrdenesPage: React.FC = () => {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [filtros, setFiltros] = useState({
    linea: '',
    estado: '',
    fecha: '',
  });
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Creada': return 'primary';
      case 'EnProceso': return 'warning';
      case 'Finalizada': return 'success';
      default: return 'default';
    }
  };

  // Formulario para nueva orden
  const [nuevaOrden, setNuevaOrden] = useState<OrdenCreacion>({
    cliente: '',
    linea: 'Desposte',
    turno: 'Mañana',
    fechaPlanificada: new Date().toISOString().split('T')[0],
    cantidadPlanificada: 0,
  });

  useEffect(() => {
    cargarOrdenes();
  }, [filtros]);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const data = await ordenesService.obtenerOrdenes(filtros);
      setOrdenes(data);
    } catch (error: any) {
      setError(error.error || 'Error cargando órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearOrden = async () => {
    try {
      await ordenesService.crearOrden(nuevaOrden);
      setOpenDialog(false);
      setNuevaOrden({
        cliente: '',
        linea: 'Desposte',
        turno: 'Mañana',
        fechaPlanificada: new Date().toISOString().split('T')[0],
        cantidadPlanificada: 0,
      });
      cargarOrdenes();
    } catch (error: any) {
      setError(error.error || 'Error creando orden');
    }
  };

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      await ordenesService.actualizarEstadoOrden(id, nuevoEstado);
      cargarOrdenes();
    } catch (error: any) {
      setError(error.error || 'Error actualizando estado');
    }
  };

  const verDetalles = (orden: Orden) => {
    navigate(`/ordenes/${orden.id}`);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" gutterBottom>
                Órdenes de Producción
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Nueva Orden
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Tabs para navegación */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={tabValue} 
                onChange={(e, newValue) => setTabValue(newValue)}
                aria-label="tabs de órdenes"
              >
                <Tab 
                  icon={<SearchIcon />} 
                  label="Gestión de Órdenes" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<DashboardIcon />} 
                  label="Dashboard de Progreso" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<ReportsIcon />} 
                  label="Reportes Consolidados" 
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            {/* Contenido según el tab seleccionado */}
            {tabValue === 0 && (
              <>
                {/* Filtros */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
                      <Box sx={{ minWidth: { xs: '100%', sm: '200px' }, flex: 1 }}>
                        <TextField
                          select
                          fullWidth
                          label="Línea"
                          value={filtros.linea}
                          onChange={(e) => setFiltros({ ...filtros, linea: e.target.value })}
                        >
                          <MenuItem value="">Todas</MenuItem>
                          <MenuItem value="Desposte">Desposte</MenuItem>
                          <MenuItem value="Derivados">Derivados</MenuItem>
                        </TextField>
                      </Box>
                      <Box sx={{ minWidth: { xs: '100%', sm: '200px' }, flex: 1 }}>
                        <TextField
                          select
                          fullWidth
                          label="Estado"
                          value={filtros.estado}
                          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                        >
                          <MenuItem value="">Todos</MenuItem>
                          <MenuItem value="Creada">Creada</MenuItem>
                          <MenuItem value="EnProceso">En Proceso</MenuItem>
                          <MenuItem value="Finalizada">Finalizada</MenuItem>
                        </TextField>
                      </Box>
                      <Box sx={{ minWidth: { xs: '100%', sm: '200px' }, flex: 1 }}>
                        <TextField
                          type="date"
                          fullWidth
                          label="Fecha"
                          value={filtros.fecha}
                          onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>
                      <Box sx={{ minWidth: { xs: '100%', sm: '200px' }, flex: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<SearchIcon />}
                          onClick={cargarOrdenes}
                          fullWidth
                        >
                          Buscar
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Tabla de órdenes */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Línea</TableCell>
                        <TableCell>Turno</TableCell>
                        <TableCell>Fecha Planificada</TableCell>
                        <TableCell>Cantidad</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            Cargando...
                          </TableCell>
                        </TableRow>
                      ) : ordenes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            No hay órdenes registradas
                          </TableCell>
                        </TableRow>
                      ) : (
                        ordenes.map((orden) => (
                          <TableRow key={orden.id} hover>
                            <TableCell>{orden.cliente}</TableCell>
                            <TableCell>{orden.linea}</TableCell>
                            <TableCell>{orden.turno}</TableCell>
                            <TableCell>
                              {format(new Date(orden.fechaPlanificada), 'dd/MM/yyyy', { locale: es })}
                            </TableCell>
                            <TableCell>{orden.cantidadPlanificada}</TableCell>
                            <TableCell>
                              <Chip
                                label={orden.estado}
                                color={getEstadoColor(orden.estado) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => verDetalles(orden)}
                                title="Ver detalles"
                              >
                                <ViewIcon />
                              </IconButton>
                              {orden.estado !== 'Finalizada' && (
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const siguienteEstado = orden.estado === 'Creada' ? 'EnProceso' : 'Finalizada';
                                    handleCambiarEstado(orden.id, siguienteEstado);
                                  }}
                                  title="Cambiar estado"
                                >
                                  <EditIcon />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {/* Dashboard de Progreso */}
            {tabValue === 1 && <DashboardProgreso />}

            {/* Reportes Consolidados */}
            {tabValue === 2 && <ReportesConsolidados />}

            {/* Dialog para crear nueva orden */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Nueva Orden de Producción</DialogTitle>
              <DialogContent>
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Cliente"
                      value={nuevaOrden.cliente}
                      onChange={(e) => setNuevaOrden({ ...nuevaOrden, cliente: e.target.value })}
                      required
                    />
                  </Box>
                  <Box display="flex" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
                    <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                      <TextField
                        select
                        fullWidth
                        label="Línea"
                        value={nuevaOrden.linea}
                        onChange={(e) => setNuevaOrden({ ...nuevaOrden, linea: e.target.value as any })}
                      >
                        <MenuItem value="Desposte">Desposte</MenuItem>
                        <MenuItem value="Derivados">Derivados</MenuItem>
                      </TextField>
                    </Box>
                    <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                      <TextField
                        select
                        fullWidth
                        label="Turno"
                        value={nuevaOrden.turno}
                        onChange={(e) => setNuevaOrden({ ...nuevaOrden, turno: e.target.value as any })}
                      >
                        <MenuItem value="Mañana">Mañana</MenuItem>
                        <MenuItem value="Tarde">Tarde</MenuItem>
                        <MenuItem value="Noche">Noche</MenuItem>
                      </TextField>
                    </Box>
                  </Box>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                      <TextField
                        type="date"
                        fullWidth
                        label="Fecha Planificada"
                        value={nuevaOrden.fechaPlanificada}
                        onChange={(e) => setNuevaOrden({ ...nuevaOrden, fechaPlanificada: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>
                    <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                      <TextField
                        type="number"
                        fullWidth
                        label="Cantidad Planificada"
                        value={nuevaOrden.cantidadPlanificada}
                        onChange={(e) => setNuevaOrden({ ...nuevaOrden, cantidadPlanificada: Number(e.target.value) })}
                      />
                    </Box>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                <Button
                  onClick={handleCrearOrden}
                  variant="contained"
                  disabled={!nuevaOrden.cliente || nuevaOrden.cantidadPlanificada <= 0}
                >
                  Crear Orden
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        }
      />
      <Route path="/progreso/:id" element={<OrdenProgresoDetalle />} />
      <Route path="/reportes/:id" element={<OrdenReportes />} />
      <Route path="/:id" element={<OrdenDetalle />} />
    </Routes>
  );
};

// Componente para mostrar detalles de una orden específica
const OrdenDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Creada': return 'primary';
      case 'EnProceso': return 'warning';
      case 'Finalizada': return 'success';
      default: return 'default';
    }
  };
  
  const [orden, setOrden] = useState<Orden | null>(null);
  const [fichas, setFichas] = useState<FichaTrazabilidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openFichaDialog, setOpenFichaDialog] = useState(false);
  const [openDesposteDialog, setOpenDesposteDialog] = useState(false);
  const [mostrarProgreso, setMostrarProgreso] = useState(false);

  const [nuevaFicha, setNuevaFicha] = useState<FichaCreacion>({
    proceso: '',
    materialConsumido: '',
    cantidad: 0,
    tiempoProceso: 0,
    condiciones: {},
  });

  useEffect(() => {
    if (id) {
      cargarOrdenDetalle(id);
    }
  }, [id]);

  const cargarOrdenDetalle = async (ordenId: string) => {
    try {
      setLoading(true);
      const ordenData = await ordenesService.obtenerOrdenPorId(ordenId);
      const fichasData = await ordenesService.obtenerFichasTrazabilidad(ordenId);
      setOrden(ordenData);
      setFichas(fichasData);
    } catch (error: any) {
      setError(error.error || 'Error cargando detalles de la orden');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearFicha = async () => {
    if (!id) return;

    try {
      await ordenesService.crearFichaTrazabilidad(id, nuevaFicha);
      setOpenFichaDialog(false);
      setNuevaFicha({
        proceso: '',
        materialConsumido: '',
        cantidad: 0,
        tiempoProceso: 0,
        condiciones: {},
      });
      cargarOrdenDetalle(id);
    } catch (error: any) {
      setError(error.error || 'Error creando ficha de trazabilidad');
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Cargando...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (!orden) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Orden no encontrada
        </Typography>
        <Button onClick={() => navigate('/ordenes')}>
          Volver a Órdenes
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Orden #{orden.id}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/ordenes')}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenFichaDialog(true)}
            sx={{ mr: 1 }}
          >
            Nueva Ficha
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<TimelineIcon />}
            onClick={() => setOpenDesposteDialog(true)}
            sx={{ mr: 1 }}
          >
            Nuevo Desposte
          </Button>
          <Button
            variant="outlined"
            startIcon={<DashboardIcon />}
            onClick={() => setMostrarProgreso(!mostrarProgreso)}
            sx={{ mr: 1 }}
          >
            {mostrarProgreso ? 'Ocultar' : 'Ver'} Progreso
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ReportsIcon />}
            onClick={() => navigate(`/ordenes/reportes/${id}`)}
          >
            Ver Reportes
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Información de la orden */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box sx={{ minWidth: { xs: '100%', md: '48%' }, flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Información General
              </Typography>
              <Typography><strong>Cliente:</strong> {orden.cliente}</Typography>
              <Typography><strong>Línea:</strong> {orden.linea}</Typography>
              <Typography><strong>Turno:</strong> {orden.turno}</Typography>
              <Typography>
                <strong>Fecha Planificada:</strong> {format(new Date(orden.fechaPlanificada), 'dd/MM/yyyy', { locale: es })}
              </Typography>
              <Typography><strong>Cantidad:</strong> {orden.cantidadPlanificada}</Typography>
              <Chip 
                label={orden.estado} 
                color={getEstadoColor(orden.estado) as any} 
                sx={{ mt: 1 }}
              />
            </Box>
            <Box sx={{ minWidth: { xs: '100%', md: '48%' }, flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Fechas
              </Typography>
              <Typography>
                <strong>Fecha de Creación:</strong> {format(new Date(orden.fechaCreacion), 'dd/MM/yyyy HH:mm', { locale: es })}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Progreso de Desposte */}
      {mostrarProgreso && id && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Progreso de Desposte
            </Typography>
            <DetalleProgresoOrden ordenId={id} />
          </CardContent>
        </Card>
      )}

      {/* Fichas de trazabilidad */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Fichas de Trazabilidad
          </Typography>
          
          {fichas.length === 0 ? (
            <Typography color="textSecondary">
              No hay fichas de trazabilidad registradas para esta orden.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Proceso</TableCell>
                    <TableCell>Material</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Tiempo (min)</TableCell>
                    <TableCell>Fecha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fichas.map((ficha) => (
                    <TableRow key={ficha.id} hover>
                      <TableCell>{ficha.proceso}</TableCell>
                      <TableCell>{ficha.materialConsumido}</TableCell>
                      <TableCell>{ficha.cantidad}</TableCell>
                      <TableCell>{ficha.tiempoProceso || '-'}</TableCell>
                      <TableCell>
                        {format(new Date(ficha.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear ficha */}
      <Dialog open={openFichaDialog} onClose={() => setOpenFichaDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Ficha de Trazabilidad</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Proceso"
                value={nuevaFicha.proceso}
                onChange={(e) => setNuevaFicha({ ...nuevaFicha, proceso: e.target.value })}
                required
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Material Consumido"
                value={nuevaFicha.materialConsumido}
                onChange={(e) => setNuevaFicha({ ...nuevaFicha, materialConsumido: e.target.value })}
                required
              />
            </Box>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cantidad"
                  value={nuevaFicha.cantidad}
                  onChange={(e) => setNuevaFicha({ ...nuevaFicha, cantidad: Number(e.target.value) })}
                  required
                />
              </Box>
              <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tiempo de Proceso (min)"
                  value={nuevaFicha.tiempoProceso}
                  onChange={(e) => setNuevaFicha({ ...nuevaFicha, tiempoProceso: Number(e.target.value) })}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFichaDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCrearFicha}
            variant="contained"
            disabled={!nuevaFicha.proceso || !nuevaFicha.materialConsumido || nuevaFicha.cantidad <= 0}
          >
            Crear Ficha
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear registro de Desposte */}
      <Dialog open={openDesposteDialog} onClose={() => setOpenDesposteDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Crear Registro de Desposte para Orden</DialogTitle>
        <DialogContent>
          {id && (
            <DesposteWizardMejorado
              ordenId={id}
              onComplete={() => {
                setOpenDesposteDialog(false);
                cargarOrdenDetalle(id);
              }}
              onCancel={() => setOpenDesposteDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Componente para mostrar progreso detallado de una orden específica
const OrdenProgresoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          ID de orden no válido
        </Typography>
        <Button onClick={() => navigate('/ordenes')}>
          Volver a Órdenes
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Progreso de Orden
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/ordenes')}
        >
          Volver a Órdenes
        </Button>
      </Box>

      <DetalleProgresoOrden 
        ordenId={id}
        onClose={() => navigate('/ordenes')}
      />
    </Box>
  );
};

// Componente para mostrar reportes de una orden específica
const OrdenReportes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          ID de orden no válido
        </Typography>
        <Button onClick={() => navigate('/ordenes')}>
          Volver a Órdenes
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Reportes de Orden
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/ordenes')}
        >
          Volver a Órdenes
        </Button>
      </Box>

      <ReportesConsolidados ordenId={id} />
    </Box>
  );
};

export default OrdenesPage;