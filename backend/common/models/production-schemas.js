/**
 * Esquemas de base de datos basados en formatos Excel existentes
 * Estructura extraída de:
 * - PROGRAMACION PRODUCIÓN
 * - PROGRAMACIÓN DESPOSTE  
 * - Formatos de trazabilidad
 */

// 1. ORDEN DE PRODUCCIÓN (basado en PROGRAMACION PRODUCIÓN)
const OrdenProduccionSchema = {
  tableName: 'ordenes_produccion',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    
    // Información del producto
    linea: 'VARCHAR(100)', // ej: "LINEA INSTITUCIONAL"
    codigo_producto: 'VARCHAR(50)', // ej: "PE004001"
    producto: 'VARCHAR(200)', // ej: "Costilla Ahumada"
    tamano_lote: 'INTEGER', // ej: 1000
    
    // Parámetros de producción
    kg_base: 'DECIMAL(10,2)', // Kg Bq
    porcentaje_recuperacion: 'DECIMAL(5,2)', // % Rec
    
    // Programación semanal
    semana_inicio: 'DATE',
    semana_fin: 'DATE',
    
    // Estado y tracking
    estado: "VARCHAR(50) DEFAULT 'Programada'", // Programada, En Proceso, Finalizada
    fecha_creacion: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    usuario_creacion: 'VARCHAR(100)',
    
    // Metadatos
    observaciones: 'TEXT',
    prioridad: 'INTEGER DEFAULT 1'
  }
};

// 2. PROGRAMACIÓN DIARIA (desglose de la orden por días)
const ProgramacionDiariaSchema = {
  tableName: 'programacion_diaria',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    orden_produccion_id: 'INTEGER REFERENCES ordenes_produccion(id)',
    
    // Día específico
    fecha_programada: 'DATE',
    dia_semana: 'VARCHAR(20)', // Lunes, Martes, etc.
    
    // Detalles del lote diario
    numero_lote: 'VARCHAR(50)',
    codigo_lote: 'VARCHAR(50)',
    fecha_vencimiento: 'DATE',
    cantidad_programada: 'INTEGER',
    
    // Estado
    estado: "VARCHAR(50) DEFAULT 'Programado'", // Programado, En Proceso, Completado
    fecha_inicio_real: 'TIMESTAMP',
    fecha_fin_real: 'TIMESTAMP'
  }
};

// 3. PROGRAMACIÓN DE MATERIA PRIMA (basado en PROGRAMACIÓN DESPOSTE)
const ProgramacionMateriaPrimaSchema = {
  tableName: 'programacion_materia_prima',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    
    // Información del producto
    producto: 'VARCHAR(200)', // ej: "CHORIZO ANTIOQUEÑO"
    cantidad_a_procesar: 'DECIMAL(10,2)', // ej: 170.0
    
    // Programación semanal
    semana_inicio: 'DATE',
    semana_fin: 'DATE',
    
    // Estado
    estado: "VARCHAR(50) DEFAULT 'Programado'",
    fecha_creacion: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

// 4. DETALLE DE MATERIA PRIMA POR PRODUCTO
const DetalleMateriaPrimaSchema = {
  tableName: 'detalle_materia_prima',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    programacion_materia_prima_id: 'INTEGER REFERENCES programacion_materia_prima(id)',
    
    // Información de la materia prima
    materia_prima: 'VARCHAR(200)', // ej: "RES 80/20", "GRASA DE CERDO"
    
    // Programación diaria (kg por día)
    lunes: 'DECIMAL(10,2) DEFAULT 0',
    martes: 'DECIMAL(10,2) DEFAULT 0',
    miercoles: 'DECIMAL(10,2) DEFAULT 0',
    jueves: 'DECIMAL(10,2) DEFAULT 0',
    viernes: 'DECIMAL(10,2) DEFAULT 0',
    sabado: 'DECIMAL(10,2) DEFAULT 0',
    domingo: 'DECIMAL(10,2) DEFAULT 0',
    
    // Total
    total_semana: 'DECIMAL(10,2) GENERATED ALWAYS AS (lunes + martes + miercoles + jueves + viernes + sabado + domingo) STORED'
  }
};

