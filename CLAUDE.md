---
name: guests-api
description: API REST de gestión de invitados, invitaciones y mesas para LOVEPOSTAL (SaaS de invitaciones digitales para bodas, mercado México)
version: "1.0.0"
model: any
tools: [bash, read, write, edit, glob, grep, agent]
tags: [fastify, typescript, prisma, postgresql, rest-api, wedding-tech]
---

> **Prioridad absoluta:** Proteger la integridad de datos multi-tenant — toda query DEBE filtrar por tenant (userId). Un query cross-tenant es BLOCKER de producción.

## Contexto del proyecto

Backend API REST para **LOVEPOSTAL** — plataforma B2C SaaS de invitaciones digitales para bodas en México (foco Guadalajara). Precios: Esencial $2,250 MXN / Premium $4,499 MXN. Dominios: `lovepostal.studio` | `app.lovepostal.studio` | `api.lovepostal.studio`. Infra: VPS 76.13.97.90, Docker, Dokploy. Principios: SOLID, YAGNI, KISS.

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js 20 (alpine) | - | Runtime |
| Fastify | ^5.2.0 | Framework HTTP |
| TypeScript | ^5.7.2 | Lenguaje (strict mode) |
| Prisma | ^6.2.0 | ORM + migraciones |
| PostgreSQL | - | Base de datos |
| @sinclair/typebox | ^0.33.0 | Validación schemas JSON |
| Vitest | ^4.0.12 | Testing |
| bcrypt | ^6.0.0 | Hash de passwords |
| @fastify/jwt | ^10.0.0 | Autenticación JWT (7d expiry) |

## Estructura del proyecto

```
src/
├── config/          # env.ts (DATABASE_URL, JWT_SECRET, PORT, HOST) + swagger.ts
├── errors/          # AppError + factories: NotFoundError, ConflictError, UnauthorizedError, InternalError
├── plugins/         # prisma.ts, jwt.ts (authenticate decorator), error-handler.ts
├── modules/
│   ├── auth/        # Registro, login, perfil (JWT). Rutas públicas: register, login
│   ├── guests/      # CRUD invitados (side: bride|groom, status: pending|confirmed|declined)
│   ├── invitations/ # CRUD invitaciones + createWithGuests (transacción atómica)
│   ├── tables/      # CRUD mesas + validación de capacidad (default: 8)
│   └── stats/       # Dashboard (totales, días hasta boda) + stats de mesas
├── types/           # fastify.d.ts — augmentación de FastifyInstance
├── utils/           # pagination.ts — calcPaginationParams(), formatPaginatedResponse()
├── app.ts           # buildApp() — registra plugins y rutas (/api/v1/*)
└── server.ts        # Entrypoint — listen + graceful shutdown
prisma/
├── schema.prisma    # Modelos: User, Table, Invitation, Guest
├── seed.js          # Upsert admin (ADMIN_EMAIL/ADMIN_PASSWORD). JS, no TS.
└── migrations/      # Migraciones SQL
```

**Patrón por módulo:** `schema.ts → repository.ts → service.ts → controller.ts → routes.ts`. DI manual en routes.ts. Errores: usar factories de AppError, nunca `throw new Error()`.

## Comandos esenciales

| Comando | Descripción |
|---|---|
| `npm run dev` | Desarrollo con hot-reload (tsx watch) |
| `npm run build` | Compilar TypeScript (`tsc`) |
| `npm start` | Producción (`node dist/server.js`) |
| `npm run test:run` | Ejecutar tests una vez (obligatorio pre-PR) |
| `npm test` | Tests en watch mode |
| `npm run test:ui` | Tests con UI visual de Vitest |
| `npm run prisma:generate` | Generar cliente Prisma |
| `npm run prisma:migrate` | Crear/ejecutar migraciones (dev) |
| `npm run prisma:studio` | UI visual de base de datos |
| `docker build -t guests-api .` | Build de imagen Docker (multi-stage) |

## Convenciones de codigo

