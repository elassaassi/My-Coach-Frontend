import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-highlights',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="page-layout"><h2>🎬 Highlights</h2><p class="todo">Feed photos/vidéos — à implémenter</p></div>`,
  styles: [`.page-layout{padding:var(--space-8) var(--space-10)} .todo{color:var(--clr-text-muted);margin-top:var(--space-4)}`]
})
export class HighlightsComponent {}