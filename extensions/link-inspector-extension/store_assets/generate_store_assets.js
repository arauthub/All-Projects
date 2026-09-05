const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = path.join(__dirname);
const TEMP_HTML_DIR = path.join(__dirname, 'temp_templates');

if (!fs.existsSync(TEMP_HTML_DIR)) fs.mkdirSync(TEMP_HTML_DIR, { recursive: true });

// Common CSS Styles
const COMMON_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background: #090d16;
    color: #f1f5f9;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  .browser-window {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #0f172a;
  }
  .browser-header {
    background: #090d16;
    height: 44px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .traffic-lights {
    display: flex;
    gap: 7px;
  }
  .dot { width: 11px; height: 11px; border-radius: 50%; }
  .dot-red { background: #ef4444; }
  .dot-yellow { background: #f59e0b; }
  .dot-green { background: #22c55e; }
  .address-bar {
    flex: 1;
    max-width: 680px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    height: 28px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    font-size: 11.5px;
    color: #94a3b8;
    gap: 8px;
  }
  .address-lock { color: #22c55e; font-size: 11px; }
  .browser-content {
    flex: 1;
    position: relative;
    background: #0d1322;
    background-image: radial-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px);
    background-size: 24px 24px;
    padding: 32px 48px;
  }
  .web-article {
    max-width: 780px;
    margin: 0 auto;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 36px 40px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  .article-badge {
    display: inline-block;
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.3);
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 14px;
  }
  .article-title {
    font-size: 26px;
    font-weight: 800;
    color: #f8fafc;
    letter-spacing: -0.5px;
    margin-bottom: 12px;
  }
  .article-desc {
    font-size: 14px;
    color: #94a3b8;
    line-height: 1.6;
    margin-bottom: 24px;
  }
  .article-links-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .article-link-item {
    font-size: 14.5px;
    color: #cbd5e1;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  a.mock-link {
    color: #38bdf8;
    text-decoration: underline;
    font-weight: 600;
  }
  /* Floating Inspector Tooltip UI */
  .inspector-card-preview {
    position: absolute;
    width: 380px;
    background: rgba(15, 23, 42, 0.97);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 12px;
    box-shadow: 0 25px 40px -5px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.2);
    padding: 14px 16px;
    color: #f8fafc;
    font-size: 12.5px;
    z-index: 100;
  }
  .li-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    margin-bottom: 10px;
  }
  .li-status-badge {
    padding: 3px 9px;
    border-radius: 9999px;
    font-size: 10.5px;
    font-weight: 700;
  }
  .badge-200 { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); }
  .badge-404 { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
  .badge-301 { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
  .li-url-box {
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 6px 8px;
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 11px;
    color: #7dd3fc;
    word-break: break-all;
    margin-bottom: 8px;
  }
  .li-tags-container { display: flex; gap: 4px; margin-top: 4px; }
  .li-tag {
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .tag-ext { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
  .tag-track { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
  .tag-nofollow { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
  .li-controls-toolbar {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 5px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .li-btn-ctrl {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #f1f5f9;
    border-radius: 6px;
    padding: 6px 3px;
    font-size: 10px;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    text-align: center;
  }
  .callout-overlay {
    position: absolute;
    top: 24px;
    right: 48px;
    background: linear-gradient(135deg, rgba(2, 132, 199, 0.3), rgba(15, 23, 42, 0.85));
    border: 1px solid #38bdf8;
    backdrop-filter: blur(16px);
    border-radius: 12px;
    padding: 16px 20px;
    max-width: 320px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.2);
  }
  .callout-title { font-size: 14px; font-weight: 800; color: #38bdf8; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .callout-desc { font-size: 12px; color: #cbd5e1; line-height: 1.4; }
`;

// Templates
const templates = {
  // Screenshot 1: Interactive Hover Inspector
  'screenshot_1_interactive_hover.html': `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
<body>
  <div class="browser-window">
    <div class="browser-header">
      <div class="traffic-lights"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
      <div class="address-bar"><span class="address-lock">🔒</span><span>https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a</span></div>
    </div>
    <div class="browser-content">
      <div class="callout-overlay">
        <div class="callout-title">⚡ Interactive Hover Inspector</div>
        <div class="callout-desc">Hover over any link to view real-time HTTP status, response latency, attributes, and access quick controls like <strong>Clean URL</strong> and <strong>Markdown Copy</strong>.</div>
      </div>

      <div class="web-article">
        <span class="article-badge">HTML Reference Documentation</span>
        <h1 class="article-title">&lt;a&gt;: The Anchor element</h1>
        <p class="article-desc">The &lt;a&gt; HTML element, with its href attribute, creates a hyperlink to web pages, files, email addresses, locations in the same page, or anything else a URL can address.</p>
        
        <ul class="article-links-list">
          <li class="article-link-item">
            <span>Official Specification:</span>
            <a class="mock-link" href="#">HTML Living Standard - Hyperlink Spec</a>
          </li>
          <li class="article-link-item" style="position: relative;">
            <span>Target Documentation:</span>
            <a class="mock-link" style="outline: 2px solid #38bdf8; outline-offset: 2px; background: rgba(56,189,248,0.1);" href="#">https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200?utm_source=docs&utm_medium=partner</a>
            <span style="font-size: 18px; margin-left: 6px;">👆</span>

            <!-- Floating Inspector Card -->
            <div class="inspector-card-preview" style="top: 36px; left: 140px;">
              <div class="li-card-header">
                <div style="font-weight:700; font-size:12px; color:#38bdf8;">🔍 developer.mozilla.org</div>
                <div class="li-status-badge badge-200">● 200 OK (42ms)</div>
              </div>
              <div style="font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:700; margin-bottom:3px;">Target URL</div>
              <div class="li-url-box">https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200?utm_source=docs&utm_medium=partner</div>
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:11px;">
                <span>Target: <strong>_blank</strong></span>
                <span>Rel: <strong>noopener</strong></span>
              </div>
              <div class="li-tags-container">
                <span class="li-tag tag-ext">External</span>
                <span class="li-tag tag-track">UTM / Tracked</span>
                <span class="li-tag" style="background:rgba(34,197,94,0.15); color:#4ade80;">HTTPS</span>
              </div>
              <div class="li-controls-toolbar">
                <div class="li-btn-ctrl"><span>📋</span><span>Copy</span></div>
                <div class="li-btn-ctrl" style="border-color:#38bdf8; color:#38bdf8; background:rgba(56,189,248,0.15);"><span>🧹</span><span>Clean URL</span></div>
                <div class="li-btn-ctrl"><span>📝</span><span>Copy MD</span></div>
                <div class="li-btn-ctrl"><span>🔄</span><span>Re-Check</span></div>
                <div class="li-btn-ctrl"><span>🎯</span><span>Highlight</span></div>
              </div>
            </div>
          </li>
          <li class="article-link-item">
            <span>Related Guide:</span>
            <a class="mock-link" href="#">Understanding Cross-Origin Resource Sharing (CORS)</a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</body></html>`,

  // Screenshot 2: Visual Link Highlighter
  'screenshot_2_link_highlighter.html': `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  ${COMMON_CSS}
  .hl-internal { outline: 2px solid #22c55e !important; outline-offset: 2px; background: rgba(34, 197, 94, 0.1) !important; padding: 2px 6px; border-radius: 4px; }
  .hl-external { outline: 2px dashed #38bdf8 !important; outline-offset: 2px; background: rgba(56, 189, 248, 0.1) !important; padding: 2px 6px; border-radius: 4px; }
  .hl-nofollow { outline: 2px dotted #f59e0b !important; outline-offset: 2px; background: rgba(245, 158, 11, 0.1) !important; padding: 2px 6px; border-radius: 4px; }
  .hl-broken { outline: 2px solid #ef4444 !important; outline-offset: 2px; background: rgba(239, 68, 68, 0.2) !important; padding: 2px 6px; border-radius: 4px; }
  .legend-box {
    display: flex; gap: 16px; margin-bottom: 24px; background: rgba(0,0,0,0.3); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
  }
  .legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
</style></head>
<body>
  <div class="browser-window">
    <div class="browser-header">
      <div class="traffic-lights"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
      <div class="address-bar"><span class="address-lock">🔒</span><span>https://github.com/features/actions</span></div>
    </div>
    <div class="browser-content">
      <div class="callout-overlay">
        <div class="callout-title">🎨 Visual Link Highlighter</div>
        <div class="callout-desc">Instantly color-code all links across any page: <strong>Internal (Green)</strong>, <strong>External (Blue)</strong>, <strong>Nofollow (Orange)</strong>, and <strong>Broken (Red)</strong>.</div>
      </div>

      <div class="web-article">
        <span class="article-badge">Automated Link Highlighting Active</span>
        <h1 class="article-title">GitHub Actions & Automation Overview</h1>
        
        <div class="legend-box">
          <div class="legend-item"><span class="legend-dot" style="background:#22c55e;"></span><span>Internal Link</span></div>
          <div class="legend-item"><span class="legend-dot" style="background:#38bdf8;"></span><span>External Link</span></div>
          <div class="legend-item"><span class="legend-dot" style="background:#f59e0b;"></span><span>Nofollow / Sponsored</span></div>
          <div class="legend-item"><span class="legend-dot" style="background:#ef4444;"></span><span>Broken Link (4xx)</span></div>
        </div>

        <p class="article-desc" style="line-height: 2.2;">
          GitHub Actions makes it easy to automate all your software workflows. Build, test, and deploy your code right from <a href="#" class="mock-link hl-internal">GitHub Documentation</a>. You can easily integrate external runners on <a href="#" class="mock-link hl-external">AWS Cloud Compute</a>, configure third-party sponsored tooling via <a href="#" class="mock-link hl-nofollow">Sponsored Partner Hub</a>, and test legacy deprecated endpoints like <a href="#" class="mock-link hl-broken">Legacy API v1 (404 Error)</a>.
        </p>
      </div>

      <!-- Toast Notification in bottom-right -->
      <div style="position: absolute; bottom: 30px; right: 48px; background: rgba(15,23,42,0.95); border: 1px solid #38bdf8; border-radius: 8px; padding: 12px 20px; color: white; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.6);">
        <span style="font-size: 18px;">🎨</span>
        <div>
          <div style="font-weight:700; font-size:13px; color:#38bdf8;">Visual Highlights Active</div>
          <div style="font-size:11px; color:#94a3b8;">Categorized 42 page links in 18ms</div>
        </div>
      </div>
    </div>
  </div>
</body></html>`,

  // Screenshot 3: Popup Dashboard
  'screenshot_3_popup_dashboard.html': `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  ${COMMON_CSS}
  .popup-preview {
    position: absolute;
    top: 60px;
    right: 80px;
    width: 415px;
    background: #0b0f19;
    border: 1px solid rgba(56,189,248,0.3);
    border-radius: 12px;
    box-shadow: 0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(56,189,248,0.25);
    padding: 16px;
    color: #f1f5f9;
  }
  .metrics-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin: 12px 0; }
  .metric-card {
    background: rgba(30,41,59,0.7);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 8px 4px;
    text-align: center;
  }
  .metric-val { font-size: 16px; font-weight: 800; }
  .metric-lbl { font-size: 8.5px; text-transform: uppercase; color: #94a3b8; }
  .link-row {
    background: rgba(30,41,59,0.7);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 8px 10px;
    margin-bottom: 6px;
    font-size: 11px;
  }
</style></head>
<body>
  <div class="browser-window">
    <div class="browser-header">
      <div class="traffic-lights"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
      <div class="address-bar"><span class="address-lock">🔒</span><span>https://example.com/ecommerce-store</span></div>
      <div style="margin-left:auto; display:flex; align-items:center; gap:8px;">
        <div style="background:rgba(56,189,248,0.2); border:1px solid #38bdf8; width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:14px;">🔍</div>
      </div>
    </div>
    <div class="browser-content">
      <div style="max-width: 500px; padding: 40px 0;">
        <h1 style="font-size: 32px; font-weight: 800; color: #f8fafc; margin-bottom: 12px;">Full-Page Link Auditor</h1>
        <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          Audit every link on your active tab concurrently. Detect HTTP status codes, redirect chains, broken pages, and export structured reports to CSV and JSON.
        </p>
        <div style="display:inline-flex; gap:12px;">
          <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); padding:10px 16px; border-radius:8px; font-size:13px; color:#38bdf8; font-weight:600;">⚡ Batch Health Audit</div>
          <div style="background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); padding:10px 16px; border-radius:8px; font-size:13px; color:#4ade80; font-weight:600;">📥 CSV & JSON Export</div>
        </div>
      </div>

      <!-- Popup Window Overlay -->
      <div class="popup-preview">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:20px;">🔍</span>
            <div>
              <div style="font-weight:700; font-size:14px;">Link Inspector Pro</div>
              <div style="font-size:10px; color:#94a3b8;">Link Auditor, SEO & Broken Link Checker</div>
            </div>
          </div>
          <span style="font-size:11px; color:#22c55e; font-weight:600;">● Active Tab</span>
        </div>

        <div class="metrics-grid">
          <div class="metric-card"><div class="metric-val" style="color:#38bdf8;">54</div><div class="metric-lbl">Total</div></div>
          <div class="metric-card"><div class="metric-val" style="color:#22c55e;">38</div><div class="metric-lbl">Internal</div></div>
          <div class="metric-card"><div class="metric-val" style="color:#60a5fa;">12</div><div class="metric-lbl">External</div></div>
          <div class="metric-card"><div class="metric-val" style="color:#f59e0b;">3</div><div class="metric-lbl">3xx Redir</div></div>
          <div class="metric-card"><div class="metric-val" style="color:#ef4444;">1</div><div class="metric-lbl">Broken</div></div>
        </div>

        <div style="display:flex; gap:8px; margin-bottom:12px;">
          <button style="flex:1; background:linear-gradient(135deg,#0284c7,#0369a1); border:none; color:white; padding:8px; border-radius:8px; font-weight:700; font-size:11.5px;">⚡ Scan Link Health</button>
          <button style="background:rgba(30,41,59,0.8); border:1px solid rgba(255,255,255,0.1); color:white; padding:8px 12px; border-radius:8px; font-weight:600; font-size:11px;">CSV</button>
          <button style="background:rgba(30,41,59,0.8); border:1px solid rgba(255,255,255,0.1); color:white; padding:8px 12px; border-radius:8px; font-weight:600; font-size:11px;">JSON</button>
        </div>

        <div style="font-size:10px; color:#94a3b8; margin-bottom:6px; font-weight:700; text-transform:uppercase;">Audited Page Links</div>
        <div class="link-row">
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
            <strong style="color:#f8fafc;">Pricing & Plans</strong>
            <span class="li-status-badge badge-200">200 OK</span>
          </div>
          <div style="color:#38bdf8; font-family:monospace; font-size:10px;">https://example.com/pricing</div>
        </div>
        <div class="link-row">
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
            <strong style="color:#f8fafc;">Blog Newsletter</strong>
            <span class="li-status-badge badge-301">301 Redirect</span>
          </div>
          <div style="color:#38bdf8; font-family:monospace; font-size:10px;">https://example.com/blog</div>
          <div style="color:#fbbf24; font-family:monospace; font-size:9.5px; margin-top:2px;">↳ https://example.com/news</div>
        </div>
        <div class="link-row">
          <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
            <strong style="color:#f8fafc;">Old Documentation</strong>
            <span class="li-status-badge badge-404">404 Error</span>
          </div>
          <div style="color:#ef4444; font-family:monospace; font-size:10px;">https://example.com/v1/docs</div>
        </div>
      </div>
    </div>
  </div>
</body></html>`,

  // Screenshot 4: Broken Link 404 & Wayback Machine
  'screenshot_4_broken_link_recovery.html': `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${COMMON_CSS}</style></head>
<body>
  <div class="browser-window">
    <div class="browser-header">
      <div class="traffic-lights"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
      <div class="address-bar"><span class="address-lock">🔒</span><span>https://wikipedia.org/wiki/Web_archiving</span></div>
    </div>
    <div class="browser-content">
      <div class="callout-overlay" style="border-color:#f59e0b;">
        <div class="callout-title" style="color:#fbbf24;">🏛️ 1-Click Wayback Machine Recovery</div>
        <div class="callout-desc">When a broken link (404 Not Found or 500 error) is detected, Link Inspector Pro provides an instant button to recover historical snapshots on <strong>web.archive.org</strong>.</div>
      </div>

      <div class="web-article">
        <span class="article-badge" style="background:rgba(239,68,68,0.15); color:#f87171; border-color:rgba(239,68,68,0.3);">Broken Link Analysis</span>
        <h1 class="article-title">Digital Preservation & Citation Rot</h1>
        <p class="article-desc">Link rot is the process by which hyperlinks on the World Wide Web point to web pages, servers, or other resources that have become permanently unavailable.</p>
        
        <ul class="article-links-list">
          <li class="article-link-item" style="position: relative;">
            <span>Referenced Source:</span>
            <a class="mock-link" style="color:#f87171; outline: 2px solid #ef4444; outline-offset: 2px; background: rgba(239,68,68,0.15); padding: 2px 6px;" href="#">http://www.oldresearchsite.org/paper-1998.html</a>
            <span style="font-size: 18px; margin-left: 6px;">👆</span>

            <!-- Floating Inspector Card with 404 & Wayback -->
            <div class="inspector-card-preview" style="top: 36px; left: 160px; border-color: rgba(239,68,68,0.4);">
              <div class="li-card-header">
                <div style="font-weight:700; font-size:12px; color:#f87171;">🔍 oldresearchsite.org</div>
                <div class="li-status-badge badge-404">● 404 Not Found</div>
              </div>
              <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:6px; padding:6px 8px; font-size:10.5px; color:#fca5a5; margin-bottom:8px;">
                ⚠️ Broken Link: Resource is missing or deleted from host server
              </div>
              <div style="font-size:10px; color:#94a3b8; text-transform:uppercase; font-weight:700; margin-bottom:3px;">Target URL</div>
              <div class="li-url-box" style="color:#fca5a5;">http://www.oldresearchsite.org/paper-1998.html</div>
              
              <div style="margin-top:8px;">
                <div style="background:linear-gradient(135deg,rgba(245,158,11,0.2),rgba(217,119,6,0.15)); border:1px solid #f59e0b; color:#fbbf24; border-radius:6px; padding:8px 10px; font-size:11.5px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px;">
                  <span>🏛️</span>
                  <span>Recover via Wayback Machine (web.archive.org)</span>
                </div>
              </div>

              <div class="li-controls-toolbar" style="grid-template-columns: repeat(4, 1fr); margin-top:8px;">
                <div class="li-btn-ctrl"><span>📋</span><span>Copy URL</span></div>
                <div class="li-btn-ctrl"><span>🧹</span><span>Clean URL</span></div>
                <div class="li-btn-ctrl"><span>🔄</span><span>Re-Check</span></div>
                <div class="li-btn-ctrl"><span>🎯</span><span>Highlight</span></div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</body></html>`,

  // Small Promo Tile (440x280)
  'promo_tile_small_440x280.html': `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 440px;
    height: 280px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: radial-gradient(circle at 50% 30%, #032b43 0%, #080e1a 75%, #050810 100%);
    color: #f8fafc;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
    border: 2px solid rgba(56, 189, 248, 0.4);
  }
  .brand-icon-box {
    width: 68px;
    height: 68px;
    background: rgba(15, 23, 42, 0.85);
    border: 2px solid #38bdf8;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 34px;
    box-shadow: 0 10px 25px rgba(56, 189, 248, 0.35), 0 0 15px rgba(56, 189, 248, 0.2);
    margin-bottom: 12px;
  }
  h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #f8fafc; margin-bottom: 4px; }
  h1 span { color: #38bdf8; }
  p { font-size: 11.5px; color: #94a3b8; margin-bottom: 14px; max-width: 320px; line-height: 1.4; }
  .pills-row { display: flex; gap: 6px; }
  .pill {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 3px 8px;
    border-radius: 20px;
    font-size: 9.5px;
    font-weight: 700;
    color: #cbd5e1;
  }
  .pill-cyan { background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.4); color: #38bdf8; }
</style></head>
<body>
  <div class="brand-icon-box">🔍</div>
  <h1>Link Inspector <span>Pro</span></h1>
  <p>Real-Time Link Auditor, Broken Link Checker & UTM Cleaner</p>
  <div class="pills-row">
    <span class="pill pill-cyan">Manifest V3</span>
    <span class="pill">100% Client-Side</span>
    <span class="pill">Wayback 404 Recovery</span>
  </div>
</body></html>`,

  // Marquee Promo Tile (1400x560)
  'promo_tile_marquee_1400x560.html': `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1400px;
    height: 560px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: radial-gradient(circle at 30% 40%, #032b43 0%, #070e1b 60%, #04070f 100%);
    color: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 60px 80px;
    border: 2px solid rgba(56, 189, 248, 0.3);
  }
  .left-content { max-width: 620px; }
  .tagline-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.4);
    padding: 6px 14px;
    border-radius: 30px;
    font-size: 13px;
    font-weight: 700;
    color: #38bdf8;
    margin-bottom: 20px;
  }
  h1 { font-size: 48px; font-weight: 900; line-height: 1.1; letter-spacing: -1px; margin-bottom: 16px; }
  h1 span { color: #38bdf8; }
  p { font-size: 17px; color: #94a3b8; line-height: 1.5; margin-bottom: 28px; }
  .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .feat-item { display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 600; color: #e2e8f0; }
  .feat-icon { color: #38bdf8; font-size: 16px; }
  .right-preview {
    position: relative;
    width: 480px;
  }
  .card-3d {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 16px;
    box-shadow: 0 30px 60px rgba(0,0,0,0.8), 0 0 40px rgba(56, 189, 248, 0.25);
    padding: 24px;
  }
</style></head>
<body>
  <div class="left-content">
    <div class="tagline-badge"><span>⚡</span><span>Next-Gen Chrome Extension (Manifest V3)</span></div>
    <h1>Link Inspector <span>Pro</span></h1>
    <p>The ultimate link auditor for developers, SEO specialists & power users. Inspect links on hover, detect broken URLs, track redirects, and strip UTM parameters instantly.</p>
    <div class="features-grid">
      <div class="feat-item"><span class="feat-icon">🔍</span><span>Real-Time HTTP & Latency Badge</span></div>
      <div class="feat-item"><span class="feat-icon">🧹</span><span>Smart UTM & Tracking Stripper</span></div>
      <div class="feat-item"><span class="feat-icon">🏛️</span><span>Wayback Machine 404 Recovery</span></div>
      <div class="feat-item"><span class="feat-icon">🎨</span><span>Visual Page-Wide Link Colors</span></div>
      <div class="feat-item"><span class="feat-icon">📊</span><span>Full Tab Audit & CSV/JSON Export</span></div>
      <div class="feat-item"><span class="feat-icon">🔒</span><span>100% Privacy-First & Client-Side</span></div>
    </div>
  </div>

  <div class="right-preview">
    <div class="card-3d">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px; margin-bottom:14px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:22px;">🔍</span>
          <span style="font-weight:800; font-size:15px; color:#38bdf8;">github.com</span>
        </div>
        <span style="background:rgba(34,197,94,0.2); color:#4ade80; border:1px solid rgba(34,197,94,0.4); padding:3px 10px; border-radius:20px; font-size:12px; font-weight:700;">● 200 OK (38ms)</span>
      </div>
      <div style="font-size:11px; color:#94a3b8; text-transform:uppercase; font-weight:700; margin-bottom:4px;">Target URL</div>
      <div style="background:rgba(0,0,0,0.35); padding:8px 10px; border-radius:6px; font-family:monospace; font-size:12px; color:#7dd3fc; margin-bottom:12px; word-break:break-all;">
        https://github.com/arauthub/All-Projects
      </div>
      <div style="display:flex; gap:6px; margin-bottom:14px;">
        <span style="background:rgba(56,189,248,0.15); color:#38bdf8; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700;">EXTERNAL</span>
        <span style="background:rgba(34,197,94,0.15); color:#4ade80; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700;">HTTPS</span>
        <span style="background:rgba(168,85,247,0.15); color:#c084fc; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700;">NO TRACKING</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:6px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08);">
        <div style="background:rgba(30,41,59,0.8); padding:8px 4px; border-radius:6px; text-align:center; font-size:10.5px; font-weight:700;">📋 Copy</div>
        <div style="background:rgba(56,189,248,0.2); border:1px solid #38bdf8; color:#38bdf8; padding:8px 4px; border-radius:6px; text-align:center; font-size:10.5px; font-weight:700;">🧹 Clean</div>
        <div style="background:rgba(30,41,59,0.8); padding:8px 4px; border-radius:6px; text-align:center; font-size:10.5px; font-weight:700;">📝 MD</div>
        <div style="background:rgba(30,41,59,0.8); padding:8px 4px; border-radius:6px; text-align:center; font-size:10.5px; font-weight:700;">🔄 Check</div>
        <div style="background:rgba(30,41,59,0.8); padding:8px 4px; border-radius:6px; text-align:center; font-size:10.5px; font-weight:700;">🎯 Pulse</div>
      </div>
    </div>
  </div>
</body></html>`
};

// Render Specs
const renderTasks = [
  { file: 'screenshot_1_interactive_hover.html', out: 'screenshot_1_interactive_hover.png', w: 1280, h: 800 },
  { file: 'screenshot_2_link_highlighter.html', out: 'screenshot_2_link_highlighter.png', w: 1280, h: 800 },
  { file: 'screenshot_3_popup_dashboard.html', out: 'screenshot_3_popup_dashboard.png', w: 1280, h: 800 },
  { file: 'screenshot_4_broken_link_recovery.html', out: 'screenshot_4_broken_link_recovery.png', w: 1280, h: 800 },
  { file: 'promo_tile_small_440x280.html', out: 'promo_tile_small_440x280.png', w: 440, h: 280 },
  { file: 'promo_tile_marquee_1400x560.html', out: 'promo_tile_marquee_1400x560.png', w: 1400, h: 560 }
];

console.log('🎨 Generating Chrome Web Store graphic assets...');

renderTasks.forEach(task => {
  const htmlContent = templates[task.file];
  const tempHtmlPath = path.join(TEMP_HTML_DIR, task.file);
  fs.writeFileSync(tempHtmlPath, htmlContent);

  const outPngPath = path.join(OUT_DIR, task.out);
  console.log(`📸 Rendering ${task.out} (${task.w}x${task.h})...`);

  const cmd = `"${CHROME_PATH}" --headless --disable-gpu --screenshot="${outPngPath}" --window-size=${task.w},${task.h} "file://${tempHtmlPath}"`;
  try {
    execSync(cmd, { stdio: 'pipe' });
    const stats = fs.statSync(outPngPath);
    console.log(`✅ Created: ${task.out} (${Math.round(stats.size / 1024)} KB)`);
  } catch (err) {
    console.error(`❌ Failed to render ${task.out}:`, err.message);
  }
});

// Clean temp html files
fs.rmSync(TEMP_HTML_DIR, { recursive: true, force: true });
console.log('✨ All graphic assets generated successfully in store_assets/!');
