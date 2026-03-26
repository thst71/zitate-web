# Zitate - Quote Collection

A web application for collecting and managing quotes, citations, and "bon mots" with rich metadata including location, images, and intelligent organization.

## Web Application

### Prerequisites

- [Node.js](https://nodejs.org/) 24+
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

### Quick Start (Development)

```bash
cd Zitate.web
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests in watch mode |
| `npm run test -- --coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |

### Docker

#### Build and run locally

```bash
docker build -t zitate-web ./Zitate.web
docker run -p 8080:8080 zitate-web
```

Open [http://localhost:8080](http://localhost:8080).

#### Using docker-compose

```bash
docker compose up -d
```

Open [http://localhost:8080](http://localhost:8080). Stop with `docker compose down`.

#### Pull from GitHub Container Registry

```bash
docker pull ghcr.io/thst71/zitate:latest
docker run -p 8080:8080 ghcr.io/thst71/zitate:latest
```

Available tags: `latest`, `1`, `1.0`, `1.0.0` (semver).

### Architecture

The web app is a Progressive Web App (PWA) built with:

- **React 18** with TypeScript
- **Vite 7** as build tool
- **IndexedDB** (via `idb`) for offline-first local storage
- **Leaflet** for map display and location picking
- **Workbox** (via `vite-plugin-pwa`) for service worker and offline caching

```
Zitate.web/src/
├── components/       # React components (entry, author, folder, label, search, ...)
├── hooks/            # Custom React hooks (useEntries, useAuthors, useFolders, ...)
├── services/         # Database and location services
├── db/               # IndexedDB schema
├── models/           # TypeScript interfaces
├── utils/            # Validators and helpers
└── styles/           # CSS styles
```

### Features

- Create, edit, and delete quotes with rich text
- Assign authors and labels with autocomplete
- Automatic and manual location tagging with map view
- Image attachments with compression
- Smart folders with dynamic filter criteria
- Full-text search with debouncing
- Import/Export functionality
- Offline-first PWA with service worker caching
- Responsive design for mobile and desktop

## CI/CD

The project uses GitHub Actions for continuous integration:

- **Pull Requests**: lint, test, security audit, Docker build (without push)
- **Tag Push** (`v*.*.*`): parallel native Docker builds (amd64 + arm64), multi-arch manifest push to GHCR, Trivy vulnerability scan

## Documentation

| File | Description |
|---|---|
| `specification-web.adoc` | Functional requirements |
| `tech-specification-web.adoc` | Technical architecture |
| `backlog-web.adoc` | User stories and implementation backlog |
| `DOCKER.md` | Docker deployment guide |

## License

Copyright © 2026. All rights reserved.
