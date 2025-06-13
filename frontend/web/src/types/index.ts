// Tipos para Órdenes
export interface Orden {
  id: string;
  cliente: string;
  linea: 'Desposte' | 'Derivados';
  turno?: 'Mañana' | 'Tarde' | 'Noche';
  fechaPlanificada: string;
  cantidadPlanificada: number;
  estado: 'Creada' | 'EnProceso' | 'Finalizada';
  fechaCreacion: string;
  fichaTrazabilidad?: FichaTrazabilidad[];
}

export interface OrdenCreacion {
  cliente: string;
  linea: 'Desposte' | 'Derivados';
  turno?: 'Mañana' | 'Tarde' | 'Noche';
  fechaPlanificada: string;
  cantidadPlanificada: number;
}

export interface FichaTrazabilidad {
  id: string;
  ordenId: string;
  proceso: string;
  materialConsumido: string;
  cantidad: number;
  tiempoProceso?: number;
  condiciones?: Record<string, any>;
  timestamp: string;
}

export interface FichaCreacion {
  proceso: string;
  materialConsumido: string;
  cantidad: number;
  tiempoProceso?: number;
  condiciones?: Record<string, any>;
}

// Tipos para Control de Calidad
export interface ProgramaQC {
  id: string;
  nombre: string;
  frecuencia: string;
  parametros: Record<string, any>;
  activo: boolean;
}

export interface RegistroQC {
  id: string;
  programaId: string;
  programaNombre: string;
  valores: Record<string, any>;
  hallazgos?: string;
  acciones?: string;
  fotos?: string[];
  ordenId?: string;
  timestamp: string;
}

export interface RegistroQCCreacion {
  programaId: string;
  valores: Record<string, any>;
  hallazgos?: string;
  acciones?: string;
  fotos?: string[];
  ordenId?: string;
}

// Tipos para Inventarios
export interface Bodega {
  id: string;
  nombre: string;
  tipo: string;
  ubicacion?: string;
  capacidad?: number;
  temperatura?: number;
  activa: boolean;
  totalArticulos?: number;
}

export interface ItemInventario {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  stockMinimo: number;
  stockMaximo: number;
  bodegaId: string;
  cantidadDisponible: number;
  cantidadReservada: number;
  ultimoMovimiento?: string;
}

export interface StockItem {
  articulo: string;
  articuloNombre: string;
  cantidadDisponible: number;
  cantidadReservada: number;
  unidad: string;
  categoria: string;
  ultimoMovimiento: string;
}

export interface MovimientoInventario {
  id: string;
  bodegaId: string;
  articulo: string;
  articuloNombre?: string;
  cantidad: number;
  tipo: 'entrada' | 'salida' | 'ajuste';
  motivo?: string;
  referencia?: string;
  usuario?: string;
  timestamp: string;
}

export interface MovimientoCreacion {
  articulo: string;
  cantidad: number;
  tipo: 'entrada' | 'salida' | 'ajuste';
  motivo?: string;
  referencia?: string;
}

// Tipos de autenticación
export interface Usuario {
  id: string;
  username: string;
  role: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Usuario;
}

