import { NextResponse } from 'next/server';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export class AuthenticationError extends AppError {
  public errorCode?: string;
  
  constructor(message: string = 'Authentication failed', errorCode?: string) {
    super(message, 401);
    this.errorCode = errorCode;
  }
}

// Error response helper
export function createErrorResponse(error: AppError | Error, message?: string) {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const errorMessage = message || (error && error.message) || 'An error occurred';

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && error && {
        stack: error.stack
      })
    },
    { status: statusCode }
  );
}

// Success response helper
export function createSuccessResponse<T>(data: T, statusCode: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data
    },
    { status: statusCode }
  );
}

// Database error handler
export function handleDatabaseError(error: any): AppError {
  if (error && error.code === 11000) {
    // Duplicate key error
    return new ConflictError('Resource already exists');
  }
  
  if (error && error.name === 'ValidationError') {
    return new ValidationError('Validation failed');
  }
  
  if (error && error.name === 'CastError') {
    return new ValidationError('Invalid ID format');
  }
  
  console.error('Database error:', error);
  return new AppError('Database operation failed');
}

// Async error handler wrapper
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error('Unexpected error:', error);
      throw new AppError('Internal server error');
    }
  };
}

// Request validation wrapper
export function withValidation<T>(
  schema: any,
  handler: (validatedData: T) => Promise<NextResponse>
) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      const body = await request.json();
      const validation = schema && schema.safeParse ? schema.safeParse(body) : null;
      
      if (!validation || !validation.success) {
        const errorMessage = validation && validation.error && validation.error.errors 
          ? validation.error.errors.map((err: any) => err.message).join(', ')
          : 'Validation failed';
        return createErrorResponse(new ValidationError(errorMessage));
      }
      
      return await handler(validation.data);
    } catch (error) {
      if (error instanceof AppError) {
        return createErrorResponse(error);
      }
      
      console.error('Validation error:', error);
      return createErrorResponse(new AppError('Invalid request data'));
    }
  };
}
