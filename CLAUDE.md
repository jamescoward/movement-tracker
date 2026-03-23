# CLAUDE.md — Developer Notes

## Service worker cache versioning

This app uses a cache-first service worker (`sw.js`). When deploying changes to any cached file, **bump the cache version** in `sw.js` or existing users will continue receiving stale cached files indefinitely.

```js
// sw.js
const CACHE_NAME = 'movement-tracker-v7'; // increment this on each deploy
```

The browser always fetches `sw.js` fresh from the network, so changing the version string is enough to trigger cache invalidation for all users.

## Adding new files

Two places need updating when a new file is added:

**1. `sw.js` — add to the `APP_SHELL` array** so it gets cached for offline use:

```js
const APP_SHELL = [
  // ...existing files...
  './my-new-file.js',
];
```

**2. `.github/workflows/deploy.yml` — add to the `cp` command** in the "Collect web files" step, otherwise the file won't be included in the GitHub Pages deployment and will 404:

```yaml
- name: Collect web files
  run: |
    mkdir dist
    cp index.html styles.css app.js ... my-new-file.js dist/
```
