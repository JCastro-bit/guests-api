import { Type, Static } from '@sinclair/typebox';

export const InvitationSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  tableNumber: Type.Union([Type.String(), Type.Null()]),
  message: Type.Union([Type.String(), Type.Null()]),
  eventDate: Type.Union([Type.String({ format: 'date' }), Type.Null()]),
  location: Type.Union([Type.String(), Type.Null()]),
  qrCode: Type.Union([Type.String(), Type.Null()]),
  operationId: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: 'date-time' }),
});

export const CreateInvitationSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  tableNumber: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  message: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  eventDate: Type.Optional(Type.Union([Type.String({ format: 'date' }), Type.Null()])),
  location: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  qrCode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  operationId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const UpdateInvitationSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  tableNumber: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  message: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  eventDate: Type.Optional(Type.Union([Type.String({ format: 'date' }), Type.Null()])),
  location: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  qrCode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  operationId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const InvitationParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});

export type Invitation = Static<typeof InvitationSchema>;
export type CreateInvitation = Static<typeof CreateInvitationSchema>;
export type UpdateInvitation = Static<typeof UpdateInvitationSchema>;
export type InvitationParams = Static<typeof InvitationParamsSchema>;
