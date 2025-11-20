import { Type, Static } from '@sinclair/typebox';

export const DashboardStatsSchema = Type.Object({
  totalGuests: Type.Integer(),
  confirmed: Type.Integer(),
  pending: Type.Integer(),
  declined: Type.Integer(),
  totalInvitations: Type.Integer(),
  daysUntilWedding: Type.Integer(),
});

export type DashboardStats = Static<typeof DashboardStatsSchema>;
