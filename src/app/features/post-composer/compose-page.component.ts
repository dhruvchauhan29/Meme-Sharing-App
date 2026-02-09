import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanComponentDeactivate } from '../../core/guards/can-deactivate.guard';

@Component({
  selector: 'app-compose-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="compose-container">
      <h1>Compose Page</h1>
      <p>Compose page - implementing...</p>
    </div>
  `,
  styles: [`
    .compose-container {
      padding: 20px;
    }
  `]
})
export class ComposePageComponent implements CanComponentDeactivate {
  canDeactivate(): boolean {
    return true;
  }
}
