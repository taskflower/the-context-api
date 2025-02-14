// src/errors/error.types.ts
export type ErrorResponse = {
    success: false;
    error: {
      code: string;
      message: string;
      details?: any;
    };
  };
  
  export type SuccessResponse<T> = {
    success: true;
    data: T;
  };