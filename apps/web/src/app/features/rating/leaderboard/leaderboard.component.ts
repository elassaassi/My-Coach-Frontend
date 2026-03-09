import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatingService } from '@momentum/api-client';
import { Leaderboard } from '@momentum/models';
import { MnBadgeComponent, MnCardComponent } from '@momentum/ui';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MnBadgeComponent, MnCardComponent],
  template: `
    <div class="page-layout">
      <div class="page-header">
        <h2>⭐ Classement</h2>
        <select [(ngModel)]="selectedSport" (change)="loadLeaderboard()" class="filter-select">
          <option value="football">Football</option>
          <option value="basketball">Basketball</option>
          <option value="tennis">Tennis</option>
        </select>
      </div>

      <mn-card [elevated]="true" *ngIf="leaderboard">
        <div class="leaderboard">
          <div *ngFor="let entry of leaderboard.entries" class="leaderboard__row"
               [class.leaderboard__row--top3]="entry.rank <= 3">
            <span class="leaderboard__rank">
              {{ entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank }}
            </span>
            <div class="leaderboard__player">
              <span class="leaderboard__name">{{ entry.displayName }}</span>
              <mn-badge [color]="levelColor(entry.level)">{{ entry.level }}</mn-badge>
            </div>
            <span class="leaderboard__score">{{ entry.proScore }}</span>
          </div>
        </div>
      </mn-card>
    </div>
  `,
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {
  private readonly ratingService = inject(RatingService);

  leaderboard: Leaderboard | null = null;
  selectedSport = 'football';

  ngOnInit(): void { this.loadLeaderboard(); }

  loadLeaderboard(): void {
    this.ratingService.getLeaderboard(this.selectedSport).subscribe({
      next: (data) => this.leaderboard = data,
      error: () => {}
    });
  }

  levelColor(level: string): 'primary' | 'accent' | 'success' | 'neutral' {
    return level === 'GOAT' ? 'accent' : level === 'PRO' ? 'primary' : level === 'SEMI_PRO' ? 'success' : 'neutral';
  }
}