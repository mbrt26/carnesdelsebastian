const logger = require('../../common/utils/logger');
const { validacionesTemperatura } = require('../../common/models/desposte-schemas');
const OrdenesService = require('./ordenesService');

class DesposteService {
  constructor(db) {
    this.db = db;
    this.ordenesService = new OrdenesService(db);
  }

  // Método helper para actualizar estado de orden automáticamente
  async actualizarEstadoOrdenSiNecesario(ordenId) {
    if (ordenId) {
      try {
        await this.ordenesService.actualizarEstadoOrdenPorDesposte(ordenId);
      } catch (error) {
        logger.warn('No se pudo actualizar estado de orden automáticamente', { 
          ordenId, 
          error: error.message 
        });
      }
    }
  }

  // 1. REGISTRO PRINCIPAL DE DESPOSTE
  async crearRegistroDesposte(registroData) {
    try {
      const query = `
        INSERT INTO registro_desposte 
        (orden_id, producto, lote, fecha_produccion, fecha_vencimiento, fecha_sacrificio, 
         peso_trasladado_kg, peso_lanzado_kg, peso_obtenido_kg, usuario_registro, observaciones)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const valores = [
        registroData.ordenId || null,
        registroData.producto,
        registroData.lote,
        registroData.fechaProduccion,
        registroData.fechaVencimiento,
        registroData.fechaSacrificio,
        registroData.pesoTrasladado,
        registroData.pesoLanzado,
        registroData.pesoObtenido,
        registroData.usuarioRegistro,
        registroData.observaciones
      ];

      const result = await this.db.query(query, valores);
      logger.info('Registro de Desposte creado', { 
        registroId: result.rows[0].id, 
        lote: registroData.lote 
      });

      const registroFormateado = this.formatearRegistroDesposte(result.rows[0]);
      
      // Actualizar estado de la orden automáticamente
      await this.actualizarEstadoOrdenSiNecesario(registroData.ordenId);

      return registroFormateado;
    } catch (error) {
      logger.error('Error creando registro de Desposte', { error: error.message, registroData });
      throw error;
    }
  }

  // 2. DESENCAJADO / ALISTAMIENTO DE M.P.C.
  async crearDesencajadoMPC(registroDesposteId, desencajadoData) {
    try {
      const query = `
        INSERT INTO desencajado_mpc 
        (registro_desposte_id, numero_materia_prima_carnica, lote_materia_prima, proveedor, 
         peso_kg, hora, temperatura_t1, temperatura_t2, temperatura_t3, color, textura, olor, 
         conformidad, responsable_desencajado, hallazgo, correccion)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;

      const valores = [
        registroDesposteId,
        desencajadoData.numeroMateriaPrimaCarnica,
        desencajadoData.loteMateriaPrima,
        desencajadoData.proveedor,
        desencajadoData.peso,
        desencajadoData.hora,
        desencajadoData.temperaturaT1,
        desencajadoData.temperaturaT2,
        desencajadoData.temperaturaT3,
        desencajadoData.color,
        desencajadoData.textura,
        desencajadoData.olor,
        desencajadoData.conformidad,
        desencajadoData.responsableDesencajado,
        desencajadoData.hallazgo,
        desencajadoData.correccion
      ];

      const result = await this.db.query(query, valores);
      logger.info('Desencajado MPC registrado', { 
        desencajadoId: result.rows[0].id,
        registroDesposteId 
      });

      return this.formatearDesencajadoMPC(result.rows[0]);
    } catch (error) {
      logger.error('Error registrando desencajado MPC', { error: error.message, desencajadoData });
      throw error;
    }
  }

  // 3. PICADO / MOLIENDA
  async crearPicadoMolienda(registroDesposteId, picadoData) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Insertar picado/molienda
      const queryPicado = `
        INSERT INTO picado_molienda 
        (registro_desposte_id, numero_materia_prima, estado_sierra, hora_inicio, hora_fin,
         temperatura_t1, temperatura_t2, temperatura_t3, cantidad_picada_tajada_kg,
         responsable_picado, disco_molienda, kg_molidos, responsable_molienda)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const valoresPicado = [
        registroDesposteId,
        picadoData.numeroMateriaPrima,
        picadoData.estadoSierra,
        picadoData.horaInicio,
        picadoData.horaFin,
        picadoData.temperaturaT1,
        picadoData.temperaturaT2,
        picadoData.temperaturaT3,
        picadoData.cantidadPicadaTajada,
        picadoData.responsablePicado,
        picadoData.discoMolienda,
        picadoData.kgMolidos,
        picadoData.responsableMolienda
      ];

      const resultPicado = await client.query(queryPicado, valoresPicado);
      const picadoId = resultPicado.rows[0].id;

      // Insertar subproductos si existen
      if (picadoData.subproductos && picadoData.subproductos.length > 0) {
        for (const subproducto of picadoData.subproductos) {
          const querySubproducto = `
            INSERT INTO subproductos 
            (picado_molienda_id, peso_kg, destino, reclasificacion, consumo_animal)
            VALUES ($1, $2, $3, $4, $5)
          `;

          await client.query(querySubproducto, [
            picadoId,
            subproducto.peso,
            subproducto.destino,
            subproducto.reclasificacion,
            subproducto.consumoAnimal
          ]);
        }
      }

      await client.query('COMMIT');
      
      logger.info('Picado/Molienda registrado', { 
        picadoId,
        registroDesposteId,
        subproductos: picadoData.subproductos?.length || 0
      });

      return this.formatearPicadoMolienda(resultPicado.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error registrando picado/molienda', { error: error.message, picadoData });
      throw error;
    } finally {
      client.release();
    }
  }

  // 4. EMPACADO / EMBUTIDO
  async crearEmpacadoEmbutido(registroDesposteId, empacadoData) {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Insertar empacado/embutido
      const queryEmpacado = `
        INSERT INTO empacado_embutido 
        (registro_desposte_id, presentacion, hora_inicio, hora_fin, temperatura_t1, 
         temperatura_t2, temperatura_t3, arranque_maquina_unidades, tiras_kg,
         bolsas_averiadas_unidades, unidades_empacadas, conteo_total, conformidad,
         responsable_empacado, responsable_fechado)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const valoresEmpacado = [
        registroDesposteId,
        empacadoData.presentacion,
        empacadoData.horaInicio,
        empacadoData.horaFin,
        empacadoData.temperaturaT1,
        empacadoData.temperaturaT2,
        empacadoData.temperaturaT3,
        empacadoData.arranqueMaquina,
        empacadoData.tiras,
        empacadoData.bolsasAveriadas,
        empacadoData.unidadesEmpacadas,
        empacadoData.conteoTotal,
        empacadoData.conformidad,
        empacadoData.responsableEmpacado,
        empacadoData.responsableFechado
      ];

      const resultEmpacado = await client.query(queryEmpacado, valoresEmpacado);
      const empacadoId = resultEmpacado.rows[0].id;

      // Insertar material de empaque
      if (empacadoData.materialEmpaque) {
        const queryMaterial = `
          INSERT INTO material_empaque 
          (empacado_embutido_id, lote_material, proveedor_material)
          VALUES ($1, $2, $3)
        `;

        await client.query(queryMaterial, [
          empacadoId,
          empacadoData.materialEmpaque.lote,
          empacadoData.materialEmpaque.proveedor
        ]);
      }

      await client.query('COMMIT');
      
      logger.info('Empacado/Embutido registrado', { 
        empacadoId,
        registroDesposteId
      });

      return this.formatearEmpacadoEmbutido(resultEmpacado.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error registrando empacado/embutido', { error: error.message, empacadoData });
      throw error;
    } finally {
      client.release();
    }
  }

  // 5. MUESTREO DE PESO
  async crearMuestreoPeso(registroDesposteId, muestreoData) {
    try {
      const query = `
        INSERT INTO muestreo_peso 
        (registro_desposte_id, peso_muestreado, numero_muestra, hallazgo, correccion)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const valores = [
        registroDesposteId,
        muestreoData.pesoMuestreado,
        muestreoData.numeroMuestra,
        muestreoData.hallazgo,
        muestreoData.correccion
      ];

      const result = await this.db.query(query, valores);
      logger.info('Muestreo de peso registrado', { 
        muestreoId: result.rows[0].id,
        registroDesposteId 
      });

      return this.formatearMuestreoPeso(result.rows[0]);
    } catch (error) {
      logger.error('Error registrando muestreo de peso', { error: error.message, muestreoData });
      throw error;
    }
  }

  // 6. LIBERACIÓN DE PRODUCTO
  async crearLiberacionProducto(registroDesposteId, liberacionData) {
    try {
      const query = `
        INSERT INTO liberacion_producto 
        (registro_desposte_id, criterio_presentacion_peso, criterio_sellado, criterio_codificado,
         criterio_rotulado, item_aspecto, item_olor, item_sabor, libre_metales, resultado,
         responsable, correccion)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const valores = [
        registroDesposteId,
        liberacionData.criterioPresentacionPeso,
        liberacionData.criterioSellado,
        liberacionData.criterioCodificado,
        liberacionData.criterioRotulado,
        liberacionData.itemAspecto,
        liberacionData.itemOlor,
        liberacionData.itemSabor,
        liberacionData.libreMetales,
        liberacionData.resultado,
        liberacionData.responsable,
        liberacionData.correccion
      ];

      const result = await this.db.query(query, valores);
      logger.info('Liberación de producto registrada', { 
        liberacionId: result.rows[0].id,
        registroDesposteId,
        resultado: liberacionData.resultado
      });

      return this.formatearLiberacionProducto(result.rows[0]);
    } catch (error) {
      logger.error('Error registrando liberación de producto', { error: error.message, liberacionData });
      throw error;
    }
  }

  // 7. ALMACENAMIENTO
  async crearAlmacenamiento(registroDesposteId, almacenamientoData) {
    try {
      const query = `
        INSERT INTO almacenamiento_encajado 
        (registro_desposte_id, producto, numero_canastillas, temperatura_cuarto_frio,
         responsable, hora_inicio, hora_fin, temperatura_t1, temperatura_t2, temperatura_t3,
         averias, hallazgo, correccion)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const valores = [
        registroDesposteId,
        almacenamientoData.producto,
        almacenamientoData.numeroCanastillas,
        almacenamientoData.temperaturaCuartoFrio || -18.0,
        almacenamientoData.responsable,
        almacenamientoData.horaInicio,
        almacenamientoData.horaFin,
        almacenamientoData.temperaturaT1,
        almacenamientoData.temperaturaT2,
        almacenamientoData.temperaturaT3,
        almacenamientoData.averias,
        almacenamientoData.hallazgo,
        almacenamientoData.correccion
      ];

      const result = await this.db.query(query, valores);
      logger.info('Almacenamiento registrado', { 
        almacenamientoId: result.rows[0].id,
        registroDesposteId 
      });

      return this.formatearAlmacenamiento(result.rows[0]);
    } catch (error) {
      logger.error('Error registrando almacenamiento', { error: error.message, almacenamientoData });
      throw error;
    }
  }

  // 8. PARÁMETROS Y MÉTRICAS
  async crearParametrosMetricas(registroDesposteId, parametrosData) {
    try {
      // Validar rangos de temperatura según tipo
      const validacion = validacionesTemperatura[parametrosData.tipoProducto];
      if (!validacion) {
        throw new Error(`Tipo de producto no válido: ${parametrosData.tipoProducto}`);
      }

      const query = `
        INSERT INTO parametros_metricas 
        (registro_desposte_id, tipo_producto, rango_temperatura_min, rango_temperatura_max,
         tiempo_produccion_horas, kg_hora_hombre, orden_produccion, salida_almacen_ept,
         orden_empaque, porcentaje_merma_peso_bruto, porcentaje_merma_subproductos)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const valores = [
        registroDesposteId,
        parametrosData.tipoProducto,
        validacion.min,
        validacion.max,
        parametrosData.tiempoProduccion,
        parametrosData.kgHoraHombre,
        parametrosData.ordenProduccion,
        parametrosData.salidaAlmacenEPT,
        parametrosData.ordenEmpaque,
        parametrosData.porcentajeMermaPesoBruto,
        parametrosData.porcentajeMermaSubproductos
      ];

      const result = await this.db.query(query, valores);
      logger.info('Parámetros y métricas registrados', { 
        parametrosId: result.rows[0].id,
        registroDesposteId 
      });

      return this.formatearParametrosMetricas(result.rows[0]);
    } catch (error) {
      logger.error('Error registrando parámetros y métricas', { error: error.message, parametrosData });
      throw error;
    }
  }

  // 9. FIRMAS Y SELLOS
  async crearFirmasSellos(registroDesposteId, firmasData) {
    try {
      const query = `
        INSERT INTO firmas_sellos 
        (registro_desposte_id, recibido_logistica, fecha_recibido_logistica,
         coordinador_desposte, fecha_coordinador_desposte, liberado_calidad,
         fecha_liberado_calidad, sello_logistica, sello_coordinador, sello_calidad)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const valores = [
        registroDesposteId,
        firmasData.recibidoLogistica,
        firmasData.fechaRecibidoLogistica,
        firmasData.coordinadorDesposte,
        firmasData.fechaCoordinadorDesposte,
        firmasData.liberadoCalidad,
        firmasData.fechaLiberadoCalidad,
        firmasData.selloLogistica,
        firmasData.selloCoordinador,
        firmasData.selloCalidad
      ];

      const result = await this.db.query(query, valores);
      logger.info('Firmas y sellos registrados', { 
        firmasId: result.rows[0].id,
        registroDesposteId 
      });

      return this.formatearFirmasSellos(result.rows[0]);
    } catch (error) {
      logger.error('Error registrando firmas y sellos', { error: error.message, firmasData });
      throw error;
    }
  }

  // CONSULTAS Y OBTENCIÓN DE DATOS
  async obtenerRegistrosDesposte(filtros = {}) {
    try {
      let query = `
        SELECT rd.*, o.cliente, o.linea, o.turno, o.fecha_planificada, o.cantidad_planificada, o.estado as orden_estado
        FROM registro_desposte rd
        LEFT JOIN ordenes o ON rd.orden_id = o.id
        WHERE 1=1
      `;
      const valores = [];
      let paramCount = 0;

      if (filtros.ordenId) {
        paramCount++;
        query += ` AND rd.orden_id = $${paramCount}`;
        valores.push(filtros.ordenId);
      }

      if (filtros.lote) {
        paramCount++;
        query += ` AND rd.lote ILIKE $${paramCount}`;
        valores.push(`%${filtros.lote}%`);
      }

      if (filtros.fechaInicio && filtros.fechaFin) {
        paramCount++;
        query += ` AND rd.fecha_produccion BETWEEN $${paramCount}`;
        valores.push(filtros.fechaInicio);
        paramCount++;
        query += ` AND $${paramCount}`;
        valores.push(filtros.fechaFin);
      }

      if (filtros.estado) {
        paramCount++;
        query += ` AND rd.estado = $${paramCount}`;
        valores.push(filtros.estado);
      }

      query += ' ORDER BY rd.fecha_creacion DESC';

      const result = await this.db.query(query, valores);
      return result.rows.map(registro => this.formatearRegistroDesposte(registro));
    } catch (error) {
      logger.error('Error obteniendo registros de Desposte', { error: error.message, filtros });
      throw error;
    }
  }

  async obtenerRegistroDesposteCompleto(id) {
    try {
      const registro = await this.obtenerRegistroDespotePorId(id);
      
      // Obtener todos los componentes relacionados
      const [
        desencajado,
        picado,
        empacado,
        muestreo,
        liberacion,
        almacenamiento,
        parametros,
        firmas
      ] = await Promise.all([
        this.obtenerDesencajadoMPC(id),
        this.obtenerPicadoMolienda(id),
        this.obtenerEmpacadoEmbutido(id),
        this.obtenerMuestreoPeso(id),
        this.obtenerLiberacionProducto(id),
        this.obtenerAlmacenamiento(id),
        this.obtenerParametrosMetricas(id),
        this.obtenerFirmasSellos(id)
      ]);

      return {
        registro,
        desencajado,
        picado,
        empacado,
        muestreo,
        liberacion,
        almacenamiento,
        parametros,
        firmas
      };
    } catch (error) {
      logger.error('Error obteniendo registro completo de Desposte', { error: error.message, id });
      throw error;
    }
  }

  async obtenerRegistroDespotePorId(id) {
    try {
      const query = 'SELECT * FROM registro_desposte WHERE id = $1';
      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        const error = new Error('Registro de Desposte no encontrado');
        error.status = 404;
        throw error;
      }

      return this.formatearRegistroDesposte(result.rows[0]);
    } catch (error) {
      logger.error('Error obteniendo registro de Desposte por ID', { error: error.message, id });
      throw error;
    }
  }

  // Métodos auxiliares para obtener componentes específicos
  async obtenerDesencajadoMPC(registroDesposteId) {
    const query = 'SELECT * FROM desencajado_mpc WHERE registro_desposte_id = $1';
    const result = await this.db.query(query, [registroDesposteId]);
    return result.rows.map(row => this.formatearDesencajadoMPC(row));
  }

  async obtenerPicadoMolienda(registroDesposteId) {
    const query = `
      SELECT pm.*, array_agg(
        json_build_object(
          'id', s.id,
          'peso_kg', s.peso_kg,
          'destino', s.destino,
          'reclasificacion', s.reclasificacion,
          'consumo_animal', s.consumo_animal
        )
      ) as subproductos
      FROM picado_molienda pm
      LEFT JOIN subproductos s ON pm.id = s.picado_molienda_id
      WHERE pm.registro_desposte_id = $1
      GROUP BY pm.id
    `;
    const result = await this.db.query(query, [registroDesposteId]);
    return result.rows.map(row => this.formatearPicadoMolienda(row));
  }

  async obtenerEmpacadoEmbutido(registroDesposteId) {
    const query = `
      SELECT ee.*, me.lote_material, me.proveedor_material
      FROM empacado_embutido ee
      LEFT JOIN material_empaque me ON ee.id = me.empacado_embutido_id
      WHERE ee.registro_desposte_id = $1
    `;
    const result = await this.db.query(query, [registroDesposteId]);
    return result.rows.map(row => this.formatearEmpacadoEmbutido(row));
  }

  async obtenerMuestreoPeso(registroDesposteId) {
    const query = 'SELECT * FROM muestreo_peso WHERE registro_desposte_id = $1';
    const result = await this.db.query(query, [registroDesposteId]);
    return result.rows.map(row => this.formatearMuestreoPeso(row));
  }

  async obtenerLiberacionProducto(registroDesposteId) {
    const query = 'SELECT * FROM liberacion_producto WHERE registro_desposte_id = $1';
    const result = await this.db.query(query, [registroDesposteId]);
    return result.rows.map(row => this.formatearLiberacionProducto(row));
  }

  async obtenerAlmacenamiento(registroDesposteId) {
    const query = 'SELECT * FROM almacenamiento_encajado WHERE registro_desposte_id = $1';
    const result = await this.db.query(query, [registroDesposteId]);
    return result.rows.map(row => this.formatearAlmacenamiento(row));
  }

  async obtenerParametrosMetricas(registroDesposteId) {
    const query = 'SELECT * FROM parametros_metricas WHERE registro_desposte_id = $1';
    const result = await this.db.query(query, [registroDesposteId]);
    return result.rows.map(row => this.formatearParametrosMetricas(row));
  }

  async obtenerFirmasSellos(registroDesposteId) {
    const query = 'SELECT * FROM firmas_sellos WHERE registro_desposte_id = $1';
    const result = await this.db.query(query, [registroDesposteId]);
    return result.rows.map(row => this.formatearFirmasSellos(row));
  }

  // MÉTODOS DE FORMATEO
  formatearRegistroDesposte(registro) {
    return {
      id: registro.id,
      ordenId: registro.orden_id,
      producto: registro.producto,
      lote: registro.lote,
      fechaProduccion: registro.fecha_produccion,
      fechaVencimiento: registro.fecha_vencimiento,
      fechaSacrificio: registro.fecha_sacrificio,
      pesoTrasladado: parseFloat(registro.peso_trasladado_kg),
      pesoLanzado: parseFloat(registro.peso_lanzado_kg),
      pesoObtenido: parseFloat(registro.peso_obtenido_kg),
      estado: registro.estado,
      fechaCreacion: registro.fecha_creacion,
      fechaActualizacion: registro.fecha_actualizacion,
      usuarioRegistro: registro.usuario_registro,
      observaciones: registro.observaciones,
      // Información de la orden asociada (si existe)
      orden: registro.cliente ? {
        cliente: registro.cliente,
        linea: registro.linea,
        turno: registro.turno,
        fechaPlanificada: registro.fecha_planificada,
        cantidadPlanificada: registro.cantidad_planificada,
        ordenEstado: registro.orden_estado
      } : null
    };
  }

  formatearDesencajadoMPC(desencajado) {
    return {
      id: desencajado.id,
      registroDesposteId: desencajado.registro_desposte_id,
      numeroMateriaPrimaCarnica: desencajado.numero_materia_prima_carnica,
      loteMateriaPrima: desencajado.lote_materia_prima,
      proveedor: desencajado.proveedor,
      peso: parseFloat(desencajado.peso_kg),
      hora: desencajado.hora,
      temperaturaT1: desencajado.temperatura_t1 ? parseFloat(desencajado.temperatura_t1) : null,
      temperaturaT2: desencajado.temperatura_t2 ? parseFloat(desencajado.temperatura_t2) : null,
      temperaturaT3: desencajado.temperatura_t3 ? parseFloat(desencajado.temperatura_t3) : null,
      color: desencajado.color,
      textura: desencajado.textura,
      olor: desencajado.olor,
      conformidad: desencajado.conformidad,
      responsableDesencajado: desencajado.responsable_desencajado,
      hallazgo: desencajado.hallazgo,
      correccion: desencajado.correccion,
      fechaRegistro: desencajado.fecha_registro
    };
  }

  formatearPicadoMolienda(picado) {
    return {
      id: picado.id,
      registroDesposteId: picado.registro_desposte_id,
      numeroMateriaPrima: picado.numero_materia_prima,
      estadoSierra: picado.estado_sierra,
      horaInicio: picado.hora_inicio,
      horaFin: picado.hora_fin,
      temperaturaT1: picado.temperatura_t1 ? parseFloat(picado.temperatura_t1) : null,
      temperaturaT2: picado.temperatura_t2 ? parseFloat(picado.temperatura_t2) : null,
      temperaturaT3: picado.temperatura_t3 ? parseFloat(picado.temperatura_t3) : null,
      cantidadPicadaTajada: parseFloat(picado.cantidad_picada_tajada_kg),
      responsablePicado: picado.responsable_picado,
      discoMolienda: picado.disco_molienda,
      kgMolidos: picado.kg_molidos ? parseFloat(picado.kg_molidos) : null,
      responsableMolienda: picado.responsable_molienda,
      subproductos: picado.subproductos && picado.subproductos[0] ? picado.subproductos : [],
      fechaRegistro: picado.fecha_registro
    };
  }

  formatearEmpacadoEmbutido(empacado) {
    return {
      id: empacado.id,
      registroDesposteId: empacado.registro_desposte_id,
      presentacion: empacado.presentacion,
      horaInicio: empacado.hora_inicio,
      horaFin: empacado.hora_fin,
      temperaturaT1: empacado.temperatura_t1 ? parseFloat(empacado.temperatura_t1) : null,
      temperaturaT2: empacado.temperatura_t2 ? parseFloat(empacado.temperatura_t2) : null,
      temperaturaT3: empacado.temperatura_t3 ? parseFloat(empacado.temperatura_t3) : null,
      arranqueMaquina: empacado.arranque_maquina_unidades,
      tiras: empacado.tiras_kg ? parseFloat(empacado.tiras_kg) : null,
      bolsasAveriadas: empacado.bolsas_averiadas_unidades,
      unidadesEmpacadas: empacado.unidades_empacadas,
      conteoTotal: empacado.conteo_total,
      conformidad: empacado.conformidad,
      responsableEmpacado: empacado.responsable_empacado,
      responsableFechado: empacado.responsable_fechado,
      materialEmpaque: {
        lote: empacado.lote_material,
        proveedor: empacado.proveedor_material
      },
      fechaRegistro: empacado.fecha_registro
    };
  }

  formatearMuestreoPeso(muestreo) {
    return {
      id: muestreo.id,
      registroDesposteId: muestreo.registro_desposte_id,
      pesoMuestreado: parseFloat(muestreo.peso_muestreado),
      numeroMuestra: muestreo.numero_muestra,
      hallazgo: muestreo.hallazgo,
      correccion: muestreo.correccion,
      fechaRegistro: muestreo.fecha_registro
    };
  }

  formatearLiberacionProducto(liberacion) {
    return {
      id: liberacion.id,
      registroDesposteId: liberacion.registro_desposte_id,
      criterios: {
        presentacionPeso: liberacion.criterio_presentacion_peso,
        sellado: liberacion.criterio_sellado,
        codificado: liberacion.criterio_codificado,
        rotulado: liberacion.criterio_rotulado
      },
      analisisSensorial: {
        aspecto: liberacion.item_aspecto,
        olor: liberacion.item_olor,
        sabor: liberacion.item_sabor,
        libreMetales: liberacion.libre_metales
      },
      resultado: liberacion.resultado,
      responsable: liberacion.responsable,
      correccion: liberacion.correccion,
      fechaRegistro: liberacion.fecha_registro
    };
  }

  formatearAlmacenamiento(almacenamiento) {
    return {
      id: almacenamiento.id,
      registroDesposteId: almacenamiento.registro_desposte_id,
      producto: almacenamiento.producto,
      numeroCanastillas: almacenamiento.numero_canastillas,
      temperaturaCuartoFrio: parseFloat(almacenamiento.temperatura_cuarto_frio),
      responsable: almacenamiento.responsable,
      horaInicio: almacenamiento.hora_inicio,
      horaFin: almacenamiento.hora_fin,
      temperaturaT1: almacenamiento.temperatura_t1 ? parseFloat(almacenamiento.temperatura_t1) : null,
      temperaturaT2: almacenamiento.temperatura_t2 ? parseFloat(almacenamiento.temperatura_t2) : null,
      temperaturaT3: almacenamiento.temperatura_t3 ? parseFloat(almacenamiento.temperatura_t3) : null,
      averias: almacenamiento.averias,
      hallazgo: almacenamiento.hallazgo,
      correccion: almacenamiento.correccion,
      fechaRegistro: almacenamiento.fecha_registro
    };
  }

  formatearParametrosMetricas(parametros) {
    return {
      id: parametros.id,
      registroDesposteId: parametros.registro_desposte_id,
      tipoProducto: parametros.tipo_producto,
      rangoTemperatura: {
        min: parseFloat(parametros.rango_temperatura_min),
        max: parseFloat(parametros.rango_temperatura_max)
      },
      tiempoProduccion: parametros.tiempo_produccion_horas ? parseFloat(parametros.tiempo_produccion_horas) : null,
      kgHoraHombre: parametros.kg_hora_hombre ? parseFloat(parametros.kg_hora_hombre) : null,
      ordenProduccion: parametros.orden_produccion,
      salidaAlmacenEPT: parametros.salida_almacen_ept,
      ordenEmpaque: parametros.orden_empaque,
      merma: {
        pesoBruto: parametros.porcentaje_merma_peso_bruto ? parseFloat(parametros.porcentaje_merma_peso_bruto) : null,
        subproductos: parametros.porcentaje_merma_subproductos ? parseFloat(parametros.porcentaje_merma_subproductos) : null
      },
      fechaRegistro: parametros.fecha_registro
    };
  }

  formatearFirmasSellos(firmas) {
    return {
      id: firmas.id,
      registroDesposteId: firmas.registro_desposte_id,
      firmas: {
        recibidoLogistica: {
          nombre: firmas.recibido_logistica,
          fecha: firmas.fecha_recibido_logistica,
          sello: firmas.sello_logistica
        },
        coordinadorDesposte: {
          nombre: firmas.coordinador_desposte,
          fecha: firmas.fecha_coordinador_desposte,
          sello: firmas.sello_coordinador
        },
        liberadoCalidad: {
          nombre: firmas.liberado_calidad,
          fecha: firmas.fecha_liberado_calidad,
          sello: firmas.sello_calidad
        }
      },
      fechaRegistro: firmas.fecha_registro
    };
  }
}

module.exports = DesposteService;