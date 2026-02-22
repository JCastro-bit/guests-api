export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export function calcPaginationParams(page?: number, limit?: number): { skip?: number; take?: number } {
  const skip = page && limit ? (page - 1) * limit : undefined;
  const take = page && limit ? limit : undefined;
  return { skip, take };
}

export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  page?: number,
  limit?: number
): T[] | PaginatedResult<T> {
  if (page && limit) {
    return { data, total, page, limit };
  }
  return data;
}
