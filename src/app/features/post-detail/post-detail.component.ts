import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Post } from '../../core/models';
import { PostService, UserService } from '../../core/services';
import { UiModalComponent } from '../../shared/ui-modal/ui-modal.component';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { UiTagComponent } from '../../shared/ui-tag/ui-tag.component';
import { PostComposerComponent } from '../post-composer/post-composer.component';

interface SpoilerSegment {
  text: string;
  isSpoiler: boolean;
  isRevealed: boolean;
}

@Component({
  selector: 'app-post-detail',
  imports: [
    CommonModule,
    FormsModule,
    UiModalComponent,
    UiButtonComponent,
    UiTagComponent,
    PostComposerComponent
  ],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.css'
})
export class PostDetailComponent implements OnChanges {
  @Input() post!: Post;
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() postUpdated = new EventEmitter<void>();
  @Output() postDeleted = new EventEmitter<void>();

  bodySegments: SpoilerSegment[] = [];
  likeCount = 0;
  isLiked = false;
  isBookmarked = false;
  currentUserId: string | null = null;
  isEditing = false;
  showDeleteConfirm = false;
  showFlagDialog = false;
  flagReason = '';

  constructor(
    private postService: PostService,
    private userService: UserService
  ) {
    const currentUser = this.userService.getCurrentUser();
    this.currentUserId = currentUser?.id || null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['post'] && this.post) {
      this.parseSpoilers();
      this.updateStats();
    }
  }

  parseSpoilers(): void {
    const text = this.post.body;
    const spoilerRegex = /\|\|(.+?)\|\|/g;
    const segments: SpoilerSegment[] = [];
    let lastIndex = 0;
    let match;

    while ((match = spoilerRegex.exec(text)) !== null) {
      // Add text before spoiler
      if (match.index > lastIndex) {
        segments.push({
          text: text.substring(lastIndex, match.index),
          isSpoiler: false,
          isRevealed: false
        });
      }

      // Add spoiler
      segments.push({
        text: match[1],
        isSpoiler: true,
        isRevealed: false
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        text: text.substring(lastIndex),
        isSpoiler: false,
        isRevealed: false
      });
    }

    this.bodySegments = segments;
  }

  updateStats(): void {
    this.likeCount = this.postService.getLikesForPost(this.post.id).length;
    this.isLiked = this.currentUserId 
      ? this.postService.isLikedByUser(this.post.id, this.currentUserId)
      : false;
    this.isBookmarked = this.currentUserId
      ? this.postService.isBookmarkedByUser(this.post.id, this.currentUserId)
      : false;
  }

  toggleSpoiler(segment: SpoilerSegment): void {
    segment.isRevealed = !segment.isRevealed;
  }

  expandAllSpoilers(): void {
    this.bodySegments.forEach(seg => {
      if (seg.isSpoiler) {
        seg.isRevealed = true;
      }
    });
  }

  collapseAllSpoilers(): void {
    this.bodySegments.forEach(seg => {
      if (seg.isSpoiler) {
        seg.isRevealed = false;
      }
    });
  }

  toggleLike(): void {
    this.postService.toggleLike(this.post.id);
    this.updateStats();
  }

  toggleBookmark(): void {
    this.postService.toggleBookmark(this.post.id);
    this.updateStats();
  }

  openEditDialog(): void {
    this.isEditing = true;
  }

  closeEditDialog(): void {
    this.isEditing = false;
  }

  onPostEdited(): void {
    this.closeEditDialog();
    this.postUpdated.emit();
    // Refresh the post data
    const updatedPost = this.postService.getPostById(this.post.id);
    if (updatedPost) {
      this.post = updatedPost;
      this.parseSpoilers();
    }
  }

  openDeleteConfirm(): void {
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
  }

  confirmDelete(): void {
    this.postService.deletePost(this.post.id);
    this.closeDeleteConfirm();
    this.postDeleted.emit();
    this.close();
  }

  openFlagDialog(): void {
    this.showFlagDialog = true;
    this.flagReason = '';
  }

  closeFlagDialog(): void {
    this.showFlagDialog = false;
    this.flagReason = '';
  }

  submitFlag(): void {
    if (this.flagReason.trim()) {
      this.postService.createFlag(this.post.id, this.flagReason.trim());
      this.closeFlagDialog();
      alert('Post has been flagged for review.');
    }
  }

  copyLink(): void {
    const postToken = `post://${this.post.id}`;
    navigator.clipboard.writeText(postToken).then(() => {
      alert('Link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
  }

  close(): void {
    this.closed.emit();
  }

  canEdit(): boolean {
    return this.currentUserId === this.post.authorId;
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

  hasSpoilers(): boolean {
    return this.bodySegments.some(seg => seg.isSpoiler);
  }
}
