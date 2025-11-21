import { Type, Static } from '@sinclair/typebox';

export const DashboardStatsSchema = Type.Object({
  totalGuests: Type.Integer(),
  confirmed: Type.Integer(),
  pending: Type.Integer(),
  declined: Type.Integer(),
  totalInvitations: Type.Integer(),
  daysUntilWedding: Type.Integer(),
});

export const TableStatsItemSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  capacity: Type.Integer(),
  location: Type.Union([Type.String(), Type.Null()]),
  guestCount: Type.Integer(),
  available: Type.Integer(),
  invitationCount: Type.Integer(),
});

export const TableStatsSchema = Type.Object({
  tables: Type.Array(TableStatsItemSchema),
  totalTables: Type.Integer(),
  totalCapacity: Type.Integer(),
  totalOccupied: Type.Integer(),
  totalAvailable: Type.Integer(),
});

export type DashboardStats = Static<typeof DashboardStatsSchema>;
export type TableStatsItem = Static<typeof TableStatsItemSchema>;
export type TableStats = Static<typeof TableStatsSchema>;
