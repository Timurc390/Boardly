# Contributing to Boardly

Thanks for your interest in contributing.

## Development Setup
### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm ci
npm start
```

## Branching
- Create a feature branch from `master`.
- Keep branch names short and clear, for example:
  - `feat/mobile-overlay-fix`
  - `fix/auth-error-handling`
  - `docs/readme-update`

## Commit Messages
Use concise and descriptive messages:
- `feat: ...`
- `fix: ...`
- `docs: ...`
- `chore: ...`
- `test: ...`

## Pull Request Checklist
- Code builds locally.
- No obvious lint errors.
- Smoke tests pass for relevant flows.
- UI changes include screenshots when useful.
- PR description explains:
  - what changed
  - why it changed
  - how it was tested

## Testing
From `frontend/`:
```bash
npm run lint
npm run qa:public
```

For authenticated mobile smoke:
```powershell
$env:TEST_USERNAME='your-login'
$env:TEST_PASSWORD='your-password'
npm run qa:local
```

From `backend/`:
```bash
python manage.py check
python manage.py test -v 1
```

## Reporting Bugs
Use the bug issue template and include:
- steps to reproduce
- expected result
- actual result
- environment (OS/browser/device)
