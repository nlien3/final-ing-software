# Decisiones Tecnicas - TP04 y TP05

## 1. Stack y arquitectura base

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- DB: PostgreSQL
- Driver DB: `pg`
- Repositorio: monorepo (`/front`, `/back`)

Motivo principal: minimizar complejidad de implementacion manteniendo separacion clara entre capas para CI/CD.

## 2. CI elegido (TP04)

Herramienta: GitHub Actions

Workflow: `.github/workflows/ci.yml`

Jobs:

- `front-ci`: install, test, build, artifact (`front-dist`)
- `back-ci`: Postgres service container, install, test, build, artifact (`back-dist`)
- `ci-summary`: validacion final

Motivo:

- YAML versionado en repo
- Logs y artefactos visibles
- Integracion nativa con GitHub

## 3. Estrategia de entornos locales

Para separar QA/PROD tambien en desarrollo local:

- Backend:
  - `.env.test` -> `tasksdb_test`, `PORT=3002`
  - `.env.prod` -> `tasksdb_prod`, `PORT=3001`
- Frontend:
  - `.env.test` -> `VITE_API_URL=http://localhost:3002`, `FRONTEND_PORT=5173`
  - `.env.prod` -> `VITE_API_URL=http://localhost:3001`, `FRONTEND_PORT=5174`

Decision clave: front usa puertos fijos por modo para evitar errores de CORS por puertos dinamicos.

## 4. CD elegido (TP05)

Plataforma cloud: Render

Recursos:

- QA: `front-qa`, `back-qa`, `db-qa`
- PROD: `front-prod`, `back-prod`, `db-prod`

Workflow release: `.github/workflows/release.yml`

- Trigger automatico por `workflow_run` exitoso de `CI` sobre `main`
- Trigger manual por `workflow_dispatch` (permite seleccionar `source_run_id`)
- `Deploy QA` -> deploy back/front QA en Render + health check
- `Deploy Production` -> deploy back/front PROD + health check

### Conexion con pipeline de build

El release descarga artefactos del run CI (`front-dist`, `back-dist`) usando `source_run_id` antes de desplegar, garantizando trazabilidad CI -> CD.

## 5. Aprobaciones manuales y gates

Aprobacion QA -> PROD implementada con GitHub Environments:

- Job de produccion usa `environment: production`
- En GitHub se configura `required reviewers`
- El despliegue a PROD queda bloqueado hasta aprobacion

Responsable definido: lider tecnico / docente (segun equipo).

## 6. Health checks post-despliegue

Se valida endpoint:

- QA: `${BACK_QA_URL}/health`
- PROD: `${BACK_PROD_URL}/health`

El workflow falla si no obtiene `HTTP 200` en los reintentos configurados.

## 7. Rollback strategy

Workflow: `.github/workflows/rollback.yml`

- Ejecucion manual (`workflow_dispatch`) con `target` (`qa` o `production`)
- Re-dispara deploy en Render para el entorno seleccionado
- Verifica health check al finalizar

Objetivo: reducir tiempo de recuperacion ante despliegue defectuoso.

## 8. Variables y secretos por entorno

Secrets requeridos en GitHub Actions:

- `RENDER_API_KEY`
- `RENDER_SERVICE_ID_BACK_QA`
- `RENDER_SERVICE_ID_FRONT_QA`
- `RENDER_SERVICE_ID_BACK_PROD`
- `RENDER_SERVICE_ID_FRONT_PROD`
- `BACK_QA_URL`
- `BACK_PROD_URL`

Variables runtime en Render por servicio:

- Backend QA/PROD: `DATABASE_URL`, `FRONTEND_URL`
- Frontend QA/PROD: `VITE_API_URL`

## 9. Evidencias a adjuntar

Capturas sugeridas:

1. Recursos cloud QA/PROD creados.
2. Configuracion de variables y secrets.
3. Run CI exitoso con artefactos.
4. Release QA exitoso.
5. Pantalla de aprobacion manual a PROD.
6. Release PROD exitoso.
7. Health checks en verde.
8. Rollback manual exitoso.

## 10. Estrategia de testing (TP06)

### Frameworks elegidos

- Backend: `Vitest` para pruebas unitarias, `Supertest` para pruebas HTTP de integracion.
- Frontend: `Vitest` + `Testing Library`.

Justificacion:

- Misma herramienta principal (`Vitest`) en front y back simplifica mantenimiento.
- Permite mocking nativo (`vi.fn`, `vi.mocked`) y buena velocidad de ejecucion.

### Arquitectura para habilitar unit tests reales

Se separo backend en:

- `TasksRepository` (acceso a datos)
- `TasksService` (reglas de negocio)
- `app` (capa HTTP)

Esto permite probar la logica de negocio sin depender de PostgreSQL real.

### Mocking implementado

- Backend unit:
  - `tasks.service.unit.test.ts`: mock de `TasksRepository` usando `vi.fn` y patron AAA (Arrange/Act/Assert).
- Backend integracion:
  - `app.test.ts`: pruebas HTTP con `Supertest` contra app real (usando PostgreSQL de test).
- Frontend unit:
  - `api.test.ts`: mock de `fetch` para respuestas 200/204/400.
  - `App.test.tsx`: mock de `fetch` para flujos de componente.

### Casos relevantes cubiertos

- Validaciones de negocio (titulo/descripcion obligatorios y longitudes).
- Validaciones de tipos y entradas invalidas (`id` no entero, `done` no boolean, payload vacio en update).
- Manejo de errores esperados (`400`, `404`) y errores inesperados (`500`).
- Flujos de UI (crear, editar, eliminar, filtrar).
- Edge cases de API (`204 No Content`, errores con mensaje de backend).

### Integracion a pipeline

En CI (`ci.yml`) backend ejecuta:

- `npm run test:unit`
- `npm run test:integration`

Y frontend ejecuta tests + build, asegurando validacion automatica en cada push/PR.

Ademas, el pipeline genera reportes JUnit (`.xml`) y cobertura (`coverage-summary.json`) por suite para calcular resumenes en el mismo run.

Tambien se agrego cobertura automatica en CI usando Vitest coverage (`v8`):

- Front: cobertura global del job de frontend.
- Back: cobertura separada para unit e integration.
- El run publica porcentajes (lines/functions/branches/statements) y estado de tests en `GITHUB_STEP_SUMMARY`.
