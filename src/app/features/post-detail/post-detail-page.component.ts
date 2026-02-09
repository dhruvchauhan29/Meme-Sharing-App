import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Post, User } from '../../core/models';
import { PostService } from '../../core/services/post.service';
import { AuthService } from '../../core/services/auth.service';
import { SpoilerPipe, SpoilerSegment } from '../../shared/pipes/spoiler.pipe';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';
import { UiTagComponent } from '../../shared/ui-tag/ui-tag.component';

@Component({
  selector: 'app-post-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SpoilerPipe, UiButtonComponent, UiCardComponent, UiTagComponent],
  templateUrl: './post-detail-page.component.html',
  styleUrl: './post-detail-page.component.css'
})
export class PostDetailPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postService = inject(PostService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  post: Post | null = null;
  currentUser: User | null = null;
  postId: number | null = null;
  loading = true;
  error: string | null = null;

  likeCount = 0;
  isLiked = false;
  isBookmarked = false;
  isTogglingLike = false;
  isTogglingBookmark = false;
  isDeleting = false;

  showFlagForm = false;
  flagReason = '';
  isFlagging = false;

  bodySegments: SpoilerSegment[] = [];

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.postId = parseInt(id, 10);
      this.loadPost();
    } else {
      this.error = 'Invalid post ID';
      this.loading = false;
    }

    this.postService.likes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateLikeState());

    this.postService.bookmarks$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateBookmarkState());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPost(): void {
    if (!this.postId) return;

    this.loading = true;
    this.error = null;

    this.postService.getPostById(this.postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (post) => {
          this.post = post;
          this.processSpoilers();
          this.updateLikeState();
          this.updateBookmarkState();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load post';
          this.loading = false;
          console.error('Error loading post:', err);
        }
      });
  }

  processSpoilers(): void {
    if (!this.post) return;
    const pipe = new SpoilerPipe();
    this.bodySegments = pipe.transform(this.post.body);
  }

  updateLikeState(): void {
    if (!this.postId || !this.currentUser) return;
    this.likeCount = this.postService.getLikesForPost(this.postId).length;
    this.isLiked = this.postService.isLikedByUser(this.postId, this.currentUser.id);
  }

  updateBookmarkState(): void {
    if (!this.postId || !this.currentUser) return;
    this.isBookmarked = this.postService.isBookmarkedByUser(this.postId, this.currentUser.id);
  }

  toggleLike(): void {
    if (!this.postId || this.isTogglingLike) return;
    
    this.isTogglingLike = true;
    this.postService.toggleLike(this.postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isTogglingLike = false;
        },
        error: (err) => {
          console.error('Error toggling like:', err);
          this.isTogglingLike = false;
        }
      });
  }

  toggleBookmark(): void {
    if (!this.postId || this.isTogglingBookmark) return;
    
    this.isTogglingBookmark = true;
    this.postService.toggleBookmark(this.postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isTogglingBookmark = false;
        },
        error: (err) => {
          console.error('Error toggling bookmark:', err);
          this.isTogglingBookmark = false;
        }
      });
  }

  revealSpoiler(segment: SpoilerSegment): void {
    segment.revealed = true;
  }

  hideSpoiler(segment: SpoilerSegment): void {
    segment.revealed = false;
  }

  canEdit(): boolean {
    if (!this.post || !this.currentUser) return false;
    return this.post.userId === this.currentUser.id || this.currentUser.role === 'admin';
  }

  canDelete(): boolean {
    if (!this.post || !this.currentUser) return false;
    return this.post.userId === this.currentUser.id || this.currentUser.role === 'admin';
  }

  canFlag(): boolean {
    if (!this.post || !this.currentUser) return false;
    return this.post.userId !== this.currentUser.id;
  }

  editPost(): void {
    if (this.postId) {
      this.router.navigate(['/edit', this.postId]);
    }
  }

  deletePost(): void {
    if (!this.postId || this.isDeleting) return;
    
    if (!confirm('Are you sure you want to delete this post?')) return;

    this.isDeleting = true;
    this.postService.deletePost(this.postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.router.navigate(['/feed']);
        },
        error: (err) => {
          console.error('Error deleting post:', err);
          alert('Failed to delete post');
          this.isDeleting = false;
        }
      });
  }

  openFlagForm(): void {
    this.showFlagForm = true;
    this.flagReason = '';
  }

  cancelFlag(): void {
    this.showFlagForm = false;
    this.flagReason = '';
  }

  submitFlag(): void {
    if (!this.postId || !this.flagReason.trim() || this.isFlagging) return;

    this.isFlagging = true;
    this.postService.createFlag(this.postId, this.flagReason.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert('Post reported successfully');
          this.showFlagForm = false;
          this.flagReason = '';
          this.isFlagging = false;
        },
        error: (err) => {
          console.error('Error flagging post:', err);
          alert('Failed to report post');
          this.isFlagging = false;
        }
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

  goBack(): void {
    this.router.navigate(['/feed']);
  }
}
