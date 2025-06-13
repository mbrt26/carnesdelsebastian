/**
 * Esquemas específicos para el módulo de registro de proceso de Desposte
 * Basado en los 9 campos específicos requeridos para el proceso de Desposte
 */

// 1. REGISTRO PRINCIPAL DE DESPOSTE
const RegistroDesposteSchema = {
  tableName: 'registro_desposte',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    
    // Relación con orden de producción
    orden_id: 'UUID REFERENCES ordenes(id) ON DELETE SET NULL',
    
    // 1. Encabezado
    producto: 'VARCHAR(200) NOT NULL',
    lote: 'VARCHAR(50) NOT NULL',
    fecha_produccion: 'DATE NOT NULL',
    fecha_vencimiento: 'DATE NOT NULL',
    fecha_sacrificio: 'DATE NOT NULL',
    peso_trasladado_kg: 'DECIMAL(10,2) NOT NULL',
    peso_lanzado_kg: 'DECIMAL(10,2) NOT NULL',
    peso_obtenido_kg: 'DECIMAL(10,2) NOT NULL',
    
    // Estado y metadata
    estado: "VARCHAR(50) DEFAULT 'En Proceso'", // En Proceso, Completado, Rechazado
    fecha_creacion: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    fecha_actualizacion: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    usuario_registro: 'VARCHAR(100)',
    
    // Observaciones generales
    observaciones: 'TEXT'
  }
};

