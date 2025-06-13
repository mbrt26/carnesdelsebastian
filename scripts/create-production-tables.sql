-- =====================================================
-- ESQUEMA DE BASE DE DATOS PARA PRODUCCIÓN
-- Basado en formatos Excel existentes de Carnes del Sebastián
-- =====================================================

-- 1. ÓRDENES DE PRODUCCIÓN (basado en PROGRAMACION PRODUCIÓN)
CREATE TABLE IF NOT EXISTS ordenes_produccion (
  id SERIAL PRIMARY KEY,
  
  -- Información del producto
  linea VARCHAR(100), -- ej: "LINEA INSTITUCIONAL"
  codigo_producto VARCHAR(50), -- ej: "PE004001"
  producto VARCHAR(200), -- ej: "Costilla Ahumada"
  tamano_lote INTEGER, -- ej: 1000
  
  -- Parámetros de producción
  kg_base DECIMAL(10,2), -- Kg Bq
  porcentaje_recuperacion DECIMAL(5,2), -- % Rec
  
  -- Programación semanal
  semana_inicio DATE,
  semana_fin DATE,
  
  -- Estado y tracking
  estado VARCHAR(50) DEFAULT 'Programada', -- Programada, En Proceso, Finalizada
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_creacion VARCHAR(100),
  
  -- Metadatos
  observaciones TEXT,
  prioridad INTEGER DEFAULT 1
);

-- 2. PROGRAMACIÓN DIARIA (desglose de la orden por días)
CREATE TABLE IF NOT EXISTS programacion_diaria (
  id SERIAL PRIMARY KEY,
  orden_produccion_id INTEGER REFERENCES ordenes_produccion(id) ON DELETE CASCADE,
  
  -- Día específico
  fecha_programada DATE,
  dia_semana VARCHAR(20), -- Lunes, Martes, etc.
  
  -- Detalles del lote diario
  numero_lote VARCHAR(50),
  codigo_lote VARCHAR(50),
  fecha_vencimiento DATE,
  cantidad_programada INTEGER,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'Programado', -- Programado, En Proceso, Completado
  fecha_inicio_real TIMESTAMP,
  fecha_fin_real TIMESTAMP
);

