import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Post } from '../../../core/models';
import { PostService } from '../../../core/services/post.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './feed-page.component.html',
  styleUrl: './feed-page.component.css'
})
export class FeedPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private postService = inject(PostService);
  private authService = inject(AuthService);

  posts: Post[] = [];
  filteredPosts: Post[] = [];

  // Filter states
  searchQuery = '';
  selectedTeam = '';
  selectedMood = '';
  selectedTags: string[] = [];
  showSavedOnly = false;
  showLikedOnly = false;
  sortOrder: 'newest' | 'oldest' = 'newest';

  // Available filter options
  availableTeams: string[] = [];
  availableMoods: string[] = [];
  availableTags: string[] = [];

  currentUserId: number | null = null;

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.id || null;

    // Load filters from query params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.searchQuery = params['q'] || '';
      this.selectedTeam = params['team'] || '';
      this.selectedMood = params['mood'] || '';
      this.selectedTags = params['tags'] ? params['tags'].split(',') : [];
      this.showSavedOnly = params['saved'] === 'true';
      this.showLikedOnly = params['liked'] === 'true';
      this.sortOrder = (params['sort'] === 'oldest' ? 'oldest' : 'newest');
      
      this.applyFilters();
    });

    // Subscribe to data changes
    combineLatest([
      this.postService.posts$,
      this.postService.bookmarks$,
      this.postService.likes$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.posts = this.postService.getPosts();
        this.updateAvailableFilters();
        this.applyFilters();
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

  applyFilters(): void {
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

    // Liked only filter
    if (this.showLikedOnly && this.currentUserId) {
      const likes = this.postService.getLikes();
      const likedPostIds = new Set(
        likes.filter(l => l.userId === this.currentUserId).map(l => l.postId)
      );
      filtered = filtered.filter(post => likedPostIds.has(post.id));
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
  }

  updateQueryParams(): void {
    const queryParams: Record<string, string> = {};
    
    if (this.searchQuery) queryParams['q'] = this.searchQuery;
    if (this.selectedTeam) queryParams['team'] = this.selectedTeam;
    if (this.selectedMood) queryParams['mood'] = this.selectedMood;
    if (this.selectedTags.length > 0) queryParams['tags'] = this.selectedTags.join(',');
    if (this.showSavedOnly) queryParams['saved'] = 'true';
    if (this.showLikedOnly) queryParams['liked'] = 'true';
    if (this.sortOrder !== 'newest') queryParams['sort'] = this.sortOrder;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  onSearchChange(): void {
    this.applyFilters();
    this.updateQueryParams();
  }

  onTeamChange(): void {
    this.applyFilters();
    this.updateQueryParams();
  }

  onMoodChange(): void {
    this.applyFilters();
    this.updateQueryParams();
  }

  onTagToggle(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
    this.applyFilters();
    this.updateQueryParams();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  onSavedOnlyToggle(): void {
    this.showSavedOnly = !this.showSavedOnly;
    this.applyFilters();
    this.updateQueryParams();
  }

  onLikedOnlyToggle(): void {
    this.showLikedOnly = !this.showLikedOnly;
    this.applyFilters();
    this.updateQueryParams();
  }

  onSortChange(): void {
    this.applyFilters();
    this.updateQueryParams();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedTeam = '';
    this.selectedMood = '';
    this.selectedTags = [];
    this.showSavedOnly = false;
    this.showLikedOnly = false;
    this.sortOrder = 'newest';
    this.applyFilters();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
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
    // Remove spoiler tags for preview
    const withoutSpoilers = body.replace(/\|\|.*?\|\|/g, '[spoiler]');
    if (withoutSpoilers.length <= maxLength) return withoutSpoilers;
    return withoutSpoilers.substring(0, maxLength) + '...';
  }

  getLikeCount(postId: number): number {
    return this.postService.getLikesForPost(postId).length;
  }

  isPostLiked(postId: number): boolean {
    return this.currentUserId
      ? this.postService.isLikedByUser(postId, this.currentUserId)
      : false;
  }

  isPostBookmarked(postId: number): boolean {
    return this.currentUserId
      ? this.postService.isBookmarkedByUser(postId, this.currentUserId)
      : false;
  }

  toggleLike(event: Event, postId: number): void {
    event.stopPropagation();
    if (!this.currentUserId) return;

    this.postService.toggleLike(postId).subscribe({
      error: (error) => console.error('Error toggling like:', error)
    });
  }

  toggleBookmark(event: Event, postId: number): void {
    event.stopPropagation();
    if (!this.currentUserId) return;

    this.postService.toggleBookmark(postId).subscribe({
      error: (error) => console.error('Error toggling bookmark:', error)
    });
  }

  navigateToPost(postId: number): void {
    this.router.navigate(['/post', postId]);
  }
}
