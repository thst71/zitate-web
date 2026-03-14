# Web Specification Documents - Summary

**Date Created:** 2026-03-15
**Platform:** Web (SPA with Local Storage)

## Documents Created

### 1. specification-web.adoc
**Purpose:** Complete functional and non-functional requirements for web version

**Key Changes from iOS Version:**
- ✅ Removed iOS-specific language and APIs
- ✅ Replaced Core Data → IndexedDB
- ✅ Replaced iCloud sync → Export/Import JSON
- ✅ Removed LLM features (FR-4.3) from v1.0 → Future Enhancements
- ✅ Changed gestures: "swipe" → "delete button" (+ optional touch gestures)
- ✅ Changed interactions: "tap" → "click"
- ✅ Added browser-specific APIs (Geolocation, MediaRecorder, File API)
- ✅ Added responsive design requirements (320px-1024px+)
- ✅ Added WCAG 2.1 AA accessibility standards
- ✅ Added PWA requirements (NFR-6)
- ✅ Added data portability requirements (NFR-5)

**New Requirements:**
- NFR-5: Data Portability (export/import JSON with Base64 media)
- NFR-6: Offline Capability (PWA with Service Worker)
- Browser compatibility matrix (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Storage quota management
- Responsive design across devices

---

### 2. tech-specification-web.adoc
**Purpose:** Technical architecture and implementation details

**Technology Stack:**
- **Language:** JavaScript/TypeScript ES6+
- **UI Framework:** React 18+ (or Vue 3+ or Vanilla JS)
- **Build Tool:** Vite
- **Database:** IndexedDB (via idb library)
- **PWA:** Service Worker + manifest.json
- **Browser APIs:** Geolocation, MediaRecorder, MediaDevices, File API

**Architecture:**
- Component-based (React/Vue)
- Custom hooks for shared logic
- Service layer for business logic
- IndexedDB schema with 6 object stores
- CSS custom properties for theming
- Mobile-first responsive design

**Key Technical Decisions:**
- IndexedDB for all data (entries, authors, labels, media as Blobs)
- UUID v4 for all IDs
- Unix timestamps for dates
- Base64 encoding for media in exports
- WebM/Opus for audio (browser-dependent)
- Virtual scrolling for >100 items
- Bundle size target: <500KB gzipped

**Performance Targets:**
- Load time: <2s (desktop), <4s (mobile) with 1,000 entries
- Lighthouse score: >90
- 60fps scrolling
- IndexedDB query: <100ms

---

### 3. backlog-web.adoc
**Purpose:** Implementation backlog with user stories

**Total Stories:** ~25 stories across 7 epics

**Epics:**
1. Core Data Layer and IndexedDB (4 stories)
2. Entry Management (6 stories)
3. UI Foundation and Responsive Design (3 stories)
4. Media Features (3 stories)
5. Author and Label Management (2 stories)
6. Search and Folders (2 stories)
7. PWA and Offline (3 stories)

**Implementation Phases:**
- Phase 1: Foundation (2 weeks) - Core data + basic entries
- Phase 2: Media and Authors (2 weeks) - Images, audio, authors, labels
- Phase 3: Search and Organization (2 weeks) - Search, smart folders
- Phase 4: PWA and Polish (1 week) - Offline, export/import

**Total Estimated Effort:** ~120 hours (7 weeks part-time)

---

### 4. phase1-web.adoc
**Purpose:** Detailed Phase 1 implementation plan

**Phase 1 Goal:** Core data layer with IndexedDB and basic entry management

**Duration:** 2 weeks (49 hours estimated)

**Stories (10 total):**

**Week 1: Data Layer**
1. Project setup (Vite + React + TypeScript)
2. TypeScript interfaces for all models
3. IndexedDB schema setup (6 object stores)
4. CRUD service wrapper
5. Validation utilities

**Week 2: UI and Entry Management**
6. App shell and layout
7. Entry creation form modal
8. Text input with validation
9. Geolocation integration
10. Entry save to IndexedDB
11. Entry list display
12. Dark mode support

**Deliverables:**
- ✅ Working IndexedDB persistence
- ✅ Entry creation with text and location
- ✅ Entry list view
- ✅ Dark mode
- ✅ Responsive layout
- ✅ Browser geolocation integration

**Not in Phase 1:**
- ❌ Images/audio
- ❌ Authors/labels
- ❌ Search/folders
- ❌ PWA/offline
- ❌ Export/import
- ❌ Entry editing/deletion

---

## Comparison: iOS vs Web

| Feature | iOS (Swift + Core Data) | Web (React + IndexedDB) |
|---------|------------------------|------------------------|
| **Language** | Swift 5.9+ | TypeScript/JavaScript ES6+ |
| **UI Framework** | SwiftUI | React 18+ |
| **Database** | Core Data | IndexedDB |
| **Sync** | iCloud (CloudKit) | Export/Import JSON |
| **Offline** | Native (always offline-first) | PWA with Service Worker |
| **Location** | CoreLocation (±10m) | Geolocation API (variable) |
| **Audio Format** | M4A | WebM/Opus (browser-dependent) |
| **Image Storage** | File system | IndexedDB as Blobs |
| **Gestures** | Native swipe gestures | Delete buttons + optional touch |
| **Platform** | iOS 17.0+ | Chrome 90+, Firefox 88+, Safari 14+ |
| **Bundle Size** | N/A (compiled) | <500KB gzipped |
| **LLM Features** | iOS 18+ (Apple Intelligence) | Deferred to v2.0 |

---

## Key Differences from iOS Version

### Removed Features (v1.0)
1. **LLM Natural Language Query (FR-4.3)** - Moved to Future Enhancements
   - Reason: Complexity, requires external API, network dependency
   - Alternative: Structured criteria builder only

2. **LLM Label Suggestions (FE-1)** - Already deferred in iOS
   - Reason: Same as above

### Modified Features

1. **Location Capture**
   - iOS: High accuracy GPS (±10m)
   - Web: Browser Geolocation API (variable accuracy, 10m-100m)

2. **Audio Recording**
   - iOS: M4A format (AAC)
   - Web: WebM/Opus (browser-dependent)

3. **Image Storage**
   - iOS: File system in app sandbox
   - Web: IndexedDB as Blobs (with compression)

4. **Sync/Backup**
   - iOS: iCloud sync
   - Web: Manual export/import JSON files

5. **Gestures**
   - iOS: Native swipe gestures
   - Web: Delete buttons (+ optional touch swipe)

### Added Features

1. **NFR-5: Data Portability**
   - Export all data as JSON
   - Import with merge/replace options
   - Media included as Base64

2. **NFR-6: Offline Capability**
   - PWA with Service Worker
   - Installable to home screen
   - Full offline functionality

3. **Browser Compatibility**
   - Specific browser version requirements
   - Feature detection and graceful degradation

4. **Responsive Design**
   - Mobile (320px+)
   - Tablet (768px+)
   - Desktop (1024px+)

---

## Usage Recommendations

### For iOS Native App
Use these documents:
- `specification.adoc`
- `tech-specification.adoc`
- `backlog.adoc`
- `phase1.adoc`

### For Web SPA
Use these documents:
- `specification-web.adoc`
- `tech-specification-web.adoc`
- `backlog-web.adoc`
- `phase1-web.adoc`

### For Both Platforms
- Share UI/UX patterns where possible
- Reuse validation logic (port from Swift to TS or vice versa)
- Keep data schemas compatible for future cross-platform sync
- Consider shared design system (colors, typography, spacing)

---

## Next Steps

### To Implement Web Version

1. **Start with Phase 1** (2 weeks):
   - Set up Vite + React + TypeScript project
   - Implement IndexedDB schema and CRUD service
   - Build entry creation form with geolocation
   - Create entry list view
   - Add dark mode support

2. **After Phase 1 Success**:
   - Review and adjust estimates
   - Begin Phase 2 (media and authors)
   - Iterate through Phase 3 and 4

3. **Testing Throughout**:
   - Unit tests for services and utilities
   - Component tests for React components
   - E2E tests for critical flows
   - Browser compatibility testing
   - Accessibility audit (WCAG 2.1 AA)

---

## Files Summary

| File | Lines | Purpose |
|------|-------|---------|
| `specification-web.adoc` | ~370 | Functional & non-functional requirements |
| `tech-specification-web.adoc` | ~580 | Technical architecture & implementation |
| `backlog-web.adoc` | ~450 | User stories and implementation backlog |
| `phase1-web.adoc` | ~460 | Phase 1 detailed implementation plan |

**Total:** ~1,860 lines of comprehensive web specification

---

## Conclusion

The web specification documents provide a complete blueprint for building Zitate as a browser-based SPA with local storage. The requirements are adapted from the iOS version to leverage web technologies (IndexedDB, PWA, browser APIs) while maintaining the core feature set.

**Key Advantages of Web Version:**
- ✅ Cross-platform (any device with modern browser)
- ✅ No app store approval needed
- ✅ Instant updates
- ✅ Lower development cost (one codebase vs multiple platforms)
- ✅ PWA allows installation without app store

**Key Limitations:**
- ⚠️ Less precise location (browser API vs native GPS)
- ⚠️ Browser storage limits (50MB-1GB vs unlimited on iOS)
- ⚠️ Audio format depends on browser
- ⚠️ No LLM features in v1.0
- ⚠️ Requires manual backup (export/import)

Both versions share the same core functionality and can coexist as complementary offerings.

---

*Created: 2026-03-15*
*Status: Ready for Implementation*