-- 3. PROGRAMACIÓN DE MATERIA PRIMA (basado en PROGRAMACIÓN DESPOSTE)
CREATE TABLE IF NOT EXISTS programacion_materia_prima (
  id SERIAL PRIMARY KEY,
  
  -- Información del producto
  producto VARCHAR(200), -- ej: "CHORIZO ANTIOQUEÑO"
  cantidad_a_procesar DECIMAL(10,2), -- ej: 170.0
  
  -- Programación semanal
  semana_inicio DATE,
  semana_fin DATE,
  
  -- Estado
  estado VARCHAR(50) DEFAULT 'Programado',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. DETALLE DE MATERIA PRIMA POR PRODUCTO
CREATE TABLE IF NOT EXISTS detalle_materia_prima (
  id SERIAL PRIMARY KEY,
  programacion_materia_prima_id INTEGER REFERENCES programacion_materia_prima(id) ON DELETE CASCADE,
  
  -- Información de la materia prima
  materia_prima VARCHAR(200), -- ej: "RES 80/20", "GRASA DE CERDO"
  
  -- Programación diaria (kg por día)
  lunes DECIMAL(10,2) DEFAULT 0,
  martes DECIMAL(10,2) DEFAULT 0,
  miercoles DECIMAL(10,2) DEFAULT 0,
  jueves DECIMAL(10,2) DEFAULT 0,
  viernes DECIMAL(10,2) DEFAULT 0,
  sabado DECIMAL(10,2) DEFAULT 0,
  domingo DECIMAL(10,2) DEFAULT 0,
  
  -- Total calculado
  total_semana DECIMAL(10,2)
);

-- 5. TRAZABILIDAD DE PRODUCCIÓN (basado en PD-PTZ-R11)
CREATE TABLE IF NOT EXISTS trazabilidad_produccion (
  id SERIAL PRIMARY KEY,
  orden_produccion_id INTEGER REFERENCES ordenes_produccion(id),
  
  -- Información básica
  producto VARCHAR(200),
  lote VARCHAR(50),
  fecha_produccion DATE,
  
  -- Responsables
  responsable_produccion VARCHAR(100),
  turno VARCHAR(50),
  
  -- Tiempos
  hora_inicio TIME,
  hora_fin TIME,
  
  -- Estado y observaciones
  estado VARCHAR(50) DEFAULT 'En Proceso',
  observaciones TEXT,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. MATERIA PRIMA UTILIZADA EN PRODUCCIÓN
CREATE TABLE IF NOT EXISTS materia_prima_utilizada (
  id SERIAL PRIMARY KEY,
  trazabilidad_produccion_id INTEGER REFERENCES trazabilidad_produccion(id) ON DELETE CASCADE,
  
  -- Información de la materia prima
  materia_prima_carnica VARCHAR(200),
  lote_materia_prima VARCHAR(50),
  proveedor VARCHAR(200),
  
  -- Cantidades y condiciones
  peso_kg DECIMAL(10,2),
  temperatura_c DECIMAL(5,2), -- 0°C - 4°C
  
  -- Fechas
  fecha_ingreso DATE,
  fecha_vencimiento DATE
);

-- 7. TRAZABILIDAD DE EMPAQUE (basado en PD-PTZ-R12)
CREATE TABLE IF NOT EXISTS trazabilidad_empaque (
  id SERIAL PRIMARY KEY,
  trazabilidad_produccion_id INTEGER REFERENCES trazabilidad_produccion(id),
  
  -- Información del producto
  producto VARCHAR(200),
  lote VARCHAR(50),
  fecha_produccion DATE,
  fecha_vencimiento DATE,
  
  -- Proceso de precámara
  precamara_temperatura_final DECIMAL(5,2), -- 40°C a 10°C
  precamara_hora_final TIME,
  
  -- Proceso de túnel
  tunel_hora_inicio TIME,
  tunel_hora_final TIME,
  
  -- Descolgado
  descolgado_fecha DATE,
  descolgado_hora_inicio TIME,
  descolgado_hora_final TIME,
  descolgado_temperatura DECIMAL(5,2), -- 0°C - 4°C
  descolgado_responsable VARCHAR(100),
  
  -- Picado o tajado
  estado_sierra_cuchilla VARCHAR(100),
  presentacion VARCHAR(100),
  peso DECIMAL(10,2),
  canastillas INTEGER,
  
  -- Estado
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orden_produccion_fecha ON ordenes_produccion(semana_inicio, semana_fin);
CREATE INDEX IF NOT EXISTS idx_orden_produccion_estado ON ordenes_produccion(estado);
CREATE INDEX IF NOT EXISTS idx_orden_produccion_codigo ON ordenes_produccion(codigo_producto);

CREATE INDEX IF NOT EXISTS idx_programacion_diaria_fecha ON programacion_diaria(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_programacion_diaria_orden ON programacion_diaria(orden_produccion_id);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_lote ON trazabilidad_produccion(lote);
CREATE INDEX IF NOT EXISTS idx_trazabilidad_fecha ON trazabilidad_produccion(fecha_produccion);

CREATE INDEX IF NOT EXISTS idx_trazabilidad_empaque_lote ON trazabilidad_empaque(lote);

-- =====================================================
-- DATOS DE EJEMPLO BASADOS EN EXCEL ACTUAL
-- =====================================================

-- Insertar una orden de ejemplo basada en la estructura Excel
INSERT INTO ordenes_produccion (
  linea, codigo_producto, producto, tamano_lote, 
  kg_base, porcentaje_recuperacion,
  semana_inicio, semana_fin,
  usuario_creacion
) VALUES (
  'LINEA INSTITUCIONAL', 'PE004001', 'Costilla Ahumada',
  1000, 7.9, 1.15,
  '2025-06-09', '2025-06-15',
  'admin'
) ON CONFLICT DO NOTHING;

-- Insertar programación de materia prima de ejemplo
INSERT INTO programacion_materia_prima (
  producto, cantidad_a_procesar, semana_inicio, semana_fin
) VALUES (
  'CHORIZO ANTIOQUEÑO', 170.0, '2025-06-09', '2025-06-15'
) ON CONFLICT DO NOTHING;

-- Insertar detalle de materia prima
INSERT INTO detalle_materia_prima (
  programacion_materia_prima_id, materia_prima, lunes, total_semana
) VALUES (
  1, 'RES 80/20', 27.2, 27.2
), (
  1, 'GRASA DE CERDO', 20.4, 20.4
), (
  1, 'CERDO 80/20', 37.944, 37.944
), (
  1, 'EMULSION', 5.882, 5.882
) ON CONFLICT DO NOTHING;

-- =====================================================
-- VISTAS ÚTILES PARA REPORTES
-- =====================================================

-- Vista resumen de programación semanal
CREATE OR REPLACE VIEW vista_programacion_semanal AS
SELECT 
  op.id,
  op.linea,
  op.codigo_producto,
  op.producto,
  op.tamano_lote,
  op.semana_inicio,
  op.semana_fin,
  op.estado,
  COUNT(pd.id) as dias_programados,
  SUM(pd.cantidad_programada) as cantidad_total_programada
FROM ordenes_produccion op
LEFT JOIN programacion_diaria pd ON op.id = pd.orden_produccion_id
GROUP BY op.id, op.linea, op.codigo_producto, op.producto, 
         op.tamano_lote, op.semana_inicio, op.semana_fin, op.estado;

-- Vista de trazabilidad completa
CREATE OR REPLACE VIEW vista_trazabilidad_completa AS
SELECT 
  tp.id,
  tp.producto,
  tp.lote,
  tp.fecha_produccion,
  tp.responsable_produccion,
  tp.hora_inicio,
  tp.hora_fin,
  tp.estado,
  COUNT(mpu.id) as materias_primas_utilizadas,
  te.fecha_vencimiento
FROM trazabilidad_produccion tp
LEFT JOIN materia_prima_utilizada mpu ON tp.id = mpu.trazabilidad_produccion_id
LEFT JOIN trazabilidad_empaque te ON tp.id = te.trazabilidad_produccion_id
GROUP BY tp.id, tp.producto, tp.lote, tp.fecha_produccion, 
         tp.responsable_produccion, tp.hora_inicio, tp.hora_fin, 
         tp.estado, te.fecha_vencimiento;

-- =====================================================
-- TRIGGERS PARA CÁLCULOS AUTOMÁTICOS
-- =====================================================

-- Trigger para calcular total_semana automáticamente
CREATE OR REPLACE FUNCTION calcular_total_semana()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_semana = NEW.lunes + NEW.martes + NEW.miercoles + 
                     NEW.jueves + NEW.viernes + NEW.sabado + NEW.domingo;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_total_semana
  BEFORE INSERT OR UPDATE ON detalle_materia_prima
  FOR EACH ROW
  EXECUTE FUNCTION calcular_total_semana();

COMMENT ON TABLE ordenes_produccion IS 'Órdenes de producción basadas en formato Excel PROGRAMACION PRODUCIÓN';
COMMENT ON TABLE trazabilidad_produccion IS 'Trazabilidad basada en formato PD-PTZ-R11';
COMMENT ON TABLE trazabilidad_empaque IS 'Trazabilidad de empaque basada en formato PD-PTZ-R12';