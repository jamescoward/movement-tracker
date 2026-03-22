# Baby Movement Tracker — Project Plan

## Overview

A progressive web app (PWA) for tracking baby movements (kicks) throughout the day. The app helps parents keep a clear, visual record of movements and the context around them — rather than relying on memory alone. Movements are logged with contextual flags (just eaten, crunched up, listening to music, etc.) and visualised as a heat map and daily charts.

**Important principle:** This app is a **recording and visualisation tool only**. It does not make diagnostic predictions, flag anomalies, or tell the user whether their baby's movements are "normal" or not. That judgement belongs to the parent and their medical team. The app simply makes the data easier to see and recall.

## Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript (or lightweight framework like Preact if complexity warrants it later)
- **Storage:** localStorage (with IndexedDB as a future upgrade path)
- **Deployment:** Static files, installable as a PWA via service worker + web app manifest
- **Design:** Muted, calming colour palette — no baby blue or pink. Think warm neutrals, sage greens, soft lavenders, muted teals.

## Data Safety Note (localStorage / PWA)

localStorage is tied to the browser origin and persists until explicitly cleared. Risks to be aware of:

- **Clearing browser data** wipes localStorage — users should be warned and offered an export option.
- **Private/incognito mode** may not persist data across sessions.
- **Storage limits** are typically 5–10 MB per origin, which is plenty for movement logs.
- **No encryption by default** — data is readable by any JS on the same origin. We'll be the only script, so this is low risk, but the app should never be hosted on a shared origin.
- **Device loss/damage** means data loss without a backup. An export-to-file feature (JSON/CSV) is planned to mitigate this.

Overall: perfectly adequate for a personal tracking tool, especially with an export/backup feature.

---

## Phases & Sprints

Each sprint is scoped so a single agent can pick it up independently. Sprints within a phase can generally run in sequence; phases build on each other.

---

### Phase 1 — Foundation

> Get the core infrastructure and a working movement logger in place.

#### Sprint 1.1 — Project Scaffolding

- [x] Initialise project structure: `index.html`, `styles.css`, `app.js`
- [x] Set up PWA manifest (`manifest.json`) with app name, icons placeholder, theme colour
- [x] Create a basic service worker for offline caching (cache-first for app shell)
- [x] Define the colour palette and CSS custom properties (muted/calming, no blue/pink)
- [x] Basic responsive layout shell (header, main content area, nav stub)

#### Sprint 1.2 — Data Layer ✅ COMPLETE

- [x] Design the movement record schema:
  ```json
  {
    "id": "uuid",
    "timestamp": "ISO-8601",
    "flags": {
      "justEaten": false,
      "crunchedUp": false,
      "listeningToMusic": false,
      "resting": false,
      "active": false
    },
    "notes": ""
  }
  ```
- [x] Build a storage abstraction module (`storage.js`) wrapping localStorage
  - `saveMovement(record)`
  - `getMovements(dateRange?)`
  - `deleteMovement(id)`
  - `exportData()` → JSON string
  - `importData(json)`
- [x] Add storage capacity check and warning when approaching limits

#### Sprint 1.3 — Movement Logging UI ✅ COMPLETE

- [x] "Log Movement" button — prominent, easy to tap one-handed
- [x] Timestamp defaults to now, with an adjuster (time picker) to correct if needed
- [x] Contextual flag toggles (pill/chip style):
  - Just eaten
  - Crunched up
  - Listening to music
  - Resting
  - Active/moving around
- [x] Optional free-text notes field
- [x] Save confirmation (subtle animation/toast, not a modal)
- [x] Recent movements list on the home screen (today's log)

---

### Phase 2 — Visualisation

> Show logged data as a simple daily chart.

#### Sprint 2.1 — Daily Movement Chart ✅ COMPLETE

- [x] Day view: vertical timeline or bar chart showing movements across 24 hours
- [x] Each movement shown as a mark/dot on the timeline
- [x] Colour-code or icon-mark movements that have flags
- [x] Day navigation (previous/next day, date picker)
- [x] Empty state for days with no data

#### Sprint 2.2 — Weekly Summary View ✅ COMPLETE

- [x] 7-day grid/row view showing movement counts per day
- [x] Tap a day to drill into the daily view
- [x] Simple movement count per day — no judgement indicators, just the data

---

### Phase 3 — Pattern Visualisation

> After ~7 days of data, help the user *see* their own patterns. No interpretation, no alerts — just a clearer picture.

#### Sprint 3.1 — Heat Map

- [ ] Hour-of-day × day-of-week heat map showing movement density
- [ ] Colour intensity mapped to movement frequency
- [ ] Overlay flag frequency (e.g. show that post-meal kicks tend to cluster at certain times)
- [ ] The user draws their own conclusions — the app just presents the data

#### Sprint 3.2 — Flag Correlation View

- [ ] Simple breakdown: how often each flag is present when movements are logged
- [ ] Side-by-side comparison (e.g. movements per hour on "just eaten" vs. not)
- [ ] Purely observational — no "you should eat more" or similar suggestions

---

### Phase 4 — Data Management & Polish

> Export, import, and overall UX polish.

#### Sprint 4.1 — Export & Import ✅ COMPLETE

- [x] Export all data as JSON file download
- [x] Import from JSON file (with validation and merge/overwrite options)
- [x] CSV export for spreadsheet use

#### Sprint 4.2 — Settings & Preferences

- [ ] Customisable flag list (add/remove/rename flags)
- [ ] Reminder notifications (if notification permission granted)
- [ ] Dark/light mode toggle (both within the muted palette)

#### Sprint 4.3 — PWA Polish

- [ ] Proper app icons (multiple sizes)
- [ ] Splash screen
- [ ] Offline-first UX messaging
- [ ] Install prompt handling
- [ ] Lighthouse audit pass (PWA, accessibility, performance)

---

### Phase 5 — Extended Features (Future)

> Ideas for after the core is solid. Not scheduled into sprints yet.

- Shareable summary (generate an image or PDF of weekly report)
- Partner/co-parent view (shared data via simple sync or file sharing)
- Contraction timer (separate mode)
- Integration with health apps (if APIs permit)
- See `ideas.md` for chart and visualisation ideas

---

## Sprint Dependency Map

```
1.1 Scaffolding
 └─► 1.2 Data Layer
      └─► 1.3 Logging UI
           ├─► 2.1 Daily Chart
           │    └─► 2.2 Weekly Summary
           │         └─► 3.1 Heat Map
           │              └─► 3.2 Flag Correlation View
           └─► 4.1 Export/Import (can start after 1.3)
                └─► 4.2 Settings
                     └─► 4.3 PWA Polish
```

Sprints 4.1–4.3 can run in parallel with Phase 3 since they don't depend on baseline features.

---

## Design Direction

| Element         | Approach                                                     |
|-----------------|--------------------------------------------------------------|
| Palette         | Warm neutrals, sage green, soft lavender, muted teal, cream  |
| Typography      | Clean sans-serif, generous spacing, large tap targets         |
| Tone            | Calm, reassuring, never clinical or alarming                  |
| Animations      | Subtle, purposeful (save confirmations, transitions)          |
| Accessibility   | High contrast ratios within muted palette, screen reader support |
