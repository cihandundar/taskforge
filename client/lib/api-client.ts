import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Cookie names
const COOKIE_NAMES = {
  ACCESS: 'taskforge_access_token',
  REFRESH: 'taskforge_refresh_token',
  USER: 'taskforge_user',
};

export interface ApiError {
  success: false;
  message: string;
  error: any;
  statusCode: number;
  timestamp: string;
  path: string;
}

export interface ApiResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class ApiClient {
  public client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;

        // Skip refresh for refresh endpoint itself to avoid loop
        if (originalRequest?.url?.includes('/auth/refresh')) {
          this.clearTokens();
          this.clearCurrentUser();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          return Promise.reject(error);
        }

        // If error is 401 and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.client.post<AuthTokens>('/auth/refresh', {
                refreshToken,
              });

              const { accessToken, refreshToken: newRefreshToken } = response.data;

              this.setToken(accessToken);
              this.setRefreshToken(newRefreshToken);

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }

              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearTokens();
            this.clearCurrentUser();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management - store in both cookie and localStorage
  public getToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Try cookie first (for middleware), fallback to localStorage
    return Cookies.get(COOKIE_NAMES.ACCESS) || localStorage.getItem('accessToken');
  }

  public setToken(token: string): void {
    if (typeof window === 'undefined') return;
    // Store in cookie (7 days, same as refresh token for simplicity)
    Cookies.set(COOKIE_NAMES.ACCESS, token, { expires: 7, path: '/' });
    // Also store in localStorage as backup
    localStorage.setItem('accessToken', token);
  }

  public getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return Cookies.get(COOKIE_NAMES.REFRESH) || localStorage.getItem('refreshToken');
  }

  public setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    Cookies.set(COOKIE_NAMES.REFRESH, token, { expires: 7, path: '/' });
    localStorage.setItem('refreshToken', token);
  }

  public clearTokens(): void {
    if (typeof window === 'undefined') return;
    Cookies.remove(COOKIE_NAMES.ACCESS, { path: '/' });
    Cookies.remove(COOKIE_NAMES.REFRESH, { path: '/' });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Auth endpoints
  async register(data: RegisterData): Promise<ApiResponse<LoginResponse>> {
    const response = await this.client.post<ApiResponse<LoginResponse>>('/auth/register', data);
    const { user, tokens } = response.data.data;

    // Store tokens
    this.setToken(tokens.accessToken);
    this.setRefreshToken(tokens.refreshToken);

    return response.data;
  }

  async login(data: LoginData): Promise<ApiResponse<LoginResponse>> {
    const response = await this.client.post<ApiResponse<LoginResponse>>('/auth/login', data);

    // Debug
    console.log('Login Response:', response.data);

    const { user, tokens } = response.data.data;

    // Store tokens
    this.setToken(tokens.accessToken);
    this.setRefreshToken(tokens.refreshToken);

    return response.data;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      await this.client.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      this.clearTokens();
      this.clearCurrentUser();
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await this.client.get<ApiResponse<User>>('/auth/me');
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    const response = await this.client.post<ApiResponse<AuthTokens>>('/auth/refresh', {
      refreshToken,
    });
    const tokens = response.data.data;

    // Update tokens
    this.setToken(tokens.accessToken);
    this.setRefreshToken(tokens.refreshToken);

    return response.data;
  }

  // Public method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Public method to get current user
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = Cookies.get(COOKIE_NAMES.USER) || localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Public method to set current user
  setCurrentUser(user: User): void {
    if (typeof window === 'undefined') return;
    const userStr = JSON.stringify(user);
    Cookies.set(COOKIE_NAMES.USER, userStr, { expires: 7, path: '/' });
    localStorage.setItem('user', userStr);
  }

  // Public method to clear current user
  clearCurrentUser(): void {
    if (typeof window === 'undefined') return;
    Cookies.remove(COOKIE_NAMES.USER, { path: '/' });
    localStorage.removeItem('user');
  }

  // File upload methods
  async uploadFile(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<any>>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async uploadFiles(files: File[]): Promise<ApiResponse<{ files: any[] }>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await this.client.post<ApiResponse<{ files: any[] }>>('/files/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async getFile(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse<any>>(`/files/${id}`);
    return response.data;
  }

  async downloadFile(id: string): Promise<ApiResponse<{ filename: string; url: string; mimetype: string }>> {
    const response = await this.client.get<ApiResponse<{ filename: string; url: string; mimetype: string }>>(`/files/${id}/download`);
    return response.data;
  }

  async deleteFile(id: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.delete<ApiResponse<{ message: string }>>(`/files/${id}`);
    return response.data;
  }

  // Comments API methods
  async getComments(pageId: string): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse<any>>('/comments', {
      params: { pageId }
    });
    return response.data;
  }

  async getComment(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse<any>>(`/comments/${id}`);
    return response.data;
  }

  async createComment(data: { content: string; pageId: string }): Promise<ApiResponse<any>> {
    const response = await this.client.post<ApiResponse<any>>('/comments', data);
    return response.data;
  }

  async updateComment(id: string, data: { content?: string; resolved?: boolean }): Promise<ApiResponse<any>> {
    const response = await this.client.patch<ApiResponse<any>>(`/comments/${id}`, data);
    return response.data;
  }

  async deleteComment(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.delete<ApiResponse<any>>(`/comments/${id}`);
    return response.data;
  }

  async resolveComment(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.patch<ApiResponse<any>>(`/comments/${id}/resolve`);
    return response.data;
  }

  async unresolveComment(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.patch<ApiResponse<any>>(`/comments/${id}/unresolve`);
    return response.data;
  }

  async getUnresolvedComments(userId?: string): Promise<ApiResponse<any>> {
    const params = userId ? { userId } : {};
    const response = await this.client.get<ApiResponse<any>>('/comments/unresolved', { params });
    return response.data;
  }

  // Mentions API methods
  async getMentions(): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse<any>>('/mentions');
    return response.data;
  }

  async getUnreadMentions(): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse<any>>('/mentions/unread');
    return response.data;
  }

  async searchUsers(query: string): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse<any>>('/mentions/search', {
      params: { q: query }
    });
    return response.data;
  }

  async markMentionAsRead(id: string): Promise<ApiResponse<any>> {
    const response = await this.client.patch<ApiResponse<any>>(`/mentions/${id}/read`);
    return response.data;
  }

  async markAllMentionsAsRead(): Promise<ApiResponse<any>> {
    const response = await this.client.patch<ApiResponse<any>>('/mentions/read-all');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
