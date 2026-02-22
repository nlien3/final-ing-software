# TP04 - Full Stack CI con GitHub Actions

Proyecto monorepo con frontend y backend separados:

- `front`: React + Vite + TypeScript
- `back`: Node.js + Express + TypeScript + PostgreSQL (`pg`)

## Estructura

```text
.
├── .github/workflows/ci.yml
├── front/
├── back/
├── decisiones.md
└── docs/evidencias/
```

## Prerrequisitos

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## Variables de entorno

Backend (`back/.env`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tasksdb
PORT=3001
```

Frontend (`front/.env`):

```env
VITE_API_URL=http://localhost:3001
```

## Ejecutar local

### 1) Backend

```bash
cd back
npm install
npm run dev
```

API en `http://localhost:3001`

### 2) Frontend

```bash
cd front
npm install
npm run dev
```

Frontend en `http://localhost:5173`

## Endpoints

- `GET /health`
- `GET /tasks`
- `POST /tasks`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

## Pipeline CI (GitHub Actions)

Archivo: `.github/workflows/ci.yml`

Trigger:

- `push` a `main`
- `pull_request` a `main`

Jobs:

- `front-ci`: instala dependencias, testea y build de frontend, publica artefacto `front-dist`
- `back-ci`: levanta PostgreSQL en service container, testea y build de backend, publica artefacto `back-dist`
- `ci-summary`: valida éxito global

## Puertos y URLs

- Front: `http://localhost:5173`
- Back: `http://localhost:3001`
- PostgreSQL local: `localhost:5432`
