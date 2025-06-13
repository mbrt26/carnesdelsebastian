import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Card,
  CardContent,
  Button,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import desposteService from '../../services/desposteService';
import { RegistroDesposteCreacion } from '../../types';

interface CrearDesposteParaOrdenProps {
  ordenId: string;
  onSuccess?: (nuevoRegistro: any) => void;
  onCancel?: () => void;
}

const CrearDesposteParaOrden: React.FC<CrearDesposteParaOrdenProps> = ({
  ordenId,
  onSuccess,
  onCancel
}) => {
  const [formulario, setFormulario] = useState<RegistroDesposteCreacion>({
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof RegistroDesposteCreacion, value: any) => {
    setFormulario(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const nuevoRegistro = await desposteService.crearRegistroDesposte(formulario);
      onSuccess?.(nuevoRegistro);
    } catch (err: any) {
      setError(err.error || 'Error al crear el registro de desposte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Crear Registro de Desposte
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom color="primary">
              Información Básica
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                required
                label="Producto"
                value={formulario.producto}
                onChange={(e) => handleChange('producto', e.target.value)}
              />
              
              <TextField
                fullWidth
                required
                label="Lote"
                value={formulario.lote}
                onChange={(e) => handleChange('lote', e.target.value)}
              />
              
              <TextField
                fullWidth
                required
                type="date"
                label="Fecha de Producción"
                value={formulario.fechaProduccion}
                onChange={(e) => handleChange('fechaProduccion', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                type="number"
                label="Peso Trasladado (kg)"
                value={formulario.pesoTrasladado}
                onChange={(e) => handleChange('pesoTrasladado', Number(e.target.value))}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones"
                value={formulario.observaciones}
                onChange={(e) => handleChange('observaciones', e.target.value)}
              />
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          {onCancel && (
            <Button 
              variant="outlined" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
          )}
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creando...' : 'Crear Registro'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default CrearDesposteParaOrden;