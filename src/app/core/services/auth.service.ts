import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models';

const AUTH_TOKEN_KEY = 'auth_token';
const CURRENT_USER_KEY = 'current_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000';
  
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {}

  private loadUserFromStorage(): User | null {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null && this.getCurrentUser() !== null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.saveAuthData(response);
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    // Set default role to 'user' if not provided
    const registerData = { ...data, role: data.role || 'user' };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerData).pipe(
      tap(response => {
        this.saveAuthData(response);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
  }

  private saveAuthData(response: AuthResponse): void {
    localStorage.setItem(AUTH_TOKEN_KEY, response.accessToken);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }
}
