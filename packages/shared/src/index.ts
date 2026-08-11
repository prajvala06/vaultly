export const APP_NAME = 'Vaultly' as const;
export const APP_TAGLINE = 'Securely store, manage, and share your files.' as const;

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorBody = {
  code: string;
  message: string;
};

export type ApiErrorResponse = {
  success: false;
  error: ApiErrorBody;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
