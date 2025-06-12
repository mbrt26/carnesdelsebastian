# README - Proyecto Sistema Integrado

Este documento reúne toda la información y artefactos generados hasta ahora para el desarrollo del sistema integrado de Carnes del Sebastián, correspondiente a la Fase 1 del proyecto.

---

## 1. Objetivo del Proyecto

Desarrollar una plataforma digital que permita a Carnes del Sebastián gestionar de forma ágil y en tiempo real los procesos de producción, control de calidad e inventario en sus plantas de Desposte y Derivados, reemplazando registros manuales en papel y Excel, y proporcionando visibilidad ejecutiva mediante reportes e indicadores.

---

## 2. Alcance de la Fase 1

1. **Módulo de Órdenes de Producción**

   * Creación y gestión de órdenes con datos clave (cliente, línea, turno, fecha, cantidades).
   * Generación de ficha de trazabilidad por lote con consumos, tiempos y condiciones.

2. **Módulo de Control de Calidad**

   * Formularios digitales para los programas de QC, frecuencia configurable.
   * Registro de hallazgos, acciones correctivas y vinculación opcional a órdenes.

3. **Módulo de Control de Inventarios por Bodega**

   * Gestión de stock “in situ” y “en tránsito” en múltiples bodegas.
   * Ajustes automáticos al registrar consumos o incidencias de calidad.

4. **Módulo de Reportes e Indicadores**

   * Dashboards con KPIs de producción, calidad e inventario.
   * Filtros por planta, línea, turno y periodos, con alertas configurables.

---

## 3. Arquitectura Técnica (Google Cloud)

* **Front-End**: PWA/React Native (móviles y tablets), React (escritorio).
* **Back-End**: Microservicios en Cloud Run / GKE, comunicados vía Pub/Sub.
* **Bases de Datos**: Cloud SQL (PostgreSQL), Firestore para series, Memorystore (Redis) para cache.
* **Data Warehouse**: BigQuery alimentado con Dataflow desde Pub/Sub.
* **Integración**: API Gateway (Cloud Endpoints), Cloud Functions + Cloud Scheduler para intercambio CSV con ERP.
* **DevOps y Observabilidad**: Cloud Build, Logging, Monitoring, Trace, Profiler.

---

## 4. Contrato OpenAPI (Resumen)

Se definió la especificación OpenAPI 3.0 para los servicios clave de la Fase 1, incluyendo rutas para:

* **Órdenes**: `POST /ordenes`, `GET /ordenes`, `GET /ordenes/{id}`
* **Fichas de trazabilidad**: `POST /ordenes/{id}/fichas`, `GET /ordenes/{id}/fichas`
* **Control de Calidad**: `GET /qc/programas`, `POST /qc/programas/{id}/registros`
* **Inventarios**: `GET /inventarios/bodegas`, `GET /inventarios/bodegas/{id}/stock`, `POST /inventarios/bodegas/{id}/movimientos`

Incluye esquemas de datos (Orden, Ficha, ProgramaQC, RegistroQC, Bodega, StockItem, MovimientoInv) y seguridad con JWT.

---

## 5. Próximos Pasos

1. Versionar y compartir el spec OpenAPI en el repositorio.
2. Levantar un mock server (Prism) para validar con front-end y QA.
3. Implementar endpoints base y pruebas automáticas de contrato.
4. Ajustar el API según feedback de preguntas de perfeccionamiento.

---

> **Nota:** Este README se actualizará iterativamente a medida que avanzan las etapas de diseño, desarrollo y pruebas.
