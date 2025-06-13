#!/bin/bash

# Script de inicio para desarrollo
echo "🚀 Iniciando Carnes del Sebastián - Sistema Integrado"

# Verificar que Docker esté funcionando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está funcionando. Por favor, inicia Docker Desktop."
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "📝 Creando archivo de configuración..."
    cp .env.example .env
    echo "✅ Archivo .env creado. Revisa y ajusta la configuración según sea necesario."
fi

# Crear directorios necesarios
mkdir -p logs
mkdir -p data/postgres
mkdir -p data/redis

echo "🔨 Construyendo e iniciando servicios..."

# Construir e iniciar todos los servicios
docker-compose up --build -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 30

# Verificar que los servicios estén funcionando
echo "🔍 Verificando servicios..."

services=("gateway:3000" "ordenes:3001" "calidad:3002" "inventarios:3003" "frontend-web:3100")

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -s http://localhost:$port/health > /dev/null; then
        echo "✅ $name está funcionando en puerto $port"
    else
        echo "❌ $name no responde en puerto $port"
    fi
done

echo ""
echo "🎉 ¡Sistema iniciado!"
echo ""
echo "📱 Interfaz Web: http://localhost:3100"
echo "🔗 API Gateway: http://localhost:3000"
echo "📊 Órdenes: http://localhost:3001"
echo "🔬 Calidad: http://localhost:3002"
echo "📦 Inventarios: http://localhost:3003"
echo ""
echo "📖 Documentación API: Consulta ContratoOPENAPI.yaml"
echo ""
echo "Para detener todos los servicios: docker-compose down"
echo "Para ver logs: docker-compose logs -f [servicio]"