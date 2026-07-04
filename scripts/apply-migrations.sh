#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/migrations"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env"
  set +a
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required but was not found in PATH." >&2
  exit 1
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "migrations directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

if [ -n "${DATABASE_URL:-}" ]; then
  PSQL_TARGET="$DATABASE_URL"
else
  : "${POSTGRES_HOST:=localhost}"
  : "${POSTGRES_PORT:=5432}"
  : "${POSTGRES_USER:=postgres}"
  : "${POSTGRES_DB:=faceswap}"

  export PGPASSWORD="${POSTGRES_PASSWORD:-}"
  PSQL_TARGET="postgresql://$POSTGRES_USER@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
fi

found=0
for migration in "$MIGRATIONS_DIR"/*.sql; do
  if [ ! -f "$migration" ]; then
    continue
  fi
  found=1
  echo "Applying $(basename "$migration")"
  psql "$PSQL_TARGET" -v ON_ERROR_STOP=1 -f "$migration"
done

if [ "$found" -eq 0 ]; then
  echo "No SQL migrations found in $MIGRATIONS_DIR" >&2
  exit 1
fi

echo "Migrations applied successfully."
