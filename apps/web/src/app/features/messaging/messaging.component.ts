import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="page-layout"><h2>💬 Messages</h2><p class="todo">Conversations — à implémenter</p></div>`,
  styles: [`.page-layout{padding:var(--space-8) var(--space-10)} .todo{color:var(--clr-text-muted);margin-top:var(--space-4)}`]
})
export class MessagingComponent {}