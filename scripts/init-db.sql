-- Crear bases de datos para cada microservicio
CREATE DATABASE carnes_ordenes;
CREATE DATABASE carnes_calidad;
CREATE DATABASE carnes_inventarios;

-- Conectar a la base de datos de órdenes
\c carnes_ordenes;

-- Tabla de órdenes de producción
CREATE TABLE ordenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente VARCHAR(255) NOT NULL,
    linea VARCHAR(50) NOT NULL CHECK (linea IN ('Desposte', 'Derivados')),
    turno VARCHAR(20) CHECK (turno IN ('Mañana', 'Tarde', 'Noche')),
    fecha_planificada DATE NOT NULL,
    cantidad_planificada INTEGER NOT NULL,
    estado VARCHAR(20) DEFAULT 'Creada' CHECK (estado IN ('Creada', 'EnProceso', 'Finalizada')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de fichas de trazabilidad
CREATE TABLE fichas_trazabilidad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
    proceso VARCHAR(255) NOT NULL,
    material_consumido VARCHAR(255) NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    tiempo_proceso INTEGER, -- en segundos
    condiciones JSONB, -- temperatura, humedad, presión, etc.
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conectar a la base de datos de calidad
\c carnes_calidad;

-- Tabla de programas de control de calidad
CREATE TABLE programas_qc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    frecuencia VARCHAR(100) NOT NULL,
    parametros JSONB, -- configuración de parámetros a medir
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de registros de control de calidad
CREATE TABLE registros_qc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programa_id UUID NOT NULL REFERENCES programas_qc(id),
    valores JSONB NOT NULL, -- pH, temperatura, etc.
    hallazgos TEXT,
    acciones TEXT,
    fotos TEXT[], -- array de URLs de fotos
    orden_id UUID, -- vinculación opcional con órdenes
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conectar a la base de datos de inventarios
\c carnes_inventarios;

-- Tabla de bodegas
CREATE TABLE bodegas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    ubicacion VARCHAR(255),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de artículos
CREATE TABLE articulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    unidad VARCHAR(50) NOT NULL,
    categoria VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de stock por bodega
CREATE TABLE stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bodega_id UUID NOT NULL REFERENCES bodegas(id),
    articulo_id UUID NOT NULL REFERENCES articulos(id),
    cantidad_disponible DECIMAL(12,2) DEFAULT 0,
    cantidad_reservada DECIMAL(12,2) DEFAULT 0,
    ultimo_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bodega_id, articulo_id)
);

-- Tabla de movimientos de inventario
CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bodega_id UUID NOT NULL REFERENCES bodegas(id),
    articulo_id UUID NOT NULL REFERENCES articulos(id),
    cantidad DECIMAL(12,2) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
    motivo VARCHAR(255),
    referencia VARCHAR(255), -- referencia a orden, QC, etc.
    usuario VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos iniciales
INSERT INTO bodegas (nombre, ubicacion) VALUES 
    ('Bodega Principal', 'Planta Desposte'),
    ('Bodega Derivados', 'Planta Derivados'),
    ('Bodega Materias Primas', 'Entrada Principal');

INSERT INTO articulos (codigo, nombre, unidad, categoria) VALUES
    ('MP001', 'Carne de Res', 'kg', 'Materia Prima'),
    ('MP002', 'Carne de Cerdo', 'kg', 'Materia Prima'),
    ('PT001', 'Chorizo Premium', 'kg', 'Producto Terminado'),
    ('PT002', 'Salchichón', 'kg', 'Producto Terminado');

-- Insertar programas de QC iniciales
\c carnes_calidad;
INSERT INTO programas_qc (nombre, frecuencia, parametros) VALUES 
    ('Control pH Diario', 'diaria', '{"ph_min": 5.5, "ph_max": 6.2}'),
    ('Control Temperatura', 'por_lote', '{"temp_min": 2, "temp_max": 4}'),
    ('Inspección Visual', 'semanal', '{"aspectos": ["color", "textura", "olor"]}');

-- ========== TABLAS DE DESPOSTE ==========
-- Registro principal de Desposte
\c carnes_ordenes;
CREATE TABLE IF NOT EXISTS registro_desposte (
  id SERIAL PRIMARY KEY,
  orden_id UUID REFERENCES ordenes(id) ON DELETE SET NULL,
  producto VARCHAR(200) NOT NULL,
  lote VARCHAR(50) NOT NULL,
  fecha_produccion DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_sacrificio DATE NOT NULL,
  canastillas_recibidas INTEGER DEFAULT 0,
  peso_trasladado_kg DECIMAL(10,2) NOT NULL,
  temperatura_carne_celcius DECIMAL(5,2) NOT NULL,
  tipo_canal VARCHAR(20) DEFAULT 'bovino' CHECK (tipo_canal IN ('bovino', 'porcino', 'avicola', 'congelado')),
  peso_lanzado_kg DECIMAL(10,2) NOT NULL,
  peso_obtenido_kg DECIMAL(10,2) NOT NULL,
  numero_lote VARCHAR(50),
  numero_guia VARCHAR(50),
  estado VARCHAR(50) DEFAULT 'En Proceso' CHECK (estado IN ('En Proceso', 'Completado', 'Rechazado')),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_registro VARCHAR(100),
  observaciones TEXT
);

