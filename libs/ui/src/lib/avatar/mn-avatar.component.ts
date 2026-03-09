import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'mn-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'mn-avatar mn-avatar--' + size">
      <img *ngIf="src; else initials" [src]="src" [alt]="alt" class="mn-avatar__img" />
      <ng-template #initials>
        <span class="mn-avatar__initials">{{ getInitials() }}</span>
      </ng-template>
      <span *ngIf="online !== undefined" [class]="'mn-avatar__dot mn-avatar__dot--' + (online ? 'online' : 'offline')"></span>
    </div>
  `,
  styleUrls: ['./mn-avatar.component.scss']
})
export class MnAvatarComponent {
  @Input() src?: string;
  @Input() alt = '';
  @Input() name = '';
  @Input() size: AvatarSize = 'md';
  @Input() online?: boolean;

  getInitials(): string {
    return this.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}