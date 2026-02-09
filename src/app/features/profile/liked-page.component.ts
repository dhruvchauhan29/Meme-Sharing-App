import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-liked-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="liked-container">
      <h1>Liked Posts</h1>
      <p>Liked posts page - implementing...</p>
    </div>
  `,
  styles: [`
    .liked-container {
      padding: 20px;
    }
  `]
})
export class LikedPageComponent {
}
