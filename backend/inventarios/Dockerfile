FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código común
COPY backend/common ./backend/common

# Copiar código del microservicio
COPY backend/inventarios ./backend/inventarios

# Crear directorio para logs
RUN mkdir -p logs

# Exponer puerto
EXPOSE 3003

# Usuario no root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Comando para iniciar el servicio
CMD ["node", "backend/inventarios/index.js"]