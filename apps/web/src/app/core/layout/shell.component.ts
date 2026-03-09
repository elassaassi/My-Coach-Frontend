import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@momentum/api-client';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="shell">
      <!-- ── Sidebar navigation ────────────────────────────────────────── -->
      <nav class="sidebar">
        <div class="sidebar__brand">
          <span class="sidebar__logo">M</span>
          <span class="sidebar__name">Momentum</span>
        </div>

        <ul class="sidebar__nav">
          <li *ngFor="let item of navItems">
            <a [routerLink]="item.path" routerLinkActive="active" class="sidebar__link">
              <span class="sidebar__icon">{{ item.icon }}</span>
              <span class="sidebar__label">{{ item.label }}</span>
            </a>
          </li>
        </ul>

        <button class="sidebar__logout" (click)="logout()">
          <span>🚪</span> Déconnexion
        </button>
      </nav>

      <!-- ── Main content ──────────────────────────────────────────────── -->
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems = [
    { path: '/dashboard',   icon: '🏠', label: 'Accueil'       },
    { path: '/activities',  icon: '⚽', label: 'Activités'     },
    { path: '/matching',    icon: '🎯', label: 'Matching'      },
    { path: '/highlights',  icon: '🎬', label: 'Highlights'    },
    { path: '/rating',      icon: '⭐', label: 'Classement'    },
    { path: '/coaching',    icon: '🎓', label: 'Coaching'      },
    { path: '/scouting',    icon: '🔭', label: 'Scouting'      },
    { path: '/messages',    icon: '💬', label: 'Messages'      },
    { path: '/profile',     icon: '👤', label: 'Mon profil'    },
  ];

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}