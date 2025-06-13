#!/bin/bash

# Script para configurar y ejecutar el backend de Carnes del Sebastián

echo "🚀 Configurando backend de Carnes del Sebastián..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado"
        echo "Por favor instala Docker Desktop desde: https://www.docker.com/products/docker-desktop"
        echo "O instala Docker CLI desde: https://docs.docker.com/engine/install/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker no está ejecutándose"
        echo "Por favor inicia Docker Desktop o el daemon de Docker"
        exit 1
    fi
    
    log_info "Docker está disponible"
}

# Verificar si Docker Compose está disponible
check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    elif docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        log_error "Docker Compose no está disponible"
        exit 1
    fi
    
    log_info "Docker Compose está disponible: $COMPOSE_CMD"
}

# Construir e iniciar servicios
start_services() {
    log_info "Construyendo e iniciando servicios..."
    
    # Detener servicios existentes si están corriendo
    $COMPOSE_CMD down
    
    # Construir imágenes
    log_info "Construyendo imágenes Docker..."
    $COMPOSE_CMD build
    
    # Iniciar servicios en background
    log_info "Iniciando servicios..."
    $COMPOSE_CMD up -d
    
    # Esperar a que los servicios estén listos
    log_info "Esperando a que los servicios estén listos..."
    sleep 10
}

# Verificar estado de los servicios
check_services() {
    log_info "Verificando estado de los servicios..."
    $COMPOSE_CMD ps
    
    # Verificar conectividad
    log_info "Verificando conectividad de servicios..."
    
    # Gateway
    if curl -f http://localhost:3000/health &> /dev/null; then
        log_info "✅ Gateway (puerto 3000) - OK"
    else
        log_warn "❌ Gateway (puerto 3000) - No responde"
    fi
    
    # Microservicios
    for service in "ordenes:3001" "calidad:3002" "inventarios:3003"; do
        IFS=':' read -r name port <<< "$service"
        if curl -f http://localhost:$port/health &> /dev/null; then
            log_info "✅ $name (puerto $port) - OK"
        else
            log_warn "❌ $name (puerto $port) - No responde"
        fi
    done
}

# Mostrar logs de servicios
show_logs() {
    if [ "$1" = "logs" ]; then
        log_info "Mostrando logs de todos los servicios..."
        $COMPOSE_CMD logs -f
    fi
}

# Función principal
main() {
    echo "========================================"
    echo "   Setup Backend - Carnes del Sebastián"
    echo "========================================"
    
    check_docker
    check_docker_compose
    start_services
    check_services
    
    echo ""
    log_info "🎉 Setup completado!"
    echo ""
    echo "URLs disponibles:"
    echo "  - Gateway/API: http://localhost:3000"
    echo "  - Microservicio Órdenes: http://localhost:3001"
    echo "  - Microservicio Calidad: http://localhost:3002"
    echo "  - Microservicio Inventarios: http://localhost:3003"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    echo ""
    echo "Comandos útiles:"
    echo "  - Ver logs: $COMPOSE_CMD logs -f"
    echo "  - Detener servicios: $COMPOSE_CMD down"
    echo "  - Reiniciar servicios: $COMPOSE_CMD restart"
    echo "  - Ver estado: $COMPOSE_CMD ps"
    echo ""
    
    show_logs "$1"
}

# Cambiar al directorio del proyecto
cd "$(dirname "$0")/.."

# Ejecutar función principal
main "$1"