// 5. TRAZABILIDAD DE PRODUCCIÓN (basado en PD-PTZ-R11)
const TrazabilidadProduccionSchema = {
  tableName: 'trazabilidad_produccion',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    orden_produccion_id: 'INTEGER REFERENCES ordenes_produccion(id)',
    
    // Información básica
    producto: 'VARCHAR(200)',
    lote: 'VARCHAR(50)',
    fecha_produccion: 'DATE',
    
    // Responsables
    responsable_produccion: 'VARCHAR(100)',
    turno: 'VARCHAR(50)',
    
    // Tiempos
    hora_inicio: 'TIME',
    hora_fin: 'TIME',
    
    // Estado y observaciones
    estado: "VARCHAR(50) DEFAULT 'En Proceso'",
    observaciones: 'TEXT',
    fecha_registro: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

// 6. MATERIA PRIMA UTILIZADA EN PRODUCCIÓN
const MateriaPrimaUtilizadaSchema = {
  tableName: 'materia_prima_utilizada',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    trazabilidad_produccion_id: 'INTEGER REFERENCES trazabilidad_produccion(id)',
    
    // Información de la materia prima
    materia_prima_carnica: 'VARCHAR(200)',
    lote_materia_prima: 'VARCHAR(50)',
    proveedor: 'VARCHAR(200)',
    
    // Cantidades y condiciones
    peso_kg: 'DECIMAL(10,2)',
    temperatura_c: 'DECIMAL(5,2)', // 0°C - 4°C
    
    // Fechas
    fecha_ingreso: 'DATE',
    fecha_vencimiento: 'DATE'
  }
};

// 7. TRAZABILIDAD DE EMPAQUE (basado en PD-PTZ-R12)
const TrazabilidadEmpaqueSchema = {
  tableName: 'trazabilidad_empaque',
  fields: {
    id: 'SERIAL PRIMARY KEY',
    trazabilidad_produccion_id: 'INTEGER REFERENCES trazabilidad_produccion(id)',
    
    // Información del producto
    producto: 'VARCHAR(200)',
    lote: 'VARCHAR(50)',
    fecha_produccion: 'DATE',
    fecha_vencimiento: 'DATE',
    
    // Proceso de precámara
    precamara_temperatura_final: 'DECIMAL(5,2)', // 40°C a 10°C
    precamara_hora_final: 'TIME',
    
    // Proceso de túnel
    tunel_hora_inicio: 'TIME',
    tunel_hora_final: 'TIME',
    
    // Descolgado
    descolgado_fecha: 'DATE',
    descolgado_hora_inicio: 'TIME',
    descolgado_hora_final: 'TIME',
    descolgado_temperatura: 'DECIMAL(5,2)', // 0°C - 4°C
    descolgado_responsable: 'VARCHAR(100)',
    
    // Picado o tajado
    estado_sierra_cuchilla: 'VARCHAR(100)',
    presentacion: 'VARCHAR(100)',
    peso: 'DECIMAL(10,2)',
    canastillas: 'INTEGER',
    
    // Estado
    fecha_registro: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

// Scripts de creación de tablas
const createTablesSQL = `
-- 1. Órdenes de Producción
CREATE TABLE IF NOT EXISTS ${OrdenProduccionSchema.tableName} (
  ${Object.entries(OrdenProduccionSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 2. Programación Diaria
CREATE TABLE IF NOT EXISTS ${ProgramacionDiariaSchema.tableName} (
  ${Object.entries(ProgramacionDiariaSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 3. Programación de Materia Prima
CREATE TABLE IF NOT EXISTS ${ProgramacionMateriaPrimaSchema.tableName} (
  ${Object.entries(ProgramacionMateriaPrimaSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 4. Detalle de Materia Prima
CREATE TABLE IF NOT EXISTS ${DetalleMateriaPrimaSchema.tableName} (
  ${Object.entries(DetalleMateriaPrimaSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 5. Trazabilidad de Producción
CREATE TABLE IF NOT EXISTS ${TrazabilidadProduccionSchema.tableName} (
  ${Object.entries(TrazabilidadProduccionSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 6. Materia Prima Utilizada
CREATE TABLE IF NOT EXISTS ${MateriaPrimaUtilizadaSchema.tableName} (
  ${Object.entries(MateriaPrimaUtilizadaSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- 7. Trazabilidad de Empaque
CREATE TABLE IF NOT EXISTS ${TrazabilidadEmpaqueSchema.tableName} (
  ${Object.entries(TrazabilidadEmpaqueSchema.fields).map(([key, value]) => `${key} ${value}`).join(',\n  ')}
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_orden_produccion_fecha ON ordenes_produccion(semana_inicio, semana_fin);
CREATE INDEX IF NOT EXISTS idx_programacion_diaria_fecha ON programacion_diaria(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_trazabilidad_lote ON trazabilidad_produccion(lote);
CREATE INDEX IF NOT EXISTS idx_trazabilidad_empaque_lote ON trazabilidad_empaque(lote);
`;

module.exports = {
  OrdenProduccionSchema,
  ProgramacionDiariaSchema,
  ProgramacionMateriaPrimaSchema,
  DetalleMateriaPrimaSchema,
  TrazabilidadProduccionSchema,
  MateriaPrimaUtilizadaSchema,
  TrazabilidadEmpaqueSchema,
  createTablesSQL
};