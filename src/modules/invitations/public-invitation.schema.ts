import { Type, Static } from '@sinclair/typebox';

export const PublicInvitationResponseSchema = Type.Object({
  slug: Type.String(),
  coupleName: Type.String(),
  message: Type.Union([Type.String(), Type.Null()]),
  eventDate: Type.Union([Type.String(), Type.Null()]),
  location: Type.Union([Type.String(), Type.Null()]),
});

export const PublicSlugParamsSchema = Type.Object({
  slug: Type.String({ minLength: 1, maxLength: 100 }),
});

export const RsvpBodySchema = Type.Object({
  guestId: Type.String({ format: 'uuid' }),
  status: Type.Union([
    Type.Literal('confirmed'),
    Type.Literal('declined'),
  ]),
  message: Type.Optional(Type.String({ maxLength: 500 })),
});

export const RsvpResponseSchema = Type.Object({
  guestId: Type.String(),
  status: Type.String(),
  message: Type.String(),
});

export type PublicSlugParams = Static<typeof PublicSlugParamsSchema>;
export type RsvpBody = Static<typeof RsvpBodySchema>;