-- Desencajado/Alistamiento MPC
CREATE TABLE IF NOT EXISTS desencajado_mpc (
  id SERIAL PRIMARY KEY,
  registro_desposte_id INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE,
  numero_materia_prima_carnica VARCHAR(50) NOT NULL,
  lote_materia_prima VARCHAR(50) NOT NULL,
  proveedor VARCHAR(200) NOT NULL,
  peso_kg DECIMAL(10,2) NOT NULL,
  hora TIME NOT NULL,
  temperatura_t1 DECIMAL(5,2),
  temperatura_t2 DECIMAL(5,2),
  temperatura_t3 DECIMAL(5,2),
  color VARCHAR(100),
  textura VARCHAR(100),
  olor VARCHAR(100),
  conformidad BOOLEAN NOT NULL,
  responsable_desencajado VARCHAR(100) NOT NULL,
  hallazgo TEXT,
  correccion TEXT,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Picado/Molienda
CREATE TABLE IF NOT EXISTS picado_molienda (
  id SERIAL PRIMARY KEY,
  registro_desposte_id INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE,
  numero_materia_prima VARCHAR(50) NOT NULL,
  estado_sierra VARCHAR(100) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  temperatura_t1 DECIMAL(5,2),
  temperatura_t2 DECIMAL(5,2),
  temperatura_t3 DECIMAL(5,2),
  cantidad_picada_tajada_kg DECIMAL(10,2) NOT NULL,
  responsable_picado VARCHAR(100) NOT NULL,
  disco_molienda VARCHAR(50),
  kg_molidos DECIMAL(10,2),
  responsable_molienda VARCHAR(100),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subproductos
CREATE TABLE IF NOT EXISTS subproductos (
  id SERIAL PRIMARY KEY,
  picado_molienda_id INTEGER REFERENCES picado_molienda(id) ON DELETE CASCADE,
  peso_kg DECIMAL(10,2) NOT NULL,
  destino VARCHAR(200) NOT NULL,
  reclasificacion VARCHAR(200),
  consumo_animal BOOLEAN DEFAULT false,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Empacado/Embutido
CREATE TABLE IF NOT EXISTS empacado_embutido (
  id SERIAL PRIMARY KEY,
  registro_desposte_id INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE,
  presentacion VARCHAR(100) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  temperatura_t1 DECIMAL(5,2),
  temperatura_t2 DECIMAL(5,2),
  temperatura_t3 DECIMAL(5,2),
  arranque_maquina_unidades INTEGER,
  tiras_kg DECIMAL(10,2),
  bolsas_averiadas_unidades INTEGER,
  unidades_empacadas INTEGER NOT NULL,
  conteo_total INTEGER NOT NULL,
  conformidad BOOLEAN NOT NULL,
  responsable_empacado VARCHAR(100) NOT NULL,
  responsable_fechado VARCHAR(100) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Material de Empaque
CREATE TABLE IF NOT EXISTS material_empaque (
  id SERIAL PRIMARY KEY,
  empacado_embutido_id INTEGER REFERENCES empacado_embutido(id) ON DELETE CASCADE,
  lote_material VARCHAR(50) NOT NULL,
  proveedor_material VARCHAR(200) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Muestreo de Peso
CREATE TABLE IF NOT EXISTS muestreo_peso (
  id SERIAL PRIMARY KEY,
  registro_desposte_id INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE,
  peso_muestreado DECIMAL(10,2) NOT NULL,
  numero_muestra INTEGER NOT NULL CHECK (numero_muestra >= 1 AND numero_muestra <= 100),
  hallazgo TEXT,
  correccion TEXT,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Liberación de Producto
CREATE TABLE IF NOT EXISTS liberacion_producto (
  id SERIAL PRIMARY KEY,
  registro_desposte_id INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE,
  criterio_presentacion_peso BOOLEAN NOT NULL,
  criterio_sellado BOOLEAN NOT NULL,
  criterio_codificado BOOLEAN NOT NULL,
  criterio_rotulado BOOLEAN NOT NULL,
  item_aspecto VARCHAR(100),
  item_olor VARCHAR(100),
  item_sabor VARCHAR(100),
  libre_metales BOOLEAN NOT NULL,
  resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('Conforme', 'No conforme')),
  responsable VARCHAR(100) NOT NULL,
  correccion TEXT,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Almacenamiento/Encajado
CREATE TABLE IF NOT EXISTS almacenamiento_encajado (
  id SERIAL PRIMARY KEY,
  registro_desposte_id INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE,
  producto VARCHAR(200) NOT NULL,
  numero_canastillas INTEGER NOT NULL,
  temperatura_cuarto_frio DECIMAL(5,2) NOT NULL DEFAULT -18.0,
  responsable VARCHAR(100) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  temperatura_t1 DECIMAL(5,2),
  temperatura_t2 DECIMAL(5,2),
  temperatura_t3 DECIMAL(5,2),
  averias TEXT,
  hallazgo TEXT,
  correccion TEXT,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parámetros y Métricas
CREATE TABLE IF NOT EXISTS parametros_metricas (
  id SERIAL PRIMARY KEY,
  registro_desposte_id INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE,
  tipo_producto VARCHAR(50) NOT NULL CHECK (tipo_producto IN ('bovino', 'porcino', 'avicola', 'congelado')),
  rango_temperatura_min DECIMAL(5,2),
  rango_temperatura_max DECIMAL(5,2),
  tiempo_produccion_horas DECIMAL(5,2),
  kg_hora_hombre DECIMAL(10,2),
  orden_produccion VARCHAR(50),
  salida_almacen_ept VARCHAR(50),
  orden_empaque VARCHAR(50),
  porcentaje_merma_peso_bruto DECIMAL(5,2),
  porcentaje_merma_subproductos DECIMAL(5,2),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Firmas y Sellos
CREATE TABLE IF NOT EXISTS firmas_sellos (
  id SERIAL PRIMARY KEY,
  registro_desposte_id INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE,
  recibido_logistica VARCHAR(100),
  fecha_recibido_logistica TIMESTAMP,
  coordinador_desposte VARCHAR(100),
  fecha_coordinador_desposte TIMESTAMP,
  liberado_calidad VARCHAR(100),
  fecha_liberado_calidad TIMESTAMP,
  sello_logistica VARCHAR(200),
  sello_coordinador VARCHAR(200),
  sello_calidad VARCHAR(200),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para actualizar fecha de modificación
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_registro_desposte_modtime 
    BEFORE UPDATE ON registro_desposte 
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Insertar datos de ejemplo para Órdenes
INSERT INTO ordenes (cliente, linea, turno, fecha_planificada, cantidad_planificada, estado) VALUES 
  ('Frigorífico Central', 'Desposte', 'Mañana', '2024-12-06', 1000, 'EnProceso'),
  ('Distribuidora Norte', 'Desposte', 'Tarde', '2024-12-07', 1500, 'Creada'),
  ('Mercado Sur', 'Derivados', 'Mañana', '2024-12-08', 800, 'Creada')
ON CONFLICT DO NOTHING;

-- Datos de ejemplo para Desposte
INSERT INTO registro_desposte (
  orden_id, producto, lote, fecha_produccion, fecha_vencimiento, fecha_sacrificio,
  peso_trasladado_kg, temperatura_carne_celcius, peso_lanzado_kg, peso_obtenido_kg, usuario_registro
) VALUES (
  (SELECT id FROM ordenes WHERE cliente = 'Frigorífico Central' LIMIT 1),
  'Res 80/20', 'LOTE001-2024', '2024-12-06', '2024-12-20', '2024-12-05',
  1000.00, 4.5, 950.00, 800.00, 'admin'
) ON CONFLICT DO NOTHING;

-- Crear índices para optimizar consultas
CREATE INDEX idx_ordenes_fecha ON ordenes(fecha_planificada);
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_fichas_orden_id ON fichas_trazabilidad(orden_id);

-- Índices para tablas de Desposte
CREATE INDEX IF NOT EXISTS idx_registro_desposte_orden ON registro_desposte(orden_id);
CREATE INDEX IF NOT EXISTS idx_registro_desposte_lote ON registro_desposte(lote);
CREATE INDEX IF NOT EXISTS idx_registro_desposte_fecha ON registro_desposte(fecha_produccion);
CREATE INDEX IF NOT EXISTS idx_registro_desposte_estado ON registro_desposte(estado);
CREATE INDEX IF NOT EXISTS idx_desencajado_mpc_registro ON desencajado_mpc(registro_desposte_id);
CREATE INDEX IF NOT EXISTS idx_picado_molienda_registro ON picado_molienda(registro_desposte_id);
CREATE INDEX IF NOT EXISTS idx_empacado_embutido_registro ON empacado_embutido(registro_desposte_id);
CREATE INDEX IF NOT EXISTS idx_liberacion_producto_registro ON liberacion_producto(registro_desposte_id);
CREATE INDEX IF NOT EXISTS idx_almacenamiento_registro ON almacenamiento_encajado(registro_desposte_id);

\c carnes_calidad;
CREATE INDEX idx_registros_programa ON registros_qc(programa_id);
CREATE INDEX idx_registros_timestamp ON registros_qc(timestamp);

\c carnes_inventarios;
CREATE INDEX idx_stock_bodega ON stock(bodega_id);
CREATE INDEX idx_movimientos_bodega ON movimientos_inventario(bodega_id);
CREATE INDEX idx_movimientos_timestamp ON movimientos_inventario(timestamp);