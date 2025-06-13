import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Science as ScienceIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import calidadService from '../services/calidadService';
import { ProgramaQC, RegistroQC } from '../types';

const CalidadPage: React.FC = () => {
  const [programas, setProgramas] = useState<ProgramaQC[]>([]);
  const [registros, setRegistros] = useState<RegistroQC[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPrograma, setSelectedPrograma] = useState<ProgramaQC | null>(null);
  const [error, setError] = useState('');
  const [nuevoRegistro, setNuevoRegistro] = useState({
    valores: {} as Record<string, any>,
    hallazgos: '',
    acciones: '',
    ordenId: '',
  });

  useEffect(() => {
    cargarProgramas();
  }, []);

  const cargarProgramas = async () => {
    try {
      setLoading(true);
      const data = await calidadService.obtenerProgramas();
      setProgramas(data);
    } catch (error: any) {
      setError(error.error || 'Error cargando programas de QC');
    } finally {
      setLoading(false);
    }
  };

  const cargarRegistros = async (programaId: string) => {
    try {
      const data = await calidadService.obtenerRegistrosQC(programaId, { limit: 10 });
      setRegistros(data);
    } catch (error: any) {
      setError(error.error || 'Error cargando registros');
    }
  };

  const handleCrearRegistro = async () => {
    if (!selectedPrograma) return;

    try {
      await calidadService.crearRegistroQC(selectedPrograma.id, nuevoRegistro);
      setOpenDialog(false);
      setNuevoRegistro({
        valores: {},
        hallazgos: '',
        acciones: '',
        ordenId: '',
      });
      cargarRegistros(selectedPrograma.id);
    } catch (error: any) {
      setError(error.error || 'Error creando registro de QC');
    }
  };

  const abrirDialogoRegistro = (programa: ProgramaQC) => {
    setSelectedPrograma(programa);
    setNuevoRegistro({
      valores: {},
      hallazgos: '',
      acciones: '',
      ordenId: '',
    });
    setOpenDialog(true);
    cargarRegistros(programa.id);
  };

  const actualizarValor = (parametro: string, valor: any) => {
    setNuevoRegistro({
      ...nuevoRegistro,
      valores: {
        ...nuevoRegistro.valores,
        [parametro]: valor,
      },
    });
  };

  const validarParametro = (valor: number, min?: number, max?: number) => {
    if (min !== undefined && max !== undefined) {
      return valor >= min && valor <= max;
    }
    return true;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Control de Calidad
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Gestión de programas de control de calidad y registros
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography>Cargando programas...</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {programas.map((programa) => (
            <Box sx={{ width: { xs: '100%', md: '50%', lg: '33.333%' } }} key={programa.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <ScienceIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{programa.nombre}</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Frecuencia: {programa.frecuencia}
                  </Typography>
                  
                  {/* Parámetros del programa */}
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Parámetros:
                    </Typography>
                    <List dense>
                      {programa.parametros.ph_min && (
                        <ListItem>
                          <ListItemText
                            primary="pH"
                            secondary={`${programa.parametros.ph_min} - ${programa.parametros.ph_max}`}
                          />
                        </ListItem>
                      )}
                      {programa.parametros.temp_min && (
                        <ListItem>
                          <ListItemText
                            primary="Temperatura"
                            secondary={`${programa.parametros.temp_min}°C - ${programa.parametros.temp_max}°C`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>

                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    onClick={() => abrirDialogoRegistro(programa)}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Nuevo Registro
                  </Button>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Dialog para crear registro de QC */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Nuevo Registro de QC - {selectedPrograma?.nombre}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* Formulario de valores */}
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <Typography variant="h6" gutterBottom>
                Valores de Control
              </Typography>
              
              {selectedPrograma?.parametros.ph_min && (
                <TextField
                  fullWidth
                  type="number"
                  label="pH"
                  value={nuevoRegistro.valores.ph || ''}
                  onChange={(e) => actualizarValor('ph', parseFloat(e.target.value))}
                  helperText={`Rango: ${selectedPrograma.parametros.ph_min} - ${selectedPrograma.parametros.ph_max}`}
                  error={
                    nuevoRegistro.valores.ph &&
                    !validarParametro(
                      nuevoRegistro.valores.ph,
                      selectedPrograma.parametros.ph_min,
                      selectedPrograma.parametros.ph_max
                    )
                  }
                  sx={{ mb: 2 }}
                />
              )}

              {selectedPrograma?.parametros.temp_min && (
                <TextField
                  fullWidth
                  type="number"
                  label="Temperatura (°C)"
                  value={nuevoRegistro.valores.temperatura || ''}
                  onChange={(e) => actualizarValor('temperatura', parseFloat(e.target.value))}
                  helperText={`Rango: ${selectedPrograma.parametros.temp_min}°C - ${selectedPrograma.parametros.temp_max}°C`}
                  error={
                    nuevoRegistro.valores.temperatura &&
                    !validarParametro(
                      nuevoRegistro.valores.temperatura,
                      selectedPrograma.parametros.temp_min,
                      selectedPrograma.parametros.temp_max
                    )
                  }
                  sx={{ mb: 2 }}
                />
              )}

              <TextField
                fullWidth
                label="ID de Orden (opcional)"
                value={nuevoRegistro.ordenId}
                onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, ordenId: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Hallazgos"
                value={nuevoRegistro.hallazgos}
                onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, hallazgos: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Acciones Correctivas"
                value={nuevoRegistro.acciones}
                onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, acciones: e.target.value })}
              />
            </Box>

            {/* Registros recientes */}
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <Typography variant="h6" gutterBottom>
                Registros Recientes
              </Typography>
              {registros.length === 0 ? (
                <Typography color="textSecondary">
                  No hay registros previos
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {registros.map((registro) => (
                    <Accordion key={registro.id}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" width="100%">
                          <Typography sx={{ flexGrow: 1 }}>
                            {format(new Date(registro.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </Typography>
                          {registro.hallazgos ? (
                            <WarningIcon color="warning" />
                          ) : (
                            <CheckIcon color="success" />
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box>
                            <Typography variant="subtitle2">Valores:</Typography>
                            {Object.entries(registro.valores).map(([key, value]) => (
                              <Typography key={key} variant="body2">
                                {key}: {value}
                              </Typography>
                            ))}
                          </Box>
                          {registro.hallazgos && (
                            <Box>
                              <Typography variant="subtitle2">Hallazgos:</Typography>
                              <Typography variant="body2">{registro.hallazgos}</Typography>
                            </Box>
                          )}
                          {registro.acciones && (
                            <Box>
                              <Typography variant="subtitle2">Acciones:</Typography>
                              <Typography variant="body2">{registro.acciones}</Typography>
                            </Box>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleCrearRegistro}
            variant="contained"
            disabled={Object.keys(nuevoRegistro.valores).length === 0}
          >
            Guardar Registro
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalidadPage;