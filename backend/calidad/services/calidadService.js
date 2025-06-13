const logger = require('../../common/utils/logger');

class CalidadService {
  constructor(db) {
    this.db = db;
  }

  async obtenerProgramasQC() {
    try {
      const query = `
        SELECT * FROM programas_qc 
        WHERE activo = true 
        ORDER BY nombre
      `;
      
      const result = await this.db.query(query);
      return result.rows.map(programa => this.formatearPrograma(programa));
    } catch (error) {
      logger.error('Error obteniendo programas de QC', { error: error.message });
      throw error;
    }
  }

  async obtenerProgramaPorId(id) {
    try {
      const query = 'SELECT * FROM programas_qc WHERE id = $1 AND activo = true';
      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        const error = new Error('Programa de QC no encontrado');
        error.status = 404;
        throw error;
      }

      return this.formatearPrograma(result.rows[0]);
    } catch (error) {
      logger.error('Error obteniendo programa de QC por ID', { error: error.message, id });
      throw error;
    }
  }

  async crearRegistroQC(registroData) {
    try {
      // Verificar que el programa existe
      await this.obtenerProgramaPorId(registroData.programaId);

      const query = `
        INSERT INTO registros_qc 
        (programa_id, valores, hallazgos, acciones, fotos, orden_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const valores = [
        registroData.programaId,
        JSON.stringify(registroData.valores),
        registroData.hallazgos || null,
        registroData.acciones || null,
        registroData.fotos || null,
        registroData.ordenId || null
      ];

      const result = await this.db.query(query, valores);
      logger.info('Registro de QC creado', { 
        registroId: result.rows[0].id, 
        programaId: registroData.programaId 
      });

      return this.formatearRegistro(result.rows[0]);
    } catch (error) {
      logger.error('Error creando registro de QC', { 
        error: error.message, 
        registroData 
      });
      throw error;
    }
  }

  async obtenerRegistrosQC(programaId, filtros = {}) {
    try {
      let query = `
        SELECT r.*, p.nombre as programa_nombre
        FROM registros_qc r
        JOIN programas_qc p ON r.programa_id = p.id
        WHERE r.programa_id = $1
      `;
      const valores = [programaId];
      let paramCount = 1;

      if (filtros.fechaInicio) {
        paramCount++;
        query += ` AND r.timestamp >= $${paramCount}`;
        valores.push(filtros.fechaInicio);
      }

      if (filtros.fechaFin) {
        paramCount++;
        query += ` AND r.timestamp <= $${paramCount}`;
        valores.push(filtros.fechaFin);
      }

      if (filtros.ordenId) {
        paramCount++;
        query += ` AND r.orden_id = $${paramCount}`;
        valores.push(filtros.ordenId);
      }

      query += ' ORDER BY r.timestamp DESC';

      if (filtros.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        valores.push(filtros.limit);
      }

      const result = await this.db.query(query, valores);
      return result.rows.map(registro => this.formatearRegistro(registro));
    } catch (error) {
      logger.error('Error obteniendo registros de QC', { 
        error: error.message, 
        programaId, 
        filtros 
      });
      throw error;
    }
  }

  async obtenerEstadisticasQC(programaId, fechaInicio, fechaFin) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_registros,
          AVG(CASE WHEN valores->>'ph' IS NOT NULL THEN (valores->>'ph')::numeric END) as ph_promedio,
          AVG(CASE WHEN valores->>'temperatura' IS NOT NULL THEN (valores->>'temperatura')::numeric END) as temp_promedio,
          COUNT(CASE WHEN hallazgos IS NOT NULL AND hallazgos != '' THEN 1 END) as registros_con_hallazgos
        FROM registros_qc 
        WHERE programa_id = $1 
        AND timestamp BETWEEN $2 AND $3
      `;

      const result = await this.db.query(query, [programaId, fechaInicio, fechaFin]);
      return {
        totalRegistros: parseInt(result.rows[0].total_registros),
        phPromedio: result.rows[0].ph_promedio ? parseFloat(result.rows[0].ph_promedio) : null,
        temperaturaPromedio: result.rows[0].temp_promedio ? parseFloat(result.rows[0].temp_promedio) : null,
        registrosConHallazgos: parseInt(result.rows[0].registros_con_hallazgos),
        periodo: { fechaInicio, fechaFin }
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de QC', { 
        error: error.message, 
        programaId, 
        fechaInicio, 
        fechaFin 
      });
      throw error;
    }
  }

  async validarParametrosQC(programaId, valores) {
    try {
      const programa = await this.obtenerProgramaPorId(programaId);
      const parametros = programa.parametros;
      const validaciones = [];

      // Validar pH si está configurado
      if (parametros.ph_min && parametros.ph_max && valores.ph) {
        const ph = parseFloat(valores.ph);
        if (ph < parametros.ph_min || ph > parametros.ph_max) {
          validaciones.push({
            parametro: 'pH',
            valor: ph,
            rango: `${parametros.ph_min} - ${parametros.ph_max}`,
            cumple: false
          });
        } else {
          validaciones.push({
            parametro: 'pH',
            valor: ph,
            rango: `${parametros.ph_min} - ${parametros.ph_max}`,
            cumple: true
          });
        }
      }

      // Validar temperatura si está configurada
      if (parametros.temp_min && parametros.temp_max && valores.temperatura) {
        const temp = parseFloat(valores.temperatura);
        if (temp < parametros.temp_min || temp > parametros.temp_max) {
          validaciones.push({
            parametro: 'Temperatura',
            valor: temp,
            rango: `${parametros.temp_min}°C - ${parametros.temp_max}°C`,
            cumple: false
          });
        } else {
          validaciones.push({
            parametro: 'Temperatura',
            valor: temp,
            rango: `${parametros.temp_min}°C - ${parametros.temp_max}°C`,
            cumple: true
          });
        }
      }

      return validaciones;
    } catch (error) {
      logger.error('Error validando parámetros de QC', { 
        error: error.message, 
        programaId, 
        valores 
      });
      throw error;
    }
  }

  // Métodos auxiliares para formatear respuestas
  formatearPrograma(programa) {
    return {
      id: programa.id,
      nombre: programa.nombre,
      frecuencia: programa.frecuencia,
      parametros: programa.parametros || {},
      activo: programa.activo,
      createdAt: programa.created_at,
      updatedAt: programa.updated_at
    };
  }

  formatearRegistro(registro) {
    return {
      id: registro.id,
      programaId: registro.programa_id,
      programaNombre: registro.programa_nombre,
      valores: registro.valores || {},
      hallazgos: registro.hallazgos,
      acciones: registro.acciones,
      fotos: registro.fotos,
      ordenId: registro.orden_id,
      timestamp: registro.timestamp,
      createdAt: registro.created_at
    };
  }
}

module.exports = CalidadService;