> **Prioridad absoluta:** Proteger la integridad de datos multi-tenant — toda query DEBE filtrar por tenant (userId). Un query cross-tenant es BLOCKER de producción.

## Contexto del proyecto

Backend API REST para **LOVEPOSTAL** — plataforma B2C SaaS de invitaciones digitales para bodas en México (foco Guadalajara). Precios: Esencial $2,250 MXN / Premium $4,499 MXN. Dominios: `lovepostal.studio` | `app.lovepostal.studio` | `api.lovepostal.studio`. Infra: VPS 76.13.97.90, Docker, Dokploy, Traefik. Principios: SOLID, YAGNI, KISS.

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js 20 (alpine) | - | Runtime |
| Fastify | ^5.2.0 | Framework HTTP |
| TypeScript | ^5.7.2 | Lenguaje (strict mode) |
| Prisma | ^6.19.0 | ORM + migraciones |
| PostgreSQL | - | Base de datos |
| @sinclair/typebox | ^0.33.0 | Validación schemas JSON |
| Vitest | ^4.0.12 | Testing |
| bcrypt | ^6.0.0 | Hash de passwords |
| @fastify/jwt | ^10.0.0 | Autenticación JWT (7d expiry) |
| @fastify/rate-limit | ^10.3.0 | Rate limiting (global + per-route) |
| nodemailer | latest | Envío de emails SMTP |
| mercadopago | latest | SDK MercadoPago Checkout Pro |

## Estructura del proyecto

```
src/
├── config/          # env.ts (DATABASE_URL, JWT_SECRET, PORT, HOST, SMTP_*, APP_URL, API_URL, MP_*) + swagger.ts
├── errors/          # AppError + factories: NotFoundError, ConflictError, UnauthorizedError, InternalError
├── lib/             # uuid.ts — validación UUID v4 (assertValidUUID)
├── plugins/         # prisma.ts, jwt.ts (authenticate decorator), error-handler.ts, rate-limit.ts, mailer.ts, mercadopago.ts
├── schemas/         # error.schema.ts (ErrorResponseSchema compartido)
├── modules/
│   ├── admin/       # Admin endpoints (requiere role admin)
│   ├── auth/        # Registro, login, perfil, forgot/reset password (JWT). Rutas públicas: register, login, forgot-password, reset-password
│   ├── email/       # EmailService + templates HTML (welcome, reset-password, payment-confirmation, rsvp-notification)
│   ├── guests/      # CRUD invitados (side: bride|groom, status: pending|confirmed|declined)
│   ├── invitations/ # CRUD invitaciones + createWithGuests (transacción atómica) + rutas públicas (slug, RSVP)
│   ├── tables/      # CRUD mesas + validación de capacidad (default: 8)
│   ├── payments/    # MercadoPago Checkout Pro: create-preference (JWT) + webhook (público, HMAC)
│   └── stats/       # Dashboard (totales, días hasta boda) + stats de mesas
├── types/           # fastify.d.ts — augmentación de FastifyInstance
├── utils/           # pagination.ts — calcPaginationParams(), formatPaginatedResponse()
├── app.ts           # buildApp() — registra plugins y rutas (/api/v1/*)
└── server.ts        # Entrypoint — listen + graceful shutdown
prisma/
├── schema.prisma    # Modelos: User (+ PlanTier, PlanStatus enums), Table, Invitation (+ slug), Guest (+ guestMessage)
├── seed.js          # Upsert admin (ADMIN_EMAIL/ADMIN_PASSWORD). JS, no TS. Non-fatal en Docker (||)
└── migrations/      # 10 migraciones SQL (init → fix_plan_status_column_mapping)
```

**Patrón por módulo:** `schema.ts → repository.ts → service.ts → controller.ts → routes.ts`. DI manual en routes.ts. Errores: usar factories de AppError, nunca `throw new Error()`.