// 2. DESENCAJADO / ALISTAMIENTO DE M.P.C.
const DesencajadoMPCSchema = {
  tableName: 'desencajado_mpc',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    registro_desposte_id: 'INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE',
    
    // Información de materia prima
    numero_materia_prima_carnica: 'VARCHAR(50) NOT NULL',
    lote_materia_prima: 'VARCHAR(50) NOT NULL',
    proveedor: 'VARCHAR(200) NOT NULL',
    peso_kg: 'DECIMAL(10,2) NOT NULL',
    hora: 'TIME NOT NULL',
    
    // Temperaturas del producto
    temperatura_t1: 'DECIMAL(5,2)', // °C
    temperatura_t2: 'DECIMAL(5,2)', // °C
    temperatura_t3: 'DECIMAL(5,2)', // °C
    
    // Evaluación sensorial
    color: 'VARCHAR(100)',
    textura: 'VARCHAR(100)',
    olor: 'VARCHAR(100)',
    conformidad: 'BOOLEAN NOT NULL', // true = Sí, false = No
    
    // Responsabilidad y control
    responsable_desencajado: 'VARCHAR(100) NOT NULL',
    hallazgo: 'TEXT',
    correccion: 'TEXT',
    
    fecha_registro: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

// 3. PICADO / TAJADO Y MOLIENDA
const PicadoMoliendaSchema = {
  tableName: 'picado_molienda',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    registro_desposte_id: 'INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE',
    
    // Información básica
    numero_materia_prima: 'VARCHAR(50) NOT NULL',
    estado_sierra: 'VARCHAR(100) NOT NULL',
    hora_inicio: 'TIME NOT NULL',
    hora_fin: 'TIME NOT NULL',
    
    // Temperaturas del producto
    temperatura_t1: 'DECIMAL(5,2)', // °C
    temperatura_t2: 'DECIMAL(5,2)', // °C
    temperatura_t3: 'DECIMAL(5,2)', // °C
    
    // Picado/Tajado
    cantidad_picada_tajada_kg: 'DECIMAL(10,2) NOT NULL',
    responsable_picado: 'VARCHAR(100) NOT NULL',
    
    // Molienda
    disco_molienda: 'VARCHAR(50)',
    kg_molidos: 'DECIMAL(10,2)',
    responsable_molienda: 'VARCHAR(100)',
    
    fecha_registro: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

// 4. SUBPRODUCTOS DE PICADO/MOLIENDA
const SubproductosSchema = {
  tableName: 'subproductos',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    picado_molienda_id: 'INTEGER REFERENCES picado_molienda(id) ON DELETE CASCADE',
    
    peso_kg: 'DECIMAL(10,2) NOT NULL',
    destino: 'VARCHAR(200) NOT NULL',
    reclasificacion: 'VARCHAR(200)',
    consumo_animal: 'BOOLEAN DEFAULT false',
    
    fecha_registro: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

// 5. EMPACADO / EMBUTIDO
const EmpacadoEmbutidoSchema = {
  tableName: 'empacado_embutido',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    registro_desposte_id: 'INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE',
    
    // Información del proceso
    presentacion: 'VARCHAR(100) NOT NULL',
    hora_inicio: 'TIME NOT NULL',
    hora_fin: 'TIME NOT NULL',
    
    // Temperaturas del producto
    temperatura_t1: 'DECIMAL(5,2)', // °C
    temperatura_t2: 'DECIMAL(5,2)', // °C
    temperatura_t3: 'DECIMAL(5,2)', // °C
    
    // Producción
    arranque_maquina_unidades: 'INTEGER',
    tiras_kg: 'DECIMAL(10,2)',
    bolsas_averiadas_unidades: 'INTEGER',
    unidades_empacadas: 'INTEGER NOT NULL',
    conteo_total: 'INTEGER NOT NULL',
    conformidad: 'BOOLEAN NOT NULL',
    
    // Responsabilidad
    responsable_empacado: 'VARCHAR(100) NOT NULL',
    responsable_fechado: 'VARCHAR(100) NOT NULL',
    
    fecha_registro: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

// 6. MATERIAL DE EMPAQUE
const MaterialEmpaqueSchema = {
  tableName: 'material_empaque',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    empacado_embutido_id: 'INTEGER REFERENCES empacado_embutido(id) ON DELETE CASCADE',
    
    lote_material: 'VARCHAR(50) NOT NULL',
    proveedor_material: 'VARCHAR(200) NOT NULL',
    
    fecha_registro: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

// 7. MUESTREO DE PESO
const MuestreoPesoSchema = {
  tableName: 'muestreo_peso',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    registro_desposte_id: 'INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE',
    
    // Peso muestreado (1 a 100) según planilla de muestreo
    peso_muestreado: 'DECIMAL(10,2) NOT NULL',
    numero_muestra: 'INTEGER NOT NULL CHECK (numero_muestra >= 1 AND numero_muestra <= 100)',
    
    // Control de calidad
    hallazgo: 'TEXT',
    correccion: 'TEXT',
    
    fecha_registro: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

// 8. LIBERACIÓN DE PRODUCTO TERMINADO / ANÁLISIS SENSORIAL
const LiberacionProductoSchema = {
  tableName: 'liberacion_producto',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    registro_desposte_id: 'INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE',
    
    // Criterios de liberación
    criterio_presentacion_peso: 'BOOLEAN NOT NULL',
    criterio_sellado: 'BOOLEAN NOT NULL',
    criterio_codificado: 'BOOLEAN NOT NULL',
    criterio_rotulado: 'BOOLEAN NOT NULL',
    
    // Análisis sensorial
    item_aspecto: 'VARCHAR(100)',
    item_olor: 'VARCHAR(100)',
    item_sabor: 'VARCHAR(100)',
    libre_metales: 'BOOLEAN NOT NULL',
    
    // Resultado general
    resultado: "VARCHAR(20) NOT NULL CHECK (resultado IN ('Conforme', 'No conforme'))",
    responsable: 'VARCHAR(100) NOT NULL',
    correccion: 'TEXT',
    
    fecha_registro: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

// 9. ALMACENAMIENTO / ENCAJADO
const AlmacenamientoSchema = {
  tableName: 'almacenamiento_encajado',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    registro_desposte_id: 'INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE',
    
    // Información del almacenamiento
    producto: 'VARCHAR(200) NOT NULL',
    numero_canastillas: 'INTEGER NOT NULL',
    temperatura_cuarto_frio: 'DECIMAL(5,2) NOT NULL DEFAULT -18.0', // -18°C
    responsable: 'VARCHAR(100) NOT NULL',
    
    // Tiempos
    hora_inicio: 'TIME NOT NULL',
    hora_fin: 'TIME NOT NULL',
    
    // Temperaturas del producto
    temperatura_t1: 'DECIMAL(5,2)', // °C
    temperatura_t2: 'DECIMAL(5,2)', // °C
    temperatura_t3: 'DECIMAL(5,2)', // °C
    
    // Control de calidad
    averias: 'TEXT',
    hallazgo: 'TEXT',
    correccion: 'TEXT',
    
    fecha_registro: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

// 10. PARÁMETROS ADICIONALES Y MÉTRICAS
const ParametrosMetricasSchema = {
  tableName: 'parametros_metricas',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    registro_desposte_id: 'INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE',
    
    // Rangos de temperatura según tipo
    tipo_producto: "VARCHAR(50) NOT NULL CHECK (tipo_producto IN ('bovino', 'porcino', 'avicola', 'congelado'))",
    rango_temperatura_min: 'DECIMAL(5,2)', // °C
    rango_temperatura_max: 'DECIMAL(5,2)', // °C
    
    // Métricas de producción
    tiempo_produccion_horas: 'DECIMAL(5,2)',
    kg_hora_hombre: 'DECIMAL(10,2)',
    orden_produccion: 'VARCHAR(50)',
    salida_almacen_ept: 'VARCHAR(50)',
    orden_empaque: 'VARCHAR(50)',
    
    // Merma
    porcentaje_merma_peso_bruto: 'DECIMAL(5,2)',
    porcentaje_merma_subproductos: 'DECIMAL(5,2)',
    
    fecha_registro: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

// 11. FIRMAS Y SELLOS
const FirmasSellosSchema = {
  tableName: 'firmas_sellos',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    registro_desposte_id: 'INTEGER REFERENCES registro_desposte(id) ON DELETE CASCADE',
    
    // Firmas
    recibido_logistica: 'VARCHAR(100)',
    fecha_recibido_logistica: 'TIMESTAMP',
    
    coordinador_desposte: 'VARCHAR(100)',
    fecha_coordinador_desposte: 'TIMESTAMP',
    
    liberado_calidad: 'VARCHAR(100)',
    fecha_liberado_calidad: 'TIMESTAMP',
    
    // Sellos digitales o referencias
    sello_logistica: 'VARCHAR(200)',
    sello_coordinador: 'VARCHAR(200)',
    sello_calidad: 'VARCHAR(200)',
    
    fecha_registro: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

// Script SQL para crear todas las tablas
const createDesposteTablesSQL = `
-- 1. Registro principal de Desposte
CREATE TABLE IF NOT EXISTS ${RegistroDesposteSchema.tableName} (
  ${Object.entries(RegistroDesposteSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 2. Desencajado/Alistamiento MPC
CREATE TABLE IF NOT EXISTS ${DesencajadoMPCSchema.tableName} (
  ${Object.entries(DesencajadoMPCSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 3. Picado/Molienda
CREATE TABLE IF NOT EXISTS ${PicadoMoliendaSchema.tableName} (
  ${Object.entries(PicadoMoliendaSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 4. Subproductos
CREATE TABLE IF NOT EXISTS ${SubproductosSchema.tableName} (
  ${Object.entries(SubproductosSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 5. Empacado/Embutido
CREATE TABLE IF NOT EXISTS ${EmpacadoEmbutidoSchema.tableName} (
  ${Object.entries(EmpacadoEmbutidoSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 6. Material de Empaque
CREATE TABLE IF NOT EXISTS ${MaterialEmpaqueSchema.tableName} (
  ${Object.entries(MaterialEmpaqueSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 7. Muestreo de Peso
CREATE TABLE IF NOT EXISTS ${MuestreoPesoSchema.tableName} (
  ${Object.entries(MuestreoPesoSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 8. Liberación de Producto
CREATE TABLE IF NOT EXISTS ${LiberacionProductoSchema.tableName} (
  ${Object.entries(LiberacionProductoSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 9. Almacenamiento/Encajado
CREATE TABLE IF NOT EXISTS ${AlmacenamientoSchema.tableName} (
  ${Object.entries(AlmacenamientoSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 10. Parámetros y Métricas
CREATE TABLE IF NOT EXISTS ${ParametrosMetricasSchema.tableName} (
  ${Object.entries(ParametrosMetricasSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 11. Firmas y Sellos
CREATE TABLE IF NOT EXISTS ${FirmasSellosSchema.tableName} (
  ${Object.entries(FirmasSellosSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
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
`;

// Validaciones de rangos de temperatura según tipo de producto
const validacionesTemperatura = {
  bovino: { min: 0, max: 6 },      // 0-6°C
  porcino: { min: 0, max: 6 },     // 0-6°C  
  avicola: { min: 0, max: 4 },     // 0-4°C
  congelado: { min: -18, max: -18 } // -18°C
};

module.exports = {
  RegistroDesposteSchema,
  DesencajadoMPCSchema,
  PicadoMoliendaSchema,
  SubproductosSchema,
  EmpacadoEmbutidoSchema,
  MaterialEmpaqueSchema,
  MuestreoPesoSchema,
  LiberacionProductoSchema,
  AlmacenamientoSchema,
  ParametrosMetricasSchema,
  FirmasSellosSchema,
  createDesposteTablesSQL,
  validacionesTemperatura
};