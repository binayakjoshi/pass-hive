# pass-hive

A zero-knowledge password manager, built as a hands-on vehicle for learning
**FastAPI**. The backend never sees a plaintext
secret or an encryption key only ciphertext ever crosses the network.


---

## Table of contents

- [Stack](#stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database migrations (Alembic)](#database-migrations-alembic)
- [Running tests](#running-tests)
- [Encryption model](#encryption-model-zero-knowledge)
- [API overview](#api-overview)
- [Background jobs (arq)](#background-jobs-arq)
- [Frontend notes](#frontend-notes)


---

## Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) (async) — web framework
- [uv](https://github.com/astral-sh/uv) + `pyproject.toml` — package management (not pip/requirements.txt)
- SQLAlchemy 2.0 (async) + `asyncpg` — ORM
- Alembic — migrations
- Argon2id (`argon2-cffi`) — master password hashing
- PyJWT — access token issuance/verification
- PostgreSQL 16
- Redis (`redis.asyncio`) — OTP storage, rate limiting
- `arq` — Redis-backed async job queue (OTP emails, scheduled hard-delete)
- `aiosmtplib` — async email delivery (Gmail SMTP)
- `pydantic-settings` — env/config loading
- pytest + pytest-asyncio + httpx (`ASGITransport`) — testing
- Docker + Podman — containerization (`docker-compose.yml` works with both)

**Frontend**
- Next.js (App Router) + TypeScript
- MUI (Material UI) — theming, components
- `hash-wasm` — client-side Argon2id (master key derivation)
- Web Crypto API — AES-256-GCM encryption/decryption in the browser

---

## Project structure

Flat layout (not `src/`) — this app is never installed as a package
(`pyproject.toml` sets `package = false`), so `src/`'s main purpose
(preventing accidental imports of an uninstalled package) doesn't apply here.

```
pass-hive/
├── docker-compose.yml        # backend + db + redis + worker services
└── backend/
    ├── Dockerfile
    ├── pyproject.toml
    ├── uv.lock
    ├── .env / .env.test / .env.example
    ├── alembic.ini
    ├── migrations/
    │   ├── env.py             # wired to app.core.config.get_settings()
    │   └── versions/
    ├── app/
    │   ├── main.py             # FastAPI instance, CORS, routers, exception handlers
    │   ├── worker.py           # arq WorkerSettings + job functions
    │   ├── core/
    │   │   ├── config.py       # Settings (pydantic-settings), Environment enum
    │   │   ├── security.py     # hash_password / verify_password, create_access_token
    │   │   ├── exceptions.py   # AppException + typed subclasses
    │   │   ├── deps.py         # get_current_user, get_current_vault
    │   │   ├── otp.py          # generate_otp, issue_otp, verify_otp (Redis-backed)
    │   │   ├── email.py        # send_otp_email (aiosmtplib)
    │   │   ├── email_templates.py
    │   │   └── queue.py        # arq pool + get_queue() dependency
    │   ├── db/
    │   │   ├── session.py      # async engine, AsyncSessionLocal, get_db()
    │   │   ├── base.py         # DeclarativeBase
    │   │   └── redis.py        # ConnectionPool, get_redis()
    │   ├── models/              # User, Vault, VaultItem (SQLAlchemy)
    │   ├── schemas/             # Pydantic request/response models
    │   └── api/routes/
    │       ├── health.py        # GET /health, GET /health/db, GET /health/redis
    │       ├── auth.py          # login, logout, verify-otp, resend-otp
    │       ├── users.py         # POST /users, GET|PATCH|DELETE /users/me
    │       └── vault.py         # /vault/items CRUD, GET /vault/current
    └── tests/
        ├── conftest.py
        └── test_auth.py
```

---

## Getting started

### Prerequisites

- Docker + Docker Compose (or Podman + `podman-compose`)
- [`uv`](https://github.com/astral-sh/uv) installed on the host (for IDE
  intellisense — the container has its own isolated `.venv`)
- Node.js (for the `frontend/` app)
- A Gmail account with **2-Step Verification** + an **App Password** (for
  OTP email delivery)

### 1. Clone and configure

```bash
git clone <repo-url>
cd pass-hive/backend
cp .env.example .env
```

Fill in `.env` — see [Environment variables](#environment-variables) below.

### 2. Start the stack

```bash
docker compose up --build
```

This brings up:
- `backend` — the FastAPI app
- `db` — Postgres 16
- `redis` — Redis (OTP storage, job queue backing store)
- `worker` — the `arq` worker process (sends OTP emails, runs the 30-day
  hard-delete job)

The API is available at `http://localhost:8000` (adjust per your
`docker-compose.yml` port mapping). Interactive docs at `/docs`.

### 3. Create the database (first run only)

Migrations are not run automatically on container start — apply them
explicitly:

```bash
docker compose exec backend uv run alembic upgrade head
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_BACKEND_API_URL` in the frontend's own `.env.local` to point
at the backend (e.g. `http://localhost:8000`).

---

## Environment variables

Set in `backend/.env` (see `.env.example` for the full template):

| Variable | Purpose |
|---|---|
| `ENVIRONMENT` | `dev` / `test` / `prod` — drives `cookie_secure` (`True` only in `prod`) and `cookie_samesite` |
| `DATABASE_URL` | Postgres async connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret used to sign access tokens |
| `GMAIL_ADDRESS` | Gmail account used for OTP delivery |
| `GMAIL_APP_PASSWORD` | Gmail App Password (requires 2-Step Verification enabled) |
| `CORS_ORIGINS` | Explicit allowed origins (required — `allow_credentials=True` means `["*"]` won't work with cookies) |

`.env.test` sets `ENVIRONMENT=test` — this matters specifically because a
`secure=True` cookie is silently dropped over plain `http://`, which the test
client uses (no real HTTPS via `ASGITransport`).

**Note on email delivery:** Gmail SMTP was chosen after Resend (blocked by
lack of a verified sending domain) and Mailtrap (sandbox-only, never reaches
real inboxes) were ruled out. Known limitation: Gmail's free-tier sending cap
(~500/day) and risk of throttling under programmatic use — fine at current
scale, flagged for revisit if this needs to grow.

---

## Database migrations (Alembic)

Migrations use the **async** Alembic template, with `env.py` overridden to
pull the DB URL from `app.core.config.get_settings()` rather than a static
value in `alembic.ini`.

```bash
# generate a new migration after changing a model
docker compose exec backend uv run alembic revision --autogenerate -m "description"

# ⚠️ autogenerate produces a DRAFT — always review the generated file
# before applying, especially anything involving enums (see gotcha below)

# apply migrations
docker compose exec backend uv run alembic upgrade head

# roll back one revision
docker compose exec backend uv run alembic downgrade -1
```

### Migration log

| Revision | Description |
|---|---|
| `7a68fac34314` | Create `users` table (`id` UUID pk, `email` unique/indexed, `hashed_master_password`, timestamps) |
| — | Add `delete_status` (soft delete) to `users` |
| `28c1377b6285` | Create `vaults` + `vault_items` tables and the `vault_item_type` Postgres enum |
| — | Add `verification_status` to `users` (OTP email verification) |

**Known Alembic gotcha (fixed):** autogenerate's `downgrade()` for
`28c1377b6285` dropped both tables but left the `vault_item_type` Postgres
enum orphaned — breaking a later re-`upgrade()` with `type
"vault_item_type" already exists`. Fixed by explicitly dropping the enum in
`downgrade()`:

```python
sa.Enum(name='vault_item_type').drop(op.get_bind(), checkfirst=True)
```

If you add another enum column, check for this same gap before merging the
autogenerated migration.

---

## Running tests

```bash
# one-time: create the test database
docker compose exec db psql -U pass_hive -d pass_hive -c "CREATE DATABASE pass_hive_test;"

# run tests (must run inside the container — the `db` hostname
# only resolves within the Docker network)
podman-compose exec backend uv run python -m pytest tests/test_auth.py -v
```

`python -m pytest` (not bare `pytest`) is the standard invocation — running
as a module adds the cwd to `sys.path`, sidestepping import-path issues.

**Test isolation:** each test runs inside a transaction that's rolled back at
teardown (`db_session` fixture) — real Postgres, no ORM mocking, since routes
use Core-style `select()`/`scalar()` queries directly rather than a
repository abstraction. Mocking is reserved for genuinely external calls
(email sending), not the DB layer.

**Current coverage:** `tests/test_auth.py` — 10 tests passing (register,
duplicate email, register-after-soft-delete, login success/failure paths,
`/users/me` auth requirement and CRUD, soft-delete flow). No vault-slice
tests yet (see [Known issues](#known-issues--open-threads)).

---

## Encryption model (zero-knowledge)

The backend never sees a plaintext secret or a decryption key — only opaque
ciphertext. Key hierarchy (mirrors Bitwarden's design):

1. **Master password → master key.** Derived client-side via **Argon2id**
   (`hash-wasm`, since Web Crypto has no native Argon2 support). Salt = the
   user's lowercased email — deterministic, avoiding an extra DB column and
   an unauthenticated "fetch my salt" round-trip that would risk becoming an
   email-enumeration oracle. *(Trade-off: changing email later requires
   re-deriving under both addresses — not yet built.)*
2. **Random AES-256 vault key** — generated once per user, actually encrypts
   every vault item.
3. **Vault key wrapping** — the vault key is encrypted by the master key
   before ever reaching the backend. A master password change only requires
   re-wrapping this one key, not re-encrypting the whole vault.
4. **Item encryption** — each item's title and JSON data payload are
   encrypted client-side (AES-256-GCM, fresh random IV per operation, never
   reused).

**Fully zero-knowledge, including titles** — even `VaultItem.title` is
encrypted. Only `type` and `favorite` stay plaintext (needed for
server-side UI grouping). Every encrypted field is stored as a
ciphertext/IV pair (`X` / `X_iv`) across two columns.

**Item types (single-table):** login, card, note, identity, ssh_key — one
`VaultItem` table with an encrypted JSON payload, rather than one table per
type (avoids `UNION`-across-five-tables queries; new types don't require a
structural migration).

**Known trade-off, not yet acted on:** the raw master password is sent to
the backend for server-side Argon2id auth hashing — diverging from
Bitwarden's stricter approach of a separate PBKDF2-derived value so the raw
master password never leaves the browser at all.

---

## API overview

| Route | Description |
|---|---|
| `GET /health`, `/health/db`, `/health/redis` | Liveness/dependency checks |
| `POST /users` | Register (also creates the user's `Vault` atomically — requires `encrypted_vault_key` + `vault_key_iv`, generated client-side) |
| `GET / PATCH / DELETE /users/me` | Self-service only — no `user_id` path param, so there's no per-route ownership check to forget |
| `POST /auth/login` | Verifies password, sets httpOnly `access_token` cookie (or triggers OTP flow if unverified) |
| `POST /auth/logout` | Clears the cookie |
| `POST /auth/verify-otp` | Verifies a login OTP, sets `verification_status = True`, logs in immediately |
| `POST /auth/resend-otp` | Requests a new OTP (generic response regardless of account state — enumeration-avoidance) |
| `GET /vault/current` | Returns the current user's `Vault` (wrapped key fields) |
| `POST / GET / PATCH / DELETE /vault/items[/{id}]` | Vault item CRUD, ownership enforced via a single `item_id` + `vault_id` query (never "fetch then check") |

**Auth delivery:** httpOnly cookie for the web client, with a Bearer-header
fallback already wired into `get_current_user` for future clients (mobile,
browser extension) where cookie jars behave inconsistently.

**Error shape:** all errors return `{code, message}` (optionally `data` for
structured payloads like OTP cooldown seconds). `code` is what the frontend
branches business logic on — HTTP status alone is too coarse (e.g. both a
duplicate-account and a deactivated-account error map to `409`).
Success responses have no global envelope — each route's `response_model`
already declares its shape, and a global wrapper would break accurate
OpenAPI/Swagger generation.

---

## Background jobs (arq)

Redis-backed via `arq`, chosen over a bare `asyncio.create_task` specifically
because it also covers the 30-day hard-delete design in the same piece of
infrastructure:

- **`send_otp_email_job`** — moves the slow SMTP round-trip off the request
  path (`login`/`resend-otp` enqueue instead of awaiting directly).
- **`hard_delete_user_job`** — enqueued with a 30-day defer on `DELETE
  /users/me`; idempotent (re-checks `delete_status` at execution time and
  no-ops if the account was reactivated), so no job-ID tracking/cancellation
  is needed.

**Dev note:** `arq` has no built-in `--reload`. The worker container runs via
`watchfiles "arq app.worker.WorkerSettings" app` with the same volume mount
as `backend`, so code changes are picked up without a manual rebuild.

---

## Frontend notes

- **`lib/crypto.ts`** — `deriveMasterKey`, `generateVaultKey`,
  `wrapVaultKey`/`unwrapVaultKey`, `encryptField`/`decryptField`.
- **`lib/vault-session.tsx`** — `VaultSessionProvider`/`useVaultSession`,
  in-memory only (`useState`, no localStorage/sessionStorage) — the vault key
  is meant to die on refresh/close, by design.
- **`context/user-context.tsx`** — `UserProvider`/`useUser` — auth state
  (`user`, `isAuthenticated`, `isLoading`) plus `pendingVerification` for the
  OTP flow, also with no persistence.
- **Client-side filtering** — type filter, title search, and favorites-sort
  in the vault list are all derived via `useMemo` from the already-decrypted
  item list, rather than re-fetching/re-decrypting per keystroke (a backend
  `type` query param was tried and reverted for this exact reason).

---
