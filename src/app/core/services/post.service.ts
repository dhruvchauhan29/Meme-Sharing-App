import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Post, Like, Bookmark, Flag } from '../models';
import { StorageService } from './storage.service';
import { UserService } from './user.service';

const POSTS_KEY = 'posts';
const LIKES_KEY = 'likes';
const BOOKMARKS_KEY = 'bookmarks';
const FLAGS_KEY = 'flags';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private postsSubject: BehaviorSubject<Post[]>;
  public posts$: Observable<Post[]>;

  private likesSubject: BehaviorSubject<Like[]>;
  public likes$: Observable<Like[]>;

  private bookmarksSubject: BehaviorSubject<Bookmark[]>;
  public bookmarks$: Observable<Bookmark[]>;

  private flagsSubject: BehaviorSubject<Flag[]>;
  public flags$: Observable<Flag[]>;

  constructor(
    private storage: StorageService,
    private userService: UserService
  ) {
    const posts = this.storage.getItem<Post[]>(POSTS_KEY) || [];
    this.postsSubject = new BehaviorSubject<Post[]>(posts);
    this.posts$ = this.postsSubject.asObservable();

    const likes = this.storage.getItem<Like[]>(LIKES_KEY) || [];
    this.likesSubject = new BehaviorSubject<Like[]>(likes);
    this.likes$ = this.likesSubject.asObservable();

    const bookmarks = this.storage.getItem<Bookmark[]>(BOOKMARKS_KEY) || [];
    this.bookmarksSubject = new BehaviorSubject<Bookmark[]>(bookmarks);
    this.bookmarks$ = this.bookmarksSubject.asObservable();

    const flags = this.storage.getItem<Flag[]>(FLAGS_KEY) || [];
    this.flagsSubject = new BehaviorSubject<Flag[]>(flags);
    this.flags$ = this.flagsSubject.asObservable();
  }

  // Posts
  getPosts(): Post[] {
    return this.postsSubject.value;
  }

  getPostById(id: string): Post | undefined {
    return this.postsSubject.value.find(p => p.id === id);
  }

  createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Post {
    const newPost: Post = {
      ...post,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const posts = [...this.postsSubject.value, newPost];
    this.savePosts(posts);
    return newPost;
  }

  updatePost(id: string, updates: Partial<Post>): Post | null {
    const posts = this.postsSubject.value;
    const index = posts.findIndex(p => p.id === id);
    if (index === -1) return null;

    const updatedPost = {
      ...posts[index],
      ...updates,
      id: posts[index].id,
      createdAt: posts[index].createdAt,
      updatedAt: Date.now()
    };
    posts[index] = updatedPost;
    this.savePosts(posts);
    return updatedPost;
  }

  deletePost(id: string): boolean {
    const posts = this.postsSubject.value.filter(p => p.id !== id);
    if (posts.length === this.postsSubject.value.length) return false;
    
    this.savePosts(posts);
    
    // Also remove associated likes, bookmarks, and flags
    this.removeLikesForPost(id);
    this.removeBookmarksForPost(id);
    this.removeFlagsForPost(id);
    
    return true;
  }

  private savePosts(posts: Post[]): void {
    this.storage.setItem(POSTS_KEY, posts);
    this.postsSubject.next(posts);
  }

  // Likes
  getLikes(): Like[] {
    return this.likesSubject.value;
  }

  getLikesForPost(postId: string): Like[] {
    return this.likesSubject.value.filter(l => l.postId === postId);
  }

  isLikedByUser(postId: string, userId: string): boolean {
    return this.likesSubject.value.some(l => l.postId === postId && l.userId === userId);
  }

  toggleLike(postId: string): boolean {
    const user = this.userService.getCurrentUser();
    if (!user) return false;

    const likes = this.likesSubject.value;
    const existingLike = likes.find(l => l.postId === postId && l.userId === user.id);

    if (existingLike) {
      // Remove like
      const newLikes = likes.filter(l => !(l.postId === postId && l.userId === user.id));
      this.saveLikes(newLikes);
      return false;
    } else {
      // Add like
      const newLike: Like = {
        postId,
        userId: user.id,
        createdAt: Date.now()
      };
      const newLikes = [...likes, newLike];
      this.saveLikes(newLikes);
      return true;
    }
  }

  private removeLikesForPost(postId: string): void {
    const likes = this.likesSubject.value.filter(l => l.postId !== postId);
    this.saveLikes(likes);
  }

  private saveLikes(likes: Like[]): void {
    this.storage.setItem(LIKES_KEY, likes);
    this.likesSubject.next(likes);
  }

  // Bookmarks
  getBookmarks(): Bookmark[] {
    return this.bookmarksSubject.value;
  }

  getBookmarksForUser(userId: string): Bookmark[] {
    return this.bookmarksSubject.value.filter(b => b.userId === userId);
  }

  isBookmarkedByUser(postId: string, userId: string): boolean {
    return this.bookmarksSubject.value.some(b => b.postId === postId && b.userId === userId);
  }

  toggleBookmark(postId: string): boolean {
    const user = this.userService.getCurrentUser();
    if (!user) return false;

    const bookmarks = this.bookmarksSubject.value;
    const existingBookmark = bookmarks.find(b => b.postId === postId && b.userId === user.id);

    if (existingBookmark) {
      // Remove bookmark
      const newBookmarks = bookmarks.filter(b => !(b.postId === postId && b.userId === user.id));
      this.saveBookmarks(newBookmarks);
      return false;
    } else {
      // Add bookmark
      const newBookmark: Bookmark = {
        postId,
        userId: user.id,
        createdAt: Date.now()
      };
      const newBookmarks = [...bookmarks, newBookmark];
      this.saveBookmarks(newBookmarks);
      return true;
    }
  }

  private removeBookmarksForPost(postId: string): void {
    const bookmarks = this.bookmarksSubject.value.filter(b => b.postId !== postId);
    this.saveBookmarks(bookmarks);
  }

  private saveBookmarks(bookmarks: Bookmark[]): void {
    this.storage.setItem(BOOKMARKS_KEY, bookmarks);
    this.bookmarksSubject.next(bookmarks);
  }

  // Flags
  getFlags(): Flag[] {
    return this.flagsSubject.value;
  }

  getFlagsForPost(postId: string): Flag[] {
    return this.flagsSubject.value.filter(f => f.postId === postId);
  }

  createFlag(postId: string, reason: string): Flag {
    const user = this.userService.getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const newFlag: Flag = {
      id: this.generateId(),
      postId,
      userId: user.id,
      reason,
      status: 'pending',
      createdAt: Date.now()
    };
    const flags = [...this.flagsSubject.value, newFlag];
    this.saveFlags(flags);
    return newFlag;
  }

  private removeFlagsForPost(postId: string): void {
    const flags = this.flagsSubject.value.filter(f => f.postId !== postId);
    this.saveFlags(flags);
  }

  private saveFlags(flags: Flag[]): void {
    this.storage.setItem(FLAGS_KEY, flags);
    this.flagsSubject.next(flags);
  }

  // Utilities
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

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
