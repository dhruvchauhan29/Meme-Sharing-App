import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CanComponentDeactivate } from '../../core/guards/can-deactivate.guard';

@Component({
  selector: 'app-edit-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="edit-container">
      <h1>Edit Page</h1>
      <p>Post ID: {{ postId }}</p>
      <p>Edit page - implementing...</p>
    </div>
  `,
  styles: [`
    .edit-container {
      padding: 20px;
    }
  `]
})
export class EditPageComponent implements OnInit, CanComponentDeactivate {
  private route = inject(ActivatedRoute);
  postId: string | null = null;

  ngOnInit(): void {
    this.postId = this.route.snapshot.paramMap.get('id');
  }

  canDeactivate(): boolean {
    return true;
  }
}
