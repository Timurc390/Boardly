# Release Readiness

Date: 2026-02-18  
Scope: board mobile overlays/popovers, profile privacy text, typography tweaks, smoke e2e, a11y, responsive support/community/privacy pages.

## Definition of Done Status

1. Desktop 1920 visual match with mock:
- Status: Passed (manual verification on PC + automated `test:desktop:smoke`).

2. Mobile 390x844 iOS Safari menus/popovers open, not clipped, clicks are not blocked:
- Status: Passed (manual phone verification + automated assertions in smoke).

3. Mobile Android Chrome same behavior:
- Status: Passed (automated `android-pixel-5` project + manual phone verification).

4. `npm run build` in `frontend`:
- Status: Passed.

5. Smoke e2e green:
- Status: Passed.
- `tests/public-mobile-pages.spec.ts`: passed.
- `tests/mobile-ui.spec.ts`: passed with auth credentials.

6. No stuck overlays and no double-open menus:
- Status: Passed in manual and automated checks.

## Latest Local Verification

```powershell
$env:TEST_USERNAME='***'
$env:TEST_PASSWORD='***'
npm run qa:local
```

Result:
- `lint`: passed
- `test:mobile:smoke`: 4 passed
- `test:desktop:smoke`: passed
- `build`: compiled successfully

## Remaining Optional Checks

- BrowserStack real-device run for external sign-off:
- `BROWSERSTACK_USERNAME`
- `BROWSERSTACK_ACCESS_KEY`
