# TP04 + TP05 + TP06 + TP07 - CI/CD + Calidad de Codigo Full Stack

Aplicacion monorepo:

- `front`: React + Vite + TypeScript
- `back`: Node.js + Express + TypeScript + PostgreSQL (`pg`)

## Estructura

```text
.
├── .github/workflows/ci.yml
├── .github/workflows/release.yml
├── .github/workflows/rollback.yml
├── sonar-project.properties
├── front/
├── back/
├── decisiones.md
└── docs/evidencias/
```

## Entornos

### QA

- Front URL: `FRONT_QA_URL` (Render Static Site)
- Back URL: `BACK_QA_URL` (Render Web Service)
- DB: `tasksdb_test` (o PostgreSQL administrado en Render QA)

### Produccion

- Front URL: `FRONT_PROD_URL` (Render Static Site)
- Back URL: `BACK_PROD_URL` (Render Web Service)
- DB: `tasksdb_prod` (o PostgreSQL administrado en Render PROD)

## Variables de entorno locales

### Backend

`back/.env.test`

```env
DATABASE_URL=postgresql://nico@localhost:5432/tasksdb_test
PORT=3002
FRONTEND_URL=http://localhost:5173
```

`back/.env.prod`

```env
DATABASE_URL=postgresql://nico@localhost:5432/tasksdb_prod
PORT=3001
FRONTEND_URL=http://localhost:5174
```

### Frontend

`front/.env.test`

```env
VITE_API_URL=http://localhost:3002
FRONTEND_PORT=5173
```

`front/.env.prod`

```env
VITE_API_URL=http://localhost:3001
FRONTEND_PORT=5174
```

## Ejecucion local

### Modo desarrollo

Test:

```bash
cd back && npm install && npm run dev:test
cd front && npm install && npm run dev:test
```

Prod:

```bash
cd back && npm install && npm run dev:prod
cd front && npm install && npm run dev:prod
```

### Modo build + run (simulacion release)

Test:

```bash
cd back && npm install && npm run test:env && npm run build && npm run start:test
cd front && npm install && npm run test -- --run && npm run build:test && npm run preview:test
```

Prod:

```bash
cd back && npm install && npm run build && npm run start:prod
cd front && npm install && npm run test -- --run && npm run build:prod && npm run preview:prod
```

## Endpoints backend

- `GET /health`
- `GET /tasks`
- `POST /tasks`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

## CI (TP04)

Workflow: `.github/workflows/ci.yml`

- Trigger: `push` y `pull_request` a `main`
- Jobs: `front-ci`, `back-ci`, `e2e-ci`, `sonarcloud-ci`, `ci-summary`
- Publica artefactos:
  - `front-dist`
  - `back-dist`

## CD (TP05)

### 1) Workflow de release

Workflow: `.github/workflows/release.yml`

- Trigger automatico: cuando finaliza exitosamente `CI` en `main`.
- Trigger manual: `workflow_dispatch` con `source_run_id`.
- Stages:
  1. `Deploy QA`
  2. `Deploy Production` (con aprobacion manual via Environment protection)
- Health checks:
  - QA: `${BACK_QA_URL}/health`
  - PROD: `${BACK_PROD_URL}/health`
- Post-deploy QA:
  - Ejecuta Cypress E2E contra QA usando `FRONT_QA_URL` + `BACK_QA_URL`.

### 2) Workflow de rollback

Workflow: `.github/workflows/rollback.yml`

- Trigger manual con input `target` (`qa` o `production`)
- Re-dispara deploy en Render para el entorno seleccionado
- Ejecuta health check post-rollback

## Secrets necesarios en GitHub

Configurar en `Settings -> Secrets and variables -> Actions`:

- `RENDER_API_KEY`
- `RENDER_SERVICE_ID_BACK_QA`
- `RENDER_SERVICE_ID_FRONT_QA`
- `RENDER_SERVICE_ID_BACK_PROD`
- `RENDER_SERVICE_ID_FRONT_PROD`
- `FRONT_QA_URL`
- `BACK_QA_URL`
- `BACK_PROD_URL`

