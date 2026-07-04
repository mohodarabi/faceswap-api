# Face Swap API

NestJS/PostgreSQL rewrite of the original Go backend in `face-swap-backend-main-2`.

## Features

- `POST /api/v1/merge-face` - synchronous Novita merge face call.
- `POST /api/v1/video-merge-face` - starts Novita video merge face and returns the current task result.
- `POST /api/v1/motion-control` - starts Kling motion control and returns the current task result.
- `POST /api/v1/users` - get or create a device-based user and initialize credits.
- `GET /api/v1/users/me/credits` - current credit balance by `X-Device-ID`.
- Category and template CRUD endpoints.
- RevenueCat webhook handling.
- `GET /health`, `GET /docs`, and `GET /openapi.yaml`.

## Setup

```bash
cp .env.example .env
npm install
npm run build
npm run start:dev
```

Run the SQL files in `migrations/` against Postgres before starting the API.

## Environment

Use either `DATABASE_URL` or the `POSTGRES_*` variables in `.env`.

Required:

- `NOVITA_API_KEY`
- `REVENUECAT_WEBHOOK_SECRET`
- `DATABASE_URL` or `POSTGRES_HOST`/`POSTGRES_PORT`/`POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`

Optional:

- `PORT` defaults to `8080`
- `ENV` defaults to `dev`
- `MAX_BODY_SIZE` defaults to `20971520`
- `POSTGRES_SSL=true` for hosted Postgres providers that require SSL

## Notes

The implementation preserves the current Go source behavior, not every stale route listed in the old README. The canonical routes are the ones mounted in the NestJS controllers.
