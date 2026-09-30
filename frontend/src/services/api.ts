import { ApiResponse, AuthTokenData, UserProfile } from '../types/auth';
import {
  CourseSummary,
  CourseDetail,
  ModuleSummary,
  LessonDetail,
  LessonCompleteResponse,
  LearningProgressSummary
} from '../types/learning';
import {
  CanonicalCircuit,
  CircuitValidationResult,
  CircuitTemplate
} from '../types/circuit';

const TOKEN_KEY = 'quantumania_auth_token';

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  },
  remove: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore
    }
  }
};

export class ApiError extends Error {
  code: string;
  details?: unknown;
  status: number;

  constructor(code: string, message: string, status: number = 400, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `/api/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch {
    throw new ApiError(
      'NETWORK_ERROR',
      'Unable to connect to the Quantum platform backend. Please check your connection.',
      0
    );
  }

  let body: ApiResponse<T>;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(
      'INVALID_RESPONSE',
      `Unexpected server response (HTTP ${response.status}).`,
      response.status
    );
  }

  if (!body.success) {
    throw new ApiError(
      body.error?.code || 'UNKNOWN_ERROR',
      body.error?.message || 'An unexpected error occurred.',
      response.status,
      body.error?.details
    );
  }

  return body.data;
}

export const authApi = {
  register: (payload: { email: string; username: string; password: string; display_name?: string }) => {
    return request<AuthTokenData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  login: (payload: { email: string; password: string }) => {
    return request<AuthTokenData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getMe: () => {
    return request<UserProfile>('/me', {
      method: 'GET'
    });
  },

  updateProfile: (payload: { display_name?: string; experience_level?: string; avatar_url?: string }) => {
    return request<UserProfile>('/me', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }
};

export const learningApi = {
  getCourses: () => {
    return request<CourseSummary[]>('/courses', {
      method: 'GET'
    });
  },

  getCourse: (courseId: string) => {
    return request<CourseDetail>(`/courses/${courseId}`, {
      method: 'GET'
    });
  },

  getModule: (moduleId: string) => {
    return request<ModuleSummary>(`/modules/${moduleId}`, {
      method: 'GET'
    });
  },

  getLesson: (lessonId: string) => {
    return request<LessonDetail>(`/lessons/${lessonId}`, {
      method: 'GET'
    });
  },

  startLesson: (lessonId: string) => {
    return request<{ lesson_id: string; status: string }>(`/lessons/${lessonId}/start`, {
      method: 'POST'
    });
  },

  completeLesson: (lessonId: string) => {
    return request<LessonCompleteResponse>(`/lessons/${lessonId}/complete`, {
      method: 'POST'
    });
  },

  getProgress: () => {
    return request<LearningProgressSummary>('/learning/progress', {
      method: 'GET'
    });
  }
};

export const quantumApi = {
  validateCircuit: (circuit: CanonicalCircuit) => {
    return request<CircuitValidationResult>('/quantum/validate', {
      method: 'POST',
      body: JSON.stringify(circuit)
    });
  },

  getTemplates: () => {
    return request<CircuitTemplate[]>('/quantum/templates', {
      method: 'GET'
    });
  },

  getTemplate: (templateId: string) => {
    return request<CircuitTemplate>(`/quantum/templates/${templateId}`, {
      method: 'GET'
    });
  }
};
