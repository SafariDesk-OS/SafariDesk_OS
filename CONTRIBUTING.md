# Contributing to SafariDesk_OS

Thanks for helping improve SafariDesk_OS! This guide explains how to get set up
and submit changes.

## Development setup
Prereqs: Docker Desktop with WSL integration enabled.

```
cp sd-backend/.env.example sd-backend/.env

docker compose up --build
```

## Project structure
- `sd-backend/`: Django API, Celery, Channels
- `sd-frontend/`: React app
- `docs/`: OSS documentation

## Coding standards
- Keep changes focused and small.
- Prefer explicit names over abbreviations.
- Match existing formatting in the file you touch.

## Tests
Backend (basic):
```
docker compose exec backend python manage.py test
```

Frontend (lint):
```
cd sd-frontend
npm run lint
```

If tests are not available for your change, describe how you verified it.

## Submitting a PR
1) Fork and create a feature branch from `main`.
2) Make your changes with clear commit messages.
3) Update docs if behavior changes.
4) Open a PR with a short summary and testing notes.

## Code of Conduct
This project follows the Code of Conduct in `CODE_OF_CONDUCT.md`.
