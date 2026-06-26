/** Standard API response envelope */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: { page: number; limit: number; total: number };
}

/** Pagination query parameters */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/** Location coordinates */
export interface Coordinates {
  lat: number;
  lng: number;
}
