# CLAUDE.md — Guests API (LOVEPOSTAL)

## Descripcion General

Repositorio backend del sistema de gestion de invitados para **LOVEPOSTAL**, una plataforma B2C SaaS de invitaciones digitales para bodas en Mexico. Este API REST gestiona invitados, invitaciones y mesas de boda. Es consumido por el frontend de LOVEPOSTAL y potencialmente por integraciones externas.

- **Dominio principal:** lovepostal.studio
- **Subdominio API:** api.lovepostal.studio
- **Dominio incorrecto (NO usar):** lovepostal.app

## Stack Tecnologico

| Tecnologia | Version | Uso |
|-----------|---------|-----|
| Node.js | - | Runtime |
| Fastify | ^5.2.0 | Framework HTTP |
| TypeScript | ^5.7.2 | Lenguaje |
| Prisma ORM | ^6.2.0 | ORM / Migraciones |
| PostgreSQL | - | Base de datos |
| @sinclair/typebox | ^0.33.0 | Validacion de schemas JSON |
| @fastify/swagger | ^9.3.0 | Documentacion OpenAPI |
| @fastify/swagger-ui | ^5.2.0 | UI de Swagger en /docs |
| @fastify/cors | ^10.1.0 | CORS |
| @fastify/helmet | ^12.0.1 | Headers de seguridad |
| Pino | ^9.5.0 | Logging estructurado |
| Vitest | ^4.0.12 | Testing |
| tsx | ^4.19.2 | Ejecucion TypeScript en desarrollo |

## Arquitectura

```
src/
├── config/
│   ├── env.ts              # Variables de entorno (DATABASE_URL, NODE_ENV, PORT, HOST)
│   └── swagger.ts          # Configuracion OpenAPI/Swagger
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
│   ├── invitations/        # CRUD invitaciones (+ transaccion con guests)
│   │   ├── invitation.schema.ts
│   │   ├── invitation.repository.ts
│   │   ├── invitation.service.ts
│   │   ├── invitation.service.test.ts
│   │   ├── invitation.controller.ts
│   │   └── invitation.routes.ts
│   ├── tables/             # CRUD mesas (con stats de ocupacion)
│   │   ├── table.schema.ts
│   │   ├── table.repository.ts
│   │   ├── table.service.ts
│   │   ├── table.controller.ts
│   │   └── table.routes.ts
│   └── stats/              # Dashboard y estadisticas
│       ├── stats.schema.ts
│       ├── stats.controller.ts
│       └── stats.routes.ts
├── types/
│   └── fastify.d.ts        # Augmentacion de tipos: FastifyInstance.prisma
├── app.ts                  # buildApp() — registra plugins, middleware y rutas
└── server.ts               # Entrypoint — listen + graceful shutdown (SIGINT/SIGTERM)
```

### Patron por modulo

Cada modulo sigue la cadena: `schema.ts -> repository.ts -> service.ts -> controller.ts -> routes.ts`

- **schema.ts**: Define schemas TypeBox para validacion de request/response
- **repository.ts**: Acceso a datos via Prisma. Recibe `PrismaClient` en constructor.
- **service.ts**: Logica de negocio. Recibe repository (y opcionalmente PrismaClient para transacciones).
- **controller.ts**: Maneja request/reply HTTP. Recibe service. Delega toda logica al service.
- **routes.ts**: Registra rutas Fastify con schemas. Instancia la cadena de dependencias.

### Inyeccion de dependencias

Manual, sin framework DI. Las routes instancian toda la cadena:

```typescript
const repository = new GuestRepository(fastify.prisma);
const service = new GuestService(repository);
const controller = new GuestController(service);
```

## Modulos

### Guests

Gestion de invitados individuales.

**Endpoints:**
- `POST /api/v1/guests` — Crear invitado
- `GET /api/v1/guests` — Listar invitados (filtro por invitationId, paginacion)
- `GET /api/v1/guests/:id` — Obtener invitado por ID (incluye invitacion)
- `PUT /api/v1/guests/:id` — Actualizar invitado
- `DELETE /api/v1/guests/:id` — Eliminar invitado

**Reglas de negocio:**
- Nombre unico: no se permite crear un guest con nombre duplicado
- OperationId unico: si se provee, no puede estar duplicado
- Validacion de existencia antes de update/delete
- Paginacion opcional con `page` y `limit` (max 100)
- Filtro por `invitationId` en listado
- Enums: side (bride|groom), status (pending|confirmed|declined)

### Invitations

Gestion de invitaciones de boda.

**Endpoints:**
- `POST /api/v1/invitations` — Crear invitacion
- `POST /api/v1/invitations/with-guests` — Crear invitacion con guests (transaccion atomica)
- `GET /api/v1/invitations` — Listar invitaciones (paginacion)
- `GET /api/v1/invitations/:id` — Obtener invitacion por ID (incluye guests y table)
- `PUT /api/v1/invitations/:id` — Actualizar invitacion
- `DELETE /api/v1/invitations/:id` — Eliminar invitacion

**Reglas de negocio:**
- Nombre unico: no se permite crear invitacion con nombre duplicado
- OperationId unico: si se provee, no puede estar duplicado
- Si se asigna `tableId`, se valida que la mesa tenga capacidad disponible
- `createInvitationWithGuests`: transaccion atomica que crea invitacion + N guests. Si falla alguno, se revierte todo.
- Dashboard stats: calcula totales de invitados por status y dias hasta la boda
- Paginacion opcional con `page` y `limit` (max 100)

### Tables

Gestion de mesas del evento.

