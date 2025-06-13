# 🔗 Integración Frontend-Backend

Esta guía te ayudará a integrar el frontend con el backend de microservicios.

## 📋 Pre-requisitos

1. **Docker Desktop** (recomendado) o Docker CLI + Docker Compose
   - Descargar desde: https://www.docker.com/products/docker-desktop
   - O instalar Docker CLI: https://docs.docker.com/engine/install/

2. **Node.js** (v16 o superior)
   - Para ejecutar el frontend en modo desarrollo

## 🚀 Inicio Rápido

### 1. Configurar Backend

```bash
# Opción 1: Usar script automatizado (recomendado)
./scripts/setup-backend.sh

# Opción 2: Manual
docker compose up -d --build
```

### 2. Configurar Frontend

```bash
cd frontend/web
npm install
npm start
```

### 3. Verificar Integración

1. Abre http://localhost:3100 en tu navegador
2. En el Dashboard, revisa el panel "Estado del Sistema"
3. Deberías ver los servicios como "healthy" si todo está funcionando

## 🔧 Configuración Detallada

### Variables de Entorno

El frontend usa las siguientes variables de entorno (archivo `.env`):

```env
# URL del Gateway/API principal
REACT_APP_API_URL=http://localhost:3000/api

# URL base del Gateway
REACT_APP_GATEWAY_URL=http://localhost:3000

# Entorno de desarrollo
REACT_APP_ENV=development

# Habilitar logs de debug
REACT_APP_ENABLE_DEBUG=true
```

### Puertos de Servicios

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend | 3100 | http://localhost:3100 |
| Gateway | 3000 | http://localhost:3000 |
| Órdenes | 3001 | http://localhost:3001 |
| Calidad | 3002 | http://localhost:3002 |
| Inventarios | 3003 | http://localhost:3003 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

## 🔍 Debugging

### Logs de API

Cuando `REACT_APP_ENABLE_DEBUG=true`, verás en la consola del navegador:

- 🚀 **API Request**: Detalles de cada petición
- ✅ **API Response**: Respuestas exitosas
- ❌ **API Error**: Errores de conexión o servidor

### Health Check

El componente `SystemStatus` en el Dashboard muestra:

- Estado de conectividad de cada microservicio
- Mensajes de error específicos
- Timestamp de última verificación
- Auto-refresh cada 30 segundos

### Verificación Manual

```bash
# Verificar Gateway
curl http://localhost:3000/health

# Verificar microservicios
curl http://localhost:3001/health  # Órdenes
curl http://localhost:3002/health  # Calidad
curl http://localhost:3003/health  # Inventarios

# Ver logs
docker compose logs -f

# Ver estado de contenedores
docker compose ps
```

## 🛠️ Comandos Útiles

```bash
# Iniciar todos los servicios
docker compose up -d

# Detener todos los servicios
docker compose down

# Reiniciar un servicio específico
docker compose restart gateway

# Ver logs en tiempo real
docker compose logs -f

# Reconstruir imágenes
docker compose build --no-cache

# Limpiar todo y empezar de cero
docker compose down -v
docker system prune -f
```

## 🐛 Solución de Problemas

### Error: "No se pudo conectar con el servidor"

1. Verificar que Docker está ejecutándose:
   ```bash
   docker info
   ```

2. Verificar que los servicios están corriendo:
   ```bash
   docker compose ps
   ```

3. Verificar conectividad:
   ```bash
   curl http://localhost:3000/health
   ```

### Error: Puerto en uso

```bash
# Encontrar proceso usando el puerto
lsof -i :3000

# Detener servicios de Docker
docker compose down
```

### Error: Base de datos no conecta

```bash
# Verificar logs de PostgreSQL
docker compose logs postgres

# Reiniciar base de datos
docker compose restart postgres
```

### Frontend no puede conectar con backend

1. Verificar variables de entorno en `.env`
2. Verificar que el Gateway está respondiendo
3. Revisar logs de la consola del navegador
4. Verificar CORS (si hay errores de origen)

## 📊 Testing de Integración

### Tests Manuales

1. **Login**: Usar credenciales `admin / admin123`
2. **Dashboard**: Verificar que las estadísticas cargan
3. **Órdenes**: Crear, listar y ver detalles de órdenes
4. **Calidad**: Crear programas QC y registros
5. **Inventarios**: Gestionar bodegas, artículos y movimientos

### Tests Automatizados

```bash
# Tests del frontend
cd frontend/web
npm test

# Tests end-to-end (cuando estén implementados)
npm run test:e2e
```

## 🔄 Flujo de Desarrollo

1. **Cambios en Frontend**: Recarga automática en modo desarrollo
2. **Cambios en Backend**: Requiere `docker compose restart <servicio>`
3. **Cambios en Base de Datos**: Ejecutar migraciones o reiniciar
4. **Nuevas Variables de Entorno**: Reiniciar contenedores

## 📚 Próximos Pasos

Una vez que la integración esté funcionando:

1. ✅ **Testing exhaustivo** de todas las funcionalidades
2. ✅ **Validación de datos** en formularios
3. ✅ **Manejo de errores** mejorado
4. ✅ **Performance optimization**
5. ✅ **Tests automatizados**
6. ✅ **CI/CD pipeline**

---

¿Necesitas ayuda? Revisa los logs con `docker compose logs -f` y el panel de Estado del Sistema en el Dashboard.