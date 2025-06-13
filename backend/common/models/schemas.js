const Joi = require('joi');

// Esquemas de validación para Órdenes
const ordenCreacionSchema = Joi.object({
  cliente: Joi.string().required().min(1).max(255),
  linea: Joi.string().valid('Desposte', 'Derivados').required(),
  turno: Joi.string().valid('Mañana', 'Tarde', 'Noche').optional(),
  fechaPlanificada: Joi.date().required(),
  cantidadPlanificada: Joi.number().integer().min(1).required()
});

const fichaCreacionSchema = Joi.object({
  proceso: Joi.string().required().min(1).max(255),
  materialConsumido: Joi.string().required().min(1).max(255),
  cantidad: Joi.number().positive().required(),
  tiempoProceso: Joi.number().integer().min(0).optional(),
  condiciones: Joi.object().optional()
});

// Esquemas de validación para Control de Calidad
const registroQCSchema = Joi.object({
  programaId: Joi.string().uuid().required(),
  valores: Joi.object().required(),
  hallazgos: Joi.string().optional().allow(''),
  acciones: Joi.string().optional().allow(''),
  fotos: Joi.array().items(Joi.string().uri()).optional(),
  ordenId: Joi.string().uuid().optional()
});

// Esquemas de validación para Inventarios
const movimientoInventarioSchema = Joi.object({
  articulo: Joi.string().required().min(1).max(255),
  cantidad: Joi.number().required(),
  tipo: Joi.string().valid('entrada', 'salida', 'ajuste').required(),
  motivo: Joi.string().optional().max(255),
  referencia: Joi.string().optional().max(255)
});

// Esquemas comunes
const uuidSchema = Joi.string().uuid();
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

module.exports = {
  ordenCreacionSchema,
  fichaCreacionSchema,
  registroQCSchema,
  movimientoInventarioSchema,
  uuidSchema,
  paginationSchema
};