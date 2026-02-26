# Architecture Responsibilities

Date: 2026-02-24  
Scope: frontend refactor around profile, board flows, Redux selectors, WebSocket middleware.

## Layer Boundaries

1. `src/screens/*`
- Route-level composition only.
- No domain-side calculations or transport mapping.
- Responsibility: wire hooks, selectors, and presentational components.

2. `src/features/*/components/*`
- Presentational rendering and UI events.
- Keep business branches minimal; delegate to hooks/callbacks.

3. `src/features/*/hooks/*`
- Feature business flows.
- Allowed: orchestration of async actions, permission checks, local UI state machines.
- Not allowed: direct low-level socket protocol handling.

4. `src/store/slices/*`
- Global state transitions and thunk side effects.
- Shared API error mapping via `src/shared/utils/apiError.ts`.
- Avoid `any` in action payloads and thunk rejects.

5. `src/store/selectors/*`
- Derived data and expensive computations for screens/components.
- Components should consume selectors instead of re-deriving board/user state.

6. `src/store/middleware/socketMiddleware.ts`
- Transport concerns only: connect/disconnect, reconnect, heartbeat, payload validation, logging.
- Do not embed UI decisions here.

7. `src/store/realtime/*`
- Event parsing, payload guards, websocket lifecycle logging (`wsLogger.ts`).
- Single source for action-payload contract checks before state updates.

8. `src/shared/*`
- Cross-feature utilities/hooks only (confirm wrappers, dialog a11y, file validation, error mappers).
- No feature-specific branching.

## Current Hotspots (Need Further Decomposition)

1. `src/features/boards/components/CardModal.tsx`
- Still large; next split target is view sections (description/sidebar/comments/checklists).

2. `src/screens/ProfileScreen.tsx`
- Container is cleaner but still oversized; split mobile menu and tab shell into dedicated UI components.

3. `src/features/boards/components/BoardColumn.tsx`
- Extract inline menus/popovers and card-list rendering block.

4. `src/features/boards/components/BoardHeader.tsx`
- Extract member popover/panel cluster to reduce mixed responsibilities.

## SRP Validation Checklist

1. Can file purpose be described in one sentence?
2. Does it avoid both transport and UI-detail logic in the same file?
3. Does it avoid recalculating state that already exists in selectors?
4. Are repeated helpers moved to `shared`?
5. Are public function signatures strictly typed (no `any`)?
