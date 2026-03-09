import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'mn-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="'mn-btn mn-btn--' + variant + ' mn-btn--' + size"
      [disabled]="disabled || loading"
      [type]="type"
    >
      <span *ngIf="loading" class="mn-btn__spinner"></span>
      <span [class.mn-btn__label--hidden]="loading">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styleUrls: ['./mn-button.component.scss']
})
export class MnButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
}