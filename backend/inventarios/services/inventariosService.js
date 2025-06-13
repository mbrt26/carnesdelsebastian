const logger = require('../../common/utils/logger');

class InventariosService {
  constructor(db) {
    this.db = db;
  }

  async obtenerBodegas() {
    try {
      const query = `
        SELECT b.*, COUNT(s.id) as total_articulos
        FROM bodegas b
        LEFT JOIN stock s ON b.id = s.bodega_id
        WHERE b.activa = true
        GROUP BY b.id, b.nombre, b.ubicacion, b.activa, b.created_at, b.updated_at
        ORDER BY b.nombre
      `;
      
      const result = await this.db.query(query);
      return result.rows.map(bodega => this.formatearBodega(bodega));
    } catch (error) {
      logger.error('Error obteniendo bodegas', { error: error.message });
      throw error;
    }
  }

  async obtenerBodegaPorId(id) {
    try {
      const query = 'SELECT * FROM bodegas WHERE id = $1 AND activa = true';
      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        const error = new Error('Bodega no encontrada');
        error.status = 404;
        throw error;
      }

      return this.formatearBodega(result.rows[0]);
    } catch (error) {
      logger.error('Error obteniendo bodega por ID', { error: error.message, id });
      throw error;
    }
  }

  async obtenerStockBodega(bodegaId) {
    try {
      // Verificar que la bodega existe
      await this.obtenerBodegaPorId(bodegaId);

      const query = `
        SELECT 
          s.*,
          a.codigo as articulo_codigo,
          a.nombre as articulo_nombre,
          a.unidad as articulo_unidad,
          a.categoria as articulo_categoria
        FROM stock s
        JOIN articulos a ON s.articulo_id = a.id
        WHERE s.bodega_id = $1 AND a.activo = true
        ORDER BY a.nombre
      `;

      const result = await this.db.query(query, [bodegaId]);
      return result.rows.map(item => this.formatearStockItem(item));
    } catch (error) {
      logger.error('Error obteniendo stock de bodega', { 
        error: error.message, 
        bodegaId 
      });
      throw error;
    }
  }

  async registrarMovimiento(bodegaId, movimientoData) {
    try {
      // Verificar que la bodega existe
      await this.obtenerBodegaPorId(bodegaId);

      return await this.db.transaction(async (client) => {
        // Buscar o crear el artículo
        let articuloId = await this.obtenerOCrearArticulo(
          client, 
          movimientoData.articulo
        );

        // Registrar el movimiento
        const movimientoQuery = `
          INSERT INTO movimientos_inventario 
          (bodega_id, articulo_id, cantidad, tipo, motivo, referencia, usuario)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

        const movimientoValues = [
          bodegaId,
          articuloId,
          movimientoData.cantidad,
          movimientoData.tipo,
          movimientoData.motivo,
          movimientoData.referencia,
          movimientoData.usuario || 'sistema'
        ];

        const movimientoResult = await client.query(movimientoQuery, movimientoValues);

        // Actualizar el stock
        await this.actualizarStock(
          client,
          bodegaId,
          articuloId,
          movimientoData.cantidad,
          movimientoData.tipo
        );

        logger.info('Movimiento de inventario registrado', {
          movimientoId: movimientoResult.rows[0].id,
          bodegaId,
          articulo: movimientoData.articulo,
          cantidad: movimientoData.cantidad,
          tipo: movimientoData.tipo
        });

        return this.formatearMovimiento(movimientoResult.rows[0]);
      });
    } catch (error) {
      logger.error('Error registrando movimiento', { 
        error: error.message, 
        bodegaId, 
        movimientoData 
      });
      throw error;
    }
  }

  async obtenerMovimientos(bodegaId, filtros = {}) {
    try {
      await this.obtenerBodegaPorId(bodegaId);

      let query = `
        SELECT 
          m.*,
          a.codigo as articulo_codigo,
          a.nombre as articulo_nombre,
          a.unidad as articulo_unidad
        FROM movimientos_inventario m
        JOIN articulos a ON m.articulo_id = a.id
        WHERE m.bodega_id = $1
      `;
      const valores = [bodegaId];
      let paramCount = 1;

      if (filtros.fechaInicio) {
        paramCount++;
        query += ` AND m.timestamp >= $${paramCount}`;
        valores.push(filtros.fechaInicio);
      }

      if (filtros.fechaFin) {
        paramCount++;
        query += ` AND m.timestamp <= $${paramCount}`;
        valores.push(filtros.fechaFin);
      }

      if (filtros.tipo) {
        paramCount++;
        query += ` AND m.tipo = $${paramCount}`;
        valores.push(filtros.tipo);
      }

      if (filtros.articulo) {
        paramCount++;
        query += ` AND (a.codigo ILIKE $${paramCount} OR a.nombre ILIKE $${paramCount})`;
        valores.push(`%${filtros.articulo}%`);
      }

      query += ' ORDER BY m.timestamp DESC';

      if (filtros.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        valores.push(filtros.limit);
      }

      const result = await this.db.query(query, valores);
      return result.rows.map(movimiento => this.formatearMovimiento(movimiento));
    } catch (error) {
      logger.error('Error obteniendo movimientos', { 
        error: error.message, 
        bodegaId, 
        filtros 
      });
      throw error;
    }
  }

  async obtenerReporteInventario(bodegaId) {
    try {
      await this.obtenerBodegaPorId(bodegaId);

      const query = `
        SELECT 
          a.categoria,
          COUNT(*) as total_articulos,
          SUM(s.cantidad_disponible) as cantidad_total,
          COUNT(CASE WHEN s.cantidad_disponible <= 10 THEN 1 END) as articulos_bajo_stock
        FROM stock s
        JOIN articulos a ON s.articulo_id = a.id
        WHERE s.bodega_id = $1 AND a.activo = true
        GROUP BY a.categoria
        ORDER BY a.categoria
      `;

      const result = await this.db.query(query, [bodegaId]);
      
      return {
        bodegaId,
        fecha: new Date().toISOString(),
        resumenPorCategoria: result.rows.map(row => ({
          categoria: row.categoria,
          totalArticulos: parseInt(row.total_articulos),
          cantidadTotal: parseFloat(row.cantidad_total),
          articulosBajoStock: parseInt(row.articulos_bajo_stock)
        }))
      };
    } catch (error) {
      logger.error('Error generando reporte de inventario', { 
        error: error.message, 
        bodegaId 
      });
      throw error;
    }
  }

  // Métodos auxiliares privados
  async obtenerOCrearArticulo(client, codigoArticulo) {
    // Buscar artículo existente
    let query = 'SELECT id FROM articulos WHERE codigo = $1';
    let result = await client.query(query, [codigoArticulo]);

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    // Crear nuevo artículo si no existe
    query = `
      INSERT INTO articulos (codigo, nombre, unidad, categoria)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    result = await client.query(query, [
      codigoArticulo,
      codigoArticulo, // nombre por defecto
      'unidad', // unidad por defecto
      'General' // categoría por defecto
    ]);

    return result.rows[0].id;
  }

  async actualizarStock(client, bodegaId, articuloId, cantidad, tipo) {
    // Obtener stock actual
    let query = `
      SELECT cantidad_disponible FROM stock 
      WHERE bodega_id = $1 AND articulo_id = $2
    `;
    let result = await client.query(query, [bodegaId, articuloId]);

    let nuevaCantidad;
    if (result.rows.length === 0) {
      // No existe registro de stock, crear uno nuevo
      nuevaCantidad = tipo === 'entrada' ? cantidad : 0;
      query = `
        INSERT INTO stock (bodega_id, articulo_id, cantidad_disponible)
        VALUES ($1, $2, $3)
      `;
      await client.query(query, [bodegaId, articuloId, nuevaCantidad]);
    } else {
      // Actualizar stock existente
      const stockActual = parseFloat(result.rows[0].cantidad_disponible);
      
      switch (tipo) {
        case 'entrada':
          nuevaCantidad = stockActual + cantidad;
          break;
        case 'salida':
          nuevaCantidad = stockActual - cantidad;
          break;
        case 'ajuste':
          nuevaCantidad = cantidad;
          break;
        default:
          throw new Error(`Tipo de movimiento inválido: ${tipo}`);
      }

      // Validar que no quede stock negativo
      if (nuevaCantidad < 0) {
        throw new Error('Stock insuficiente para realizar la operación');
      }

      query = `
        UPDATE stock 
        SET cantidad_disponible = $1, ultimo_movimiento = CURRENT_TIMESTAMP
        WHERE bodega_id = $2 AND articulo_id = $3
      `;
      await client.query(query, [nuevaCantidad, bodegaId, articuloId]);
    }
  }

  // Métodos para formatear respuestas
  formatearBodega(bodega) {
    return {
      id: bodega.id,
      nombre: bodega.nombre,
      ubicacion: bodega.ubicacion,
      activa: bodega.activa,
      totalArticulos: parseInt(bodega.total_articulos || 0),
      createdAt: bodega.created_at,
      updatedAt: bodega.updated_at
    };
  }

  formatearStockItem(item) {
    return {
      articulo: item.articulo_codigo,
      articuloNombre: item.articulo_nombre,
      cantidadDisponible: parseFloat(item.cantidad_disponible),
      cantidadReservada: parseFloat(item.cantidad_reservada || 0),
      unidad: item.articulo_unidad,
      categoria: item.articulo_categoria,
      ultimoMovimiento: item.ultimo_movimiento
    };
  }

  formatearMovimiento(movimiento) {
    return {
      id: movimiento.id,
      bodegaId: movimiento.bodega_id,
      articulo: movimiento.articulo_codigo || movimiento.articulo,
      articuloNombre: movimiento.articulo_nombre,
      cantidad: parseFloat(movimiento.cantidad),
      tipo: movimiento.tipo,
      motivo: movimiento.motivo,
      referencia: movimiento.referencia,
      usuario: movimiento.usuario,
      timestamp: movimiento.timestamp
    };
  }
}

module.exports = InventariosService;