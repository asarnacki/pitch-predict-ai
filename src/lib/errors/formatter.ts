/**
 * Error Response Formatter
 *
 * Converts various error types into standardized API error responses.
 * Ensures consistent error format across all endpoints.
 */

import { ZodError } from 'zod';
import type { ApiErrorResponse } from '@/types';
import { ApiError } from './api-errors';

/**
 * Format error into standardized API response
 *
 * Handles different error types:
 * - Custom ApiError (from api-errors.ts)
 * - Zod validation errors
 * - Generic/unexpected errors
 *
 * @param error - Any error object
 * @returns Object with HTTP status and ApiErrorResponse body
 */
export function formatError(error: unknown): {
  status: number;
  body: ApiErrorResponse;
} {
  if (error instanceof ApiError) {
    return {
      status: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
  };
}
