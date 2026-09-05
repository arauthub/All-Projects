import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, MatDividerModule, MatIconModule, MatButtonModule],
  template: `
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-brand">
          <div class="brand-logotype">
            <mat-icon class="brand-icon">build_circle</mat-icon>
            <h2>FlashApps ERP</h2>
          </div>
          <p class="brand-tagline">The premium multi-tenant operating system for modern auto repair networks. Scalable, fast, and entirely localized.</p>
          <div class="social-icons">
            <button mat-icon-button aria-label="LinkedIn"><mat-icon>work</mat-icon></button>
            <button mat-icon-button aria-label="Twitter"><mat-icon>share</mat-icon></button>
            <button mat-icon-button aria-label="Github"><mat-icon>terminal</mat-icon></button>
          </div>
        </div>
        
        <div class="footer-links-grid">
          <div class="footer-section">
            <h3>Product</h3>
            <div class="links">
              <a href="#">Mechanic Platform</a>
              <a href="#">SaaS Cost Calculator</a>
              <a href="#">Owner Analytics</a>
              <a href="#">Mobile Check-in</a>
            </div>
          </div>
          <div class="footer-section">
            <h3>Resources</h3>
            <div class="links">
              <a href="#">Documentation</a>
              <a href="#">API Reference</a>
              <a href="#">Community Forum</a>
              <a href="#">Knowledge Base</a>
            </div>
          </div>
          <div class="footer-section">
            <h3>Company</h3>
            <div class="links">
              <a href="#">About FlashApps</a>
              <a href="#">Contact Support</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-bottom-content">
          <p>&copy; 2026 FlashApps Project. All rights reserved.</p>
          <div class="bottom-links">
            <a href="#">Security</a>
            <a href="#">Status</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: `
    .app-footer {
      background-color: #0b1121; /* High-contrast enterprise dark */
      color: #e2e8f0;
      font-family: 'Inter', system-ui, sans-serif;
      overflow: hidden;
      position: relative;
    }
    
    .app-footer::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
    }

    .footer-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 4rem 2rem 3rem 2rem;
      display: flex;
      flex-wrap: wrap;
      gap: 4rem;
      justify-content: space-between;
    }

    .footer-brand {
      flex: 1 1 300px;
      max-width: 400px;
    }

    .brand-logotype {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 1.5rem;
    }

    .brand-icon {
      color: #3b82f6;
      font-size: 32px;
      height: 32px;
      width: 32px;
    }

    .brand-logotype h2 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }

    .brand-tagline {
      color: #94a3b8;
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .social-icons {
      display: flex;
      gap: 0.5rem;
    }
    
    .social-icons button {
      color: #94a3b8;
      background: rgba(255, 255, 255, 0.05);
      transition: all 0.2s ease;
    }
    
    .social-icons button:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }

    .footer-links-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 3rem;
      flex: 2 1 500px;
      justify-content: space-around;
    }

    .footer-section h3 {
      color: #ffffff;
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .links {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .links a {
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.95rem;
      transition: color 0.2s ease, transform 0.2s ease;
      display: inline-block;
    }

    .links a:hover {
      color: #3b82f6;
      transform: translateX(3px);
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background-color: #050810;
    }

    .footer-bottom-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .footer-bottom p {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
    }

    .bottom-links {
      display: flex;
      gap: 2rem;
    }

    .bottom-links a {
      color: #64748b;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s ease;
    }

    .bottom-links a:hover {
      color: #ffffff;
    }

    @media (max-width: 768px) {
      .footer-content {
        padding: 3rem 1.5rem 2rem 1.5rem;
        flex-direction: column;
      }
      .footer-links-grid {
        justify-content: flex-start;
      }
      .footer-bottom-content {
        flex-direction: column;
        text-align: center;
      }
    }
  `
})
export class FooterComponent { }
