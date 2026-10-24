# §7 Constraints and assumptions

## Constraints

1. Web platform only (desktop and mobile browsers).
2. Local-only architecture, no server backend.
3. Browser storage limits apply (typically 50 MB to 1 GB depending on the browser).
4. A modern browser with IndexedDB, ES6+ and CSS Grid is required.
5. Media features need browser API support (MediaRecorder, Geolocation, MediaDevices).
6. No LLM features in version 1 (see §8).
7. Geocoding needs an external service and is optional.

## Assumptions

8. Users grant the browser permissions they want to use (location, camera, microphone).
9. Location accuracy varies by device and browser (typically 10 m to 100 m).
10. Users manage their browser storage quota.
11. IndexedDB is available and not disabled.
12. Modern JavaScript is supported (ES6+, modules, async/await).
13. No synchronization across devices in version 1.
14. Users understand that the data is stored in their browser, not in a cloud.
15. Users back up their data through export.