- **Archivos:** kebab-case con prefijo de modulo (`guest.service.ts`, `invitation.schema.ts`)
- **Schemas:** TypeBox (`@sinclair/typebox`) — todo endpoint con schema completo (body, params, query, responses)
- **Errores:** `NotFoundError('Guest')`, `ConflictError('msg')`, `UnauthorizedError()`, `InternalError('msg')`
- **Imports:** paths relativos, sin alias
- **Swagger:** todo endpoint documentado con tags (auth, guests, invitations, tables, stats), summary y responses
- **Evitar:** `any` sin justificacion, `@ts-ignore`, `throw new Error()` en services, hardcodear URLs
- **Dominio:** siempre `lovepostal.studio`, NUNCA `lovepostal.app`
- **Auth:** NUNCA retornar `password` en respuestas. Errores de login: siempre `'Invalid email or password'`

## Flujo de trabajo

- **Branches:** `feature/<slug>`, `bugfix/<slug>` desde `main`
- **Commits:** Conventional Commits en ingles (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`, `docs:`)
- **PR requirements:** tests pasan (`npm run test:run`), build compila (`npm run build`), schema Swagger completo
- **Deploy:** push a `main` → Dokploy auto-deploy → `docker-entrypoint.sh` (migrate deploy + seed + start)

## Testing

- **Framework:** Vitest ^4.0.12 con globals habilitados y coverage v8
- **Ubicacion:** colocados junto al codigo (`modulo.service.test.ts`)
- **Patron:** mocks manuales de repository con `vi.fn()`, estructura AAA (Arrange-Act-Assert)
- **Cobertura:** 4/5 modulos con tests (auth, guests, invitations, stats). Falta: tables
- **Regla:** todo service nuevo DEBE tener tests unitarios
- **Ejecutar:** `npm run test:run` antes de cada PR

## Reglas de negocio criticas

> No modificar sin analisis de impacto documentado.

1. Unicidad por nombre en guests, invitations, tables (case-sensitive, nivel de aplicacion)
2. Unicidad por operationId en guests e invitations
3. Validacion de capacidad de mesa unificada en `TableService.validateTableCapacity()`
4. No eliminar mesas con invitaciones asignadas
5. No reducir capacidad por debajo del guest count actual
6. Transaccion atomica para crear invitacion con guests
7. `onDelete: SetNull` para guests (eliminar invitation) e invitations (eliminar table)

## Limites y seguridad

### SIEMPRE hacer (sin preguntar)
- Filtrar queries por tenant (userId) en contexto multi-tenant
- Usar factories de AppError para errores en services
- Validar schemas TypeBox en todo endpoint nuevo
- Escribir tests unitarios para services nuevos
- Usar variables de entorno para configuracion

### PREGUNTAR primero
- Modificar reglas de negocio criticas (ver lista arriba)
- Cambiar modelos de Prisma o crear migraciones
- Modificar `docker-entrypoint.sh` o `Dockerfile`
- Agregar dependencias nuevas al proyecto
- Cambiar configuracion de autenticacion/JWT

### NUNCA hacer
- Modificar `.env*` o archivos con credenciales
- Hard delete en BD (solo soft delete con `deletedAt`)
- Queries sin filtro de tenant en contexto multi-tenant
- Commitear secrets, tokens o API keys
- Ignorar errores TypeScript con `@ts-ignore` sin justificacion documentada
- Ejecutar comandos destructivos contra la base de datos de produccion
- Retornar el campo `password` del modelo User en ninguna respuesta
- Usar el dominio `lovepostal.app` (correcto: `lovepostal.studio`)

### Archivos protegidos
- `.env`, `.env.example` — credenciales y configuracion sensible
- `prisma/schema.prisma` — modelo de datos (requiere migracion)
- `prisma/seed.js` — seed de admin en produccion
- `docker-entrypoint.sh` — pipeline de deploy
- `Dockerfile` — build de produccion
- `src/config/env.ts` — variables de entorno criticas