## Aprobacion manual a produccion

Configurar en `Settings -> Environments -> production`:

- Required reviewers habilitado
- Al menos 1 aprobador (por ejemplo: docente/lider tecnico)

Con esto, el job `Deploy Production` queda bloqueado hasta aprobacion.

## Recursos cloud (Render)

Minimo recomendado:

- `back-qa` (Web Service)
- `front-qa` (Static Site)
- `db-qa` (PostgreSQL)
- `back-prod` (Web Service)
- `front-prod` (Static Site)
- `db-prod` (PostgreSQL)

## Evidencias a entregar

Subir capturas en `docs/evidencias/`:

1. Recursos QA y PROD creados en Render.
2. Variables por entorno configuradas.
3. Run de `CI` exitoso con artefactos.
4. Run de `release.yml` con `Deploy QA` exitoso.
5. Pantalla de aprobacion manual de `production`.
6. `Deploy Production` exitoso.
7. Health checks OK.
8. Run de `rollback.yml` exitoso.

## TP06 - Pruebas Unitarias

Frameworks elegidos:

- Backend: `Vitest` + `Supertest`
- Frontend: `Vitest` + `@testing-library/react`
- Mocks/stubs:
  - backend: mocks de `TasksRepository` en unit tests
  - frontend: mock de `fetch` para API y componentes

### Prerequisitos para correr tests

- Backend unit (`test:unit`): no requiere base de datos.
- Backend integracion (`test:integration`): requiere PostgreSQL disponible y `back/.env.test` con `DATABASE_URL` valida.
- Frontend tests: no requieren backend levantado porque la API esta mockeada.

### Comandos de tests backend

Unitarios (sin DB):

```bash
cd back && npm install && npm run test:unit
```

Integracion (con DB):

```bash
cd back && npm install && npm run test:integration
```

Integracion contra entorno test local:

```bash
cd back && npm install && npm run test:env
```

### Comandos de tests frontend

```bash
cd front && npm install && npm run test -- --run
```

### Validacion completa TP06 (local)

```bash
cd back && npm install && npm run test:unit && npm run test:integration && npm run build
cd ../front && npm install && npm run test -- --run && npm run build
```

### Ejecucion en CI

En `.github/workflows/ci.yml` se ejecuta automaticamente:

- Frontend tests + build
- Backend `test:unit` + `test:integration` + build
- Resumen de resultados por job en `GITHUB_STEP_SUMMARY`.
  - Tests: cantidad, failures, errors, skipped.
  - Coverage: porcentaje de lines/functions/branches/statements.

Con esto las pruebas quedan integradas en el pipeline de CI/CD.

## TP07 - Coverage + SonarCloud + Cypress E2E

### Objetivo implementado

- Coverage en front y back con quality gate.
- Analisis estatico con SonarCloud y quality gate.
- Pruebas end-to-end con Cypress cubriendo flujos criticos.
- Todo integrado en un pipeline unico que bloquea despliegues defectuosos.

### Nuevos prerequisitos

#### SonarCloud (GitHub Secrets)

Configurar en `Settings -> Secrets and variables -> Actions`:

- `SONAR_TOKEN`
- `SONAR_ORGANIZATION`
- `SONAR_PROJECT_KEY`

#### Cypress

Instalar dependencias frontend:

```bash
cd front && npm install
```

### Comandos utiles TP07

Coverage front/back en local:

```bash
cd front && npm run test -- --run --coverage
cd ../back && npm run test:unit -- --coverage && npm run test:integration -- --coverage
```

Cypress E2E local (requiere back + front corriendo):

```bash
cd front && npm run e2e
```

### Quality gates configurados

El pipeline bloquea si:

1. Cobertura de lineas < 70% (frontend).
2. Cobertura de lineas < 70% en unit o integration (backend).
3. Falla cualquier test E2E (Cypress).
4. SonarCloud quality gate falla.

### Casos E2E implementados (Cypress)

- Crear tarea completa desde UI.
- Editar tarea existente y validar cambios.
- Forzar error de backend y verificar manejo de error en frontend.
