export interface UserProfile {
  user_id: string;
  email: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  current_streak_days: number;
  created_at: string;
}

export interface AuthTokenData {
  user_id: string;
  email: string;
  username: string;
  token: string;
  token_type: string;
  expires_in: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
