# CLAUDE.md — Guests API (LOVEPOSTAL)

## Descripción General

Repositorio backend del sistema de gestión de invitados para **LOVEPOSTAL**, una plataforma B2C SaaS de invitaciones digitales para bodas en México. Este API REST gestiona invitados, invitaciones y mesas de boda. Es consumido por el frontend de LOVEPOSTAL y potencialmente por integraciones externas.

- **Dominio principal:** lovepostal.studio
- **Subdominio API:** api.lovepostal.studio
- **Dominio incorrecto (NO usar):** lovepostal.app

## Stack Tecnológico

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Node.js | - | Runtime |
| Fastify | ^5.2.0 | Framework HTTP |
| TypeScript | ^5.7.2 | Lenguaje |
| Prisma ORM | ^6.2.0 | ORM / Migraciones |
| PostgreSQL | - | Base de datos |
| @sinclair/typebox | ^0.33.0 | Validación de schemas JSON |
| @fastify/swagger | ^9.3.0 | Documentación OpenAPI |
| @fastify/swagger-ui | ^5.2.0 | UI de Swagger en /docs |
| @fastify/cors | ^10.1.0 | CORS |
| @fastify/helmet | ^12.0.1 | Headers de seguridad |
| Pino | ^9.5.0 | Logging estructurado |
| Vitest | ^4.0.12 | Testing |
| tsx | ^4.19.2 | Ejecución TypeScript en desarrollo |

## Arquitectura

```
src/
├── config/
│   ├── env.ts              # Variables de entorno (DATABASE_URL, NODE_ENV, PORT, HOST)
│   └── swagger.ts          # Configuración OpenAPI/Swagger
├── plugins/
│   ├── prisma.ts           # Plugin Fastify: inyecta PrismaClient en fastify.prisma
│   └── error-handler.ts    # Plugin Fastify: manejo centralizado de errores
├── modules/
│   ├── guests/             # CRUD invitados
│   │   ├── guest.schema.ts
│   │   ├── guest.repository.ts
│   │   ├── guest.service.ts
│   │   ├── guest.service.test.ts
│   │   ├── guest.controller.ts
│   │   └── guest.routes.ts
│   ├── invitations/        # CRUD invitaciones (+ transacción con guests)
│   │   ├── invitation.schema.ts
│   │   ├── invitation.repository.ts
│   │   ├── invitation.service.ts
│   │   ├── invitation.service.test.ts
│   │   ├── invitation.controller.ts
│   │   └── invitation.routes.ts
│   ├── tables/             # CRUD mesas (con stats de ocupación)
│   │   ├── table.schema.ts
│   │   ├── table.repository.ts
│   │   ├── table.service.ts
│   │   ├── table.controller.ts
│   │   └── table.routes.ts
│   └── stats/              # Dashboard y estadísticas
│       ├── stats.schema.ts
│       ├── stats.controller.ts
│       └── stats.routes.ts
├── types/
│   └── fastify.d.ts        # Augmentación de tipos: FastifyInstance.prisma
├── app.ts                  # buildApp() — registra plugins, middleware y rutas
└── server.ts               # Entrypoint — listen + graceful shutdown (SIGINT/SIGTERM)
```

### Patrón por módulo

Cada módulo sigue la cadena: `schema.ts -> repository.ts -> service.ts -> controller.ts -> routes.ts`

- **schema.ts**: Define schemas TypeBox para validación de request/response
- **repository.ts**: Acceso a datos via Prisma. Recibe `PrismaClient` en constructor.
- **service.ts**: Lógica de negocio. Recibe repository (y opcionalmente PrismaClient para transacciones).
- **controller.ts**: Maneja request/reply HTTP. Recibe service. Delega toda lógica al service.
- **routes.ts**: Registra rutas Fastify con schemas. Instancia la cadena de dependencias.

### Inyección de dependencias

Manual, sin framework DI. Las routes instancian toda la cadena:

```typescript
const repository = new GuestRepository(fastify.prisma);
const service = new GuestService(repository);
const controller = new GuestController(service);
```

## Módulos

### Guests

Gestión de invitados individuales.

**Endpoints:**
- `POST /api/v1/guests` — Crear invitado
- `GET /api/v1/guests` — Listar invitados (filtro por invitationId, paginación)
- `GET /api/v1/guests/:id` — Obtener invitado por ID (incluye invitación)
- `PUT /api/v1/guests/:id` — Actualizar invitado
- `DELETE /api/v1/guests/:id` — Eliminar invitado

**Reglas de negocio:**
- Nombre único: no se permite crear un guest con nombre duplicado
- OperationId único: si se provee, no puede estar duplicado
- Validación de existencia antes de update/delete
- Paginación opcional con `page` y `limit` (max 100)
- Filtro por `invitationId` en listado
- Enums: side (bride|groom), status (pending|confirmed|declined)

