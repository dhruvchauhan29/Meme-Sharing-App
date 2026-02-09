import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-moderation-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="moderation-container">
      <h1>Moderation Page</h1>
      <p>Moderation page - implementing...</p>
    </div>
  `,
  styles: [`
    .moderation-container {
      padding: 20px;
    }
  `]
})
export class ModerationPageComponent {
}
