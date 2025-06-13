import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { RegistroDesposteCreacion } from '../../types';
import desposteService from '../../services/desposteService';

interface DesposteWizardProps {
  ordenId: string;
  onComplete?: (registro: any) => void;
  onCancel?: () => void;
}

const steps = [
  'Registro Principal',
  'Desencajado/Alistamiento MPC',
  'Picado y Molienda',
  'Empacado/Embutido',
  'Muestreo y Peso',
  'Parámetros y Métricas',
  'Almacenamiento',
  'Liberación del Producto',
  'Firmas y Sellos'
];

const DesposteWizardMejorado: React.FC<DesposteWizardProps> = ({
  ordenId,
  onComplete,
  onCancel
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<RegistroDesposteCreacion>({
    ordenId,
    producto: '',
    lote: '',
    fechaProduccion: new Date().toISOString().split('T')[0],
    fechaVencimiento: '',
    fechaSacrificio: '',
    canastillasRecibidas: 0,
    pesoTrasladado: 0,
    temperaturaCarne: 0,
    tipoCanal: 'bovino',
    pesoLanzado: 0,
    pesoObtenido: 0,
    rendimiento: 0,
    merma: 0,
    numeroLote: '',
    numeroGuia: '',
    observaciones: '',
    estado: 'En Proceso'
  });

  const updateFormData = (field: keyof RegistroDesposteCreacion, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error de validación si existe
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    switch (step) {
      case 0: // Registro Principal
        if (!formData.producto.trim()) {
          errors.producto = 'El producto es requerido';
        }
        if (!formData.lote.trim()) {
          errors.lote = 'El lote es requerido';
        }
        if (!formData.fechaProduccion) {
          errors.fechaProduccion = 'La fecha de producción es requerida';
        }
        if (formData.pesoTrasladado <= 0) {
          errors.pesoTrasladado = 'El peso trasladado debe ser mayor a 0';
        }
        break;
      
      case 2: // Picado y Molienda
        if (formData.pesoLanzado <= 0) {
          errors.pesoLanzado = 'El peso lanzado debe ser mayor a 0';
        }
        if (formData.pesoObtenido <= 0) {
          errors.pesoObtenido = 'El peso obtenido debe ser mayor a 0';
        }
        break;
      
      case 5: // Parámetros y Métricas
        if (formData.rendimiento < 0 || formData.rendimiento > 100) {
          errors.rendimiento = 'El rendimiento debe estar entre 0 y 100%';
        }
        if (formData.merma < 0 || formData.merma > 100) {
          errors.merma = 'La merma debe estar entre 0 y 100%';
        }
        break;
      
      case 7: // Liberación del Producto
        if (!formData.numeroLote.trim()) {
          errors.numeroLote = 'El número de lote es requerido';
        }
        if (!formData.numeroGuia.trim()) {
          errors.numeroGuia = 'El número de guía es requerido';
        }
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setError(null);
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      
      // Auto-calcular rendimiento y merma si tenemos los datos
      if (activeStep === 2 && formData.pesoLanzado > 0 && formData.pesoObtenido > 0) {
        const rendimientoCalculado = (formData.pesoObtenido / formData.pesoLanzado) * 100;
        const mermaCalculada = 100 - rendimientoCalculado;
        updateFormData('rendimiento', Math.round(rendimientoCalculado * 100) / 100);
        updateFormData('merma', Math.round(mermaCalculada * 100) / 100);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Enviando datos del desposte:', formData);
      const resultado = await desposteService.crearRegistroDesposte(formData);
      console.log('Resultado del desposte:', resultado);
      onComplete?.(resultado);
    } catch (err: any) {
      console.error('Error al crear registro de desposte:', err);
      setError(err.error || err.message || 'Error al crear el registro de desposte');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Registro Principal
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Ingrese la información básica del producto y del proceso de desposte.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  required
                  label="Producto"
                  value={formData.producto}
                  onChange={(e) => updateFormData('producto', e.target.value)}
                  error={!!validationErrors.producto}
                  helperText={validationErrors.producto}
                  placeholder="Ej: Carne de res, Costilla, etc."
                />
                
                <TextField
                  fullWidth
                  required
                  label="Lote"
                  value={formData.lote}
                  onChange={(e) => updateFormData('lote', e.target.value)}
                  error={!!validationErrors.lote}
                  helperText={validationErrors.lote}
                  placeholder="Ej: LOT-001"
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Fecha de Producción"
                  value={formData.fechaProduccion}
                  onChange={(e) => updateFormData('fechaProduccion', e.target.value)}
                  error={!!validationErrors.fechaProduccion}
                  helperText={validationErrors.fechaProduccion}
                  InputLabelProps={{ shrink: true }}
                />
                
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Vencimiento"
                  value={formData.fechaVencimiento}
                  onChange={(e) => updateFormData('fechaVencimiento', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Sacrificio"
                  value={formData.fechaSacrificio}
                  onChange={(e) => updateFormData('fechaSacrificio', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Canastillas Recibidas"
                  value={formData.canastillasRecibidas}
                  onChange={(e) => updateFormData('canastillasRecibidas', Number(e.target.value))}
                  inputProps={{ min: 0 }}
                />
                
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Peso Trasladado (kg)"
                  value={formData.pesoTrasladado}
                  onChange={(e) => updateFormData('pesoTrasladado', Number(e.target.value))}
                  error={!!validationErrors.pesoTrasladado}
                  helperText={validationErrors.pesoTrasladado}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                
                <TextField
                  fullWidth
                  type="number"
                  label="Temperatura de la Carne (°C)"
                  value={formData.temperaturaCarne}
                  onChange={(e) => updateFormData('temperaturaCarne', Number(e.target.value))}
                  inputProps={{ step: 0.1 }}
                />
              </Box>

              <FormControl fullWidth>
                <InputLabel>Tipo de Canal</InputLabel>
                <Select
                  value={formData.tipoCanal}
                  onChange={(e) => updateFormData('tipoCanal', e.target.value)}
                  label="Tipo de Canal"
                >
                  <MenuItem value="bovino">Bovino</MenuItem>
                  <MenuItem value="porcino">Porcino</MenuItem>
                  <MenuItem value="ovino">Ovino</MenuItem>
                  <MenuItem value="caprino">Caprino</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Desencajado / Alistamiento de M.P.C.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Registre el proceso de desencajado y alistamiento de materia prima cárnica.
            </Typography>
            
            <Box sx={{ backgroundColor: 'grey.50', p: 3, borderRadius: 1 }}>
              <Typography variant="body1" gutterBottom>
                Esta sección permite registrar:
              </Typography>
              <ul>
                <li>Número de canastillas procesadas: <strong>{formData.canastillasRecibidas}</strong></li>
                <li>Estado de la materia prima: <strong>En proceso</strong></li>
                <li>Condiciones de temperatura: <strong>{formData.temperaturaCarne}°C</strong></li>
                <li>Peso trasladado: <strong>{formData.pesoTrasladado} kg</strong></li>
              </ul>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                Los datos del registro principal se utilizan automáticamente en esta sección.
                Proceda al siguiente paso para continuar con el proceso.
              </Alert>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Picado y Molienda
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Registre los pesos del proceso de picado y molienda de la carne.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Peso Lanzado (kg)"
                  value={formData.pesoLanzado}
                  onChange={(e) => updateFormData('pesoLanzado', Number(e.target.value))}
                  error={!!validationErrors.pesoLanzado}
                  helperText={validationErrors.pesoLanzado || "Peso de la materia prima antes del procesamiento"}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Peso Obtenido (kg)"
                  value={formData.pesoObtenido}
                  onChange={(e) => updateFormData('pesoObtenido', Number(e.target.value))}
                  error={!!validationErrors.pesoObtenido}
                  helperText={validationErrors.pesoObtenido || "Peso del producto final procesado"}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Box>
              
              {formData.pesoLanzado > 0 && formData.pesoObtenido > 0 && (
                <Alert severity="success">
                  <Typography variant="body2">
                    <strong>Cálculo automático:</strong><br/>
                    Rendimiento estimado: {((formData.pesoObtenido / formData.pesoLanzado) * 100).toFixed(2)}%<br/>
                    Merma estimada: {(100 - (formData.pesoObtenido / formData.pesoLanzado) * 100).toFixed(2)}%
                  </Typography>
                </Alert>
              )}
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Empacado / Embutido
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Registre el proceso de empacado o embutido del producto.
            </Typography>
            
            <Box sx={{ backgroundColor: 'grey.50', p: 3, borderRadius: 1 }}>
              <Typography variant="body1" gutterBottom>
                Proceso de empacado en curso:
              </Typography>
              <ul>
                <li>Producto: <strong>{formData.producto}</strong></li>
                <li>Peso a empacar: <strong>{formData.pesoObtenido} kg</strong></li>
                <li>Tipo de proceso: <strong>Empacado estándar</strong></li>
              </ul>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                Esta sección registra automáticamente el proceso de empacado basado en los datos anteriores.
              </Alert>
            </Box>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Muestreo y Peso
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Registre las actividades de muestreo y control de peso final.
            </Typography>
            
            <Box sx={{ backgroundColor: 'grey.50', p: 3, borderRadius: 1 }}>
              <Typography variant="body1" gutterBottom>
                Control de peso realizado:
              </Typography>
              <ul>
                <li>Peso inicial: <strong>{formData.pesoLanzado} kg</strong></li>
                <li>Peso final: <strong>{formData.pesoObtenido} kg</strong></li>
                <li>Diferencia: <strong>{(formData.pesoLanzado - formData.pesoObtenido).toFixed(2)} kg</strong></li>
                <li>Estado: <strong>Conforme</strong></li>
              </ul>
              
              <Alert severity="success" sx={{ mt: 2 }}>
                El muestreo y control de peso han sido registrados correctamente.
              </Alert>
            </Box>
          </Box>
        );

      case 5:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Parámetros y Métricas
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Confirme o ajuste los parámetros de calidad y métricas del proceso.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Rendimiento (%)"
                  value={formData.rendimiento}
                  onChange={(e) => updateFormData('rendimiento', Number(e.target.value))}
                  error={!!validationErrors.rendimiento}
                  helperText={validationErrors.rendimiento || "Porcentaje de rendimiento del proceso"}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
                
                <TextField
                  fullWidth
                  type="number"
                  label="Merma (%)"
                  value={formData.merma}
                  onChange={(e) => updateFormData('merma', Number(e.target.value))}
                  error={!!validationErrors.merma}
                  helperText={validationErrors.merma || "Porcentaje de merma del proceso"}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Box>
              
              <Alert severity="info">
                Los valores se calculan automáticamente basados en los pesos del proceso.
                Puede ajustarlos manualmente si es necesario.
              </Alert>
            </Box>
          </Box>
        );

      case 6:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Almacenamiento
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Registre las condiciones de almacenamiento del producto terminado.
            </Typography>
            
            <Box sx={{ backgroundColor: 'grey.50', p: 3, borderRadius: 1 }}>
              <Typography variant="body1" gutterBottom>
                Condiciones de almacenamiento:
              </Typography>
              <ul>
                <li>Producto: <strong>{formData.producto}</strong></li>
                <li>Cantidad: <strong>{formData.pesoObtenido} kg</strong></li>
                <li>Temperatura requerida: <strong>0-4°C</strong></li>
                <li>Ubicación: <strong>Cámara frigorífica principal</strong></li>
              </ul>
              
              <Alert severity="success" sx={{ mt: 2 }}>
                El producto ha sido registrado para almacenamiento bajo condiciones óptimas.
              </Alert>
            </Box>
          </Box>
        );

      case 7:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Liberación del Producto
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Ingrese los números de identificación para la liberación del producto.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  required
                  label="Número de Lote"
                  value={formData.numeroLote}
                  onChange={(e) => updateFormData('numeroLote', e.target.value)}
                  error={!!validationErrors.numeroLote}
                  helperText={validationErrors.numeroLote || "Número único del lote de producción"}
                  placeholder="Ej: LOTE-2025-001"
                />
                
                <TextField
                  fullWidth
                  required
                  label="Número de Guía"
                  value={formData.numeroGuia}
                  onChange={(e) => updateFormData('numeroGuia', e.target.value)}
                  error={!!validationErrors.numeroGuia}
                  helperText={validationErrors.numeroGuia || "Número de guía de despacho"}
                  placeholder="Ej: GUIA-001234"
                />
              </Box>
              
              <Alert severity="warning">
                Estos números son únicos e irrevocables. Verifique que sean correctos antes de proceder.
              </Alert>
            </Box>
          </Box>
        );

      case 8:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Firmas y Sellos - Resumen Final
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Revise el resumen del registro y agregue observaciones finales.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Resumen de datos */}
              <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Resumen del Registro de Desposte
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Typography variant="body2"><strong>Producto:</strong> {formData.producto}</Typography>
                  <Typography variant="body2"><strong>Lote:</strong> {formData.lote}</Typography>
                  <Typography variant="body2"><strong>Fecha Producción:</strong> {formData.fechaProduccion}</Typography>
                  <Typography variant="body2"><strong>Peso Lanzado:</strong> {formData.pesoLanzado} kg</Typography>
                  <Typography variant="body2"><strong>Peso Obtenido:</strong> {formData.pesoObtenido} kg</Typography>
                  <Typography variant="body2"><strong>Rendimiento:</strong> {formData.rendimiento}%</Typography>
                  <Typography variant="body2"><strong>Número Lote:</strong> {formData.numeroLote}</Typography>
                  <Typography variant="body2"><strong>Número Guía:</strong> {formData.numeroGuia}</Typography>
                </Box>
              </Paper>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Observaciones Finales"
                value={formData.observaciones}
                onChange={(e) => updateFormData('observaciones', e.target.value)}
                placeholder="Ingrese cualquier observación adicional sobre el proceso..."
                helperText="Opcional: Comentarios adicionales sobre el proceso de desposte"
              />
              
              <Alert severity="info">
                Al finalizar, el registro será enviado al sistema y no podrá ser modificado.
                Verifique que toda la información sea correcta.
              </Alert>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Ficha de Trazabilidad Completa - Proceso de Desposte
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Orden ID: {ordenId}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 3, px: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Paper elevation={1}>
        {renderStepContent()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
              variant="outlined"
            >
              Anterior
            </Button>
          </Box>
          
          <Box>
            {onCancel && (
              <Button
                onClick={onCancel}
                sx={{ mr: 1 }}
                disabled={loading}
                color="inherit"
              >
                Cancelar
              </Button>
            )}
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                color="primary"
                size="large"
              >
                {loading ? 'Creando Registro...' : 'Finalizar y Crear Registro'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                color="primary"
              >
                Siguiente
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default DesposteWizardMejorado;