import type { NextFunction, Request, Response } from 'express';
import type { ApiErrorResponse, ApiSuccessResponse } from '@vaultly/shared';

export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  const body: ApiSuccessResponse<T> = { success: true, data };
  return res.status(statusCode).json(body);
}

export function sendError(res: Response, statusCode: number, code: string, message: string): Response {
  const body: ApiErrorResponse = { success: false, error: { code, message } };
  return res.status(statusCode).json(body);
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    sendError(res, err.statusCode, err.code, err.message);
    return;
  }
  console.error(err);
  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong.');
}
