# Stage 1: Build the application
FROM node:24-alpine AS build

# Create non-root user for build
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reactjs -u 1001

# Set working directory
WORKDIR /app

# Change ownership
RUN chown -R reactjs:nodejs /app
USER reactjs

# Copy package files
COPY --chown=reactjs:nodejs package*.json ./

# Install dependencies (including devDependencies needed for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY --chown=reactjs:nodejs . .

# Build the application
RUN npm run build

# Stage 2: Serve the application with nginx
FROM nginx:alpine

# Install security updates
RUN apk upgrade --no-cache

# Create non-root user for nginx
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-app -u 1001 -G nginx-app

# Configure nginx to run as non-root
RUN sed -i 's|/run/nginx.pid|/tmp/nginx.pid|' /etc/nginx/nginx.conf && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    chown -R nginx-app:nginx-app /etc/nginx/conf.d

# Copy built assets from build stage
COPY --from=build --chown=nginx-app:nginx-app /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY --chown=nginx-app:nginx-app nginx.conf /etc/nginx/conf.d/default.conf

# Switch to non-root user
USER nginx-app

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Expose port 8080
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
