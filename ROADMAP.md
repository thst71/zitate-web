# Zitate Web Application - Roadmap

## Completed Phases

### ✅ Phase 1: Foundation (Weeks 1-2)
**Status:** Complete
**Deliverable:** Basic entry management with text and location

**Features:**
- IndexedDB schema and CRUD operations
- Entry creation with text validation
- Automatic geolocation capture
- Entry list display with date formatting
- Dark mode support
- Responsive layout

**Files:** 116 tests passing

---

### ✅ Phase 2: Authors and Labels (Weeks 3-4)
**Status:** Complete
**Deliverable:** Author and label management

**Features:**
- Author CRUD operations with duplicate prevention
- Label CRUD operations with autocomplete
- Author selection (inline creation)
- Label input with visual tags
- Display authors and labels in entry cards
- Alphabetical sorting

**Files:** 133 tests passing (+17 new tests)

---

### ✅ Phase 3: Search and Smart Folders (Weeks 5-6)
**Status:** Complete
**Deliverable:** Search and organization features

**Features:**
- Multi-field search (text, author, labels)
- Debounced search input (300ms)
- Smart folder creation with criteria builder
- Folder-based filtering
- Criteria: author, labels, text, location, date range
- Dynamic entry counts

**Files:** 172 tests passing (+84 new tests)

---

### ✅ Phase 4: Entry Editing and Deletion (Week 7)
**Status:** Complete
**Deliverable:** Complete CRUD operations

**Features:**
- Edit existing entries (text, author, labels)
- Delete entries with confirmation
- ConfirmDialog component (reusable)
- Edit/Delete button UI on entry cards
- Pre-filled edit form
- Read-only location in edit mode

**Files:** 10 files changed, core CRUD complete

---

## Planned Phases

### 📋 Phase 5: Image Attachments (Week 8)
**Goal:** Add image upload and display

**Planned Features:**
- Image file selection (up to 10 per entry)
- Image compression (max 2MB each)
- Store images as Blobs in IndexedDB
- Thumbnail display in entry cards
- Full-size image viewer/gallery
- Image deletion (individual)
- Support JPEG, PNG, HEIC formats

**Estimated Effort:** 8-10 hours

**Stories:**
- Image upload component
- Image compression service
- Image storage in IndexedDB
- Thumbnail grid display
- Image viewer modal
- Delete individual images

---

### 📋 Phase 6: Location Display with Mini-Maps (Week 9)
**Goal:** Visual location display on entry cards

**Planned Features:**
- Mini-map display on entry cards (when location exists)
- Static map images (OpenStreetMap tiles or similar)
- Map thumbnail (small, 200x150px)
- Click to view full-size map
- Fallback to coordinates if map unavailable
- Offline-friendly (cache map tiles)

**Estimated Effort:** 6-8 hours

**Stories:**
- Integrate map library (Leaflet or static tiles)
- Mini-map component for entry cards
- Full-size map modal
- Handle map loading states
- Offline map support

**Technical Considerations:**
- Use static map tiles API (OpenStreetMap/Mapbox)
- Or use Leaflet.js for interactive maps
- Cache tiles in IndexedDB for offline use
- Lazy load maps (performance)

---

### 📋 Phase 7: Location Editing (Week 10)
**Goal:** Allow users to edit entry locations

**Planned Features:**
- Map picker for location selection
- Edit location in entry form
- Drag marker to set location
- Search for address/place
- Reverse geocoding (coordinates → address)
- Update existing entry locations
- Clear location option

**Estimated Effort:** 8-10 hours

**Stories:**
- Location picker component (map-based)
- Integrate geocoding API
- Address search
- Marker dragging
- Location clear option
- Update EntryForm for location editing

**Technical Considerations:**
- Use Leaflet.js for interactive map
- OpenStreetMap Nominatim for geocoding (free)
- Or Mapbox/Google Maps APIs (paid)
- Handle permission/API errors

---

### 📋 Phase 8: Import/Export (Week 11)
**Goal:** Data portability and backup

**Planned Features:**
- Export all data to JSON file
- Include media as Base64 in export
- Import JSON file (restore backup)
- Merge or replace options on import
- Schema version in export
- Validate import data structure
- Progress indicator for large exports

**Estimated Effort:** 6-8 hours

**Stories:**
- Export service (all data to JSON)
- Convert Blobs to Base64
- Download JSON file
- Import file picker
- Validate import structure
- Merge/replace logic
- Progress UI

**Export Format:**
```json
{
  "version": "1.0",
  "exportDate": "2026-03-15T00:00:00.000Z",
  "entries": [...],
  "authors": [...],
  "labels": [...],
  "folders": [...],
  "images": [
    {
      "id": "...",
      "entryId": "...",
      "data": "base64...",
      "mimeType": "image/jpeg"
    }
  ]
}
```

---

### 📋 Phase 9: Progressive Web App (PWA) (Week 12)
**Goal:** Offline capability and installability

**Planned Features:**
- Service Worker setup
- App Shell caching (cache-first)
- Offline functionality (all features work offline)
- Add to Home Screen (A2HS) prompt
- Web App Manifest
- App icons (multiple sizes)
- Splash screen
- Update notification (new version available)

**Estimated Effort:** 8-10 hours

**Stories:**
- Create service worker
- Implement caching strategies
- Create manifest.json
- Generate app icons
- Test offline mode
- Test install flow
- Update notification UI

**PWA Requirements:**
- HTTPS (production)
- Manifest with name, icons, theme
- Service worker registered
- Responds to fetch events
- Icons: 192x192, 512x512 (minimum)

---

## Version 2.x Features (Future)

### Audio Recording
**Deferred to:** v2.0
**Reason:** Complex feature requiring MediaRecorder API, browser compatibility testing, storage considerations

**Planned Features:**
- Audio recording (max 5 minutes)
- Playback controls
- Waveform visualization
- Store as Blob in IndexedDB
- Multiple audio clips per entry
- Delete individual clips

---

## Summary

| Phase | Focus | Status | Tests | Effort |
|-------|-------|--------|-------|--------|
| 1 | Foundation | ✅ Complete | 116 | 49h |
| 2 | Authors & Labels | ✅ Complete | 133 | 36h |
| 3 | Search & Folders | ✅ Complete | 172 | 51h |
| 4 | Edit & Delete | ✅ Complete | TBD | 12h |
| 5 | Images | 📋 Planned | TBD | 8-10h |
| 6 | Mini-Maps | 📋 Planned | TBD | 6-8h |
| 7 | Location Edit | 📋 Planned | TBD | 8-10h |
| 8 | Import/Export | 📋 Planned | TBD | 6-8h |
| 9 | PWA | 📋 Planned | TBD | 8-10h |

**Total Completed:** 148 hours (4 phases)
**Remaining (Phases 5-9):** 36-46 hours
**Total Estimated:** 184-194 hours for v1.0

---

## Technology Stack

**Core:**
- React 18 + TypeScript
- Vite (build tool)
- IndexedDB (idb library)

**Current Dependencies:**
- uuid (ID generation)
- date-fns (date formatting)

**Planned Additions:**
- Phase 5: browser-image-compression (image compression)
- Phase 6-7: Leaflet.js (maps) or static map tiles
- Phase 9: workbox (service worker helpers, optional)

---

## Notes

- All phases maintain test coverage
- All phases maintain backward compatibility
- All phases support dark mode
- All phases are mobile-responsive
- IndexedDB remains the single source of truth (no cloud sync in v1.0)

---

*Last Updated:* 2026-03-15
*Current Phase:* Phase 4 Complete ✅
*Next Phase:* Phase 5 - Image Attachments
