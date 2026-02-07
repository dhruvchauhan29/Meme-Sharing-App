import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models';
import { StorageService } from './storage.service';

const CURRENT_USER_KEY = 'currentUser';
const USERS_KEY = 'users';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(private storage: StorageService) {
    const currentUser = this.storage.getItem<User>(CURRENT_USER_KEY);
    this.currentUserSubject = new BehaviorSubject<User | null>(currentUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: User): void {
    this.storage.setItem(CURRENT_USER_KEY, user);
    this.currentUserSubject.next(user);
  }

  getAllUsers(): User[] {
    return this.storage.getItem<User[]>(USERS_KEY) || [];
  }

  saveUsers(users: User[]): void {
    this.storage.setItem(USERS_KEY, users);
  }
}
