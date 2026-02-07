import { Injectable } from '@angular/core';
import { User, Post } from '../models';
import { UserService } from './user.service';
import { StorageService } from './storage.service';

const INIT_FLAG_KEY = 'app_initialized';

@Injectable({
  providedIn: 'root'
})
export class DataInitService {
  constructor(
    private userService: UserService,
    private storage: StorageService
  ) {}

  initializeData(): void {
    const isInitialized = this.storage.getItem<boolean>(INIT_FLAG_KEY);
    if (isInitialized) {
      return;
    }

    this.seedUsers();
    this.seedPosts();
    
    this.storage.setItem(INIT_FLAG_KEY, true);
  }

  private seedUsers(): void {
    const users: User[] = [
      { id: 'user1', name: 'Alice Johnson', team: 'Engineering' },
      { id: 'user2', name: 'Bob Smith', team: 'Design' },
      { id: 'user3', name: 'Charlie Brown', team: 'Product' },
      { id: 'user4', name: 'Diana Prince', team: 'Engineering' },
      { id: 'user5', name: 'Eve Adams', team: 'Marketing' }
    ];

    this.userService.saveUsers(users);
    this.userService.setCurrentUser(users[0]); // Set first user as current
  }

  private seedPosts(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    const posts: Post[] = [
      {
        id: this.generateId(),
        authorId: 'user1',
        authorName: 'Alice Johnson',
        team: 'Engineering',
        tags: ['work', 'coding', 'humor'],
        mood: '😊 Happy',
        title: 'When your code works on the first try',
        body: 'Me: *writes code*\nCode: *compiles without errors*\nMe: Wait, that\'s illegal 🤔\n\n||Spoiler: It had bugs in production||',
        createdAt: now,
        updatedAt: now
      },
      {
        id: this.generateId(),
        authorId: 'user2',
        authorName: 'Bob Smith',
        team: 'Design',
        tags: ['design', 'clients', 'funny'],
        mood: '😅 Amused',
        title: 'Client feedback be like',
        body: 'Client: "Can you make the logo bigger?"\nMe: "Sure"\nClient: "Actually, make it smaller"\nMe: "No problem"\nClient: "You know what, bigger is better"\n\nThis went on for 47 iterations... ||Spoiler: They chose the original size||',
        createdAt: now - (oneHour * 2),
        updatedAt: now - (oneHour * 2)
      },
      {
        id: this.generateId(),
        authorId: 'user3',
        authorName: 'Charlie Brown',
        team: 'Product',
        tags: ['meetings', 'relatable'],
        mood: '🙄 Annoyed',
        body: 'Another meeting that could have been an email\n\nActual meeting duration: 1 hour\nUseful information shared: 5 minutes\nTime spent listening to people who love hearing themselves talk: 55 minutes',
        createdAt: now - (oneHour * 4),
        updatedAt: now - (oneHour * 4)
      },
      {
        id: this.generateId(),
        authorId: 'user4',
        authorName: 'Diana Prince',
        team: 'Engineering',
        tags: ['debugging', 'late-night', 'coding'],
        mood: '😴 Tired',
        title: '3 AM debugging session',
        body: 'Me at 3 AM: *finally finds the bug*\nThe bug: a missing semicolon from 2 weeks ago\nMe: ||Spoiler: I\'m questioning all my life choices||',
        createdAt: now - (oneHour * 6),
        updatedAt: now - (oneHour * 6)
      },
      {
        id: this.generateId(),
        authorId: 'user5',
        authorName: 'Eve Adams',
        team: 'Marketing',
        tags: ['social-media', 'trends'],
        mood: '🎉 Excited',
        title: 'When the campaign goes viral',
        body: 'That moment when your meme marketing campaign actually works and the engagement goes through the roof 🚀\n\nCEO: "Great work!"\nMe: *frantically trying to remember what I did*',
        createdAt: now - (oneHour * 8),
        updatedAt: now - (oneHour * 8)
      },
      {
        id: this.generateId(),
        authorId: 'user1',
        authorName: 'Alice Johnson',
        team: 'Engineering',
        tags: ['git', 'version-control', 'oops'],
        mood: '😱 Shocked',
        title: 'Git troubles',
        body: 'Just typed "git push --force" on the main branch...\n\n||Spoiler: The entire team is now hunting me down||\n\nUpdate: I\'ve been told to update my resume',
        createdAt: now - (oneHour * 10),
        updatedAt: now - (oneHour * 10)
      },
      {
        id: this.generateId(),
        authorId: 'user2',
        authorName: 'Bob Smith',
        team: 'Design',
        tags: ['tools', 'figma'],
        mood: '😎 Cool',
        body: 'Designers: *spends hours perfecting a design*\nDevelopers: *implements with 2px off*\nDesigners: "MY EYES! MY BEAUTIFUL DESIGN!"\n\nTrue story from this morning\'s standup',
        createdAt: now - (oneHour * 12),
        updatedAt: now - (oneHour * 12)
      },
      {
        id: this.generateId(),
        authorId: 'user3',
        authorName: 'Charlie Brown',
        team: 'Product',
        tags: ['features', 'scope-creep'],
        mood: '😤 Frustrated',
        title: 'Just a small feature',
        body: 'Stakeholder: "This is just a small feature, shouldn\'t take long"\nMe: *creates 47-page technical specification*\nStakeholder: "Wait, I didn\'t mean..."\n\n||Spoiler: The "small feature" took 3 sprints||',
        createdAt: now - (oneHour * 14),
        updatedAt: now - (oneHour * 14)
      }
    ];

    // Save posts directly to storage without triggering subscriptions
    this.storage.setItem('posts', posts);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
