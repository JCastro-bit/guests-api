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
  plan: Type.Union([
    Type.Literal('free'),
    Type.Literal('esencial'),
    Type.Literal('premium'),
  ]),
  planStatus: Type.Union([
    Type.Literal('inactive'),
    Type.Literal('active'),
    Type.Literal('expired'),
  ]),
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

export const PlanTierEnum = Type.Union([
  Type.Literal('free'),
  Type.Literal('esencial'),
  Type.Literal('premium'),
]);

export const PlanStatusEnum = Type.Union([
  Type.Literal('inactive'),
  Type.Literal('active'),
  Type.Literal('expired'),
]);

export const ForgotPasswordBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
});

export const ResetPasswordBodySchema = Type.Object({
  token: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 8 }),
});

export const MessageResponseSchema = Type.Object({
  message: Type.String(),
});

export type RegisterBody = Static<typeof RegisterBodySchema>;
export type LoginBody = Static<typeof LoginBodySchema>;
export type UserResponse = Static<typeof UserResponseSchema>;
export type AuthResponse = Static<typeof AuthResponseSchema>;
export type ForgotPasswordBody = Static<typeof ForgotPasswordBodySchema>;
export type ResetPasswordBody = Static<typeof ResetPasswordBodySchema>;
