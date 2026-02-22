import { Type, Static } from '@sinclair/typebox';

export const SideEnum = Type.Union([Type.Literal('bride'), Type.Literal('groom')]);
export const StatusEnum = Type.Union([
  Type.Literal('pending'),
  Type.Literal('confirmed'),
  Type.Literal('declined'),
]);

export const GuestSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  side: SideEnum,
  phone: Type.Union([Type.String(), Type.Null()]),
  email: Type.Union([Type.String(), Type.Null()]),
  status: StatusEnum,
  invitationId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
  operationId: Type.Union([Type.String(), Type.Null()]), // TODO: evaluar remoción si no se usa en frontend
  createdAt: Type.String({ format: 'date-time' }),
});

export const CreateGuestSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  side: SideEnum,
  phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  email: Type.Optional(Type.Union([Type.String({ format: 'email' }), Type.Null()])),
  status: Type.Optional(StatusEnum),
  invitationId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
  operationId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const UpdateGuestSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  side: Type.Optional(SideEnum),
  phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  email: Type.Optional(Type.Union([Type.String({ format: 'email' }), Type.Null()])),
  status: Type.Optional(StatusEnum),
  invitationId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
  operationId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const GuestParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export const GuestQuerySchema = Type.Object({
  invitationId: Type.Optional(Type.String({ format: 'uuid' })),
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
});

export const PaginatedGuestsSchema = Type.Object({
  data: Type.Array(GuestSchema),
  total: Type.Integer(),
  page: Type.Integer(),
  limit: Type.Integer(),
});

export type Guest = Static<typeof GuestSchema>;
export type CreateGuest = Static<typeof CreateGuestSchema>;
export type UpdateGuest = Static<typeof UpdateGuestSchema>;
export type GuestParams = Static<typeof GuestParamsSchema>;
export type GuestQuery = Static<typeof GuestQuerySchema>;
export type PaginatedGuests = Static<typeof PaginatedGuestsSchema>;
