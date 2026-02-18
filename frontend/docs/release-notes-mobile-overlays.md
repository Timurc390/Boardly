# Release Notes: Mobile Overlay Stabilization

Date: 2026-02-18

## Summary

- Fixed stacking and clipping issues for board menus/popovers on mobile.
- Ensured actions opened from avatar and three-dot triggers render above board content.
- Stabilized card modal menus (`...`, `+`, comments) so actions do not close unexpectedly.
- Added/expanded mobile smoke checks for top-layer visibility and non-clipping behavior.

## Key Fixes

- Unified board overlay stack (`z-index` and touch viewport behavior).
- Sidebar/actions panel rendered through portal to avoid local stacking context conflicts.
- Card header menu opening no longer self-closes through shared overlay reset.
- Smoke flow updated to verify realistic mobile sequence (`...` menu -> close -> `+` popover).
- Playwright viewport tolerance adjusted to avoid false failures from sub-pixel Android rendering.

## Accessibility and UX

- Added/verified `aria-label` coverage for icon-only actions in board/card interactions.
- Kept keyboard behavior (`Esc`, focus flow, `:focus-visible`) stable after overlay refactors.

## Tests and Validation

- `npm run lint`: passed.
- `npm run test:mobile:smoke`: passed (`4/4`).
- `npm run test:desktop:smoke`: passed.
- `npm run build`: passed.
- `npm run qa:local`: passed (`lint + smoke + build`).

## Notes

- BrowserStack run remains optional for cloud real-device sign-off.
