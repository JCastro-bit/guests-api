import { Type, Static } from '@sinclair/typebox';

export const InvitationSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  message: Type.Union([Type.String(), Type.Null()]),
  eventDate: Type.Union([Type.String({ format: 'date' }), Type.Null()]),
  location: Type.Union([Type.String(), Type.Null()]),
  qrCode: Type.Union([Type.String(), Type.Null()]),
  operationId: Type.Union([Type.String(), Type.Null()]),
  tableId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
  createdAt: Type.String({ format: 'date-time' }),
});

export const CreateInvitationSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  message: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  eventDate: Type.Optional(Type.Union([Type.String({ format: 'date' }), Type.Null()])),
  location: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  qrCode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  operationId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  tableId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
});

export const UpdateInvitationSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  message: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  eventDate: Type.Optional(Type.Union([Type.String({ format: 'date' }), Type.Null()])),
  location: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  qrCode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  operationId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  tableId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
});

export const InvitationParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export const InvitationQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
});

export const PaginatedInvitationsSchema = Type.Object({
  data: Type.Array(InvitationSchema),
  total: Type.Integer(),
  page: Type.Integer(),
  limit: Type.Integer(),
});

export const CreateInvitationWithGuestsSchema = Type.Object({
  invitation: CreateInvitationSchema,
  guests: Type.Array(Type.Object({
    name: Type.String({ minLength: 1 }),
    side: Type.Union([Type.Literal('bride'), Type.Literal('groom')]),
    phone: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    email: Type.Optional(Type.Union([Type.String({ format: 'email' }), Type.Null()])),
    status: Type.Optional(Type.Union([
      Type.Literal('pending'),
      Type.Literal('confirmed'),
      Type.Literal('declined'),
    ])),
    operationId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  })),
});

export type Invitation = Static<typeof InvitationSchema>;
export type CreateInvitation = Static<typeof CreateInvitationSchema>;
export type UpdateInvitation = Static<typeof UpdateInvitationSchema>;
export type InvitationParams = Static<typeof InvitationParamsSchema>;
export type InvitationQuery = Static<typeof InvitationQuerySchema>;
export type PaginatedInvitations = Static<typeof PaginatedInvitationsSchema>;
export type CreateInvitationWithGuests = Static<typeof CreateInvitationWithGuestsSchema>;
