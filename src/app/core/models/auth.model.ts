export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    name: string;
    team: string;
    role: 'user' | 'admin';
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  team: string;
  role?: 'user' | 'admin';
}
