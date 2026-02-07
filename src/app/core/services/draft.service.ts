import { Injectable } from '@angular/core';
import { Draft } from '../models';
import { StorageService } from './storage.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  constructor(
    private storage: StorageService,
    private userService: UserService
  ) {}

  getDraftKey(postId?: string): string {
    const user = this.userService.getCurrentUser();
    if (!user) return '';
    
    if (postId) {
      return `draft:${user.id}:post:${postId}`;
    }
    return `draft:${user.id}:new`;
  }

  saveDraft(draft: Draft, postId?: string): void {
    const key = this.getDraftKey(postId);
    if (key) {
      this.storage.setItem(key, draft);
    }
  }

  getDraft(postId?: string): Draft | null {
    const key = this.getDraftKey(postId);
    if (!key) return null;
    return this.storage.getItem<Draft>(key);
  }

  clearDraft(postId?: string): void {
    const key = this.getDraftKey(postId);
    if (key) {
      this.storage.removeItem(key);
    }
  }

  getAllDrafts(): { key: string; draft: Draft }[] {
    const user = this.userService.getCurrentUser();
    if (!user) return [];

    const prefix = `draft:${user.id}:`;
    const keys = this.storage.getAllKeys().filter(k => k.startsWith(prefix));
    
    return keys.map(key => ({
      key,
      draft: this.storage.getItem<Draft>(key)!
    })).filter(item => item.draft !== null);
  }
}
