# Guests API

API REST para gestión de invitados y invitaciones de boda, construida con Fastify, TypeScript, Prisma y PostgreSQL.

## Stack Tecnológico

- **Node.js** + **Fastify** - Framework web rápido y ligero
- **TypeScript** - Tipado estático
- **Prisma ORM** - ORM moderno para PostgreSQL
- **PostgreSQL** - Base de datos
- **TypeBox** - Validación de esquemas JSON
- **Swagger/OpenAPI** - Documentación automática de API

## Arquitectura

Arquitectura limpia con separación de responsabilidades:

```
src/
├── config/          # Configuración (env, swagger)
├── plugins/         # Plugins de Fastify (prisma, error-handler)
├── modules/
│   ├── invitations/ # Módulo de invitaciones
│   │   ├── invitation.schema.ts      # Validaciones TypeBox
│   │   ├── invitation.repository.ts  # Acceso a datos (Prisma)
│   │   ├── invitation.service.ts     # Lógica de negocio
│   │   ├── invitation.controller.ts  # Controladores HTTP
│   │   └── invitation.routes.ts      # Definición de rutas
│   └── guests/      # Módulo de invitados
└── types/           # Definiciones de tipos TypeScript
```

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

## Scripts Disponibles

- `npm run dev` - Inicia el servidor en modo desarrollo con hot-reload
- `npm run build` - Compila el proyecto TypeScript
- `npm start` - Inicia el servidor en producción
- `npm run prisma:generate` - Genera el cliente de Prisma
- `npm run prisma:migrate` - Ejecuta migraciones de base de datos
- `npm run prisma:studio` - Abre Prisma Studio para gestionar la BD

## Endpoints

### Invitations

- `POST /api/v1/invitations` - Crear invitación
- `GET /api/v1/invitations` - Listar invitaciones
- `GET /api/v1/invitations/:id` - Obtener invitación por ID
- `PUT /api/v1/invitations/:id` - Actualizar invitación
- `DELETE /api/v1/invitations/:id` - Eliminar invitación

### Guests

- `POST /api/v1/guests` - Crear invitado
- `GET /api/v1/guests` - Listar invitados
- `GET /api/v1/guests?invitationId=<uuid>` - Listar invitados por invitación
- `GET /api/v1/guests/:id` - Obtener invitado por ID
- `PUT /api/v1/guests/:id` - Actualizar invitado
- `DELETE /api/v1/guests/:id` - Eliminar invitado

## Documentación API

Una vez iniciado el servidor, la documentación interactiva de Swagger está disponible en:

```
http://localhost:3000/docs
```

## Características

- Validación estricta de entrada/salida con TypeBox
- Documentación OpenAPI generada automáticamente
- Manejo de errores centralizado
- Logs estructurados con Pino
- CORS y Helmet configurados
- Graceful shutdown
- Arquitectura escalable y mantenible
