import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-activity-create',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="page-layout"><h2>Créer une activité</h2><p class="todo">Formulaire de création — à implémenter</p></div>`,
  styles: [`.page-layout{padding:var(--space-8) var(--space-10)} .todo{color:var(--clr-text-muted);margin-top:var(--space-4)}`]
})
export class ActivityCreateComponent {}