import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WagtailService } from '../../services/wagtail';
import { SnippetComponent } from '../snippet/snippet';

@Component({
  selector: 'app-showcase',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSelectModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatDividerModule,
    MatExpansionModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatStepperModule,
    MatBadgeModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    SnippetComponent
  ],
  template: `
    <div class="showcase-container">
      <header class="showcase-header">
        <h1>Ultimate Material 3 Showcase</h1>
        <p>A comprehensive preview of all Modular Components and Material Design elements.</p>
      </header>

      <mat-tab-group class="showcase-tabs" animationDuration="1000ms">
        <!-- TAB 1: INTERACTION -->
        <mat-tab label="Interaction">
          <div class="tab-content">
            <section class="comp-section">
              <h3>Buttons & Menus</h3>
              <div class="comp-row">
                <button mat-flat-button color="primary">Primary Action</button>
                <button mat-stroked-button color="accent">Secondary</button>
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item>
                    <mat-icon>settings</mat-icon>
                    <span>Settings</span>
                  </button>
                  <button mat-menu-item disabled>
                    <mat-icon>voicemail</mat-icon>
                    <span>Check voicemail</span>
                  </button>
                  <button mat-menu-item>
                    <mat-icon>notifications_off</mat-icon>
                    <span>Disable alerts</span>
                  </button>
                </mat-menu>
              </div>
            </section>

            <section class="comp-section">
              <h3>Chips & Badges</h3>
              <div class="comp-row">
                <mat-chip-listbox>
                  <mat-chip-option color="primary" selected>Material 3</mat-chip-option>
                  <mat-chip-option color="accent">Angular</mat-chip-option>
                  <mat-chip-option color="warn">Premium</mat-chip-option>
                </mat-chip-listbox>
                
                <span matBadge="7" matBadgeColor="warn" matBadgeOverlap="false" class="demo-badge">
                  Messages
                </span>
                
                <button mat-icon-button matTooltip="Help info">
                  <mat-icon>help</mat-icon>
                </button>
              </div>
            </section>
          </div>
        </mat-tab>

        <!-- TAB 2: FORMS -->
        <mat-tab label="Forms & Data">
          <div class="tab-content">
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Username</mat-label>
                <input matInput placeholder="Ex. admin">
                <mat-hint>Enter your preferred name</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Select Role</mat-label>
                <mat-select>
                  <mat-option value="admin">Administrator</mat-option>
                  <mat-option value="editor">Editor</mat-option>
                  <mat-option value="viewer">Viewer</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="full-width">
                <mat-slide-toggle color="primary">Enable Dark Mode</mat-slide-toggle>
              </div>

              <div class="full-width">
                <h4>Experience Level</h4>
                <mat-slider min="0" max="10" step="1" showTickMarks discrete>
                  <input matSliderThumb>
                </mat-slider>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- TAB 3: STEPPERS -->
        <mat-tab label="Flow & Navigation">
          <div class="tab-content">
            <mat-stepper #stepper>
              <mat-step label="Profile Info">
                <div class="step-placeholder">
                  <p>Step 1: Enter your personal details.</p>
                  <button mat-button matStepperNext>Next</button>
                </div>
              </mat-step>
              <mat-step label="Verification">
                <div class="step-placeholder">
                  <p>Step 2: Verify your contact info.</p>
                  <button mat-button matStepperPrevious>Back</button>
                  <button mat-button matStepperNext>Next</button>
                </div>
              </mat-step>
              <mat-step label="Done">
                 <div class="step-placeholder">
                  <p>All set! Click finish to complete.</p>
                  <button mat-button (click)="stepper.reset()">Reset</button>
                </div>
              </mat-step>
            </mat-stepper>
          </div>
        </mat-tab>

        <!-- TAB 4: ALERTS -->
        <mat-tab label="Alerts & Dialogs">
          <div class="tab-content">
             <section class="comp-section">
               <h3>Popups</h3>
               <div class="comp-row">
                 <button mat-raised-button color="primary" (click)="openSnackBar()">Show Snackbar</button>
                 <button mat-raised-button color="accent" (click)="openDialog()">Open Dialog</button>
               </div>
             </section>

             <section class="comp-section">
               <h3>Visual Feedback</h3>
               <div class="progress-box">
                 <mat-progress-bar mode="buffer" value="60" bufferValue="80"></mat-progress-bar>
                 <div class="spinner-row">
                   <mat-spinner diameter="40"></mat-spinner>
                   <mat-spinner diameter="60" color="accent"></mat-spinner>
                 </div>
               </div>
             </section>
          </div>
        </mat-tab>

        <!-- TAB 5: SNIPPETS -->
        <mat-tab label="Modular Snippets">
          <div class="tab-content">
            <header class="section-intro">
              <h3>Reusable Components</h3>
              <p>These are pre-configured snippets that can be dropped into any page. Select one below to see it in action.</p>
            </header>

            <div class="snippets-grid">
              <mat-card *ngFor="let snippet of snippets()" class="snippet-item">
                <mat-card-header>
                  <mat-card-title>{{ snippet.title }}</mat-card-title>
                  <mat-card-subtitle>ID: {{ snippet.id }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <app-snippet [id]="snippet.id"></app-snippet>
                </mat-card-content>
              </mat-card>
            </div>

            <div *ngIf="snippets().length === 0" class="empty-state">
              <mat-icon>inbox</mat-icon>
              <p>No snippets found in the backend.</p>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: `
    .showcase-container {
      padding: 3rem;
      max-width: 1200px;
      margin: 2rem auto;
      background: #fafafa;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }
    .showcase-header {
      margin-bottom: 3rem;
      text-align: center;
    }
    .showcase-header h1 {
      font-size: 2.8rem;
      font-weight: 800;
      color: #1a1a1a;
      letter-spacing: -1px;
    }
    .tab-content {
      padding: 3rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 3rem;
      animation: slideIn 0.6s ease-out;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .comp-section {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .comp-row {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
      align-items: center;
      margin-top: 1.5rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .full-width { grid-column: span 2; }
    .step-placeholder { padding: 2rem 0; }
    .demo-badge { margin-right: 2rem; }
    .progress-box {
      display: flex;
      flex-direction: column;
      gap: 3rem;
    }
    .spinner-row {
      display: flex;
      gap: 3rem;
      align-items: center;
      justify-content: center;
    }
    .snippets-grid {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .snippet-item {
      border-left: 5px solid #3f51b5;
    }
    .section-intro { margin-bottom: 1rem; }
    .empty-state {
       text-align: center;
       padding: 4rem;
       color: #999;
    }
    .empty-state mat-icon { font-size: 4rem; width:4rem; height:4rem; margin-bottom: 1rem;}
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      .full-width { grid-column: span 1; }
    }
  `
})
export class ShowcaseComponent implements OnInit {
  private snackBar = inject(MatSnackBar);
  public dialog = inject(MatDialog);
  private wagtailService = inject(WagtailService);

  snippets = signal<any[]>([]);

  ngOnInit() {
    this.fetchSnippets();
  }

  fetchSnippets() {
    this.wagtailService.getSnippets().subscribe({
      next: (res: any) => {
        this.snippets.set(res.items || []);
      }
    });
  }

  openSnackBar() {
    this.snackBar.open('Premium Material Snackbar is working!', 'Action', {
      duration: 3000,
    });
  }

  openDialog() {
    this.dialog.open(ShowcaseDialogContent);
  }
}

@Component({
  selector: 'showcase-dialog-content',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Material Dialog</h2>
    <mat-dialog-content>
      This is a beautiful Material 3 dialog integrated into your showcase.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" mat-dialog-close>OK</button>
    </mat-dialog-actions>
  `,
})
export class ShowcaseDialogContent { }