### Invitations

Gestión de invitaciones de boda.

**Endpoints:**
- `POST /api/v1/invitations` — Crear invitación
- `POST /api/v1/invitations/with-guests` — Crear invitación con guests (transacción atómica)
- `GET /api/v1/invitations` — Listar invitaciones (paginación)
- `GET /api/v1/invitations/:id` — Obtener invitación por ID (incluye guests y table)
- `PUT /api/v1/invitations/:id` — Actualizar invitación
- `DELETE /api/v1/invitations/:id` — Eliminar invitación

**Reglas de negocio:**
- Nombre único: no se permite crear invitación con nombre duplicado
- OperationId único: si se provee, no puede estar duplicado
- Si se asigna `tableId`, se valida que la mesa tenga capacidad disponible
- `createInvitationWithGuests`: transacción atómica que crea invitación + N guests. Si falla alguno, se revierte todo.
- Dashboard stats: calcula totales de invitados por status y días hasta la boda
- Paginación opcional con `page` y `limit` (max 100)

### Tables

Gestión de mesas del evento.

**Endpoints:**
- `POST /api/v1/tables` — Crear mesa
- `GET /api/v1/tables` — Listar mesas con estadísticas (paginación)
- `GET /api/v1/tables/:id` — Obtener mesa por ID con invitaciones y guests
- `PUT /api/v1/tables/:id` — Actualizar mesa
- `DELETE /api/v1/tables/:id` — Eliminar mesa (solo si no tiene invitaciones)

**Reglas de negocio:**
- Nombre único: no se permite crear mesa con nombre duplicado
- Al actualizar nombre, se valida unicidad excluyendo la mesa actual
- No se puede eliminar una mesa que tiene invitaciones asignadas
- No se puede reducir la capacidad por debajo del número actual de guests
- Capacidad por defecto: 8
- Estadísticas calculadas: guestCount, available (capacidad - guests)

### Stats

Estadísticas del dashboard y mesas.

**Endpoints:**
- `GET /api/v1/stats/dashboard` — Estadísticas generales (totales, confirmados, pendientes, declinados, días hasta boda)
- `GET /api/v1/stats/tables` — Estadísticas de mesas (capacidad, ocupación, disponibilidad)

**Nota:** El módulo stats no tiene repository propio; usa InvitationService y TableService.

## Modelos de Datos

```
Table (tables)
├── id          UUID    PK, auto-generated
├── name        String  UNIQUE
├── capacity    Int     default: 8
├── location    String? opcional
├── notes       String? opcional
├── createdAt   DateTime
└── invitations Invitation[]  (one-to-many)

Invitation (invitations)
├── id          UUID    PK, auto-generated
├── name        String
├── message     String? opcional
├── eventDate   DateTime? opcional
├── location    String? opcional
├── qrCode      String? opcional
├── operationId String? opcional (indexed)
├── tableId     String? FK -> Table.id (indexed)
├── table       Table?  (many-to-one)
├── guests      Guest[] (one-to-many)
└── createdAt   DateTime

Guest (guests)
├── id           UUID    PK, auto-generated
├── name         String
├── side         String  enum: bride | groom
├── phone        String? opcional
├── email        String? opcional
├── status       String  enum: pending | confirmed | declined (default: pending)
├── operationId  String? opcional (indexed)
├── invitationId String? FK -> Invitation.id (indexed, onDelete: SetNull)
├── invitation   Invitation? (many-to-one)
└── createdAt    DateTime
```

**Comportamiento en cascada:**
- Al eliminar una Invitation, los Guest asociados mantienen su registro pero `invitationId` se pone en `null` (onDelete: SetNull)
- Al eliminar una Table, las Invitations mantienen su registro pero `tableId` se pone en `null` (comportamiento implícito de Prisma)
- Las validaciones de unicidad por nombre y operationId se hacen a nivel de aplicación, NO a nivel de base de datos (excepto Table.name que tiene constraint UNIQUE en DB)

## Reglas de Negocio Críticas

> **ESTAS REGLAS NO SE DEBEN MODIFICAR SIN ANÁLISIS DE IMPACTO PREVIO**

1. **Unicidad por nombre** en guests, invitations y tables (case-sensitive, nivel de aplicación)
2. **Unicidad por operationId** en guests e invitations (nivel de aplicación)
3. **Validación de capacidad de mesa** antes de asignar invitaciones (compara guest count vs capacity)
4. **No eliminar mesas con invitaciones asignadas** (TableService.deleteTable)
5. **No reducir capacidad por debajo del guest count actual** (TableService.updateTable)
6. **Transacción atómica** para crear invitación con guests (InvitationService.createInvitationWithGuests)
7. **Cálculo de días hasta la boda** basado en el eventDate más reciente futuro
8. **onDelete: SetNull** para guests cuando se elimina invitación
9. **onDelete: SetNull** implícito para invitations cuando se elimina mesa

