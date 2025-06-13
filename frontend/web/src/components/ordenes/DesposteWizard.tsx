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
  CircularProgress
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

const DesposteWizard: React.FC<DesposteWizardProps> = ({
  ordenId,
  onComplete,
  onCancel
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const resultado = await desposteService.crearRegistroDesposte(formData);
      onComplete?.(resultado);
    } catch (err: any) {
      setError(err.error || 'Error al crear el registro de desposte');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof RegistroDesposteCreacion, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Registro Principal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <label htmlFor="producto">Producto:</label>
                <input
                  id="producto"
                  type="text"
                  value={formData.producto}
                  onChange={(e) => updateFormData('producto', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                  required
                />
              </Box>
              
              <Box>
                <label htmlFor="lote">Lote:</label>
                <input
                  id="lote"
                  type="text"
                  value={formData.lote}
                  onChange={(e) => updateFormData('lote', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                  required
                />
              </Box>

              <Box>
                <label htmlFor="fechaProduccion">Fecha de Producción:</label>
                <input
                  id="fechaProduccion"
                  type="date"
                  value={formData.fechaProduccion}
                  onChange={(e) => updateFormData('fechaProduccion', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                  required
                />
              </Box>

              <Box>
                <label htmlFor="pesoTrasladado">Peso Trasladado (kg):</label>
                <input
                  id="pesoTrasladado"
                  type="number"
                  value={formData.pesoTrasladado}
                  onChange={(e) => updateFormData('pesoTrasladado', Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                />
              </Box>

              <Box>
                <label htmlFor="temperaturaCarne">Temperatura de la Carne (°C):</label>
                <input
                  id="temperaturaCarne"
                  type="number"
                  value={formData.temperaturaCarne}
                  onChange={(e) => updateFormData('temperaturaCarne', Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                />
              </Box>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Desencajado / Alistamiento de M.P.C.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Registre el proceso de desencajado y alistamiento de materia prima cárnica.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Esta sección permitirá registrar:
              </Typography>
              <ul>
                <li>Número de canastillas procesadas</li>
                <li>Estado de la materia prima</li>
                <li>Condiciones de temperatura</li>
                <li>Observaciones del proceso</li>
              </ul>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Picado y Molienda
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Registre el proceso de picado y molienda de la carne.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box>
                <label htmlFor="pesoLanzado">Peso Lanzado (kg):</label>
                <input
                  id="pesoLanzado"
                  type="number"
                  value={formData.pesoLanzado}
                  onChange={(e) => updateFormData('pesoLanzado', Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <label htmlFor="pesoObtenido">Peso Obtenido (kg):</label>
                <input
                  id="pesoObtenido"
                  type="number"
                  value={formData.pesoObtenido}
                  onChange={(e) => updateFormData('pesoObtenido', Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                />
              </Box>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Empacado / Embutido
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Registre el proceso de empacado o embutido del producto.
            </Typography>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Muestreo y Peso
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Registre las actividades de muestreo y control de peso.
            </Typography>
          </Box>
        );

      case 5:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Parámetros y Métricas
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Registre los parámetros de calidad y métricas del proceso.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box>
                <label htmlFor="rendimiento">Rendimiento (%):</label>
                <input
                  id="rendimiento"
                  type="number"
                  value={formData.rendimiento}
                  onChange={(e) => updateFormData('rendimiento', Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <label htmlFor="merma">Merma (%):</label>
                <input
                  id="merma"
                  type="number"
                  value={formData.merma}
                  onChange={(e) => updateFormData('merma', Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                />
              </Box>
            </Box>
          </Box>
        );

      case 6:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Almacenamiento
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Registre las condiciones de almacenamiento del producto.
            </Typography>
          </Box>
        );

      case 7:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Liberación del Producto
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Registre la liberación final del producto.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box>
                <label htmlFor="numeroLote">Número de Lote:</label>
                <input
                  id="numeroLote"
                  type="text"
                  value={formData.numeroLote}
                  onChange={(e) => updateFormData('numeroLote', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                />
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <label htmlFor="numeroGuia">Número de Guía:</label>
                <input
                  id="numeroGuia"
                  type="text"
                  value={formData.numeroGuia}
                  onChange={(e) => updateFormData('numeroGuia', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                />
              </Box>
            </Box>
          </Box>
        );

      case 8:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Firmas y Sellos
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Registre las firmas y sellos de autorización.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box>
                <label htmlFor="observaciones">Observaciones Finales:</label>
                <textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => updateFormData('observaciones', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '4px', minHeight: '100px' }}
                  placeholder="Ingrese observaciones adicionales..."
                />
              </Box>
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
        Crear Ficha de Trazabilidad - Wizard Completo
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5, px: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Paper elevation={1}>
        {renderStepContent()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 3 }}>
          <Box>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
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
              >
                {loading ? 'Creando...' : 'Finalizar y Crear'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
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

export default DesposteWizard;