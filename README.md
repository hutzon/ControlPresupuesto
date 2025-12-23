# LedgerFlow - Personal Budget Control

LedgerFlow is a personal finance application built with a Docker-first approach.

## Stack

- **Infrastructure**: Docker, Nginx, PostgreSQL
- **Backend**: NestJS (Express), Prisma
- **Frontend**: React (Vite), TailwindCSS

## Prerequisites

- Docker & Docker Compose installed.

## Quick Start (Development)

The entire environment can be started with a single command:

```bash
docker-compose up --build
```

_Note: The first run will take some time to download images and install dependencies._

## Access

- **Application (UI)**: [http://localhost](http://localhost)
- **API**: [http://localhost/api](http://localhost/api) (proxied to backend)
- **Database**: Port `5432` exposed locally.

## Development Workflow

- **Hot Reload**: Both Backend and Frontend have hot-reload enabled via Docker volumes. Changes in `apps/` are reflected immediately.
- **Node Modules**: `node_modules` are containerized. If you install a new package, you may need to rebuild or restart:
  ```bash
  docker-compose up -d --build
  ```

## Project Structure

- `apps/backend`: NestJS application.
- `apps/frontend`: React application.
- `docker/`: Infrastructure configuration (Nginx, etc).

## Auth Endpoints (Stage 3)
- `POST /api/auth/register`: { email, password, name }
- `POST /api/auth/login`: { email, password }
- `POST /api/auth/refresh`: (Requires Cookie `refresh_token`)
- `POST /api/auth/logout`: (Requires Access Token)
- `GET /api/auth/me`: (Requires Access Token)
