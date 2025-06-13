-- Script para crear las tablas del módulo de Desposte
-- Basado en los 9 campos específicos requeridos para el proceso de Desposte

-- 1. Registro principal de Desposte
CREATE TABLE IF NOT EXISTS registro_desposte (
  id SERIAL PRIMARY KEY,
  producto VARCHAR(200) NOT NULL,
  lote VARCHAR(50) NOT NULL,
  fecha_produccion DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_sacrificio DATE NOT NULL,
  peso_trasladado_kg DECIMAL(10,2) NOT NULL,
  peso_lanzado_kg DECIMAL(10,2) NOT NULL,
  peso_obtenido_kg DECIMAL(10,2) NOT NULL,
  estado VARCHAR(50) DEFAULT 'En Proceso',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_registro VARCHAR(100),
  observaciones TEXT
);

-- 2. Desencajado/Alistamiento MPC
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

-- 3. Picado/Molienda
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

-- 4. Subproductos
CREATE TABLE IF NOT EXISTS subproductos (
  id SERIAL PRIMARY KEY,
  picado_molienda_id INTEGER REFERENCES picado_molienda(id) ON DELETE CASCADE,
  peso_kg DECIMAL(10,2) NOT NULL,
  destino VARCHAR(200) NOT NULL,
  reclasificacion VARCHAR(200),
  consumo_animal BOOLEAN DEFAULT false,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Empacado/Embutido
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

-- 6. Material de Empaque
CREATE TABLE IF NOT EXISTS material_empaque (
  id SERIAL PRIMARY KEY,
  empacado_embutido_id INTEGER REFERENCES empacado_embutido(id) ON DELETE CASCADE,
  lote_material VARCHAR(50) NOT NULL,
  proveedor_material VARCHAR(200) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Muestreo de Peso
CREATE TABLE IF NOT EXISTS muestreo_peso (
  id SERIAL PRIMARY KEY,
  registro_desposte_id INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE,
  peso_muestreado DECIMAL(10,2) NOT NULL,
  numero_muestra INTEGER NOT NULL CHECK (numero_muestra >= 1 AND numero_muestra <= 100),
  hallazgo TEXT,
  correccion TEXT,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Liberación de Producto
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

-- 9. Almacenamiento/Encajado
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

-- 10. Parámetros y Métricas
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

-- 11. Firmas y Sellos
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

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_registro_desposte_lote ON registro_desposte(lote);
CREATE INDEX IF NOT EXISTS idx_registro_desposte_fecha ON registro_desposte(fecha_produccion);
CREATE INDEX IF NOT EXISTS idx_registro_desposte_estado ON registro_desposte(estado);
CREATE INDEX IF NOT EXISTS idx_desencajado_mpc_registro ON desencajado_mpc(registro_desposte_id);
CREATE INDEX IF NOT EXISTS idx_picado_molienda_registro ON picado_molienda(registro_desposte_id);
CREATE INDEX IF NOT EXISTS idx_empacado_embutido_registro ON empacado_embutido(registro_desposte_id);
CREATE INDEX IF NOT EXISTS idx_liberacion_producto_registro ON liberacion_producto(registro_desposte_id);
CREATE INDEX IF NOT EXISTS idx_almacenamiento_registro ON almacenamiento_encajado(registro_desposte_id);

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

-- Datos de ejemplo para pruebas
INSERT INTO registro_desposte (
  producto, lote, fecha_produccion, fecha_vencimiento, fecha_sacrificio,
  peso_trasladado_kg, peso_lanzado_kg, peso_obtenido_kg, usuario_registro
) VALUES (
  'Res 80/20', 'LOTE001-2024', '2024-12-06', '2024-12-20', '2024-12-05',
  1000.00, 950.00, 800.00, 'admin'
) ON CONFLICT DO NOTHING;