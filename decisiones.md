# Decisiones Técnicas

## Stack elegido

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Base de datos: PostgreSQL
- Driver DB: `pg` (sin ORM)
- CI: GitHub Actions

## Por qué este stack

1. Es simple de implementar para un TP corto.
2. Separa claramente frontend y backend (`/front`, `/back`).
3. PostgreSQL alinea con despliegues reales en nube.
4. `pg` permite explicar SQL directo sin capa adicional.

## Diseño del pipeline

Archivo: `.github/workflows/ci.yml`

- Pipeline con 3 jobs:
  - `front-ci`
  - `back-ci`
  - `ci-summary`
- `back-ci` usa un contenedor de PostgreSQL para pruebas.
- Publicación de artefactos:
  - `front-dist` (`front/dist`)
  - `back-dist` (`back/dist`)

## Evidencias

Guardar capturas en `docs/evidencias/`:

1. Ejecución exitosa del workflow completo.
2. Detalle de job `front-ci` en verde.
3. Detalle de job `back-ci` en verde.
4. Pestaña de artefactos con `front-dist` y `back-dist`.
5. (Opcional) historial de runs para trazabilidad.

## Riesgos y mitigaciones

- Riesgo: errores de conexión a DB en CI.
  - Mitigación: service container de PostgreSQL + healthcheck.
- Riesgo: diferencias de versión de Node.
  - Mitigación: fijar Node 20 en workflow.
- Riesgo: drift de esquema.
  - Mitigación: creación de esquema en startup (`ensureSchema`) y tests de integración.
