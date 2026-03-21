# Zitate - Quote Collection

A multi-platform application for collecting and managing quotes, citations, and "bon mots" with rich metadata including location, images, and intelligent organization.

## Platforms

| Platform | Stack | Status |
|---|---|---|
| **Web (PWA)** | React, TypeScript, Vite, IndexedDB | ✅ Phase 6 complete |
| **iOS** | SwiftUI, Core Data, CloudKit | ✅ Phase 1 complete |

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
| `npm run format` | Format code with Prettier |

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
- Assign authors and labels
- Automatic and manual location tagging with map view
- Image attachments with compression
- Smart folders with dynamic filter criteria
- Full-text search with debouncing
- Import/Export functionality
- Offline-first PWA with service worker caching
- Responsive design for mobile and desktop

## iOS Application

### Prerequisites

- macOS with Xcode 15.0+
- iOS 17.0+ Simulator or device

### Setup

1. Open `Zitate/Zitate.xcodeproj` in Xcode
2. Set deployment target to iOS 17.0
3. Add capabilities: iCloud → CloudKit, Background Modes → Remote notifications
4. Build (⌘B) and Run (⌘R)

## CI/CD

The project uses GitHub Actions for continuous integration:

- **Pull Requests**: lint, test, security audit, Docker build (without push)
- **Tag Push** (`v*.*.*`): parallel native Docker builds (amd64 + arm64), multi-arch manifest push to GHCR, Trivy vulnerability scan

## Documentation

| File | Description |
|---|---|
| `specification-web.adoc` | Web functional requirements |
| `tech-specification-web.adoc` | Web technical architecture |
| `phase1-web.adoc` – `phase6-web.adoc` | Web implementation phases |
| `specification.adoc` | iOS functional requirements |
| `tech-specification.adoc` | iOS technical architecture |

## License

Copyright © 2026. All rights reserved.
