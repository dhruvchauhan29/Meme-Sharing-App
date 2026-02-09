import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feed-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="feed-container">
      <h1>Feed Page</h1>
      <p>Feed page - implementing...</p>
    </div>
  `,
  styles: [`
    .feed-container {
      padding: 20px;
    }
  `]
})
export class FeedPageComponent {
}
