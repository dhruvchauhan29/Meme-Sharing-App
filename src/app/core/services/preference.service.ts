import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Preference } from '../models';
import { StorageService } from './storage.service';
import { UserService } from './user.service';

const PREFERENCES_KEY_PREFIX = 'preferences:';

@Injectable({
  providedIn: 'root'
})
export class PreferenceService {
  private preferencesSubject: BehaviorSubject<Preference>;
  public preferences$: Observable<Preference>;

  private defaultPreferences: Preference = {
    sortOrder: 'newest',
    filterTags: [],
    showSavedOnly: false,
    searchQuery: ''
  };

  constructor(
    private storage: StorageService,
    private userService: UserService
  ) {
    const savedPreferences = this.loadPreferences();
    this.preferencesSubject = new BehaviorSubject<Preference>(
      savedPreferences || this.defaultPreferences
    );
    this.preferences$ = this.preferencesSubject.asObservable();
  }

  private getPreferencesKey(): string {
    const user = this.userService.getCurrentUser();
    return user ? `${PREFERENCES_KEY_PREFIX}${user.id}` : '';
  }

  private loadPreferences(): Preference | null {
    const key = this.getPreferencesKey();
    if (!key) return null;
    return this.storage.getItem<Preference>(key);
  }

  getPreferences(): Preference {
    return this.preferencesSubject.value;
  }

  updatePreferences(updates: Partial<Preference>): void {
    const current = this.preferencesSubject.value;
    const updated = { ...current, ...updates };
    
    const key = this.getPreferencesKey();
    if (key) {
      this.storage.setItem(key, updated);
    }
    
    this.preferencesSubject.next(updated);
  }

  resetPreferences(): void {
    const key = this.getPreferencesKey();
    if (key) {
      this.storage.removeItem(key);
    }
    this.preferencesSubject.next(this.defaultPreferences);
  }
}
