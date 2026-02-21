import { Type, Static } from '@sinclair/typebox';

export const RoleEnum = Type.Union([Type.Literal('user'), Type.Literal('admin')]);

export const RegisterBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8 }),
  name: Type.Optional(Type.String({ minLength: 1 })),
});

export const LoginBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 1 }),
});

export const UserResponseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ format: 'email' }),
  name: Type.Union([Type.String(), Type.Null()]),
  role: RoleEnum,
  createdAt: Type.String({ format: 'date-time' }),
});

export const AuthResponseSchema = Type.Object({
  token: Type.String(),
  user: Type.Object({
    id: Type.String({ format: 'uuid' }),
    email: Type.String({ format: 'email' }),
    name: Type.Union([Type.String(), Type.Null()]),
    role: RoleEnum,
  }),
});

export const AuthErrorSchema = Type.Object({
  error: Type.Object({
    statusCode: Type.Integer(),
    message: Type.String(),
  }),
});

export type RegisterBody = Static<typeof RegisterBodySchema>;
export type LoginBody = Static<typeof LoginBodySchema>;
export type UserResponse = Static<typeof UserResponseSchema>;
export type AuthResponse = Static<typeof AuthResponseSchema>;
