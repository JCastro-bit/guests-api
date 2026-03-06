import { Type, Static } from '@sinclair/typebox';

export const ActivatePlanBodySchema = Type.Object({
  userId: Type.String({ format: 'uuid' }),
  plan: Type.Union([Type.Literal('esencial'), Type.Literal('premium')]),
  notes: Type.Optional(Type.String({ maxLength: 500 })),
});

export const ActivatePlanResponseSchema = Type.Object({
  userId: Type.String(),
  email: Type.String(),
  plan: Type.String(),
  planStatus: Type.String(),
  planActivatedAt: Type.String(),
});

export type ActivatePlanBody = Static<typeof ActivatePlanBodySchema>;
