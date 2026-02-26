# EggHunt Mobile V0 (Offline) Release Guide

This guide ships the current game to app stores without login or backend.

## 1) One-time setup

From repo root:

```bash
npm install
npx cap add android
npx cap add ios
```

## 2) Prepare web bundle for native shell

```bash
npm run prepare:web
```

This generates `dist/` from:
- `index.html`
- `app.js`
- `styles.css`
- `assets/`

## 3) Sync with native projects

```bash
npm run cap:sync
```

## 4) Open native IDE projects

Android:

```bash
npm run cap:open:android
```

iOS:

```bash
npm run cap:open:ios
```

## 5) V0 acceptance checks before release

1. Launch app and verify BGM + SFX toggles work.
2. Create hunt, place eggs/props, switch to find mode, finish hunt.
3. Background and foreground the app:
   - BGM pauses/resumes correctly.
   - Active hunt state is restored.
4. Close app and relaunch:
   - Last hunt state restores from local storage.
5. Verify touch behavior in scene drag/rotate/scale on small Android device.

## 6) Runtime behavior implemented for mobile

- Offline-only gameplay (no auth, no backend).
- Local runtime state persistence key:
  - `egghunt_runtime_state_v1`
- Audio settings:
  - `egghunt_sound_enabled`
  - `egghunt_music_enabled`
- Local metrics (for QA/debug):
  - `window.EggHuntMetrics.read()`
  - `window.EggHuntMetrics.clear()`

## 7) Store metadata checklist

Android Play Console:
1. Privacy policy URL (state offline/local-only behavior).
2. Data safety form:
   - No personal data collection in V0.
3. Screenshots from key flows:
   - Setup (theme picker)
   - Hide mode
   - Find mode
   - Completion screen

iOS App Store Connect:
1. App privacy answers aligned with offline/local-only behavior.
2. TestFlight external tester pass before App Review.
