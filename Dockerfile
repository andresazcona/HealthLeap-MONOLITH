FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependencias para compilación
COPY package*.json ./
RUN npm ci

# Copiar código fuente y compilar
COPY tsconfig.json ./
COPY src ./src
# Comentamos esta línea para evitar el error
# COPY tests ./tests  
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS production

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --production && npm cache clean --force

# Crear directorio para logs
RUN mkdir -p logs && chmod 777 logs

# Copiar archivos compilados desde la etapa de construcción
COPY --from=builder /app/dist ./dist

# Añadir healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Usuario no root para seguridad
USER node

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "dist/server.js"]