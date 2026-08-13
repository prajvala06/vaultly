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

export {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS,
  REGISTER_OTP_LENGTH,
  loginSchema,
  passwordSchema,
  registerSchema,
  resendRegisterOtpSchema,
  verifyRegisterOtpSchema,
  type LoginInput,
  type RegisterInput,
  type ResendRegisterOtpInput,
  type VerifyRegisterOtpInput,
} from './auth.js';

export type {
  CreateFolderResponse,
  DeleteFolderResponse,
  ListFoldersResponse,
  VaultFolderDto,
} from './folders.js';

export type { UserLookupDto, UserLookupResponse } from './users.js';

export {
  FILE_VISIBILITY_VALUES,
  updateFileSchema,
  type FileType,
  type FileVisibility,
  type ListFilesResponse,
  type ListSharedWithMeResponse,
  type SharedFileDto,
  type StorageSummaryDto,
  type UpdateFileInput,
  type UpdateFileResponse,
  type UploadFileResponse,
  type VaultFileDto,
  type FileShareDto,
  type ListFileSharesResponse,
} from './files.js';
