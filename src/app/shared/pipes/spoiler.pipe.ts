import { Pipe, PipeTransform } from '@angular/core';

export interface SpoilerSegment {
  type: 'text' | 'spoiler';
  content: string;
  revealed: boolean;
}

@Pipe({
  name: 'spoiler',
  standalone: true
})
export class SpoilerPipe implements PipeTransform {
  transform(text: string): SpoilerSegment[] {
    if (!text) return [];
    
    const segments: SpoilerSegment[] = [];
    const regex = /\|\|(.*?)\|\|/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // Add text before spoiler
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
          revealed: false
        });
      }

      // Add spoiler
      segments.push({
        type: 'spoiler',
        content: match[1],
        revealed: false
      });

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex),
        revealed: false
      });
    }

    return segments;
  }
}
