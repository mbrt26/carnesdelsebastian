-- Agregar relación con órdenes de producción al módulo de Desposte

-- Agregar columna orden_id a la tabla registro_desposte
ALTER TABLE registro_desposte 
ADD COLUMN orden_id UUID REFERENCES ordenes(id) ON DELETE SET NULL;

-- Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_registro_desposte_orden ON registro_desposte(orden_id);

-- Actualizar registros existentes para asociarlos con la orden creada (opcional)
-- Esto es solo para los datos de prueba existentes
UPDATE registro_desposte 
SET orden_id = (SELECT id FROM ordenes WHERE linea = 'Desposte' LIMIT 1)
WHERE orden_id IS NULL;