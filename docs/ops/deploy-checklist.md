# Deployment Checklist

## 1. Security First
- Rotate SMTP credentials used previously.
- Update production secrets:
  - `PROD_EMAIL_HOST_USER`
  - `PROD_EMAIL_HOST_PASSWORD`
  - `PROD_DEFAULT_FROM_EMAIL`
- Run repository hardening scripts under an admin account:
  - `pwsh scripts/github/enable-security-analysis.ps1`
  - `pwsh scripts/github/apply-branch-protection.ps1 -Branches @("broadly","main","master")`

## 2. Observability & Realtime
- Backend env:
  - `SENTRY_DSN`
  - `SENTRY_TRACES_SAMPLE_RATE` (e.g. `0.1`)
  - `CHANNEL_REDIS_URL`
- Frontend env:
  - `REACT_APP_SENTRY_DSN`
  - `REACT_APP_SENTRY_ENV` (`production`)
  - `REACT_APP_SENTRY_TRACES_SAMPLE_RATE` (e.g. `0.05`)
- If deploying to Fly, export these env vars locally and run:
  - `pwsh scripts/fly/set-prod-secrets.ps1`

## 3. Migrations
- Run backend migration:
  - `python manage.py migrate`
- Verify migration `0023` is applied.
- For Fly production apps:
  - `pwsh scripts/fly/run-prod-migrations.ps1`
- For GitHub Actions-driven migration:
  - Run workflow `.github/workflows/prod-migrate.yml`.

## 4. Recurring Reminders Job
- Configure repository secrets for scheduled workflow:
  - `PROD_DATABASE_URL`
  - `PROD_DJANGO_SECRET_KEY`
  - `PROD_ALLOWED_HOSTS`
  - `PROD_EMAIL_HOST`
  - `PROD_EMAIL_PORT`
  - `PROD_EMAIL_HOST_USER`
  - `PROD_EMAIL_HOST_PASSWORD`
  - `PROD_DEFAULT_FROM_EMAIL`
- Confirm `.github/workflows/due-reminders.yml` runs every 10 minutes.

## 5. Sentry Alerts (minimum)
- Backend unhandled errors (5xx).
- Frontend `error` events.
- WebSocket reconnect exhaustion / disconnect spike.
- Suggested rule definitions:
  - `docs/ops/sentry-alert-rules.md`

## 6. Manual Smoke
- Templates:
  - Create board with `Product roadmap` template.
  - Verify lists and labels are prefilled.
- Recurrence:
  - Set card recurrence to `daily`.
  - Complete card and verify due date auto-moves and card reopens.
- Reminder:
  - Set due date + reminder and verify mail after command run.
- Health:
  - `GET /api/health/` and `GET /healthz/` return `200`.
- PWA/offline:
  - Install prompt appears.
  - Edit card description offline, reload, restore draft.
