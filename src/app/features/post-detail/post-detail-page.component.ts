import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-post-detail-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="post-detail-container">
      <h1>Post Detail Page</h1>
      <p>Post ID: {{ postId }}</p>
      <p>Post detail page - implementing...</p>
    </div>
  `,
  styles: [`
    .post-detail-container {
      padding: 20px;
    }
  `]
})
export class PostDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  postId: string | null = null;

  ngOnInit(): void {
    this.postId = this.route.snapshot.paramMap.get('id');
  }
}
