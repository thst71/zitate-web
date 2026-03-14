# Requirements Analysis: Web SPA with Local Storage

## Analysis of Current Requirements for Web Platform

### Changes Required by Section

---

## Overview (Line 5-6)
**Current**: "Mobile iOS application..."

**Suggested Change**:
```
Single-page web application (SPA) for collecting and managing sayings, citations,
and "bon mots" with rich metadata including location, media, and intelligent
organization capabilities. Data stored locally in browser.
```

---

## FR-1.2: Location Association and Modification
**Issues**:
- "GPS coordinates captured automatically with accuracy of ±10 meters" - Web Geolocation API has variable accuracy
- "Location permission requested on first use" - Different permission model in browsers

**Suggested Changes**:
```
FR-1.2: Location Association and Modification
Requirement: The system shall attempt to capture and store browser geolocation
coordinates (latitude/longitude) for each entry at the time of creation, and
allow users to modify the location during entry creation or later during editing.

Acceptance Criteria:
- Geolocation coordinates requested via browser Geolocation API
- Browser permission prompt appears on first location request
- Coordinates stored with each entry (accuracy varies by browser/device)
- Location displayed as coordinates or address (if geocoding service available)
- Location field is clickable to open interactive map interface
- User can click new location on map or search for address
- Map shows both original and new location before confirmation
- User can cancel location change without saving
- Location modification available during initial creation and subsequent editing
- App functions fully if geolocation permission denied (location optional)
```

---

## FR-1.3: Image Attachment
**Issues**:
- "User can take photo with camera" - Requires MediaDevices API or file input
- "User can select from photo library" - File input only
- "Images stored in app sandbox" - Should be IndexedDB/LocalStorage

**Suggested Changes**:
```
FR-1.3: Image Attachment
Requirement: The system shall allow users to attach up to 10 images per entry
from device camera (if available) or file system, and remove individual images.

Acceptance Criteria:
- User can capture photo using device camera (via file input or MediaDevices API)
- User can select images from file system via file input
- Images converted to Base64 or stored as Blobs in IndexedDB
- Images compressed to max 2MB each (client-side compression)
- Images stored in browser IndexedDB
- User can remove individual images via delete button on image thumbnail
- Fallback to file selection if camera not available
```

---

## FR-1.4: Audio Recording
**Issues**:
- "Audio recorded in M4A format" - Web typically uses WebM/Opus or MP3
- "Microphone permission requested on first use" - Browser permission model

**Suggested Changes**:
```
FR-1.4: Audio Recording
Requirement: The system shall allow users to record and attach audio clips
up to 5 minutes duration per entry using browser MediaRecorder API, and
remove audio recordings.

Acceptance Criteria:
- Browser microphone permission requested on first recording attempt
- Audio recorded using MediaRecorder API in WebM/Opus format (browser-dependent)
- Maximum duration 5 minutes per clip
- Audio playback available in entry detail view using HTML5 audio element
- User can remove audio via delete button in audio player control
- Audio stored as Blob in IndexedDB
- Fallback message if browser doesn't support MediaRecorder API
```

---

## FR-1.5: Entry Creation Workflow
**Issues**:
- "Tapping" should be "clicking" for web
- "app sandbox" -> browser storage

**Suggested Changes**:
```
FR-1.5: Entry Creation Workflow
Requirement: The system shall provide a "plus" button on the home screen
that initiates the creation of a new entry with all data fields.

Acceptance Criteria:
- Plus button visible and accessible on home screen
- Clicking plus button opens entry creation form (modal or route)
- Form includes all entry fields: text, location, images, audio, author, labels
- Text field is required; all other fields optional
- Location auto-requested on form open (if permission granted)
- User can save entry or cancel without saving
- Saved entry immediately appears in IndexedDB and search results
```

---

## FR-1.6: Entry Deletion
**Issues**:
- "Swipe gesture" not standard on web (desktop)

**Suggested Changes**:
```
FR-1.6: Entry Deletion
Requirement: The system shall allow users to delete entries via delete
button or context menu, with confirmation prompt before permanent deletion.

Acceptance Criteria:
- Delete button/icon visible on entry card (hover on desktop, always on mobile)
- Clicking delete shows confirmation dialog
- Confirmation dialog shows entry preview (first 50 characters)
- User can confirm or cancel deletion
- Confirmed deletion removes entry permanently from IndexedDB
- Deletion removes associated images and audio blobs
- No undo after confirmation
- Optional: Swipe gesture on touch devices reveals delete action
```

---

## FR-2.3: Author Editing and Deletion
**Issues**:
- "Swipe left" gesture

