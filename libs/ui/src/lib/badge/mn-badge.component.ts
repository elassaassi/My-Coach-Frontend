import { Component, Input } from '@angular/core';

export type BadgeColor = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

@Component({
  selector: 'mn-badge',
  standalone: true,
  template: `<span [class]="'mn-badge mn-badge--' + color"><ng-content></ng-content></span>`,
  styleUrls: ['./mn-badge.component.scss']
})
export class MnBadgeComponent {
  @Input() color: BadgeColor = 'primary';
}