## Convenciones de Código

- TypeScript strict mode habilitado
- Nombres de archivos: kebab-case para módulos (ej: `guest.service.ts`)
- Patrón por módulo: schema -> repository -> service -> controller -> routes
- Schemas con TypeBox (`@sinclair/typebox`)
- Repositorios reciben `PrismaClient`, services reciben repositories
- Controllers reciben services
- Routes instancian la cadena de dependencias
- Errores en services: `throw new Error('mensaje')` (genérico, el error handler mapea a 500 por defecto)
- Logs con Pino (integrado en Fastify)
- Sin ESLint/Prettier configurado actualmente

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo con hot-reload (tsx watch) |
| `npm run build` | Compilar TypeScript |
| `npm start` | Producción (node dist/server.js) |
| `npm test` | Tests en watch mode |
| `npm run test:run` | Tests una vez |
| `npm run test:ui` | Tests con UI visual |
| `npm run prisma:generate` | Generar cliente Prisma |
| `npm run prisma:migrate` | Ejecutar migraciones |
| `npm run prisma:studio` | UI de base de datos |

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| DATABASE_URL | Connection string de PostgreSQL | postgresql://user:pass@localhost:5432/guests_db?schema=public |
| NODE_ENV | Entorno de ejecución | development / production |
| PORT | Puerto del servidor | 3000 |
| HOST | Host del servidor | 0.0.0.0 |

## Swagger/OpenAPI

- **URL local:** http://localhost:3000/docs
- **URL producción:** https://api.lovepostal.studio/docs
- **Tags:** invitations, guests, tables, stats
- **Todos los endpoints deben tener schema completo** (body, params, query, responses)
- **Nota:** Actualmente hay 4 usos de `Type.Any()` que deben reemplazarse con schemas tipados

## Tests

- **Framework:** Vitest ^4.0.12
- **Patrón:** Mocks manuales de repository con `vi.fn()` para unit tests de services
- **Ubicación:** Colocados junto al código (`modulo.service.test.ts`)
- **Cobertura actual:** 2 de 4 módulos tienen tests (guests y invitations)
- **Módulos sin tests:** tables, stats
- **Ejecutar antes de cada PR:** `npm run test:run`
- **Config:** `vitest.config.ts` con coverage v8

## Lineamientos para Agentes IA

1. **NO modificar reglas de negocio** sin análisis de impacto documentado
2. **Mantener tipado estricto** — no agregar `any` sin justificación
3. **Validar schemas** — todo endpoint nuevo debe tener schema TypeBox completo
4. **Tests obligatorios** — todo service nuevo debe tener tests unitarios
5. **Swagger coverage** — todo endpoint debe documentarse en Swagger con tags, summary, body, params, query y responses
6. **No hardcodear URLs** — usar variables de entorno
7. **Seguir el patrón de módulos existente** para nuevas entidades
8. **Commits atómicos** — un cambio lógico por commit
9. **No romper backwards compatibility** sin documentar breaking changes
10. **Dominio correcto** — siempre `lovepostal.studio`, NUNCA `lovepostal.app`

## Docker / Deploy

### Dockerfile

Build multi-stage con 2 etapas:

1. **builder:** Instala todas las dependencias, genera el cliente Prisma, compila TypeScript
2. **runner:** Solo dependencias de producción, copia dist/, cliente Prisma y CLI desde builder

- Base image: `node:20-alpine`
- `npm ci` para builds reproducibles (`--only=production --ignore-scripts` en runner)
- NO ejecuta migraciones durante el build

### Entrypoint (`docker-entrypoint.sh`)

1. Ejecuta `prisma migrate deploy` (aplica migraciones pendientes, seguro para producción)
2. Inicia el servidor con `exec node dist/server.js` (PID 1 para graceful shutdown)
3. Si la migración falla, el contenedor falla (`set -e`)

### Configuración Dokploy

| Configuración | Valor |
|---------------|-------|
| Build Type | Dockerfile |
| Docker File | Dockerfile |
| Container Port | 3000 |
| Domain | api.lovepostal.studio |
| HTTPS | Enabled (Let's Encrypt) |
| Trigger | On Push (branch main) |

### Variables de Entorno (Dokploy → App → Environment)

```
DATABASE_URL=postgresql://lovepostal_user:<PASSWORD_URL_ENCODED>@lovepostal-database-sntqvk:5432/lovepostal_db
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

> **Nota:** El password del DB contiene `+` y `=` que deben estar URL-encoded (`%2B` y `%3D`).

### DNS (Hostinger)

```
Tipo A: api → 76.13.97.90  TTL 300
```

### Comandos Docker

| Comando | Descripción |
|---------|-------------|
| `docker build -t guests-api .` | Construir imagen |
| `docker run -p 3000:3000 --env-file .env guests-api` | Ejecutar contenedor localmente |
