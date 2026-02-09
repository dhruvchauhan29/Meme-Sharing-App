export interface User {
  id: number;
  email: string;
  password?: string; // Only sent during registration, not returned from server
  name: string;
  team: string;
  role: 'user' | 'admin';
}
