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
| `npm run check` | Quality gate: lint, format check, type check, tests, specification validation |
| `npm run test` | Run the tests once (`npm run test:watch` for watch mode) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint (no warnings allowed) |
| `npm run format` | Format the sources with Prettier |

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

Available tags: `latest`, `<major>`, `<major>.<minor>`, `<major>.<minor>.<patch>` (semver).

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

- **Pull Requests** (`docker-publish.yml`): quality gate (`npm run check`), coverage, security audit, Docker build (without push)
- **Release** (`release.yml`): a signed tag `v<semver>` pushed by the maintainer is verified, then the quality gate runs, the specification is rendered to HTML, native Docker builds (amd64 + arm64) are merged into a multi-arch manifest on GHCR and scanned with Trivy, and the GitHub release is published with the release notes

## Documentation

| File | Description |
|---|---|
| `SPEC.md` | Stakeholder needs, constraints and deferred enhancements |
| `specification-web.adoc` | Functional and non-functional requirements |
| `tech-specification-web.adoc` | Technical architecture |
| `backlog-web.adoc` | User stories and implementation backlog |
| `release-notes.adoc` | Release notes |
| `DOCKER.md` | Docker deployment guide |

The specification is modular: each master includes one file per item from `specification/`. Development with coding agents follows [AGENTS.md](AGENTS.md) and the vendored [agent-skills](https://github.com/thst71/agent-skills) library in `.agents/skills/`.

## License

Copyright © 2026. All rights reserved.
