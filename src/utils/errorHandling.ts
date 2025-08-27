/**
 * Error handling utilities for consistent error management
 */

import { toast } from "sonner";

/**
 * Error types for categorizing different errors
 */
export enum ErrorType {
  API = "API_ERROR",
  VALIDATION = "VALIDATION_ERROR",
  NETWORK = "NETWORK_ERROR",
  SYNTAX = "SYNTAX_ERROR",
  ANALYSIS = "ANALYSIS_ERROR",
  UNKNOWN = "UNKNOWN_ERROR"
}

/**
 * Custom error class with additional properties
 */
export class AppError extends Error {
  type: ErrorType;
  details?: any;
  retry?: () => Promise<any>;
  
  constructor(message: string, type: ErrorType = ErrorType.UNKNOWN, details?: any, retry?: () => Promise<any>) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.details = details;
    this.retry = retry;
    
    // Ensure the prototype chain is properly set up
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Create an API error
 */
export function createApiError(message: string, details?: any, retry?: () => Promise<any>): AppError {
  return new AppError(message, ErrorType.API, details, retry);
}

/**
 * Create a validation error
 */
export function createValidationError(message: string, details?: any): AppError {
  return new AppError(message, ErrorType.VALIDATION, details);
}

/**
 * Create a network error
 */
export function createNetworkError(message: string, details?: any, retry?: () => Promise<any>): AppError {
  return new AppError(message, ErrorType.NETWORK, details, retry);
}

/**
 * Create a syntax error
 */
export function createSyntaxError(message: string, details?: any, retry?: () => Promise<any>): AppError {
  return new AppError(message, ErrorType.SYNTAX, details, retry);
}

/**
 * Create an analysis error
 */
export function createAnalysisError(message: string, details?: any, retry?: () => Promise<any>): AppError {
  return new AppError(message, ErrorType.ANALYSIS, details, retry);
}

/**
 * Handle an error with consistent logging and user feedback
 * @param error Error to handle
 * @param fallback Optional fallback value to return
 * @returns Fallback value if provided
 */
export function handleError<T>(error: unknown, fallback?: T): T | undefined {
  // Convert to AppError if it's not already
  const appError = error instanceof AppError 
    ? error 
    : new AppError(
        error instanceof Error ? error.message : String(error),
        ErrorType.UNKNOWN,
        error
      );
  
  // Log the error with appropriate level based on type
  console.error(`[${appError.type}] ${appError.message}`, appError.details);
  
  // Show user-friendly toast notification
  toast.error(getUserFriendlyMessage(appError), {
    description: getErrorDescription(appError),
    action: appError.retry ? {
      label: "Retry",
      onClick: () => {
        if (appError.retry) {
          appError.retry().catch(e => handleError(e));
        }
      }
    } : undefined
  });
  
  // Return fallback value if provided
  return fallback;
}

/**
 * Get a user-friendly error message based on error type
 */
function getUserFriendlyMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.API:
      return "API Request Failed";
    case ErrorType.VALIDATION:
      return "Validation Error";
    case ErrorType.NETWORK:
      return "Network Connection Issue";
    case ErrorType.SYNTAX:
      return "Syntax Error";
    case ErrorType.ANALYSIS:
      return "Analysis Failed";
    case ErrorType.UNKNOWN:
    default:
      return "Something Went Wrong";
  }
}

/**
 * Get a more detailed error description
 */
function getErrorDescription(error: AppError): string {
  // Use the error message as the description
  return error.message;
}

/**
 * Try to execute a function and handle any errors
 * @param fn Function to execute
 * @param fallback Optional fallback value to return on error
 * @returns Result of the function or fallback value
 */
export async function tryCatch<T>(fn: () => Promise<T>, fallback?: T): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    return handleError(error, fallback);
  }
}

/**
 * Create a safe version of a function that handles errors
 * @param fn Function to make safe
 * @param fallback Optional fallback value to return on error
 * @returns Safe function that handles errors
 */
export function makeSafe<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  fallback?: T
): (...args: Args) => Promise<T | undefined> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleError(error, fallback);
    }
  };
}