import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { CanComponentDeactivate } from '../../core/guards/can-deactivate.guard';
import { PostService } from '../../core/services/post.service';
import { DraftService } from '../../core/services/draft.service';
import { AuthService } from '../../core/services/auth.service';
import { Draft, Post } from '../../core/models';
import { UiButtonComponent } from '../../shared/ui-button/ui-button.component';
import { UiCardComponent } from '../../shared/ui-card/ui-card.component';

@Component({
  selector: 'app-compose-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiButtonComponent, UiCardComponent],
  templateUrl: './compose-page.component.html',
  styleUrl: './compose-page.component.css'
})
export class ComposePageComponent implements OnInit, OnDestroy, CanComponentDeactivate {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private postService = inject(PostService);
  private draftService = inject(DraftService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  composeForm!: FormGroup;
  isSubmitting = false;
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
    this.initForm();
    this.loadDraft();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.composeForm = this.fb.group({
      title: ['', [Validators.maxLength(100)]],
      body: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      team: ['', [Validators.required]],
      mood: ['', [Validators.required]],
      tags: ['', [Validators.required]]
    });
  }

  loadDraft(): void {
    const draft = this.draftService.getDraft();
    if (draft) {
      this.composeForm.patchValue({
        title: draft.title || '',
        body: draft.body,
        mood: draft.mood,
        tags: draft.tags.join(', ')
      });
    }
  }

  setupAutoSave(): void {
    this.composeForm.valueChanges
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
    const formValue = this.composeForm.value;
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

    this.draftService.saveDraft(draft);
  }

  onSubmit(): void {
    if (this.composeForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    const formValue = this.composeForm.value;

    const tags = formValue.tags
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);

    if (tags.length === 0) {
      alert('Please provide at least one tag');
      this.isSubmitting = false;
      return;
    }

    const postData = {
      title: formValue.title || undefined,
      body: formValue.body,
      team: formValue.team,
      mood: formValue.mood,
      tags
    } as Omit<Post, 'id' | 'createdAt' | 'updatedAt'>;

    this.postService.createPost(postData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.hasUnsavedChanges = false;
          this.draftService.clearDraft();
          this.router.navigate(['/feed']);
        },
        error: (err) => {
          console.error('Error creating post:', err);
          alert('Failed to create post. Please try again.');
          this.isSubmitting = false;
        }
      });
  }

  cancel(): void {
    if (this.hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.router.navigate(['/feed']);
      }
    } else {
      this.router.navigate(['/feed']);
    }
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (this.hasUnsavedChanges && !this.isSubmitting) {
      return confirm('You have unsaved changes. Are you sure you want to leave?');
    }
    return true;
  }

  get titleControl() {
    return this.composeForm.get('title');
  }

  get bodyControl() {
    return this.composeForm.get('body');
  }

  get teamControl() {
    return this.composeForm.get('team');
  }

  get moodControl() {
    return this.composeForm.get('mood');
  }

  get tagsControl() {
    return this.composeForm.get('tags');
  }
}
