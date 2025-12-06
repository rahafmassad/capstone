// services/api.ts

// Note: For mobile devices, replace 'localhost' with your computer's IP address
// Example: 'http://192.168.1.100:4000/api'
// For Android emulator, use 'http://10.0.2.2:4000/api'
// For iOS simulator, 'localhost' should work
const API_BASE_URL = 'https://defeasible-doreen-crustless.ngrok-free.dev/api'; // Update with your production URL

export interface AuthSignupRequest {
  fullName: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  token?: string; // Only in development
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string | null;
  city?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocationsResponse {
  locations: Location[];
}

export interface Gate {
  id: string;
  name: string;
  locationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationGatesResponse {
  location: Location;
  gates: Gate[];
}

export interface Activity {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: any;
  createdAt: string;
}

export interface ActivitiesResponse {
  activities: Activity[];
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    acceptedTerms: boolean;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  hasAcceptedTerms: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserUpdateRequest {
  fullName?: string;
  email?: string;
  password?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Makes an API request with error handling
 * Optionally includes authentication token
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Extract method and ensure it's explicitly set and uppercase
  const method = (options.method || 'GET').toUpperCase();
  
  // Build headers - start with default headers
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    // Skip ngrok browser warning page
    'ngrok-skip-browser-warning': 'true',
  };

  // Merge with any headers from options
  const headers: Record<string, string> = {
    ...defaultHeaders,
    ...(options.headers as Record<string, string> || {}),
  };

  // Add authorization header if token is provided (this should override any existing Authorization header)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('No token provided for authenticated request to:', endpoint);
  }
  
  // Build the request config
  const config: RequestInit = {
    method,
    headers,
  };

  // Only include body for methods that support it
  if (options.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    config.body = options.body;
  }

  try {
    // Log request details for debugging
    const authHeader = headers['Authorization'];
    console.log('API Request:', { 
      url, 
      method, 
      hasBody: !!config.body,
      bodyLength: config.body ? String(config.body).length : 0,
      hasAuth: !!authHeader,
      authHeaderPrefix: authHeader ? authHeader.substring(0, 10) : 'none'
    });
    
    const response = await fetch(url, config);
    
    // Read response as text first to check if it's JSON
    const text = await response.text();
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let data;
    
    // Check if response starts with HTML (common error indicator)
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      console.error('Received HTML instead of JSON:', text.substring(0, 500));
      throw {
        message: `Server returned an HTML page instead of JSON. This usually means the endpoint doesn't exist or there's a server error. Status: ${response.status}`,
        status: response.status,
      } as ApiError;
    }
    
    // Try to parse as JSON
    try {
      data = JSON.parse(text);
    } catch {
      // If parsing fails and it's not HTML, provide helpful error
      if (!isJson) {
        console.error('Non-JSON response:', text.substring(0, 200));
        throw {
          message: `Server returned ${response.status} ${response.statusText}. Expected JSON but received ${contentType || 'unknown content type'}.`,
          status: response.status,
        } as ApiError;
      }
      // If content-type says JSON but parsing fails
      throw {
        message: 'Invalid JSON response from server.',
        status: response.status,
      } as ApiError;
    }

    if (!response.ok) {
      const error: ApiError = {
        message: data.message || data.error || `HTTP error! status: ${response.status}`,
        status: response.status,
      };
      throw error;
    }

    return data;
  } catch (error) {
    // Handle JSON parse errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      throw {
        message: 'Invalid response from server. Please check the API endpoint.',
        status: 0,
      } as ApiError;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw {
        message: 'Network error. Please check your connection.',
        status: 0,
      } as ApiError;
    }
    
    // Re-throw ApiError if it's already one
    if (error && typeof error === 'object' && 'message' in error && 'status' in error) {
      throw error;
    }
    
    // Handle any other errors
    throw {
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      status: 0,
    } as ApiError;
  }
}

/**
 * Sign up a new user
 */
export async function signup(data: AuthSignupRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Log in an existing user
 */
export async function login(data: AuthLoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Request password reset (forgot password)
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  return apiRequest<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Reset password using token
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  return apiRequest<ResetPasswordResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get all locations
 */
export async function getLocations(): Promise<LocationsResponse> {
  return apiRequest<LocationsResponse>('/locations', {
    method: 'GET',
  });
}

/**
 * Get a single location by ID
 */
export async function getLocation(locationId: string): Promise<{ location: Location }> {
  return apiRequest<{ location: Location }>(`/locations/${locationId}`, {
    method: 'GET',
  });
}

/**
 * Get gates for a location
 */
export async function getLocationGates(locationId: string): Promise<LocationGatesResponse> {
  return apiRequest<LocationGatesResponse>(`/locations/${locationId}/gates`, {
    method: 'GET',
  });
}

/**
 * Accept terms and conditions (for authenticated users)
 * This is used when terms are updated and user needs to re-accept
 */
export async function acceptTerms(token: string): Promise<{ user: any }> {
  return apiRequest<{ user: any }>('/auth/accept-terms', {
    method: 'POST',
  }, token);
}

/**
 * Get current user profile
 * Requires authentication token
 */
export async function getCurrentUser(token: string): Promise<{ user: User }> {
  return apiRequest<{ user: User }>('/user/me', {
    method: 'GET',
  }, token);
}

/**
 * Update current user profile
 * Requires authentication token
 */
export async function updateCurrentUser(
  data: UserUpdateRequest,
  token: string
): Promise<{ user: User }> {
  return apiRequest<{ user: User }>('/user/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, token);
}

/**
 * Get user activities
 * Requires authentication token
 * @param sort - 'newest' or 'oldest' (default: 'newest')
 */
export async function getActivities(
  token: string,
  sort: 'newest' | 'oldest' = 'newest'
): Promise<ActivitiesResponse> {
  const endpoint = `/activities?sort=${sort}`;
  return apiRequest<ActivitiesResponse>(endpoint, {
    method: 'GET',
  }, token);
}

