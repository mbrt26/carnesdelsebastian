-- =====================================================
-- ESTRUCTURA DE PRODUCCIÓN - CARNES DEL SEBASTIÁN
-- Dos plantas: Desposte y Derivados
-- =====================================================

-- 1. CATÁLOGO DE PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  tipo_planta VARCHAR(20) NOT NULL CHECK (tipo_planta IN ('DESPOSTE', 'DERIVADOS', 'AMBAS')),
  categoria VARCHAR(100),
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_creacion VARCHAR(100)
);

-- 2. ÓRDENES DE PRODUCCIÓN DESPOSTE
CREATE TABLE IF NOT EXISTS ordenes_produccion_desposte (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id),
  producto VARCHAR(200) NOT NULL, -- Denormalizado para flexibilidad
  tamano_lote INTEGER NOT NULL,
  dia DATE NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  lote VARCHAR(50) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  
  -- Control y estado
  estado VARCHAR(50) DEFAULT 'Programada' CHECK (estado IN ('Programada', 'En Proceso', 'Completada', 'Cancelada')),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_creacion VARCHAR(100),
  usuario_actualizacion VARCHAR(100),
  
  -- Observaciones
  observaciones TEXT
);

-- 3. ÓRDENES DE PRODUCCIÓN DERIVADOS
CREATE TABLE IF NOT EXISTS ordenes_produccion_derivados (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id),
  producto VARCHAR(200) NOT NULL, -- Denormalizado para flexibilidad
  tamano_lote INTEGER NOT NULL,
  dia DATE NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  lote VARCHAR(50) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  
  -- Control y estado
  estado VARCHAR(50) DEFAULT 'Programada' CHECK (estado IN ('Programada', 'En Proceso', 'Completada', 'Cancelada')),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_creacion VARCHAR(100),
  usuario_actualizacion VARCHAR(100),
  
  -- Observaciones
  observaciones TEXT
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Productos
CREATE INDEX IF NOT EXISTS idx_productos_tipo_planta ON productos(tipo_planta);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- Órdenes Desposte
CREATE INDEX IF NOT EXISTS idx_ordenes_desposte_dia ON ordenes_produccion_desposte(dia);
CREATE INDEX IF NOT EXISTS idx_ordenes_desposte_estado ON ordenes_produccion_desposte(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_desposte_lote ON ordenes_produccion_desposte(lote);
CREATE INDEX IF NOT EXISTS idx_ordenes_desposte_codigo ON ordenes_produccion_desposte(codigo);

-- Órdenes Derivados
CREATE INDEX IF NOT EXISTS idx_ordenes_derivados_dia ON ordenes_produccion_derivados(dia);
CREATE INDEX IF NOT EXISTS idx_ordenes_derivados_estado ON ordenes_produccion_derivados(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_derivados_lote ON ordenes_produccion_derivados(lote);
CREATE INDEX IF NOT EXISTS idx_ordenes_derivados_codigo ON ordenes_produccion_derivados(codigo);

-- =====================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Función para actualizar fecha de modificación
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para órdenes de desposte
CREATE TRIGGER trigger_actualizar_fecha_desposte
  BEFORE UPDATE ON ordenes_produccion_desposte
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Triggers para órdenes de derivados
CREATE TRIGGER trigger_actualizar_fecha_derivados
  BEFORE UPDATE ON ordenes_produccion_derivados
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_fecha_modificacion();

-- =====================================================
-- DATOS DE EJEMPLO PARA PRODUCTOS
-- =====================================================

INSERT INTO productos (codigo, nombre, tipo_planta, categoria, usuario_creacion) VALUES
-- Productos de Desposte
('DES001', 'Res 80/20', 'DESPOSTE', 'Carne de Res', 'admin'),
('DES002', 'Cerdo 80/20', 'DESPOSTE', 'Carne de Cerdo', 'admin'),
('DES003', 'Cerdo 90/10', 'DESPOSTE', 'Carne de Cerdo', 'admin'),
('DES004', 'Grasa de Cerdo', 'DESPOSTE', 'Grasa', 'admin'),

-- Productos de Derivados
('PE004001', 'Costilla Ahumada', 'DERIVADOS', 'Productos Ahumados', 'admin'),
('PE004005', 'Chorizo Antioqueño', 'DERIVADOS', 'Embutidos', 'admin'),
('PE004010', 'Chorizo Santorrosano', 'DERIVADOS', 'Embutidos', 'admin'),
('PE004015', 'Chorizo Coctel', 'DERIVADOS', 'Embutidos', 'admin')

ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- DATOS DE EJEMPLO PARA ÓRDENES
-- =====================================================

-- Órdenes de Desposte
INSERT INTO ordenes_produccion_desposte 
(producto_id, producto, tamano_lote, dia, codigo, lote, fecha_vencimiento, usuario_creacion) 
VALUES
(1, 'Res 80/20', 500, '2025-06-13', 'DES001-001', 'L001-13JUN25', '2025-06-20', 'admin'),
(2, 'Cerdo 80/20', 300, '2025-06-13', 'DES002-001', 'L002-13JUN25', '2025-06-20', 'admin')
ON CONFLICT DO NOTHING;

-- Órdenes de Derivados
INSERT INTO ordenes_produccion_derivados 
(producto_id, producto, tamano_lote, dia, codigo, lote, fecha_vencimiento, usuario_creacion) 
VALUES
(5, 'Costilla Ahumada', 1000, '2025-06-14', 'PE004001-001', 'CA001-14JUN25', '2025-07-14', 'admin'),
(6, 'Chorizo Antioqueño', 170, '2025-06-14', 'PE004005-001', 'CH001-14JUN25', '2025-07-14', 'admin')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VISTAS ÚTILES PARA CONSULTAS
-- =====================================================

-- Vista unificada de todas las órdenes
CREATE OR REPLACE VIEW vista_ordenes_todas AS
SELECT 
  'DESPOSTE' as planta,
  id,
  producto_id,
  producto,
  tamano_lote,
  dia,
  codigo,
  lote,
  fecha_vencimiento,
  estado,
  fecha_creacion,
  usuario_creacion
FROM ordenes_produccion_desposte
UNION ALL
SELECT 
  'DERIVADOS' as planta,
  id,
  producto_id,
  producto,
  tamano_lote,
  dia,
  codigo,
  lote,
  fecha_vencimiento,
  estado,
  fecha_creacion,
  usuario_creacion
FROM ordenes_produccion_derivados;

-- Vista de productos por planta
CREATE OR REPLACE VIEW vista_productos_desposte AS
SELECT * FROM productos 
WHERE tipo_planta IN ('DESPOSTE', 'AMBAS') AND activo = true
ORDER BY nombre;

CREATE OR REPLACE VIEW vista_productos_derivados AS
SELECT * FROM productos 
WHERE tipo_planta IN ('DERIVADOS', 'AMBAS') AND activo = true
ORDER BY nombre;

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE productos IS 'Catálogo de productos para ambas plantas';
COMMENT ON TABLE ordenes_produccion_desposte IS 'Órdenes de producción para planta de desposte';
COMMENT ON TABLE ordenes_produccion_derivados IS 'Órdenes de producción para planta de derivados';

COMMENT ON COLUMN productos.tipo_planta IS 'DESPOSTE, DERIVADOS o AMBAS';
COMMENT ON COLUMN ordenes_produccion_desposte.tamano_lote IS 'Tamaño del lote en unidades o kg';
COMMENT ON COLUMN ordenes_produccion_derivados.tamano_lote IS 'Tamaño del lote en unidades o kg';