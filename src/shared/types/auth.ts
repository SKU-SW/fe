export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
