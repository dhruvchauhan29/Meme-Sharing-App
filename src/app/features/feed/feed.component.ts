import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest, takeUntil } from 'rxjs';

import { Post, Preference } from '../../core/models';
import { PostService, PreferenceService, UserService } from '../../core/services';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { UiInputComponent } from '../../shared/ui-input/ui-input.component';
import { UiTagComponent } from '../../shared/ui-tag/ui-tag.component';
import { PostDetailComponent } from '../post-detail/post-detail.component';
import { PostComposerComponent } from '../post-composer/post-composer.component';

@Component({
  selector: 'app-feed',
  imports: [
    CommonModule,
    FormsModule,
    UiButtonComponent,
    UiCardComponent,
    UiInputComponent,
    UiTagComponent,
    PostDetailComponent,
    PostComposerComponent
  ],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css'
})
export class FeedComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  posts: Post[] = [];
  filteredPosts: Post[] = [];
  
  searchQuery = '';
  selectedTeam = '';
  selectedMood = '';
  selectedTags: string[] = [];
  showSavedOnly = false;
  sortOrder: 'newest' | 'oldest' = 'newest';

  availableTeams: string[] = [];
  availableMoods: string[] = [];
  availableTags: string[] = [];

  selectedPost: Post | null = null;
  isPostDetailOpen = false;
  isComposerOpen = false;

  currentUserId: string | null = null;

  constructor(
    private postService: PostService,
    private preferenceService: PreferenceService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const currentUser = this.userService.getCurrentUser();
    this.currentUserId = currentUser?.id || null;

    // Load preferences
    const prefs = this.preferenceService.getPreferences();
    this.searchQuery = prefs.searchQuery;
    this.selectedTeam = prefs.filterTeam || '';
    this.selectedMood = prefs.filterMood || '';
    this.selectedTags = [...prefs.filterTags];
    this.showSavedOnly = prefs.showSavedOnly;
    this.sortOrder = prefs.sortOrder;

    // Subscribe to posts and bookmarks (but not preferences to avoid circular updates)
    combineLatest([
      this.postService.posts$,
      this.postService.bookmarks$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([posts, bookmarks]) => {
        this.posts = posts;
        this.updateAvailableFilters();
        this.applyFilters(false); // Don't save preferences during subscription updates
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateAvailableFilters(): void {
    this.availableTeams = this.postService.getAllTeams();
    this.availableMoods = this.postService.getAllMoods();
    this.availableTags = this.postService.getAllTags();
  }

  applyFilters(savePrefs: boolean = true): void {
    let filtered = [...this.posts];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        (post.title?.toLowerCase().includes(query) || false) ||
        post.body.toLowerCase().includes(query)
      );
    }

    // Team filter
    if (this.selectedTeam) {
      filtered = filtered.filter(post => post.team === this.selectedTeam);
    }

    // Mood filter
    if (this.selectedMood) {
      filtered = filtered.filter(post => post.mood === this.selectedMood);
    }

    // Tags filter
    if (this.selectedTags.length > 0) {
      filtered = filtered.filter(post =>
        this.selectedTags.some(tag => post.tags.includes(tag))
      );
    }

    // Saved only filter
    if (this.showSavedOnly && this.currentUserId) {
      const bookmarks = this.postService.getBookmarksForUser(this.currentUserId);
      const savedPostIds = new Set(bookmarks.map(b => b.postId));
      filtered = filtered.filter(post => savedPostIds.has(post.id));
    }

    // Sort
    filtered.sort((a, b) => {
      if (this.sortOrder === 'newest') {
        return b.createdAt - a.createdAt;
      } else {
        return a.createdAt - b.createdAt;
      }
    });

    this.filteredPosts = filtered;
    
    if (savePrefs) {
      this.savePreferences();
    }
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onTeamChange(): void {
    this.applyFilters();
  }

  onMoodChange(): void {
    this.applyFilters();
  }

  onTagToggle(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
    this.applyFilters();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  onSavedOnlyToggle(): void {
    this.showSavedOnly = !this.showSavedOnly;
    this.applyFilters();
  }

  onSortChange(order: 'newest' | 'oldest'): void {
    this.sortOrder = order;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedTeam = '';
    this.selectedMood = '';
    this.selectedTags = [];
    this.showSavedOnly = false;
    this.applyFilters();
  }

  savePreferences(): void {
    this.preferenceService.updatePreferences({
      searchQuery: this.searchQuery,
      filterTeam: this.selectedTeam || undefined,
      filterMood: this.selectedMood || undefined,
      filterTags: this.selectedTags,
      showSavedOnly: this.showSavedOnly,
      sortOrder: this.sortOrder
    });
  }

  openPost(post: Post): void {
    this.selectedPost = post;
    this.isPostDetailOpen = true;
  }

  closePostDetail(): void {
    this.isPostDetailOpen = false;
    this.selectedPost = null;
  }

  openComposer(): void {
    this.isComposerOpen = true;
  }

  closeComposer(): void {
    this.isComposerOpen = false;
  }

  onPostCreated(): void {
    this.closeComposer();
  }

  onPostUpdated(): void {
    // Refresh the selected post if it's still open
    if (this.selectedPost) {
      const updatedPost = this.postService.getPostById(this.selectedPost.id);
      if (updatedPost) {
        this.selectedPost = updatedPost;
      }
    }
  }

  onPostDeleted(): void {
    this.closePostDetail();
  }

  getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  getPostPreview(body: string): string {
    const maxLength = 150;
    if (body.length <= maxLength) return body;
    return body.substring(0, maxLength) + '...';
  }

  getLikeCount(postId: string): number {
    return this.postService.getLikesForPost(postId).length;
  }

  isPostLiked(postId: string): boolean {
    return this.currentUserId 
      ? this.postService.isLikedByUser(postId, this.currentUserId)
      : false;
  }

  isPostBookmarked(postId: string): boolean {
    return this.currentUserId
      ? this.postService.isBookmarkedByUser(postId, this.currentUserId)
      : false;
  }
}
