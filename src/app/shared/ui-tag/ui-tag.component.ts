import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-tag',
  imports: [CommonModule],
  templateUrl: './ui-tag.component.html',
  styleUrl: './ui-tag.component.css'
})
export class UiTagComponent {
  @Input() removable = false;
  @Input() color: 'blue' | 'green' | 'purple' | 'orange' | 'gray' = 'blue';
  @Output() removed = new EventEmitter<void>();

  onRemove(event: Event): void {
    event.stopPropagation();
    this.removed.emit();
  }
}
