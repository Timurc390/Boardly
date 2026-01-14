# Boardly

Minimal run guide for local development.

## Backend (Django)

PowerShell (Windows):
1. `cd backend`
2. `python -m venv venv`
3. `venv\Scripts\activate`
4. `pip install -r requirements.txt`
5. `python manage.py migrate`
6. `python manage.py runserver 0.0.0.0:8000`

URLs:
- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/admin/`
- `http://127.0.0.1:8000/api/`

Dev note: test credentials `admin` / `admin123`.

## Frontend (React)

1. `cd frontend`
2. `npm install`
3. `npm start`

App URLs:
- `http://localhost:3000/login`
- `http://localhost:3000/register`
- `http://localhost:3000/profile`
- `http://localhost:3000/board`
- `http://localhost:3000/faq`
- `http://localhost:3000/my-cards`

API base:
- Default (dev proxy): `/api`
- Override via env: `REACT_APP_API_URL=https://<back-ngrok>/api`

## Database configuration (SQLite fallback / Postgres)

By default the backend uses SQLite (dev fallback). If any of these env vars are set,
Postgres is used instead:
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

Example (PowerShell):
```
$env:POSTGRES_DB = "boardly_db"
$env:POSTGRES_USER = "boardly_user"
$env:POSTGRES_PASSWORD = "secret"
$env:POSTGRES_HOST = "localhost"
$env:POSTGRES_PORT = "5432"
```

## Ngrok (public access)

Frontend (free plan, single tunnel):
1. Ensure `frontend/package.json` has `"proxy": "http://localhost:8000"` and `REACT_APP_API_URL=/api`.
2. Run `ngrok http 3000`.
3. Share `https://<front-ngrok>`; API is reachable at `https://<front-ngrok>/api/`.

Backend (separate tunnel, if you have multiple tunnels):
1. Run `ngrok http 8000` to get `https://<back-ngrok>`.
2. Set env and restart backend:
```
$env:ALLOWED_HOSTS_EXTRA = "<front-ngrok-domain>,<back-ngrok-domain>"
$env:CSRF_TRUSTED_ORIGINS = "https://<front-ngrok-domain>,https://<back-ngrok-domain>"
$env:CORS_EXTRA_ORIGINS = "https://<front-ngrok-domain>"
```
3. Set frontend API base:
```
$env:REACT_APP_API_URL = "https://<back-ngrok-domain>/api"
```