**Endpoints:**
- `POST /api/v1/tables` — Crear mesa
- `GET /api/v1/tables` — Listar mesas con estadisticas (paginacion)
- `GET /api/v1/tables/:id` — Obtener mesa por ID con invitaciones y guests
- `PUT /api/v1/tables/:id` — Actualizar mesa
- `DELETE /api/v1/tables/:id` — Eliminar mesa (solo si no tiene invitaciones)

**Reglas de negocio:**
- Nombre unico: no se permite crear mesa con nombre duplicado
- Al actualizar nombre, se valida unicidad excluyendo la mesa actual
- No se puede eliminar una mesa que tiene invitaciones asignadas
- No se puede reducir la capacidad por debajo del numero actual de guests
- Capacidad por defecto: 8
- Estadisticas calculadas: guestCount, available (capacidad - guests)

### Stats

Estadisticas del dashboard y mesas.

**Endpoints:**
- `GET /api/v1/stats/dashboard` — Estadisticas generales (totales, confirmados, pendientes, declinados, dias hasta boda)
- `GET /api/v1/stats/tables` — Estadisticas de mesas (capacidad, ocupacion, disponibilidad)

**Nota:** El modulo stats no tiene repository propio; usa InvitationService y TableService.

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
- Al eliminar una Table, las Invitations mantienen su registro pero `tableId` se pone en `null` (comportamiento implicito de Prisma)
- Las validaciones de unicidad por nombre y operationId se hacen a nivel de aplicacion, NO a nivel de base de datos (excepto Table.name que tiene constraint UNIQUE en DB)

## Reglas de Negocio Criticas

> **ESTAS REGLAS NO SE DEBEN MODIFICAR SIN ANALISIS DE IMPACTO PREVIO**

1. **Unicidad por nombre** en guests, invitations y tables (case-sensitive, nivel de aplicacion)
2. **Unicidad por operationId** en guests e invitations (nivel de aplicacion)
3. **Validacion de capacidad de mesa** antes de asignar invitaciones (compara guest count vs capacity)
4. **No eliminar mesas con invitaciones asignadas** (TableService.deleteTable)
5. **No reducir capacidad por debajo del guest count actual** (TableService.updateTable)
6. **Transaccion atomica** para crear invitacion con guests (InvitationService.createInvitationWithGuests)
7. **Calculo de dias hasta la boda** basado en el eventDate mas reciente futuro
8. **onDelete: SetNull** para guests cuando se elimina invitacion
9. **onDelete: SetNull** implicito para invitations cuando se elimina mesa

## Convenciones de Codigo

- TypeScript strict mode habilitado
- Nombres de archivos: kebab-case para modulos (ej: `guest.service.ts`)
- Patron por modulo: schema -> repository -> service -> controller -> routes
- Schemas con TypeBox (`@sinclair/typebox`)
- Repositorios reciben `PrismaClient`, services reciben repositories
- Controllers reciben services
- Routes instancian la cadena de dependencias
- Errores en services: `throw new Error('mensaje')` (generico, el error handler mapea a 500 por defecto)
- Logs con Pino (integrado en Fastify)
- Sin ESLint/Prettier configurado actualmente

## Comandos

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Desarrollo con hot-reload (tsx watch) |
| `npm run build` | Compilar TypeScript |
| `npm start` | Produccion (node dist/server.js) |
| `npm test` | Tests en watch mode |
| `npm run test:run` | Tests una vez |
| `npm run test:ui` | Tests con UI visual |
| `npm run prisma:generate` | Generar cliente Prisma |
| `npm run prisma:migrate` | Ejecutar migraciones |
| `npm run prisma:studio` | UI de base de datos |

## Variables de Entorno

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| DATABASE_URL | Connection string de PostgreSQL | postgresql://user:pass@localhost:5432/guests_db?schema=public |
| NODE_ENV | Entorno de ejecucion | development / production |
| PORT | Puerto del servidor | 3000 |
| HOST | Host del servidor | 0.0.0.0 |

## Swagger/OpenAPI

- **URL local:** http://localhost:3000/docs
- **URL produccion:** https://api.lovepostal.studio/docs
- **Tags:** invitations, guests, tables, stats
- **Todos los endpoints deben tener schema completo** (body, params, query, responses)
- **Nota:** Actualmente hay 4 usos de `Type.Any()` que deben reemplazarse con schemas tipados

## Tests

- **Framework:** Vitest ^4.0.12
- **Patron:** Mocks manuales de repository con `vi.fn()` para unit tests de services
- **Ubicacion:** Colocados junto al codigo (`modulo.service.test.ts`)
- **Cobertura actual:** 2 de 4 modulos tienen tests (guests y invitations)
- **Modulos sin tests:** tables, stats
- **Ejecutar antes de cada PR:** `npm run test:run`
- **Config:** `vitest.config.ts` con coverage v8

## Lineamientos para Agentes IA

1. **NO modificar reglas de negocio** sin analisis de impacto documentado
2. **Mantener tipado estricto** — no agregar `any` sin justificacion
3. **Validar schemas** — todo endpoint nuevo debe tener schema TypeBox completo
4. **Tests obligatorios** — todo service nuevo debe tener tests unitarios
5. **Swagger coverage** — todo endpoint debe documentarse en Swagger con tags, summary, body, params, query y responses
6. **No hardcodear URLs** — usar variables de entorno
7. **Seguir el patron de modulos existente** para nuevas entidades
8. **Commits atomicos** — un cambio logico por commit
9. **No romper backwards compatibility** sin documentar breaking changes
10. **Dominio correcto** — siempre `lovepostal.studio`, NUNCA `lovepostal.app`
