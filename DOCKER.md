# Docker Deployment Guide

This document describes how to build and run the Zitate web application using Docker.

## Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose 2.0 or higher (optional, for docker-compose usage)

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

The application will be available at: http://localhost:8080

### Using Docker CLI

```bash
# Build the image
docker build -t zitate-web:latest ./Zitate.web

# Run the container
docker run -d -p 8080:80 --name zitate-web zitate-web:latest

# View logs
docker logs -f zitate-web

# Stop the container
docker stop zitate-web
docker rm zitate-web
```

## Architecture

The Dockerfile uses a multi-stage build:

1. **Build Stage**: Uses Node.js 18 Alpine to build the Vite application
   - Installs dependencies with `npm ci`
   - Builds production bundle with `npm run build`

2. **Production Stage**: Uses Nginx Alpine to serve the static files
   - Copies built assets from build stage
   - Serves SPA with client-side routing support
   - Includes security headers and caching configuration

## Configuration

### Port Configuration

Default port mapping is `8080:80`. To use a different port:

```bash
# Docker Compose
# Edit docker-compose.yml and change ports section

# Docker CLI
docker run -d -p 3000:80 --name zitate-web zitate-web:latest
```

### Nginx Configuration

The `nginx.conf` file includes:
- Client-side routing support for SPA
- Gzip compression for better performance
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Cache control for static assets (1 year) and index.html (no-cache)

To modify nginx configuration, edit `Zitate.web/nginx.conf` and rebuild the image.

## Building for Production

```bash
# Build with specific tag
docker build -t zitate-web:v1.0.0 ./Zitate.web

# Build with multiple tags
docker build -t zitate-web:latest -t zitate-web:v1.0.0 ./Zitate.web
```

## Image Size Optimization

The image uses:
- Alpine Linux base images (minimal size)
- Multi-stage builds (only production files in final image)
- `.dockerignore` to exclude unnecessary files

Expected image size: ~25-30 MB (nginx:alpine + built assets)

## Health Checks

To add a health check to the container:

```bash
docker run -d \
  -p 8080:80 \
  --name zitate-web \
  --health-cmd="wget --no-verbose --tries=1 --spider http://localhost/ || exit 1" \
  --health-interval=30s \
  --health-timeout=3s \
  --health-retries=3 \
  zitate-web:latest
```

Or add to `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"]
  interval: 30s
  timeout: 3s
  retries: 3
  start_period: 10s
```

## Development vs Production

This Docker setup is for **production deployment only**. For development:

```bash
# Use the development server
cd Zitate.web
npm install
npm run dev
```

## Data Persistence

The Zitate web application stores all data in the browser's IndexedDB. There is no server-side data storage, so:
- No volumes are required
- Data is stored client-side only
- Multiple users will have separate data stores

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs zitate-web

# Check if port is already in use
lsof -i :8080
```

### Build fails

```bash
# Clear Docker build cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t zitate-web:latest ./Zitate.web
```

### Permission errors

```bash
# Ensure Docker has permission to read the build context
# Check file permissions in Zitate.web directory
ls -la Zitate.web/
```

## Security Considerations

- The application runs as root inside the container (nginx default)
- For enhanced security, consider running nginx as non-root user
- All data is client-side; no server-side secrets needed
- Keep base images updated: `docker pull nginx:alpine && docker pull node:18-alpine`

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build Docker Image
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t zitate-web:latest ./Zitate.web
      - name: Test container
        run: |
          docker run -d -p 8080:80 --name test zitate-web:latest
          sleep 5
          curl --fail http://localhost:8080 || exit 1
          docker stop test
```

## Support

For issues related to Docker deployment, check:
- Docker logs: `docker logs zitate-web`
- Nginx error logs: `docker exec zitate-web cat /var/log/nginx/error.log`
- Container status: `docker ps -a`
