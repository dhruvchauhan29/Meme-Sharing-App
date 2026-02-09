import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Flag, Post } from '../../core/models';
import { PostService } from '../../core/services/post.service';
import { AuthService } from '../../core/services/auth.service';

interface FlagWithPost {
  id?: number;
  userId: number;
  postId: number;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt?: number;
  post?: Post;
}

@Component({
  selector: 'app-moderation-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './moderation-page.component.html',
  styleUrl: './moderation-page.component.css'
})
export class ModerationPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private postService = inject(PostService);
  private authService = inject(AuthService);

  flags: FlagWithPost[] = [];
  filteredFlags: FlagWithPost[] = [];
  selectedStatus: 'all' | 'pending' | 'reviewed' | 'dismissed' = 'all';
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'admin') {
      this.error = 'Access denied. Admin privileges required.';
      this.loading = false;
      return;
    }

    this.postService.flags$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadFlags();
      });

    this.postService.posts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadFlags();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFlags(): void {
    try {
      const allFlags = this.postService.getFlags();
      const allPosts = this.postService.getPosts();

      this.flags = allFlags
        .map((flag: Flag) => {
          const post = allPosts.find((p: Post) => p.id === flag.postId);
          return { ...flag, post };
        })
        .sort((a: FlagWithPost, b: FlagWithPost) => (b.createdAt || 0) - (a.createdAt || 0));

      this.applyFilter();
      this.loading = false;
    } catch (err) {
      this.error = 'Error loading flags';
      this.loading = false;
    }
  }

  applyFilter(): void {
    if (this.selectedStatus === 'all') {
      this.filteredFlags = this.flags;
    } else {
      this.filteredFlags = this.flags.filter((flag: FlagWithPost) => flag.status === this.selectedStatus);
    }
  }

  onStatusFilterChange(status: 'all' | 'pending' | 'reviewed' | 'dismissed'): void {
    this.selectedStatus = status;
    this.applyFilter();
  }

  updateFlagStatus(flag: FlagWithPost, status: 'reviewed' | 'dismissed'): void {
    if (!flag.id) return;

    this.postService.updateFlagStatus(flag.id, status).subscribe({
      next: () => {
        console.log(`Flag ${flag.id} marked as ${status}`);
      },
      error: (error: unknown) => console.error('Error updating flag status:', error)
    });
  }

  getRelativeTime(timestamp: number | undefined): string {
    if (!timestamp) return 'unknown';

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

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge-pending';
      case 'reviewed':
        return 'badge-reviewed';
      case 'dismissed':
        return 'badge-dismissed';
      default:
        return '';
    }
  }

  getPostPreview(body: string): string {
    const maxLength = 80;
    const withoutSpoilers = body.replace(/\|\|.*?\|\|/g, '[spoiler]');
    if (withoutSpoilers.length <= maxLength) return withoutSpoilers;
    return withoutSpoilers.substring(0, maxLength) + '...';
  }

  countByStatus(status: 'pending' | 'reviewed' | 'dismissed'): number {
    return this.flags.filter((flag: FlagWithPost) => flag.status === status).length;
  }
}