// Tipos de respuesta API
export interface ApiError {
  error: string;
  details?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ==================== TIPOS PARA DESPOSTE ====================

// Tipo principal de registro de Desposte
export interface RegistroDesposte {
  id: string;
  ordenId?: string;
  producto: string;
  lote: string;
  fechaProduccion: string;
  fechaVencimiento: string;
  fechaSacrificio: string;
  pesoTrasladado: number;
  pesoLanzado: number;
  pesoObtenido: number;
  estado: 'En Proceso' | 'Completado' | 'Rechazado';
  fechaCreacion: string;
  fechaActualizacion: string;
  usuarioRegistro: string;
  observaciones?: string;
  // Información de la orden asociada (si existe)
  orden?: {
    cliente: string;
    linea: string;
    turno?: string;
    fechaPlanificada: string;
    cantidadPlanificada: number;
    ordenEstado: string;
  };
}

export interface RegistroDesposteCreacion {
  ordenId?: string;
  producto: string;
  lote: string;
  fechaProduccion: string;
  fechaVencimiento: string;
  fechaSacrificio: string;
  canastillasRecibidas: number;
  pesoTrasladado: number;
  temperaturaCarne: number;
  tipoCanal: string;
  pesoLanzado: number;
  pesoObtenido: number;
  rendimiento: number;
  merma: number;
  numeroLote: string;
  numeroGuia: string;
  usuarioRegistro?: string;
  observaciones?: string;
  estado: string;
}

// Desencajado / Alistamiento de M.P.C.
export interface DesencajadoMPC {
  id: string;
  registroDesposteId: string;
  numeroMateriaPrimaCarnica: string;
  loteMateriaPrima: string;
  proveedor: string;
  peso: number;
  hora: string;
  temperaturaT1?: number;
  temperaturaT2?: number;
  temperaturaT3?: number;
  color?: string;
  textura?: string;
  olor?: string;
  conformidad: boolean;
  responsableDesencajado: string;
  hallazgo?: string;
  correccion?: string;
  fechaRegistro: string;
}

export interface DesencajadoMPCCreacion {
  numeroMateriaPrimaCarnica: string;
  loteMateriaPrima: string;
  proveedor: string;
  peso: number;
  hora: string;
  temperaturaT1?: number;
  temperaturaT2?: number;
  temperaturaT3?: number;
  color?: string;
  textura?: string;
  olor?: string;
  conformidad: boolean;
  responsableDesencajado: string;
  hallazgo?: string;
  correccion?: string;
}

// Picado / Molienda
export interface Subproducto {
  id?: string;
  peso: number;
  destino: string;
  reclasificacion?: string;
  consumoAnimal: boolean;
}

export interface PicadoMolienda {
  id: string;
  registroDesposteId: string;
  numeroMateriaPrima: string;
  estadoSierra: string;
  horaInicio: string;
  horaFin: string;
  temperaturaT1?: number;
  temperaturaT2?: number;
  temperaturaT3?: number;
  cantidadPicadaTajada: number;
  responsablePicado: string;
  discoMolienda?: string;
  kgMolidos?: number;
  responsableMolienda?: string;
  subproductos: Subproducto[];
  fechaRegistro: string;
}

export interface PicadoMoliendaCreacion {
  numeroMateriaPrima: string;
  estadoSierra: string;
  horaInicio: string;
  horaFin: string;
  temperaturaT1?: number;
  temperaturaT2?: number;
  temperaturaT3?: number;
  cantidadPicadaTajada: number;
  responsablePicado: string;
  discoMolienda?: string;
  kgMolidos?: number;
  responsableMolienda?: string;
  subproductos?: Subproducto[];
}

// Empacado / Embutido
export interface MaterialEmpaque {
  lote: string;
  proveedor: string;
}

export interface EmpacadoEmbutido {
  id: string;
  registroDesposteId: string;
  presentacion: string;
  horaInicio: string;
  horaFin: string;
  temperaturaT1?: number;
  temperaturaT2?: number;
  temperaturaT3?: number;
  arranqueMaquina?: number;
  tiras?: number;
  bolsasAveriadas?: number;
  unidadesEmpacadas: number;
  conteoTotal: number;
  conformidad: boolean;
  responsableEmpacado: string;
  responsableFechado: string;
  materialEmpaque?: MaterialEmpaque;
  fechaRegistro: string;
}

export interface EmpacadoEmbutidoCreacion {
  presentacion: string;
  horaInicio: string;
  horaFin: string;
  temperaturaT1?: number;
  temperaturaT2?: number;
  temperaturaT3?: number;
  arranqueMaquina?: number;
  tiras?: number;
  bolsasAveriadas?: number;
  unidadesEmpacadas: number;
  conteoTotal: number;
  conformidad: boolean;
  responsableEmpacado: string;
  responsableFechado: string;
  materialEmpaque?: MaterialEmpaque;
}

// Muestreo de Peso
export interface MuestreoPeso {
  id: string;
  registroDesposteId: string;
  pesoMuestreado: number;
  numeroMuestra: number;
  hallazgo?: string;
  correccion?: string;
  fechaRegistro: string;
}

export interface MuestreoPesoCreacion {
  pesoMuestreado: number;
  numeroMuestra: number;
  hallazgo?: string;
  correccion?: string;
}

// Liberación de Producto
export interface CriteriosLiberacion {
  presentacionPeso: boolean;
  sellado: boolean;
  codificado: boolean;
  rotulado: boolean;
}

export interface AnalisisSensorial {
  aspecto?: string;
  olor?: string;
  sabor?: string;
  libreMetales: boolean;
}

export interface LiberacionProducto {
  id: string;
  registroDesposteId: string;
  criterios: CriteriosLiberacion;
  analisisSensorial: AnalisisSensorial;
  resultado: 'Conforme' | 'No conforme';
  responsable: string;
  correccion?: string;
  fechaRegistro: string;
}

export interface LiberacionProductoCreacion {
  criterioPresentacionPeso: boolean;
  criterioSellado: boolean;
  criterioCodificado: boolean;
  criterioRotulado: boolean;
  itemAspecto?: string;
  itemOlor?: string;
  itemSabor?: string;
  libreMetales: boolean;
  resultado: 'Conforme' | 'No conforme';
  responsable: string;
  correccion?: string;
}

// Almacenamiento
export interface Almacenamiento {
  id: string;
  registroDesposteId: string;
  producto: string;
  numeroCanastillas: number;
  temperaturaCuartoFrio: number;
  responsable: string;
  horaInicio: string;
  horaFin: string;
  temperaturaT1?: number;
  temperaturaT2?: number;
  temperaturaT3?: number;
  averias?: string;
  hallazgo?: string;
  correccion?: string;
  fechaRegistro: string;
}

export interface AlmacenamientoCreacion {
  producto: string;
  numeroCanastillas: number;
  temperaturaCuartoFrio?: number;
  responsable: string;
  horaInicio: string;
  horaFin: string;
  temperaturaT1?: number;
  temperaturaT2?: number;
  temperaturaT3?: number;
  averias?: string;
  hallazgo?: string;
  correccion?: string;
}

// Parámetros y Métricas
export interface RangoTemperatura {
  min: number;
  max: number;
}

export interface Merma {
  pesoBruto?: number;
  subproductos?: number;
}

export interface ParametrosMetricas {
  id: string;
  registroDesposteId: string;
  tipoProducto: 'bovino' | 'porcino' | 'avicola' | 'congelado';
  rangoTemperatura: RangoTemperatura;
  tiempoProduccion?: number;
  kgHoraHombre?: number;
  ordenProduccion?: string;
  salidaAlmacenEPT?: string;
  ordenEmpaque?: string;
  merma: Merma;
  fechaRegistro: string;
}

export interface ParametrosMetricasCreacion {
  tipoProducto: 'bovino' | 'porcino' | 'avicola' | 'congelado';
  tiempoProduccion?: number;
  kgHoraHombre?: number;
  ordenProduccion?: string;
  salidaAlmacenEPT?: string;
  ordenEmpaque?: string;
  porcentajeMermaPesoBruto?: number;
  porcentajeMermaSubproductos?: number;
}

// Firmas y Sellos
export interface Firma {
  nombre?: string;
  fecha?: string;
  sello?: string;
}

export interface FirmasSellos {
  id: string;
  registroDesposteId: string;
  firmas: {
    recibidoLogistica: Firma;
    coordinadorDesposte: Firma;
    liberadoCalidad: Firma;
  };
  fechaRegistro: string;
}

export interface FirmasSellosCreacion {
  recibidoLogistica?: string;
  fechaRecibidoLogistica?: string;
  coordinadorDesposte?: string;
  fechaCoordinadorDesposte?: string;
  liberadoCalidad?: string;
  fechaLiberadoCalidad?: string;
  selloLogistica?: string;
  selloCoordinador?: string;
  selloCalidad?: string;
}

// Registro completo de Desposte
export interface RegistroDesposteCompleto {
  registro: RegistroDesposte;
  desencajado: DesencajadoMPC[];
  picado: PicadoMolienda[];
  empacado: EmpacadoEmbutido[];
  muestreo: MuestreoPeso[];
  liberacion: LiberacionProducto[];
  almacenamiento: Almacenamiento[];
  parametros: ParametrosMetricas[];
  firmas: FirmasSellos[];
}

// Estadísticas de Desposte
export interface EstadisticasDesposte {
  totalRegistros: number;
  completados: number;
  enProceso: number;
  rechazados: number;
  promedioPesoObtenido: number;
  totalPesoProducido: number;
  promedioRendimiento: number;
}

// Validaciones de temperatura
export interface ValidacionTemperatura {
  min: number;
  max: number;
}

export interface ValidacionesTemperatura {
  bovino: ValidacionTemperatura;
  porcino: ValidacionTemperatura;
  avicola: ValidacionTemperatura;
  congelado: ValidacionTemperatura;
}

// Filtros para consultas
export interface FiltrosDesposte {
  ordenId?: string;
  lote?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: 'En Proceso' | 'Completado' | 'Rechazado';
}