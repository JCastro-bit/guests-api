import { Type, Static } from '@sinclair/typebox';

export const CreatePreferenceBodySchema = Type.Object({
  plan: Type.Union([Type.Literal('esencial'), Type.Literal('premium')]),
});

export const PreferenceResponseSchema = Type.Object({
  preferenceId: Type.String(),
  initPoint: Type.String(),
  sandboxInitPoint: Type.String(),
});

export const WebhookBodySchema = Type.Object({
  type: Type.String(),
  data: Type.Object({
    id: Type.String(),
  }),
});

export const WebhookResponseSchema = Type.Object({
  received: Type.Boolean(),
});

export type CreatePreferenceBody = Static<typeof CreatePreferenceBodySchema>;
export type WebhookBody = Static<typeof WebhookBodySchema>;
