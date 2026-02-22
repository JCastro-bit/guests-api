# LOVEPOSTAL — Guests API

API REST para gestión de invitados, invitaciones y mesas de boda, construida con Fastify, TypeScript, Prisma y PostgreSQL. Parte de la plataforma **LOVEPOSTAL** (lovepostal.studio).

## Stack Tecnológico

- **Node.js** + **Fastify 5** - Framework web rápido y ligero
- **TypeScript** - Tipado estático (strict mode)
- **Prisma ORM** - ORM moderno para PostgreSQL
- **PostgreSQL** - Base de datos
- **TypeBox** (@sinclair/typebox) - Validación de esquemas JSON
- **Swagger/OpenAPI** - Documentación automática de API
- **Vitest** - Framework de testing
- **Pino** - Logging estructurado

## Arquitectura

Arquitectura limpia con separación de responsabilidades. Cada módulo sigue el patrón: `schema → repository → service → controller → routes`.

```
src/
├── config/          # Configuración (env, swagger)
├── plugins/         # Plugins de Fastify (prisma, jwt, error-handler)
├── modules/
│   ├── auth/        # Módulo de autenticación
│   ├── invitations/ # Módulo de invitaciones
│   ├── guests/      # Módulo de invitados
│   ├── tables/      # Módulo de mesas
│   └── stats/       # Módulo de estadísticas
├── types/           # Definiciones de tipos TypeScript
├── app.ts           # buildApp() — registra plugins y rutas
└── server.ts        # Entrypoint — listen + graceful shutdown
```

## Prerrequisitos

- Node.js >= 18
- PostgreSQL
- npm

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:

```bash
npm install
```

3. Crear archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

4. Configurar la variable `DATABASE_URL` en `.env` con la conexión a PostgreSQL

5. Generar el cliente de Prisma:

```bash
npm run prisma:generate
```

6. Ejecutar migraciones:

```bash
npm run prisma:migrate
```

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string de PostgreSQL | `postgresql://user:pass@localhost:5432/guests_db?schema=public` |
| `NODE_ENV` | Entorno de ejecución | `development` / `production` |
| `PORT` | Puerto del servidor | `3000` |
| `HOST` | Host del servidor | `0.0.0.0` |
| `JWT_SECRET` | Secret para JWT | `change-me-in-production` |
| `ADMIN_EMAIL` | Email del admin para seed | `admin@lovepostal.studio` |
| `ADMIN_PASSWORD` | Password del admin para seed | (vacío = skip) |

> **Nota:** Si el password contiene `#`, usa comillas dobles: `ADMIN_PASSWORD="Pass#123"`. Sin comillas, `#` trunca el valor.

## Scripts Disponibles

- `npm run dev` - Inicia el servidor en modo desarrollo con hot-reload
- `npm run build` - Compila el proyecto TypeScript
- `npm start` - Inicia el servidor en producción
- `npm test` - Ejecuta tests en modo watch
- `npm run test:run` - Ejecuta tests una vez
- `npm run test:ui` - Ejecuta tests con UI visual
- `npm run prisma:generate` - Genera el cliente de Prisma
- `npm run prisma:migrate` - Ejecuta migraciones de base de datos
- `npm run prisma:studio` - Abre Prisma Studio para gestionar la BD

## Endpoints

### Auth

- `POST /api/v1/auth/register` - Registrar nuevo usuario
- `POST /api/v1/auth/login` - Iniciar sesión
- `GET /api/v1/auth/me` - Obtener perfil (requiere JWT)

### Invitations

- `POST /api/v1/invitations` - Crear invitación
- `POST /api/v1/invitations/with-guests` - Crear invitación con invitados (transacción atómica)
- `GET /api/v1/invitations` - Listar invitaciones (soporta paginación)
- `GET /api/v1/invitations/:id` - Obtener invitación por ID (incluye invitados y mesa)
- `PUT /api/v1/invitations/:id` - Actualizar invitación
- `DELETE /api/v1/invitations/:id` - Eliminar invitación

### Guests

- `POST /api/v1/guests` - Crear invitado
- `GET /api/v1/guests` - Listar invitados (soporta paginación)
- `GET /api/v1/guests?invitationId=<uuid>` - Listar invitados por invitación
- `GET /api/v1/guests/:id` - Obtener invitado por ID
- `PUT /api/v1/guests/:id` - Actualizar invitado
- `DELETE /api/v1/guests/:id` - Eliminar invitado

### Tables

- `POST /api/v1/tables` - Crear mesa
- `GET /api/v1/tables` - Listar mesas con estadísticas (soporta paginación)
- `GET /api/v1/tables/:id` - Obtener mesa por ID con invitaciones y guests
- `PUT /api/v1/tables/:id` - Actualizar mesa
- `DELETE /api/v1/tables/:id` - Eliminar mesa (solo si no tiene invitaciones)

### Stats

- `GET /api/v1/stats/dashboard` - Estadísticas generales (totales, confirmados, pendientes, declinados, días hasta boda)
- `GET /api/v1/stats/tables` - Estadísticas de mesas (capacidad, ocupación, disponibilidad)

### Health

- `GET /health` - Health check

## Reglas de Negocio

- **Unicidad por nombre** en guests, invitations y tables
- **Unicidad por operationId** en guests e invitations
- **Validación de capacidad** de mesa antes de asignar invitaciones
- **No eliminar mesas** con invitaciones asignadas
- **No reducir capacidad** por debajo del número actual de guests
- **Transacción atómica** para crear invitación con guests
- **onDelete: SetNull** — al eliminar invitación, los guests quedan huérfanos (invitationId = null)

## Documentación API

Una vez iniciado el servidor, la documentación interactiva de Swagger está disponible en:

- **Desarrollo:** http://localhost:3000/docs
- **Producción:** https://api.lovepostal.studio/docs

## Tests

Framework: Vitest. Los tests unitarios usan mocks manuales de repositories.

```bash
# Ejecutar tests una vez
npm run test:run

# Ejecutar tests en modo watch
npm test

# Ejecutar tests con UI visual
npm run test:ui
```

## Características

- Autenticación JWT con email/password
- Validación estricta de entrada/salida con TypeBox
- Documentación OpenAPI generada automáticamente
- Manejo de errores centralizado con mapeo de status codes
- Logs estructurados con Pino
- CORS y Helmet configurados
- Graceful shutdown
- Admin seed automático en deploy (idempotente)
- Arquitectura escalable y mantenible
