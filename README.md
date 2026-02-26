# Boardly

Boardly is a collaborative Kanban board app (Trello-like) with real-time updates, drag-and-drop cards, board permissions, profile settings, and mobile-focused UX improvements.

## Tech Stack
- Backend: Python, Django, Django REST Framework, Channels, Djoser, dj-rest-auth, django-allauth
- Frontend: React, TypeScript, Redux Toolkit, React Router, Axios
- Database: PostgreSQL (SQLite fallback for local/dev)
- Testing: Playwright, Testing Library
- Tooling: Git, GitHub, Docker, Docker Compose, GitHub Actions

## Repository Structure
```text
backend/   Django API + WebSocket server
frontend/  React + TypeScript client app
.github/   CI workflows
```

## Local Development (Without Docker)

### 1) Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver
```
Backend runs on `http://localhost:8000`.

### 2) Frontend
```bash
cd frontend
npm ci
npm start
```
Frontend runs on `http://localhost:3000`.

## Docker Run
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

## QA / Test Commands
Run from `frontend/`:
- `npm run lint`
- `npm run test:mobile:public`
- `npm run test:mobile:smoke`
- `npm run test:desktop:smoke`
- `npm run qa:public`
- `npm run qa:local`

For authenticated smoke tests, set:
- `TEST_USERNAME`
- `TEST_PASSWORD`

## Deployment Notes
- Backend uses ASGI (`daphne`) for HTTP + WebSocket support.
- Frontend production build is served via `nginx`.
- CI workflow lives in `.github/workflows/frontend-ci.yml`.

### Realtime Config (Redis + WS reconnect)
- Backend channel layer:
  - `CHANNEL_REDIS_URL` (or `REDIS_URL`) enables `channels_redis` transport.
  - If not set, backend falls back to `InMemoryChannelLayer` (ok for local dev, not for multi-instance production).
- Frontend WebSocket base:
  - `REACT_APP_WS_URL` (optional). If omitted, WS URL is derived from `REACT_APP_API_URL` or current host.
- Frontend reconnect tuning (optional):
  - `REACT_APP_WS_MAX_RECONNECT_ATTEMPTS`
  - `REACT_APP_WS_BASE_RECONNECT_MS`
  - `REACT_APP_WS_MAX_RECONNECT_MS`
  - `REACT_APP_WS_RECONNECT_JITTER_MS`

## License
MIT License. See `LICENSE`.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
