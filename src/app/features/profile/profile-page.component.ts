import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Post, User } from '../../core/models';
import { PostService } from '../../core/services/post.service';
import { AuthService } from '../../core/services/auth.service';

interface UserStats {
  totalPosts: number;
  totalLikes: number;
  totalBookmarks: number;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css'
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private postService = inject(PostService);
  private authService = inject(AuthService);

  currentUser: User | null = null;
  userPosts: Post[] = [];
  stats: UserStats = {
    totalPosts: 0,
    totalLikes: 0,
    totalBookmarks: 0
  };
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.error = 'User not authenticated';
      this.loading = false;
      return;
    }

    this.postService.posts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadUserData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData(): void {
    if (!this.currentUser) return;

    try {
      const allPosts = this.postService.getPosts();
      this.userPosts = allPosts
        .filter((post: Post) => post.userId === this.currentUser!.id)
        .sort((a: Post, b: Post) => b.createdAt - a.createdAt);

      const allLikes = this.postService.getLikes();
      const allBookmarks = this.postService.getBookmarks();

      this.stats.totalPosts = this.userPosts.length;

      this.stats.totalLikes = this.userPosts.reduce((count, post) => {
        return count + allLikes.filter((like: any) => like.postId === post.id).length;
      }, 0);

      this.stats.totalBookmarks = this.userPosts.reduce((count, post) => {
        return count + allBookmarks.filter((bookmark: any) => bookmark.postId === post.id).length;
      }, 0);

      this.loading = false;
    } catch (err) {
      this.error = 'Error loading profile data';
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
    const maxLength = 100;
    const withoutSpoilers = body.replace(/\|\|.*?\|\|/g, '[spoiler]');
    if (withoutSpoilers.length <= maxLength) return withoutSpoilers;
    return withoutSpoilers.substring(0, maxLength) + '...';
  }

  getLikeCount(postId: number): number {
    return this.postService.getLikesForPost(postId).length;
  }
}
