# EggHunt

Fairytale-style Easter egg hunt game for kids.

Current release target: **offline mobile V0** (no login/backend).

## Live Site

- URL: [https://nzhou.github.io/EggHunt/](https://nzhou.github.io/EggHunt/)
- Deploy status: [![Deploy Web to GitHub Pages](https://github.com/nzhou/EggHunt/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/nzhou/EggHunt/actions/workflows/deploy-pages.yml)

## GitHub Pages Setup

1. Open repository **Settings** -> **Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` to trigger deployment.

## Local Web Run

Open `index.html` in browser, or host static files with any local server.

## Mobile (Capacitor) Workflow

```bash
npm install
npx cap add android
npx cap add ios
npm run cap:sync
npm run cap:open:android
```

See:
- `docs/mobile-v0-offline-release.md`
- `docs/v1-login-share-roadmap.md`

## Notes on Repository Visibility

- Public repos work with GitHub Free.
- Private repos for Pages require a paid plan (for personal accounts, GitHub Pro; for orgs, Team/Enterprise).
- If a repo is switched to private on GitHub Free, any published Pages site is automatically unpublished.