**Rutas públicas (sin JWT):**
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`
- `GET /api/v1/public/invitations/:slug` — datos públicos de invitación por slug
- `PATCH /api/v1/public/invitations/:slug/rsvp` — confirmar/declinar asistencia (rate limited: 5/5min)
- `POST /api/v1/payments/webhook` — webhook MercadoPago (HMAC verificada)

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

**No hay lint script configurado** — no ejecutar `npm run lint`.

## Convenciones de codigo

- **Archivos:** kebab-case con prefijo de modulo (`guest.service.ts`, `invitation.schema.ts`)
- **Schemas:** TypeBox (`@sinclair/typebox`) — todo endpoint con schema completo (body, params, query, responses)
- **Errores:** `NotFoundError('Guest')`, `ConflictError('msg')`, `UnauthorizedError()`, `InternalError('msg')`
- **Imports:** paths relativos, sin alias
- **Swagger:** todo endpoint documentado con tags (auth, guests, invitations, tables, stats, payments, public), summary y responses
- **Evitar:** `any` sin justificacion, `@ts-ignore`, `throw new Error()` en services, hardcodear URLs
- **Dominio:** siempre `lovepostal.studio`, NUNCA `lovepostal.app`
- **Auth:** NUNCA retornar `password`, `resetToken` ni `resetTokenExpiry` en respuestas. Errores de login: siempre `'Invalid email or password'`
- **Emails:** templates como funciones TypeScript puras en `src/modules/email/templates/`. Fire-and-forget (no bloquean respuesta HTTP)
- **UUID validation:** `assertValidUUID()` en controllers antes de queries a BD (ajv-formats no instalado, `format: 'uuid'` es decorativo)
- **Rate limiting:** global 100 req/min + per-route overrides en auth (register 5/hr, login 10/15min, forgot-password 5/hr) y RSVP (5/5min)
- **Fastify typing:** agregar preHandler a rutas rompe inferencia de tipos del handler. Fix: inline handler con `req as any`

## Prisma @map conventions

El schema usa camelCase para campos TypeScript y `@map("snake_case")` para columnas PostgreSQL. **Crítico:** toda columna multi-word DEBE tener `@map()` explícito, o Prisma buscará el nombre camelCase en la BD. Ejemplo: `planStatus @map("plan_status")`.

## Flujo de trabajo

- **Branches:** `feature/<slug>`, `bugfix/<slug>` desde `main`
- **Commits:** Conventional Commits en ingles (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`, `docs:`)
- **PR requirements:** tests pasan (`npm run test:run`), build compila (`npm run build`), schema Swagger completo
- **Deploy:** push a `main` → Dokploy auto-deploy → `docker-entrypoint.sh` (migrate deploy + seed || non-fatal + start)

## Testing

- **Framework:** Vitest ^4.0.12 con globals habilitados y coverage v8
- **Ubicacion:** colocados junto al codigo (`modulo.service.test.ts`)
- **Patron:** mocks manuales de repository con `vi.fn()`, estructura AAA (Arrange-Act-Assert)
- **Cobertura:** 8/8 modulos con tests (admin, auth, guests, invitations, tables, stats, payments, email) + uuid lib
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
8. Soft delete implementado en guests, invitations, tables (campo `deletedAt`, todas las queries filtran `deletedAt: null`)
9. Multi-tenant: todos los modelos de datos (Table, Invitation, Guest) tienen `userId` FK — todas las queries filtran por userId
10. Forgot password: no revela si el email existe (prevención de user enumeration). Token expira en 1 hora
11. Modelo User tiene campos de plan (PlanTier: free|esencial|premium, PlanStatus: inactive|active|expired) y campos de pago (mpPaymentId)
12. Pagos MercadoPago: webhook idempotente (verifica mpPaymentId antes de activar), firma HMAC verificada, external_reference formato `userId:plan:timestamp`
13. Precios: Esencial $2,250 MXN / Premium $4,499 MXN — definidos en `PaymentService.PLAN_PRICES`
14. Invitaciones tienen slug único (nullable) para acceso público. Guests tienen guestMessage para mensajes de RSVP
15. RSVP público: actualiza status de guests y guarda guestMessage, envía notificación por email al owner (fire-and-forget)

## Docker y deploy

- **Entrypoint (`docker-entrypoint.sh`):** `prisma migrate deploy` + `seed.js || non-fatal` + `node dist/server.js`
- **Seed es non-fatal:** falla sin matar el container (fix a `set -e` que crasheaba el container)
- **Healthcheck:** `GET /health` → `{"status":"ok"}` (200). Debe ser ruta directa sin redirects (BusyBox wget no sigue redirects)
- **Rescue migrations:** cuando hay migration drift (migración registrada pero ALTER TABLE no ejecutado), usar `IF NOT EXISTS` y `DO $$ ... EXCEPTION WHEN duplicate_object ... $$` para idempotencia

## Limites y seguridad

### SIEMPRE hacer (sin preguntar)
- Filtrar queries por tenant (userId) en contexto multi-tenant
- Usar factories de AppError para errores en services
- Validar schemas TypeBox en todo endpoint nuevo
- Escribir tests unitarios para services nuevos
- Usar variables de entorno para configuracion
- Verificar `@map()` en campos camelCase del schema Prisma

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
- Retornar `password`, `resetToken` o `resetTokenExpiry` del modelo User en ninguna respuesta
- Usar el dominio `lovepostal.app` (correcto: `lovepostal.studio`)

### Archivos protegidos
- `.env`, `.env.example` — credenciales y configuracion sensible
- `prisma/schema.prisma` — modelo de datos (requiere migracion)
- `prisma/seed.js` — seed de admin en produccion
- `docker-entrypoint.sh` — pipeline de deploy
- `Dockerfile` — build de produccion
- `src/config/env.ts` — variables de entorno criticas
