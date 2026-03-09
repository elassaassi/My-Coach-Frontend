import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mn-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'mn-card' + (elevated ? ' mn-card--elevated' : '') + (clickable ? ' mn-card--clickable' : '')">
      <div *ngIf="header" class="mn-card__header">{{ header }}</div>
      <div class="mn-card__body">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrls: ['./mn-card.component.scss']
})
export class MnCardComponent {
  @Input() header?: string;
  @Input() elevated = false;
  @Input() clickable = false;
}