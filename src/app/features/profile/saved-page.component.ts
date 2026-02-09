import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Post, Bookmark } from '../../core/models';
import { PostService } from '../../core/services/post.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-saved-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './saved-page.component.html',
  styleUrl: './saved-page.component.css'
})
export class SavedPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private postService = inject(PostService);
  private authService = inject(AuthService);

  savedPosts: Post[] = [];
  currentUserId: number | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?.id || null;

    if (!this.currentUserId) {
      this.error = 'User not authenticated';
      this.loading = false;
      return;
    }

    this.postService.posts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadSavedPosts();
      });

    this.postService.bookmarks$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadSavedPosts();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSavedPosts(): void {
    if (!this.currentUserId) return;

    try {
      const allBookmarks = this.postService.getBookmarks();
      const userBookmarks = allBookmarks.filter((bookmark: Bookmark) => bookmark.userId === this.currentUserId);
      const savedPostIds = new Set(userBookmarks.map((bookmark: Bookmark) => bookmark.postId));
      
      const allPosts = this.postService.getPosts();
      this.savedPosts = allPosts
        .filter((post: Post) => savedPostIds.has(post.id))
        .sort((a: Post, b: Post) => {
          const bookmarkA = userBookmarks.find((bm: Bookmark) => bm.postId === a.id);
          const bookmarkB = userBookmarks.find((bm: Bookmark) => bm.postId === b.id);
          return (bookmarkB?.createdAt || 0) - (bookmarkA?.createdAt || 0);
        });

      this.loading = false;
    } catch (err) {
      this.error = 'Error loading saved posts';
      this.loading = false;
    }
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
    event.preventDefault();
    if (!this.currentUserId) return;

    this.postService.toggleLike(postId).subscribe({
      error: (error: unknown) => console.error('Error toggling like:', error)
    });
  }

  toggleBookmark(event: Event, postId: number): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.currentUserId) return;

    this.postService.toggleBookmark(postId).subscribe({
      error: (error: unknown) => console.error('Error toggling bookmark:', error)
    });
  }
}
