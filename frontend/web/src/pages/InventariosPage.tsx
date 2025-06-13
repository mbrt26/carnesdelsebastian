import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Warehouse as WarehouseIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import inventariosService from '../services/inventariosService';
import { Bodega, ItemInventario, MovimientoInventario } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const InventariosPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [inventario, setInventario] = useState<ItemInventario[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [error, setError] = useState('');
  
  // Estados para diálogos
  const [openBodegaDialog, setOpenBodegaDialog] = useState(false);
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [openMovimientoDialog, setOpenMovimientoDialog] = useState(false);
  
  // Estados para formularios
  const [selectedBodega, setSelectedBodega] = useState<Bodega | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemInventario | null>(null);
  
  const [formBodega, setFormBodega] = useState({
    nombre: '',
    tipo: 'General',
    ubicacion: '',
    capacidad: '',
    temperatura: '',
  });

  const [formItem, setFormItem] = useState({
    codigo: '',
    nombre: '',
    categoria: 'Materia Prima',
    unidadMedida: 'kg',
    stockMinimo: '',
    stockMaximo: '',
    bodegaId: '',
  });

  const [formMovimiento, setFormMovimiento] = useState({
    itemId: '',
    tipo: 'entrada',
    cantidad: '',
    motivo: '',
    ordenId: '',
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [bodegasData, inventarioData, movimientosData] = await Promise.all([
        inventariosService.obtenerBodegas(),
        inventariosService.obtenerInventario(),
        inventariosService.obtenerMovimientos({ limit: 20 }),
      ]);
      setBodegas(bodegasData);
      setInventario(inventarioData);
      setMovimientos(movimientosData);
    } catch (error: any) {
      setError(error.error || 'Error cargando datos de inventario');
    }
  };

  const handleCrearBodega = async () => {
    try {
      const bodegaData = {
        ...formBodega,
        capacidad: parseFloat(formBodega.capacidad) || 0,
        temperatura: formBodega.temperatura ? parseFloat(formBodega.temperatura) : undefined,
      };

      if (selectedBodega) {
        await inventariosService.actualizarBodega(selectedBodega.id, bodegaData);
      } else {
        await inventariosService.crearBodega(bodegaData);
      }

      setOpenBodegaDialog(false);
      resetFormBodega();
      cargarDatos();
    } catch (error: any) {
      setError(error.error || 'Error guardando bodega');
    }
  };

  const handleCrearItem = async () => {
    try {
      const itemData = {
        ...formItem,
        stockMinimo: parseFloat(formItem.stockMinimo) || 0,
        stockMaximo: parseFloat(formItem.stockMaximo) || 0,
      };

      if (selectedItem) {
        await inventariosService.actualizarItem(selectedItem.id, itemData);
      } else {
        await inventariosService.crearItem(itemData);
      }

      setOpenItemDialog(false);
      resetFormItem();
      cargarDatos();
    } catch (error: any) {
      setError(error.error || 'Error guardando artículo');
    }
  };

  const handleCrearMovimiento = async () => {
    try {
      const movimientoData = {
        ...formMovimiento,
        cantidad: parseFloat(formMovimiento.cantidad) || 0,
      };

      const selectedItem = inventario.find(item => item.id === movimientoData.itemId);
      if (!selectedItem) throw new Error('Artículo no encontrado');
      
      await inventariosService.crearMovimiento(movimientoData.itemId, {
        articulo: selectedItem.codigo,
        tipo: movimientoData.tipo as 'entrada' | 'salida' | 'ajuste',
        cantidad: movimientoData.cantidad,
        motivo: movimientoData.motivo,
        referencia: movimientoData.ordenId,
      });

      setOpenMovimientoDialog(false);
      resetFormMovimiento();
      cargarDatos();
    } catch (error: any) {
      setError(error.error || 'Error registrando movimiento');
    }
  };

  const resetFormBodega = () => {
    setFormBodega({
      nombre: '',
      tipo: 'General',
      ubicacion: '',
      capacidad: '',
      temperatura: '',
    });
    setSelectedBodega(null);
  };

  const resetFormItem = () => {
    setFormItem({
      codigo: '',
      nombre: '',
      categoria: 'Materia Prima',
      unidadMedida: 'kg',
      stockMinimo: '',
      stockMaximo: '',
      bodegaId: '',
    });
    setSelectedItem(null);
  };

  const resetFormMovimiento = () => {
    setFormMovimiento({
      itemId: '',
      tipo: 'entrada',
      cantidad: '',
      motivo: '',
      ordenId: '',
    });
  };

  const editarBodega = (bodega: Bodega) => {
    setSelectedBodega(bodega);
    setFormBodega({
      nombre: bodega.nombre,
      tipo: bodega.tipo,
      ubicacion: bodega.ubicacion || '',
      capacidad: bodega.capacidad?.toString() || '',
      temperatura: bodega.temperatura?.toString() || '',
    });
    setOpenBodegaDialog(true);
  };

  const editarItem = (item: ItemInventario) => {
    setSelectedItem(item);
    setFormItem({
      codigo: item.codigo,
      nombre: item.nombre,
      categoria: item.categoria,
      unidadMedida: item.unidadMedida,
      stockMinimo: item.stockMinimo.toString(),
      stockMaximo: item.stockMaximo.toString(),
      bodegaId: item.bodegaId,
    });
    setOpenItemDialog(true);
  };

  const getStockStatus = (item: ItemInventario) => {
    if (item.cantidadDisponible <= item.stockMinimo) {
      return { color: 'error', label: 'Stock Mínimo' };
    } else if (item.cantidadDisponible >= item.stockMaximo) {
      return { color: 'warning', label: 'Stock Máximo' };
    }
    return { color: 'success', label: 'Normal' };
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestión de Inventarios
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Administración de bodegas, artículos y movimientos de inventario
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Bodegas" />
        <Tab label="Artículos" />
        <Tab label="Movimientos" />
      </Tabs>

      {/* Tab Bodegas */}
      <TabPanel value={activeTab} index={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Bodegas</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenBodegaDialog(true)}
          >
            Nueva Bodega
          </Button>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={3}>
          {bodegas.map((bodega) => (
            <Box key={bodega.id} sx={{ minWidth: { xs: '100%', md: '300px', lg: '280px' }, flex: '1 1 300px', maxWidth: { lg: '400px' } }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <WarehouseIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{bodega.nombre}</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Tipo: {bodega.tipo}
                  </Typography>
                  {bodega.ubicacion && (
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Ubicación: {bodega.ubicacion}
                    </Typography>
                  )}
                  {bodega.capacidad && (
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Capacidad: {bodega.capacidad} m³
                    </Typography>
                  )}
                  {bodega.temperatura && (
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Temperatura: {bodega.temperatura}°C
                    </Typography>
                  )}
                  <Typography variant="body2" color="textSecondary">
                    Artículos: {bodega.totalArticulos || 0}
                  </Typography>
                  <Box mt={2} display="flex" gap={1}>
                    <IconButton size="small" onClick={() => editarBodega(bodega)}>
                      <EditIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </TabPanel>

      {/* Tab Artículos */}
      <TabPanel value={activeTab} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Artículos de Inventario</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenItemDialog(true)}
          >
            Nuevo Artículo
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Stock Disponible</TableCell>
                <TableCell>Stock Reservado</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventario.map((item) => {
                const status = getStockStatus(item);
                return (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.codigo}</TableCell>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell>{item.categoria}</TableCell>
                    <TableCell>
                      {item.cantidadDisponible} {item.unidadMedida}
                    </TableCell>
                    <TableCell>
                      {item.cantidadReservada} {item.unidadMedida}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={status.label}
                        color={status.color as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => editarItem(item)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setFormMovimiento({ ...formMovimiento, itemId: item.id });
                          setOpenMovimientoDialog(true);
                        }}
                      >
                        <InventoryIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Tab Movimientos */}
      <TabPanel value={activeTab} index={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Movimientos de Inventario</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenMovimientoDialog(true)}
          >
            Nuevo Movimiento
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Artículo</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Cantidad</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Usuario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimientos.map((movimiento) => (
                <TableRow key={movimiento.id} hover>
                  <TableCell>
                    {format(new Date(movimiento.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </TableCell>
                  <TableCell>{movimiento.articuloNombre || movimiento.articulo}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {movimiento.tipo === 'entrada' ? (
                        <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                      ) : (
                        <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                      )}
                      {movimiento.tipo}
                    </Box>
                  </TableCell>
                  <TableCell>{movimiento.cantidad}</TableCell>
                  <TableCell>{movimiento.motivo || '-'}</TableCell>
                  <TableCell>{movimiento.usuario || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Dialog Bodega */}
      <Dialog open={openBodegaDialog} onClose={() => setOpenBodegaDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedBodega ? 'Editar Bodega' : 'Nueva Bodega'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Nombre"
                value={formBodega.nombre}
                onChange={(e) => setFormBodega({ ...formBodega, nombre: e.target.value })}
                required
              />
            </Box>
            <Box display="flex" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
              <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                <TextField
                  select
                  fullWidth
                  label="Tipo"
                  value={formBodega.tipo}
                  onChange={(e) => setFormBodega({ ...formBodega, tipo: e.target.value })}
                >
                  <MenuItem value="General">General</MenuItem>
                  <MenuItem value="Refrigerado">Refrigerado</MenuItem>
                  <MenuItem value="Congelado">Congelado</MenuItem>
                  <MenuItem value="Seco">Seco</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                <TextField
                  fullWidth
                  label="Ubicación"
                  value={formBodega.ubicacion}
                  onChange={(e) => setFormBodega({ ...formBodega, ubicacion: e.target.value })}
                />
              </Box>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Capacidad (m³)"
                  value={formBodega.capacidad}
                  onChange={(e) => setFormBodega({ ...formBodega, capacidad: e.target.value })}
                />
              </Box>
              <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Temperatura (°C)"
                  value={formBodega.temperatura}
                  onChange={(e) => setFormBodega({ ...formBodega, temperatura: e.target.value })}
                  helperText="Solo para bodegas con control de temperatura"
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenBodegaDialog(false); resetFormBodega(); }}>
            Cancelar
          </Button>
          <Button
            onClick={handleCrearBodega}
            variant="contained"
            disabled={!formBodega.nombre}
          >
            {selectedBodega ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Artículo */}
      <Dialog open={openItemDialog} onClose={() => setOpenItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Editar Artículo' : 'Nuevo Artículo'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Box display="flex" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
              <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                <TextField
                  fullWidth
                  label="Código"
                  value={formItem.codigo}
                  onChange={(e) => setFormItem({ ...formItem, codigo: e.target.value })}
                  required
                />
              </Box>
              <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={formItem.nombre}
                  onChange={(e) => setFormItem({ ...formItem, nombre: e.target.value })}
                  required
                />
              </Box>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
              <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                <TextField
                  select
                  fullWidth
                  label="Categoría"
                  value={formItem.categoria}
                  onChange={(e) => setFormItem({ ...formItem, categoria: e.target.value })}
                >
                  <MenuItem value="Materia Prima">Materia Prima</MenuItem>
                  <MenuItem value="Producto Terminado">Producto Terminado</MenuItem>
                  <MenuItem value="Insumos">Insumos</MenuItem>
                  <MenuItem value="Empaques">Empaques</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                <TextField
                  select
                  fullWidth
                  label="Unidad de Medida"
                  value={formItem.unidadMedida}
                  onChange={(e) => setFormItem({ ...formItem, unidadMedida: e.target.value })}
                >
                  <MenuItem value="kg">Kilogramos</MenuItem>
                  <MenuItem value="g">Gramos</MenuItem>
                  <MenuItem value="lt">Litros</MenuItem>
                  <MenuItem value="ml">Mililitros</MenuItem>
                  <MenuItem value="unid">Unidades</MenuItem>
                </TextField>
              </Box>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
              <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                <TextField
                  select
                  fullWidth
                  label="Bodega"
                  value={formItem.bodegaId}
                  onChange={(e) => setFormItem({ ...formItem, bodegaId: e.target.value })}
                  required
                >
                  {bodegas.map((bodega) => (
                    <MenuItem key={bodega.id} value={bodega.id}>
                      {bodega.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Stock Mínimo"
                  value={formItem.stockMinimo}
                  onChange={(e) => setFormItem({ ...formItem, stockMinimo: e.target.value })}
                />
              </Box>
            </Box>
            <Box>
              <TextField
                fullWidth
                type="number"
                label="Stock Máximo"
                value={formItem.stockMaximo}
                onChange={(e) => setFormItem({ ...formItem, stockMaximo: e.target.value })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenItemDialog(false); resetFormItem(); }}>
            Cancelar
          </Button>
          <Button
            onClick={handleCrearItem}
            variant="contained"
            disabled={!formItem.codigo || !formItem.nombre || !formItem.bodegaId}
          >
            {selectedItem ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Movimiento */}
      <Dialog open={openMovimientoDialog} onClose={() => setOpenMovimientoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Movimiento de Inventario</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Box sx={{ mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Artículo"
                value={formMovimiento.itemId}
                onChange={(e) => setFormMovimiento({ ...formMovimiento, itemId: e.target.value })}
                required
              >
                {inventario.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.codigo} - {item.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
              <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Movimiento"
                  value={formMovimiento.tipo}
                  onChange={(e) => setFormMovimiento({ ...formMovimiento, tipo: e.target.value })}
                >
                  <MenuItem value="entrada">Entrada</MenuItem>
                  <MenuItem value="salida">Salida</MenuItem>
                  <MenuItem value="ajuste">Ajuste</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ minWidth: { xs: '100%', sm: '48%' }, flex: 1 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cantidad"
                  value={formMovimiento.cantidad}
                  onChange={(e) => setFormMovimiento({ ...formMovimiento, cantidad: e.target.value })}
                  required
                />
              </Box>
            </Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Motivo"
                value={formMovimiento.motivo}
                onChange={(e) => setFormMovimiento({ ...formMovimiento, motivo: e.target.value })}
                multiline
                rows={2}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Referencia (ID Orden)"
                value={formMovimiento.ordenId}
                onChange={(e) => setFormMovimiento({ ...formMovimiento, ordenId: e.target.value })}
                helperText="Opcional: ID de orden relacionada"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenMovimientoDialog(false); resetFormMovimiento(); }}>
            Cancelar
          </Button>
          <Button
            onClick={handleCrearMovimiento}
            variant="contained"
            disabled={!formMovimiento.itemId || !formMovimiento.cantidad}
          >
            Registrar Movimiento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventariosPage;