import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { CanComponentDeactivate } from '../../core/guards/can-deactivate.guard';
import { PostService } from '../../core/services/post.service';
import { DraftService } from '../../core/services/draft.service';
import { AuthService } from '../../core/services/auth.service';
import { Post, Draft, User } from '../../core/models';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';

@Component({
  selector: 'app-edit-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiButtonComponent, UiCardComponent],
  templateUrl: './edit-page.component.html',
  styleUrl: './edit-page.component.css'
})
export class EditPageComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private postService = inject(PostService);
  private draftService = inject(DraftService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  postId: number | null = null;
  post: Post | null = null;
  currentUser: User | null = null;
  editForm!: FormGroup;
  isSubmitting = false;
  isLoading = true;
  hasUnsavedChanges = false;

  teams = ['Engineering', 'Design', 'Product', 'Marketing', 'Sales'];
  moods = [
    { label: '😊 Happy', value: '😊 Happy' },
    { label: '😅 Amused', value: '😅 Amused' },
    { label: '🙄 Annoyed', value: '🙄 Annoyed' },
    { label: '😴 Tired', value: '😴 Tired' },
    { label: '🎉 Excited', value: '🎉 Excited' },
    { label: '😱 Shocked', value: '😱 Shocked' },
    { label: '😎 Cool', value: '😎 Cool' },
    { label: '😤 Frustrated', value: '😤 Frustrated' },
    { label: '😰 Nervous', value: '😰 Nervous' }
  ];

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.postId = parseInt(id, 10);
      this.initForm();
      this.loadPost();
    } else {
      alert('Invalid post ID');
      this.router.navigate(['/feed']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.editForm = this.fb.group({
      title: ['', [Validators.maxLength(100)]],
      body: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      team: ['', [Validators.required]],
      mood: ['', [Validators.required]],
      tags: ['', [Validators.required]]
    });
  }

  loadPost(): void {
    if (!this.postId) return;

    this.postService.getPostById(this.postId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (post) => {
          this.post = post;
          
          if (!this.canEdit()) {
            alert('You do not have permission to edit this post');
            this.router.navigate(['/feed']);
            return;
          }

          this.loadDraftOrPost();
          this.setupAutoSave();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading post:', err);
          alert('Failed to load post');
          this.router.navigate(['/feed']);
        }
      });
  }

  canEdit(): boolean {
    if (!this.post || !this.currentUser) return false;
    return this.post.userId === this.currentUser.id || this.currentUser.role === 'admin';
  }

  loadDraftOrPost(): void {
    if (!this.post || !this.postId) return;

    const draft = this.draftService.getDraft(this.postId.toString());
    
    if (draft) {
      this.editForm.patchValue({
        title: draft.title || '',
        body: draft.body,
        mood: draft.mood,
        tags: draft.tags.join(', ')
      });
    } else {
      this.editForm.patchValue({
        title: this.post.title || '',
        body: this.post.body,
        team: this.post.team,
        mood: this.post.mood,
        tags: this.post.tags.join(', ')
      });
    }
  }

  setupAutoSave(): void {
    this.editForm.valueChanges
      .pipe(
        debounceTime(1000),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        this.hasUnsavedChanges = true;
        this.saveDraft();
      });
  }

  saveDraft(): void {
    if (!this.postId) return;

    const formValue = this.editForm.value;
    const tags = formValue.tags
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);

    const draft: Draft = {
      title: formValue.title,
      body: formValue.body,
      tags,
      mood: formValue.mood,
      savedAt: Date.now()
    };

    this.draftService.saveDraft(draft, this.postId.toString());
  }

  onSubmit(): void {
    if (this.editForm.invalid || this.isSubmitting || !this.postId) return;

    this.isSubmitting = true;
    const formValue = this.editForm.value;

    const tags = formValue.tags
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);

    if (tags.length === 0) {
      alert('Please provide at least one tag');
      this.isSubmitting = false;
      return;
    }

    const updates = {
      title: formValue.title || undefined,
      body: formValue.body,
      team: formValue.team,
      mood: formValue.mood,
      tags
    };

    this.postService.updatePost(this.postId, updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.hasUnsavedChanges = false;
          this.draftService.clearDraft(this.postId!.toString());
          this.router.navigate(['/post', this.postId]);
        },
        error: (err) => {
          console.error('Error updating post:', err);
          alert('Failed to update post. Please try again.');
          this.isSubmitting = false;
        }
      });
  }

  cancel(): void {
    if (this.hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.router.navigate(['/post', this.postId]);
      }
    } else {
      this.router.navigate(['/post', this.postId]);
    }
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (this.hasUnsavedChanges && !this.isSubmitting) {
      return confirm('You have unsaved changes. Are you sure you want to leave?');
    }
    return true;
  }

  get titleControl() {
    return this.editForm.get('title');
  }

  get bodyControl() {
    return this.editForm.get('body');
  }

  get teamControl() {
    return this.editForm.get('team');
  }

  get moodControl() {
    return this.editForm.get('mood');
  }

  get tagsControl() {
    return this.editForm.get('tags');
  }
}