**Suggested Changes**:
```
FR-2.3: Author Editing and Deletion
Requirement: The system shall allow users to edit existing author information
and delete authors that are not associated with any entries.

Acceptance Criteria:
- User can access author list from home screen icon/button
- Clicking author in list opens edit form with all author fields
- Changes to author information update all associated entries
- Delete button/icon visible on author item (hover on desktop)
- Delete option available for authors with zero entries
- Authors with existing entries cannot be deleted (error message shown)
- Confirmation prompt before author deletion
- Deleted authors removed permanently from IndexedDB
- Optional: Swipe gesture on touch devices reveals delete action
```

---

## FR-4.3: Natural Language Query Processing
**Issues**:
- Requires LLM integration (you want to exclude this)

**Suggested Changes**:
```
FR-4.3: Natural Language Query Processing - REMOVED FOR WEB v1.0

(Move to Future Enhancements)
```

**In FR-4.4, update**:
```
FR-4.4: Smart Folder Management
Requirement: The system shall provide UI for creating, editing, and deleting
smart folders with structured criteria builder.

Acceptance Criteria:
- First card in smart folders list displays plus icon for creating new folder
- Clicking plus card opens folder creation form
- Folder creation form includes name field (required, max 100 characters)
- Criteria builder allows selecting: labels (AND/OR logic), author, date range,
  location+radius, text-match
- Edit button on folder card opens folder form with current criteria
- Delete button on folder card shows confirmation prompt with folder name
- Deleting folder removes folder but not the entries within it
- Folders can be reordered by drag-and-drop (desktop) or long-press (mobile)
- Swipe gestures optional for touch devices
```

---

## FR-5.1: Platform Design Compliance
**Issues**:
- iOS-specific

**Suggested Changes**:
```
FR-5.1: Web Design Standards Compliance
Requirement: The system shall implement UI following modern web design
standards with responsive layout and accessibility.

Acceptance Criteria:
- Uses semantic HTML5 elements
- Responsive design adapts to mobile (320px+), tablet (768px+), desktop (1024px+)
- Supports light/dark mode via CSS custom properties and prefers-color-scheme
- Implements standard web interactions (click, hover, keyboard navigation)
- Passes WCAG 2.1 AA accessibility standards
- Keyboard navigable (tab order, enter/space activation)
- Screen reader compatible (ARIA labels and roles)
- Touch-friendly on mobile (min 44px touch targets)
```

---

## FR-5.2: Home Screen Layout
**Issues**:
- iOS-specific UI patterns
- "Location updates when user moves >500m" - less relevant for web

**Suggested Changes**:
```
FR-5.2: Home Screen Layout
Requirement: The system shall display a home screen showing the nearest
quote based on current location (or latest quote if no location available),
a search text field, intelligent folders as a list of cards, and access to
author list editor.

Acceptance Criteria:
- Plus button for entry creation visible in header or as floating action button
- Featured quote card displays nearest entry within 10km radius (if geolocation available)
- If no location or entries within 10km, displays most recently created entry
- Search text field prominently positioned below featured quote
- Intelligent folders displayed as scrollable list of cards below search field
- Each folder card shows folder name and entry count
- Author list editor accessible via button/icon in header
- Featured quote shows: full text, author, distance/recency indicator, thumbnail
- Clicking featured quote opens detail view
- Clicking folder card opens folder contents view
- Location refreshed on page load (not continuous tracking)
```

---

## FR-5.3 & FR-5.4: Card-Based Views
**Issues**:
- "Swipe left" gesture, "60fps minimum"

**Suggested Changes**:
```
FR-5.3: Card-Based Search Results
Requirement: The system shall display search results as scrollable cards.

Acceptance Criteria:
- Cards display in vertical scroll list
- Each card shows: text preview (first 160 chars), author, thumbnail, distance/date
- Card click navigates to detail view
- Smooth scrolling (CSS scroll-behavior, virtual scrolling for >100 items)
- Delete button visible on card (hover on desktop, always on mobile)

FR-5.4: Folder Contents View
(Same pattern - replace "swipe" with "delete button", "tap" with "click")
```

---

## NFR-1: Performance
**Issues**:
- "iPhone 12" reference

**Suggested Changes**:
```
NFR-1: Performance
Requirement: The system shall load home screen with up to 1,000 entries
within 2 seconds on modern desktop browsers and within 4 seconds on
mobile browsers.

Acceptance Criteria:
- Measured load time <2s (desktop), <4s (mobile) with 1,000 entries
- IndexedDB queries optimized with indexes
- Images lazy-loaded as user scrolls (IntersectionObserver)
- Virtual scrolling for lists with >100 items
- Bundle size <500KB (gzipped) for initial load
- Lighthouse performance score >90
```

---

## NFR-2: Data Persistence
**Issues**:
- Core Data, iCloud specific

