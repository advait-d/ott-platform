import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular'; // Make sure this is imported
import { IonRouterOutlet, IonSplitPane } from '@ionic/angular'; // Import necessary Ionic components
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor(private router: Router) {}
}
