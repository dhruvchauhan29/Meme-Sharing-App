import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-card',
  imports: [CommonModule],
  templateUrl: './ui-card.component.html',
  styleUrl: './ui-card.component.css'
})
export class UiCardComponent {
  @Input() padding: 'small' | 'medium' | 'large' = 'medium';
  @Input() hoverable = false;
}
