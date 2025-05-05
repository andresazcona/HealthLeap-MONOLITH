FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependencias para compilación
COPY package*.json ./
RUN npm ci

# Copiar código fuente y compilar
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Etapa de producción
FROM node:18-alpine AS production

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --production

# Crear directorio para logs
RUN mkdir -p logs && chmod 777 logs

# Copiar archivos compilados desde la etapa de construcción
COPY --from=builder /app/dist ./dist

# Usuario no root para seguridad
USER node

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "dist/server.js"]