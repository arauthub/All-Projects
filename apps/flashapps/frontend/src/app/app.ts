import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { FooterComponent } from './components/footer/footer';
import { ERPService } from './services/erp';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  public erpService = inject(ERPService);
  protected readonly title = signal('frontend');
}
