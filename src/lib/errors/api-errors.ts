/**
 * Custom API Error Classes
 *
 * Standardized error handling for all API endpoints.
 * Each error includes HTTP status code, machine-readable code, and user-friendly message.
 */

/**
 * Base API Error class
 * All custom API errors extend this class
 */
import type { ApiErrorDetails } from "@/types";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: ApiErrorDetails
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 401 Unauthorized Error
 * Used when user is not authenticated or token is invalid
 */
export class UnauthorizedError extends ApiError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
    this.name = "UnauthorizedError";
  }
}

/**
 * 400 Bad Request - Validation Error
 * Used when request data fails validation
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: ApiErrorDetails) {
    super(400, "VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

/**
 * 404 Not Found Error
 * Used when requested resource doesn't exist
 */
export class NotFoundError extends ApiError {
  constructor(code: string, message: string) {
    super(404, code, message);
    this.name = "NotFoundError";
  }
}

/**
 * 403 Forbidden - Prediction Limit Error
 * Used when user reaches the 50 prediction limit
 */
export class PredictionLimitError extends ApiError {
  constructor() {
    super(
      403,
      "PREDICTION_LIMIT_REACHED",
      "Maximum of 50 saved predictions reached. Please delete some predictions to add new ones."
    );
    this.name = "PredictionLimitError";
  }
}

/**
 * 503 Service Unavailable - External Service Error
 * Used when external API (football-data.org, OpenRouter.ai) fails
 */
export class ExternalServiceError extends ApiError {
  constructor(message: string) {
    super(503, "EXTERNAL_API_ERROR", message);
    this.name = "ExternalServiceError";
  }
}

/**
 * 409 Conflict Error
 * Used for business logic conflicts (e.g., match not finished yet)
 */
export class ConflictError extends ApiError {
  constructor(code: string, message: string) {
    super(409, code, message);
    this.name = "ConflictError";
  }
}
