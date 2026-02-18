# Mobile QA Checklist (Pre-Deploy)

## Devices and Viewports
- iOS Safari: `390x844` (iPhone 12/13 baseline)
- Android Chrome: Pixel 5 profile (or closest)

## Board Overlay and Popover Stack
- Open board global menu (`☰`) and verify it is above lists/cards.
- Open board account actions (avatar trigger) and verify panel is above board content.
- Open list `...` menu and verify no clipping at top/bottom.
- Open card modal, then open card `...` menu and `+` add popover.
- Verify only one overlay/popover/menu group is active at once.
- Verify no stale dark overlay remains after closing menus/modals.

## Interaction Safety
- Tap-through check: background elements must not steal taps while overlay is open.
- Buttons in open popovers remain clickable (no hidden layer on top).
- `Esc` closes modals/popovers on keyboard-capable devices.
- Focus returns to trigger after closing modal/sidebar/dialog.

## Layout and Responsiveness
- No horizontal scroll on `/help`, `/community`, `/privacy-policy`.
- No text overflow in long privacy paragraphs.
- Header search, filters, and avatar controls remain visible and usable.

## Visual Quality
- Mobile blur/shadow intensity is reduced (no heavy haze).
- Menus/popovers are not visually cut by safe areas or header.
- `:focus-visible` ring is visible for keyboard navigation.

## Smoke Commands
- `npm run qa:public`
- `npm run qa:local`
- `npm run test:desktop:smoke`

## Notes
- `tests/mobile-ui.spec.ts` requires `TEST_USERNAME` and `TEST_PASSWORD`.
- If credentials are missing, use `npm run test:mobile:public` for public-page coverage only.