**Suggested Changes**:
```
NFR-2: Data Persistence
Requirement: The system shall store all data locally using browser IndexedDB
with data export/import functionality.

Acceptance Criteria:
- Data persists across browser sessions using IndexedDB
- Export functionality to download all data as JSON file
- Import functionality to restore data from JSON file
- No data loss on page refresh or browser crash
- Schema versioning for IndexedDB migrations
- Periodic automatic export to Downloads (optional, user configurable)
- Clear data option in settings with confirmation
- Storage quota management (warn user if approaching browser limits)
```

---

## NFR-3: Platform Support
**Issues**:
- iOS specific

**Suggested Changes**:
```
NFR-3: Browser Support
Requirement: The system shall support modern evergreen browsers on desktop
and mobile platforms.

Acceptance Criteria:
- Chrome 90+ (desktop and mobile)
- Firefox 88+ (desktop and mobile)
- Safari 14+ (desktop and mobile)
- Edge 90+ (desktop)
- Responsive design works on mobile (320px+), tablet (768px+), desktop (1024px+)
- Progressive Web App (PWA) installable on supported browsers
- Graceful feature degradation if APIs unavailable (camera, geolocation, etc.)
```

---

## NFR-4: Privacy
**Issues**:
- iOS permission model

**Suggested Changes**:
```
NFR-4: Privacy
Requirement: The system shall request explicit user permission for browser
APIs and handle denials gracefully.

Acceptance Criteria:
- Geolocation permission requested with clear context
- Camera/microphone permissions requested on first use
- App functions with all permissions denied (features disabled gracefully)
- Privacy policy accessible from settings/footer
- All data stored locally (no server communication)
- No cookies, tracking, or analytics
- Data export allows user to control their data
```

---

## Constraints
**Suggested Changes**:
```
== Constraints

- Web platform (desktop and mobile browsers)
- Local-only architecture (no server backend required)
- Browser storage limits apply (typically 50MB-1GB depending on browser)
- Requires modern browser with IndexedDB, ES6+, CSS Grid support
- Media features require browser API support (MediaRecorder, Geolocation)
- LLM features excluded from v1.0 (deferred to future enhancements)
```

---

## Assumptions
**Suggested Changes**:
```
== Assumptions

- Users grant necessary browser permissions (geolocation, camera, microphone)
- Geolocation accuracy varies by device and browser
- Users manage browser storage quota
- IndexedDB available and not disabled
- Modern JavaScript features supported (ES6+, Modules)
- No requirement for cross-device sync in v1.0
```

---

## New Requirements for Web

### NFR-5: Data Portability
```
NFR-5: Data Portability
Requirement: The system shall allow users to export and import their
complete data set.

Acceptance Criteria:
- Export button generates JSON file with all entries, authors, labels, folders
- Media files included as Base64 in export or separate files in ZIP
- Import validates JSON structure before restoring data
- Import offers merge or replace options
- Export includes schema version for compatibility
- Export/import handles large datasets (>1000 entries) without freezing UI
```

### NFR-6: Offline Capability
```
NFR-6: Offline Capability
Requirement: The system shall function fully offline after initial load
as a Progressive Web App.

Acceptance Criteria:
- Service Worker caches app shell and assets
- All features work without network connection
- App installable to home screen (PWA)
- Offline indicator shown when network unavailable
- Data operations work offline via IndexedDB
```

---

## Summary of Major Changes

### Remove/Replace:
1. ❌ **Remove FR-4.3** (LLM Natural Language Processing) - moved to Future Enhancements
2. ✏️ **Replace "iOS"** → "Web/Browser" throughout
3. ✏️ **Replace "swipe"** → "delete button/click" (with optional swipe on touch)
4. ✏️ **Replace "tap"** → "click" (or "click/tap")
5. ✏️ **Replace "Core Data"** → "IndexedDB"
6. ✏️ **Replace "iCloud sync"** → "Export/Import"
7. ✏️ **Replace "M4A format"** → "WebM/Opus format"
8. ✏️ **Replace "app sandbox"** → "browser IndexedDB"

### Add:
1. ✅ **Add NFR-5**: Data Portability (Export/Import)
2. ✅ **Add NFR-6**: Offline Capability (PWA)
3. ✅ **Add browser compatibility** requirements
4. ✅ **Add responsive design** criteria
5. ✅ **Add accessibility standards** (WCAG 2.1 AA)
6. ✅ **Add storage quota management**

### Adjust:
1. 📝 Location accuracy expectations (browser Geolocation API)
2. 📝 Performance targets (separate desktop/mobile)
3. 📝 Media format flexibility (browser-dependent)
4. 📝 Gesture interactions (mouse + touch)
5. 📝 Permission model (browser prompts)

---

## Recommended Approach

Create a new file: `specification-web.adoc` that:
1. Duplicates the structure of `specification.adoc`
2. Applies all changes listed above
3. Removes iOS-specific language
4. Adds web-specific requirements
5. Maintains the same requirement IDs (FR-1.1, etc.) for consistency

This allows both specifications to coexist while sharing the core feature set.
