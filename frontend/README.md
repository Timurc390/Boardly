# Boardly Frontend

## Requirements
- Node.js 18+
- npm 9+

## Local Start
```bash
npm install
npm start
```

Frontend runs on `http://localhost:3000`.

## QA Commands
- `npm run lint` - ESLint for `src` and Playwright tests.
- `npm run test:mobile:public` - mobile smoke for public pages (`/help`, `/community`, `/privacy-policy`).
- `npm run test:mobile:smoke` - authenticated mobile smoke (`public + board flows`).
- `npm run test:desktop:smoke` - desktop smoke for public/auth/protected routes on `1920x1080`.
- `npm run build` - production build.
- `npm run qa:public` - `lint + mobile public smoke + desktop smoke + build`.
- `npm run qa:local` - `lint + authenticated mobile smoke + desktop smoke + build`.

## Playwright Local Setup
For full mobile smoke (`viewport-390x844` + `android-pixel-5`), install Playwright browsers and host dependencies:

```bash
npx playwright install
sudo npx playwright install-deps
```

If system deps cannot be installed locally, run Chromium-only mobile smoke:

```bash
npx playwright test tests/public-mobile-pages.spec.ts --workers=1 --project=android-pixel-5
```

## Authenticated Smoke Env Vars
`tests/mobile-ui.spec.ts` needs:
- `TEST_USERNAME`
- `TEST_PASSWORD`

PowerShell example:
```powershell
$env:TEST_USERNAME='your-login'
$env:TEST_PASSWORD='your-password'
npm run test:mobile:smoke -- --reporter=list
```

## Notes
- Auth smoke expects local backend auth/API to be available.
- Playwright auto-starts frontend dev server (`webServer`) for mobile smoke commands.
- Playwright projects used by default: `viewport-390x844`, `android-pixel-5`.
