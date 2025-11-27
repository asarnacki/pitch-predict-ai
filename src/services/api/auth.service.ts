import { apiClient } from './client'

export interface AuthUser {
  id: string
  email: string
}

export interface AuthResponse {
  user: AuthUser
}

export interface MessageResponse {
  message: string
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    const response = await apiClient<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return response.user
  },

  async register(email: string, password: string): Promise<AuthUser> {
    const response = await apiClient<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return response.user
  },

  async resetPassword(email: string): Promise<string> {
    const response = await apiClient<MessageResponse>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    return response.message
  },

  async updatePassword(password: string): Promise<string> {
    const response = await apiClient<MessageResponse>('/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    })
    return response.message
  },

  async logout(): Promise<void> {
    await apiClient('/api/auth/logout', {
      method: 'POST',
    })
  },
}
