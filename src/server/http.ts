/**
 * Shared helpers for API route handlers. Server-only: import from `+api.ts`
 * files (or other src/server modules) only, never from app screens.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'ERROR',
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

type Handler<Params> = (request: Request, params: Params) => Promise<Response>;

export function route<Params = Record<string, string>>(handler: Handler<Params>) {
  return async (request: Request, params: Params) => {
    try {
      return await handler(request, params);
    } catch (error) {
      if (error instanceof ApiError) {
        return json({ error: { code: error.code, message: error.message } }, error.status);
      }
      console.error('[api] unhandled error', error);
      return json({ error: { code: 'INTERNAL', message: 'Something went wrong' } }, 500);
    }
  };
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, 'Request body must be valid JSON', 'BAD_REQUEST');
  }
}

export function requireString(value: unknown, field: string, maxLength = 10_000): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ApiError(400, `${field} is required`, 'BAD_REQUEST');
  }
  if (value.length > maxLength) {
    throw new ApiError(400, `${field} is too long`, 'BAD_REQUEST');
  }
  return value;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requireUuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw new ApiError(400, `${field} must be a UUID`, 'BAD_REQUEST');
  }
  return value;
}
