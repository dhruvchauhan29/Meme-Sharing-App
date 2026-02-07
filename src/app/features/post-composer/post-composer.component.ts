import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, interval, takeUntil } from 'rxjs';

import { Post, Draft } from '../../core/models';
import { PostService, UserService, DraftService } from '../../core/services';
import { UiModalComponent } from '../../shared/ui-modal/ui-modal.component';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { UiTagComponent } from '../../shared/ui-tag/ui-tag.component';

@Component({
  selector: 'app-post-composer',
  imports: [
    CommonModule,
    FormsModule,
    UiModalComponent,
    UiButtonComponent,
    UiTagComponent
  ],
  templateUrl: './post-composer.component.html',
  styleUrl: './post-composer.component.css'
})
export class PostComposerComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() editingPost?: Post;
  @Output() closed = new EventEmitter<void>();
  @Output() postCreated = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private autosaveInterval$ = interval(5000); // Auto-save every 5 seconds

  title = '';
  body = '';
  tags: string[] = [];
  mood = '';
  newTag = '';

  availableMoods = [
    '😊 Happy',
    '😂 Laughing',
    '😅 Amused',
    '🙄 Annoyed',
    '😤 Frustrated',
    '😱 Shocked',
    '😴 Tired',
    '😎 Cool',
    '🤔 Thinking',
    '🎉 Excited',
    '😢 Sad',
    '😠 Angry'
  ];

  constructor(
    private postService: PostService,
    private userService: UserService,
    private draftService: DraftService
  ) {}

  ngOnInit(): void {
    if (this.editingPost) {
      // Load post data for editing
      this.title = this.editingPost.title || '';
      this.body = this.editingPost.body;
      this.tags = [...this.editingPost.tags];
      this.mood = this.editingPost.mood;
    } else {
      // Load draft if available
      this.loadDraft();
    }

    // Set up auto-save
    this.autosaveInterval$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isOpen && this.body.trim()) {
          this.saveDraft();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDraft(): void {
    const draft = this.draftService.getDraft(this.editingPost?.id);
    if (draft) {
      this.title = draft.title || '';
      this.body = draft.body;
      this.tags = [...draft.tags];
      this.mood = draft.mood;
    }
  }

  saveDraft(): void {
    if (!this.body.trim()) return;

    const draft: Draft = {
      title: this.title,
      body: this.body,
      tags: [...this.tags],
      mood: this.mood,
      savedAt: Date.now()
    };

    this.draftService.saveDraft(draft, this.editingPost?.id);
  }

  clearDraft(): void {
    this.draftService.clearDraft(this.editingPost?.id);
  }

  addTag(): void {
    const tag = this.newTag.trim().toLowerCase();
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
      this.newTag = '';
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  canSubmit(): boolean {
    return this.body.trim().length > 0;
  }

  submit(): void {
    if (!this.canSubmit()) return;

    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) {
      alert('You must be logged in to post.');
      return;
    }

    const trimmedBody = this.body.trim();

    if (this.editingPost) {
      // Update existing post
      this.postService.updatePost(this.editingPost.id, {
        title: this.title.trim() || undefined,
        body: trimmedBody,
        tags: [...this.tags],
        mood: this.mood || '😊 Happy'
      });
    } else {
      // Create new post
      this.postService.createPost({
        authorId: currentUser.id,
        authorName: currentUser.name,
        team: currentUser.team,
        title: this.title.trim() || undefined,
        body: trimmedBody,
        tags: [...this.tags],
        mood: this.mood || '😊 Happy'
      });
    }

    this.clearDraft();
    this.resetForm();
    this.postCreated.emit();
  }

  resetForm(): void {
    this.title = '';
    this.body = '';
    this.tags = [];
    this.mood = '';
    this.newTag = '';
  }

  close(): void {
    if (this.body.trim()) {
      this.saveDraft();
    }
    this.closed.emit();
  }

  getModalTitle(): string {
    return this.editingPost ? 'Edit Post' : 'New Post';
  }
}
