import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-saved-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="saved-container">
      <h1>Saved Posts</h1>
      <p>Saved posts page - implementing...</p>
    </div>
  `,
  styles: [`
    .saved-container {
      padding: 20px;
    }
  `]
})
export class SavedPageComponent {
}
