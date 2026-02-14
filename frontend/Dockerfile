# =============================================================================
# Frontend - Multi-stage Dockerfile
# Stage 1: Build React app with Vite
# Stage 2: Serve with Nginx (reverse proxy + static files)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build
# -----------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Accept build-time API URL (empty for proxy-transparent deployment)
ARG VITE_API_URL=""

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production (Nginx)
# -----------------------------------------------------------------------------
FROM nginx:alpine AS production

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8117

CMD ["nginx", "-g", "daemon off;"]
