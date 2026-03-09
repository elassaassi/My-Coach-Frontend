import { Component } from '@angular/core';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, homeSharp,
  footballOutline, footballSharp,
  addCircleOutline, addCircleSharp,
  chatbubbleOutline, chatbubbleSharp,
  personOutline, personSharp
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Accueil</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="activities" href="/tabs/activities">
          <ion-icon name="football-outline"></ion-icon>
          <ion-label>Activités</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="create" href="/tabs/create" class="tab-create">
          <ion-icon name="add-circle-outline"></ion-icon>
          <ion-label>Créer</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="chat" href="/tabs/chat">
          <ion-icon name="chatbubble-outline"></ion-icon>
          <ion-label>Chat</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon name="person-outline"></ion-icon>
          <ion-label>Moi</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent {
  constructor() {
    addIcons({
      homeOutline, homeSharp,
      footballOutline, footballSharp,
      addCircleOutline, addCircleSharp,
      chatbubbleOutline, chatbubbleSharp,
      personOutline, personSharp
    });
  }
}