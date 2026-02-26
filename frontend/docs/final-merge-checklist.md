# Final Technical Merge Checklist

Date: 2026-02-24  
Branch scope: refactor (profile/boards), Redux typing/selector cleanup, websocket resilience.

## 1. Refactor Integrity

1. `ProfileScreen` is route-container only; tab logic is delegated to hooks/components.
2. `CardModal` flows are delegated to dedicated hooks (`state`, `permissions`, `checklist`, `comment`, `attachment`).
3. `BoardMenuSidebar` and `BoardColumn` are decomposed into sections/view+wiring layers.
4. Shared duplicated helpers moved to `src/shared` (`confirm`, `fileValidation`, `useDialogA11y`).

## 2. Redux Quality

1. No `any` in `authSlice` and auth-related thunk payloads.
2. Shared API/auth error mapping is reused (`src/shared/utils/apiError.ts`, `src/shared/utils/authError.ts`).
3. Board-heavy derivations are computed via selectors (`src/store/selectors/boardSelectors.ts`).
4. Components do not repeat permission/derived calculations already provided by selectors/hooks.

## 3. WebSocket Reliability

1. Heartbeat ping and timeout handling are active in `socketMiddleware.ts`.
2. Reconnect/disconnect metrics and structured logs are emitted via `wsLogger.ts`.
3. Incoming/outgoing websocket payloads are validated before applying actions.
4. Disconnect/error reasons are logged in a single format.

## 4. Regression Safety

1. `npm run lint` passes.
2. `npm run build` passes.
3. `CI=true npm test -- --watch=false --runInBand` passes.
4. Core board path smoke-tested manually:
- Open board
- Move list/card
- Open/edit card modal
- Filters menu
- Sidebar members/archive/background

## 5. Post-Merge Follow-up (Not Blocking)

1. Reduce files still >500 LOC (`CardModal`, `ProfileScreen`, `BoardColumn`, `BoardHeader`).
2. Add additional hook unit tests for board presentation and sidebar membership flow.
3. Add websocket reconnect telemetry export for dashboards (if backend/infra supports).
