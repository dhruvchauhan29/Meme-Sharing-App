import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Post, Like, Bookmark, Flag } from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000';

  private postsSubject = new BehaviorSubject<Post[]>([]);
  public posts$ = this.postsSubject.asObservable();

  private likesSubject = new BehaviorSubject<Like[]>([]);
  public likes$ = this.likesSubject.asObservable();

  private bookmarksSubject = new BehaviorSubject<Bookmark[]>([]);
  public bookmarks$ = this.bookmarksSubject.asObservable();

  private flagsSubject = new BehaviorSubject<Flag[]>([]);
  public flags$ = this.flagsSubject.asObservable();

  constructor() {
    // Load initial data
    this.loadPosts();
    this.loadLikes();
    this.loadBookmarks();
    this.loadFlags();
  }

  // Posts
  loadPosts(): void {
    this.http.get<Post[]>(`${this.apiUrl}/posts`).subscribe({
      next: (posts) => this.postsSubject.next(posts.filter(p => !p.isDeleted)),
      error: (error) => console.error('Error loading posts:', error)
    });
  }

  getPosts(): Post[] {
    return this.postsSubject.value;
  }

  getPostById(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/posts/${id}`);
  }

  createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Observable<Post> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const newPost = {
      ...post,
      userId: currentUser.id,
      authorName: currentUser.name,
      isDeleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return this.http.post<Post>(`${this.apiUrl}/posts`, newPost).pipe(
      tap(createdPost => {
        this.postsSubject.next([...this.postsSubject.value, createdPost]);
      })
    );
  }

  updatePost(id: number, updates: Partial<Post>): Observable<Post> {
    const updatedData = {
      ...updates,
      updatedAt: Date.now()
    };

    return this.http.patch<Post>(`${this.apiUrl}/posts/${id}`, updatedData).pipe(
      tap(updatedPost => {
        const posts = this.postsSubject.value.map(p => 
          p.id === id ? updatedPost : p
        );
        this.postsSubject.next(posts);
      })
    );
  }

  deletePost(id: number): Observable<Post> {
    // Soft delete
    return this.http.patch<Post>(`${this.apiUrl}/posts/${id}`, { isDeleted: true }).pipe(
      tap(() => {
        const posts = this.postsSubject.value.filter(p => p.id !== id);
        this.postsSubject.next(posts);
      })
    );
  }

  // Likes
  loadLikes(): void {
    this.http.get<Like[]>(`${this.apiUrl}/likes`).subscribe({
      next: (likes) => this.likesSubject.next(likes),
      error: (error) => console.error('Error loading likes:', error)
    });
  }

  getLikes(): Like[] {
    return this.likesSubject.value;
  }

  getLikesForPost(postId: number): Like[] {
    return this.likesSubject.value.filter(l => l.postId === postId);
  }

  isLikedByUser(postId: number, userId: number): boolean {
    return this.likesSubject.value.some(l => l.postId === postId && l.userId === userId);
  }

  toggleLike(postId: number): Observable<boolean> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const existingLike = this.likesSubject.value.find(
      l => l.postId === postId && l.userId === user.id
    );

    if (existingLike && existingLike.id) {
      // Remove like
      return this.http.delete(`${this.apiUrl}/likes/${existingLike.id}`).pipe(
        tap(() => {
          const likes = this.likesSubject.value.filter(l => l.id !== existingLike.id);
          this.likesSubject.next(likes);
        }),
        map(() => false)
      );
    } else {
      // Add like
      const newLike: Like = {
        postId,
        userId: user.id,
        createdAt: Date.now()
      };
      return this.http.post<Like>(`${this.apiUrl}/likes`, newLike).pipe(
        tap(createdLike => {
          this.likesSubject.next([...this.likesSubject.value, createdLike]);
        }),
        map(() => true)
      );
    }
  }

  // Bookmarks
  loadBookmarks(): void {
    this.http.get<Bookmark[]>(`${this.apiUrl}/bookmarks`).subscribe({
      next: (bookmarks) => this.bookmarksSubject.next(bookmarks),
      error: (error) => console.error('Error loading bookmarks:', error)
    });
  }

  getBookmarks(): Bookmark[] {
    return this.bookmarksSubject.value;
  }

  getBookmarksForUser(userId: number): Bookmark[] {
    return this.bookmarksSubject.value.filter(b => b.userId === userId);
  }

  isBookmarkedByUser(postId: number, userId: number): boolean {
    return this.bookmarksSubject.value.some(b => b.postId === postId && b.userId === userId);
  }

  toggleBookmark(postId: number): Observable<boolean> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const existingBookmark = this.bookmarksSubject.value.find(
      b => b.postId === postId && b.userId === user.id
    );

    if (existingBookmark && existingBookmark.id) {
      // Remove bookmark
      return this.http.delete(`${this.apiUrl}/bookmarks/${existingBookmark.id}`).pipe(
        tap(() => {
          const bookmarks = this.bookmarksSubject.value.filter(b => b.id !== existingBookmark.id);
          this.bookmarksSubject.next(bookmarks);
        }),
        map(() => false)
      );
    } else {
      // Add bookmark
      const newBookmark: Bookmark = {
        postId,
        userId: user.id,
        createdAt: Date.now()
      };
      return this.http.post<Bookmark>(`${this.apiUrl}/bookmarks`, newBookmark).pipe(
        tap(createdBookmark => {
          this.bookmarksSubject.next([...this.bookmarksSubject.value, createdBookmark]);
        }),
        map(() => true)
      );
    }
  }

  // Flags
  loadFlags(): void {
    this.http.get<Flag[]>(`${this.apiUrl}/flags`).subscribe({
      next: (flags) => this.flagsSubject.next(flags),
      error: (error) => console.error('Error loading flags:', error)
    });
  }

  getFlags(): Flag[] {
    return this.flagsSubject.value;
  }

  getFlagsForPost(postId: number): Flag[] {
    return this.flagsSubject.value.filter(f => f.postId === postId);
  }

  createFlag(postId: number, reason: string): Observable<Flag> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const newFlag: Flag = {
      postId,
      userId: user.id,
      reason,
      status: 'pending',
      createdAt: Date.now()
    };

    return this.http.post<Flag>(`${this.apiUrl}/flags`, newFlag).pipe(
      tap(createdFlag => {
        this.flagsSubject.next([...this.flagsSubject.value, createdFlag]);
      })
    );
  }

  updateFlagStatus(id: number, status: 'pending' | 'reviewed' | 'dismissed'): Observable<Flag> {
    return this.http.patch<Flag>(`${this.apiUrl}/flags/${id}`, { status }).pipe(
      tap(updatedFlag => {
        const flags = this.flagsSubject.value.map(f => 
          f.id === id ? updatedFlag : f
        );
        this.flagsSubject.next(flags);
      })
    );
  }

  // Utilities
  getAllTags(): string[] {
    const posts = this.postsSubject.value;
    const tagSet = new Set<string>();
    posts.forEach(post => {
      post.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  getAllTeams(): string[] {
    const posts = this.postsSubject.value;
    const teamSet = new Set<string>();
    posts.forEach(post => teamSet.add(post.team));
    return Array.from(teamSet).sort();
  }

  getAllMoods(): string[] {
    const posts = this.postsSubject.value;
    const moodSet = new Set<string>();
    posts.forEach(post => moodSet.add(post.mood));
    return Array.from(moodSet).sort();
  }
}
