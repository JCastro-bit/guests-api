import { Type } from '@sinclair/typebox';

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({
    statusCode: Type.Integer(),
    message: Type.String(),
  }),
});
