import { Type, Static } from '@sinclair/typebox';

export const TableSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  capacity: Type.Integer({ minimum: 1 }),
  location: Type.Union([Type.String(), Type.Null()]),
  notes: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: 'date-time' }),
});

export const CreateTableSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  capacity: Type.Optional(Type.Integer({ minimum: 1, default: 8 })),
  location: Type.Optional(Type.Union([Type.String(), Type.Null()])), // TODO: evaluar remoción si no se usa en frontend
  notes: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const UpdateTableSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  capacity: Type.Optional(Type.Integer({ minimum: 1 })),
  location: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  notes: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const TableParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export const TableQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
});

export const PaginatedTablesSchema = Type.Object({
  data: Type.Array(TableSchema),
  total: Type.Integer(),
  page: Type.Integer(),
  limit: Type.Integer(),
});

export const TableWithStatsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  capacity: Type.Integer(),
  location: Type.Union([Type.String(), Type.Null()]),
  notes: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: 'date-time' }),
  guestCount: Type.Integer(),
  available: Type.Integer(),
  invitations: Type.Array(Type.Object({
    id: Type.String({ format: 'uuid' }),
    name: Type.String(),
    message: Type.Union([Type.String(), Type.Null()]),
    eventDate: Type.Union([Type.String({ format: 'date' }), Type.Null()]),
    location: Type.Union([Type.String(), Type.Null()]),
    tableId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
    createdAt: Type.String({ format: 'date-time' }),
    guests: Type.Array(Type.Object({
      id: Type.String({ format: 'uuid' }),
      name: Type.String(),
      side: Type.Union([Type.Literal('bride'), Type.Literal('groom')]),
      phone: Type.Union([Type.String(), Type.Null()]),
      email: Type.Union([Type.String(), Type.Null()]),
      status: Type.Union([Type.Literal('pending'), Type.Literal('confirmed'), Type.Literal('declined')]),
      invitationId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
      createdAt: Type.String({ format: 'date-time' }),
    })),
  })),
});

export type Table = Static<typeof TableSchema>;
export type CreateTable = Static<typeof CreateTableSchema>;
export type UpdateTable = Static<typeof UpdateTableSchema>;
export type TableParams = Static<typeof TableParamsSchema>;
export type TableQuery = Static<typeof TableQuerySchema>;
export type PaginatedTables = Static<typeof PaginatedTablesSchema>;
export type TableWithStats = Static<typeof TableWithStatsSchema>;
