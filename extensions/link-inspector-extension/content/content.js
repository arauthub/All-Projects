// Link Inspector Content Script - Power System

(function () {
  if (window.__LINK_INSPECTOR_LOADED__) return;
  window.__LINK_INSPECTOR_LOADED__ = true;

  let isInspectorEnabled = true;
  let isHighlightEnabled = false;
  let pointerStyle = 'default';
  let highlightConfig = { internal: true, external: true, nofollow: true, broken: true };

  let activeCard = null;
  let currentTargetLink = null;
  let openTimeout = null;
  let closeTimeout = null;
  let isMouseOverCard = false;

  const TRACKING_PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid', 'mc_eid', 'ref', 'ref_src',
    '_ga', '_gl', 'igshid', 'wickedid', 'twclid', 'yclid'
  ];

  const GENERIC_ANCHOR_TEXTS = [
    'click here', 'click', 'read more', 'learn more', 'here', 'more',
    'link', 'website', 'page', 'check this out', 'view more', 'info'
  ];

  // Initialize Extension State from storage
  chrome.storage.local.get(['inspectorEnabled', 'highlightEnabled', 'highlightCategories', 'pointerStyle'], (res) => {
    if (res.inspectorEnabled !== undefined) {
      isInspectorEnabled = res.inspectorEnabled;
    } else {
      isInspectorEnabled = true;
      chrome.storage.local.set({ inspectorEnabled: true });
    }

    if (res.highlightEnabled !== undefined) isHighlightEnabled = res.highlightEnabled;
    if (res.highlightCategories) highlightConfig = res.highlightCategories;
    if (res.pointerStyle) pointerStyle = res.pointerStyle;

    updatePointerStyleClass();

    if (isHighlightEnabled) {
      applyLinkHighlights();
    }
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.inspectorEnabled !== undefined) {
      isInspectorEnabled = changes.inspectorEnabled.newValue;
      updatePointerStyleClass();
      if (!isInspectorEnabled) hideInspectorCard();
    }
    if (changes.pointerStyle !== undefined) {
      pointerStyle = changes.pointerStyle.newValue;
      updatePointerStyleClass();
    }
    if (changes.highlightEnabled !== undefined) {
      isHighlightEnabled = changes.highlightEnabled.newValue;
      if (isHighlightEnabled) {
        applyLinkHighlights();
      } else {
        removeLinkHighlights();
      }
    }
    if (changes.highlightCategories) {
      highlightConfig = changes.highlightCategories.newValue;
      if (isHighlightEnabled) applyLinkHighlights();
    }
  });

  // Listen for messages from background / popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'GET_PAGE_LINKS_SUMMARY') {
      const summary = getPageLinksSummary();
      sendResponse(summary);
      return true;
    }

    if (message.action === 'TRIGGER_FULL_SCAN') {
      scanAndCheckAllPageLinks().then((results) => {
        sendResponse(results);
      });
      return true;
    }

    if (message.action === 'SET_INSPECTOR_STATE') {
      isInspectorEnabled = message.enabled;
      updatePointerStyleClass();
      if (!isInspectorEnabled) hideInspectorCard();
      showToast(isInspectorEnabled ? '🔍 Link Inspector Active' : 'Link Inspector Disabled');
      sendResponse({ status: 'ok' });
    }

    if (message.action === 'SET_POINTER_STYLE') {
      pointerStyle = message.style;
      updatePointerStyleClass();
      sendResponse({ status: 'ok' });
    }

    if (message.action === 'SET_HIGHLIGHT_STATE') {
      isHighlightEnabled = message.enabled;
      if (isHighlightEnabled) {
        applyLinkHighlights();
        showToast('🎨 Link Highlights Active');
      } else {
        removeLinkHighlights();
        showToast('Highlights Hidden');
      }
      sendResponse({ status: 'ok' });
    }

    if (message.action === 'INSPECT_SINGLE_LINK') {
      const targetUrl = message.linkUrl;
      const matchingLink = Array.from(document.querySelectorAll('a')).find(a => a.href === targetUrl);
      if (matchingLink) {
        matchingLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
        matchingLink.classList.add('li-flash-target');
        showInspectorCardForLink(matchingLink);
        setTimeout(() => matchingLink.classList.remove('li-flash-target'), 2500);
      }
    }
  });

  // Attach Event Listeners for Interactive Hover Inspector
  document.addEventListener('mouseover', (e) => {
    if (!isInspectorEnabled) return;
    const anchor = e.target.closest('a[href]');
    if (!anchor) return;

    clearTimeout(closeTimeout);

    if (currentTargetLink === anchor && activeCard && activeCard.classList.contains('li-visible')) {
      return;
    }

    currentTargetLink = anchor;
    clearTimeout(openTimeout);
    openTimeout = setTimeout(() => {
      showInspectorCardForLink(anchor);
    }, 150);
  });

  document.addEventListener('mouseout', (e) => {
    if (!isInspectorEnabled) return;
    const anchor = e.target.closest('a[href]');
    if (anchor && anchor === currentTargetLink) {
      clearTimeout(openTimeout);
      closeTimeout = setTimeout(() => {
        if (!isMouseOverCard) {
          hideInspectorCard();
        }
      }, 300);
    }
  });

  // Close popup instantly on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideInspectorCard();
    }
  });

  /**
   * Create and Display the Floating Interactive Card UI
   */
  function showInspectorCardForLink(linkEl) {
    if (!activeCard) {
      activeCard = createCardElement();
      document.body.appendChild(activeCard);
    }

    const fullUrl = linkEl.href;
    const rawHref = linkEl.getAttribute('href') || '';
    const isExternal = isUrlExternal(fullUrl);
    const targetAttr = linkEl.getAttribute('target') || '_self';
    const relAttr = linkEl.getAttribute('rel') || 'none';
    const textContent = (linkEl.innerText || linkEl.title || getImgAltInLink(linkEl) || '').trim();
    const hasTracking = checkHasTrackingParams(fullUrl);
    const isInsecure = fullUrl.startsWith('http://');

    // Security & SEO Audits
    const isMixedContent = window.location.protocol === 'https:' && isInsecure;
    const isTabnabbingRisk = targetAttr === '_blank' && !relAttr.toLowerCase().includes('noopener') && !relAttr.toLowerCase().includes('noreferrer');
    const isPlaceholderLink = rawHref === '#' || rawHref.startsWith('javascript:');
    const isWeakAnchor = !textContent || GENERIC_ANCHOR_TEXTS.includes(textContent.toLowerCase());

    let domainName = '';
    try {
      domainName = new URL(fullUrl).hostname;
    } catch (err) {
      domainName = 'Link Details';
    }

    // Header updates
    const titleEl = activeCard.querySelector('.li-card-title');
    titleEl.textContent = domainName;
    titleEl.title = domainName;

    // Build Tag List
    let tagsHtml = `<span class="li-tag ${isExternal ? 'li-tag-external' : 'li-tag-internal'}">${isExternal ? 'External' : 'Internal'}</span>`;
    if (relAttr.includes('nofollow')) tagsHtml += `<span class="li-tag li-tag-nofollow">Nofollow</span>`;
    if (relAttr.includes('sponsored')) tagsHtml += `<span class="li-tag li-tag-nofollow">Sponsored</span>`;
    if (isInsecure) tagsHtml += `<span class="li-tag li-tag-insecure">HTTP (Insecure)</span>`;
    if (hasTracking) tagsHtml += `<span class="li-tag li-tag-tracking">UTM / Tracked</span>`;

    // Build Audits Warning Banners
    let alertsHtml = '';
    if (isMixedContent) {
      alertsHtml += `<div class="li-audit-alert li-alert-security">⚠️ Mixed Content: Unencrypted HTTP link on secure HTTPS page</div>`;
    }
    if (isTabnabbingRisk) {
      alertsHtml += `<div class="li-audit-alert li-alert-security">⚠️ Security Risk: target="_blank" missing rel="noopener"</div>`;
    }
    if (isPlaceholderLink) {
      alertsHtml += `<div class="li-audit-alert li-alert-dead">⚠️ Dummy Link: href="${escapeHtml(rawHref)}"</div>`;
    } else if (isWeakAnchor) {
      alertsHtml += `<div class="li-audit-alert li-alert-seo">⚠️ Weak SEO: Anchor text is ${textContent ? `generic ("${escapeHtml(textContent)}")` : 'missing or empty'}</div>`;
    }

    // Populate Card Body
    const bodyEl = activeCard.querySelector('.li-card-body');
    bodyEl.innerHTML = `
      <div class="li-field-row">
        <span class="li-field-label">Target URL</span>
        <div class="li-url-box" title="${escapeHtml(fullUrl)}">${escapeHtml(fullUrl)}</div>
      </div>

      <div id="li-redirect-row" class="li-redirect-box" style="display: none;">
        <span>↳</span>
        <span id="li-redirect-text">Checking redirect...</span>
      </div>

      ${alertsHtml}

      <div class="li-field-row">
        <span class="li-field-label">Anchor / Alt Text</span>
        <span class="li-field-value">"${escapeHtml(truncateText(textContent || '[No Text]', 60))}"</span>
      </div>

      <div style="display: flex; gap: 14px; margin-top: 1px;">
        <div class="li-field-row">
          <span class="li-field-label">Target</span>
          <span class="li-field-value">${escapeHtml(targetAttr)}</span>
        </div>
        <div class="li-field-row">
          <span class="li-field-label">Rel</span>
          <span class="li-field-value">${escapeHtml(relAttr)}</span>
        </div>
      </div>

      <div class="li-tags-container">
        ${tagsHtml}
      </div>

      <div class="li-controls-toolbar">
        <button id="li-ctrl-copy-url" class="li-btn-ctrl" title="Copy full URL">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span class="li-btn-label">Copy URL</span>
        </button>

        <button id="li-ctrl-clean-url" class="li-btn-ctrl" title="Copy clean URL without UTM / tracking parameters">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span class="li-btn-label">Clean URL</span>
        </button>

        <button id="li-ctrl-copy-md" class="li-btn-ctrl" title="Copy markdown snippet: [text](url)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span class="li-btn-label">Copy MD</span>
        </button>

        <button id="li-ctrl-check" class="li-btn-ctrl" title="Re-check HTTP status and latency live">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span class="li-btn-label">Re-Check</span>
        </button>

        <button id="li-ctrl-highlight" class="li-btn-ctrl" title="Highlight all occurrences on this page">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="22" y1="12" x2="18" y2="12"></line>
            <line x1="6" y1="12" x2="2" y2="12"></line>
            <line x1="12" y1="6" x2="12" y2="2"></line>
            <line x1="12" y1="22" x2="12" y2="18"></line>
          </svg>
          <span class="li-btn-label">Highlight</span>
        </button>
      </div>

      <div id="li-extra-actions" style="margin-top: 5px; display: none;">
        <button id="li-ctrl-wayback" class="li-btn-ctrl li-btn-wayback" style="width: 100%; flex-direction: row; padding: 6px; gap: 6px;" title="View archived version of this broken link on Wayback Machine">
          <span>🏛️</span>
          <span>Recover via Wayback Machine (web.archive.org)</span>
        </button>
      </div>
    `;

    // Attach Event Listeners to Card Action Controls
    attachCardActionHandlers(fullUrl, textContent);

    // Initial Status Badge State
    const badge = activeCard.querySelector('#li-card-badge');
    badge.className = 'li-status-badge li-status-loading';
    badge.innerHTML = `<span class="li-badge-dot li-dot-pulse"></span><span>Checking...</span>`;

    // Position Card Stably Relative to Link Anchor
    positionCardRelativeToLink(linkEl);
    activeCard.classList.add('li-visible');

    // Fetch Status Async from Background Worker
    fetchAndDisplayLinkStatus(fullUrl);
  }

  /**
   * Position Card Stably below or above the hovered link
   */
  function positionCardRelativeToLink(anchor) {
    if (!activeCard) return;

    const rect = anchor.getBoundingClientRect();
    const cardWidth = 380;
    const estimatedHeight = 260;
    const margin = 12;

    // Horizontal placement
    let left = rect.left;
    if (left + cardWidth > window.innerWidth - margin) {
      left = window.innerWidth - cardWidth - margin;
    }
    if (left < margin) {
      left = margin;
    }

    // Vertical placement
    let top = rect.bottom + 8;
    if (top + estimatedHeight > window.innerHeight - margin) {
      if (rect.top - estimatedHeight - 8 > margin) {
        top = rect.top - estimatedHeight - 8;
      } else {
        top = Math.max(margin, window.innerHeight - estimatedHeight - margin);
      }
    }

    activeCard.style.left = `${Math.round(left)}px`;
    activeCard.style.top = `${Math.round(top)}px`;
  }

  /**
   * Request live HTTP status from background service worker and update badge & redirect row
   */
  function fetchAndDisplayLinkStatus(url, onComplete) {
    const badge = activeCard ? activeCard.querySelector('#li-card-badge') : null;
    const redirectRow = activeCard ? activeCard.querySelector('#li-redirect-row') : null;
    const redirectText = activeCard ? activeCard.querySelector('#li-redirect-text') : null;
    const extraActions = activeCard ? activeCard.querySelector('#li-extra-actions') : null;
    if (!badge) return;

    chrome.runtime.sendMessage({ action: 'CHECK_LINK_STATUS', url }, (res) => {
      if (onComplete) onComplete(res);
      if (!res || !activeCard || !activeCard.classList.contains('li-visible')) return;

      // Handle Redirect Tracking
      if (res.redirected && res.finalUrl && res.finalUrl !== url && redirectRow && redirectText) {
        redirectRow.style.display = 'flex';
        redirectText.innerHTML = `Redirects to: <strong>${escapeHtml(res.finalUrl)}</strong>`;
      }

      // Handle Broken 404 Wayback Machine Action
      if (extraActions) {
        if (!res.ok && (res.status >= 400 || res.status === 0) && !res.isSpecial) {
          extraActions.style.display = 'block';
          const btnWayback = extraActions.querySelector('#li-ctrl-wayback');
          if (btnWayback) {
            btnWayback.onclick = (e) => {
              e.stopPropagation();
              const waybackUrl = `https://web.archive.org/web/*/${encodeURIComponent(url)}`;
              window.open(waybackUrl, '_blank', 'noopener,noreferrer');
            };
          }
        } else {
          extraActions.style.display = 'none';
        }
      }

      if (res.ok) {
        badge.className = 'li-status-badge li-status-2xx';
        badge.innerHTML = `<span class="li-badge-dot"></span><span>200 OK (${res.latencyMs || 0}ms)</span>`;
      } else if (res.status >= 300 && res.status < 400) {
        badge.className = 'li-status-badge li-status-3xx';
        badge.innerHTML = `<span class="li-badge-dot"></span><span>${res.status} Redirect</span>`;
      } else if (res.status >= 400 && res.status < 500) {
        badge.className = 'li-status-badge li-status-4xx';
        badge.innerHTML = `<span class="li-badge-dot"></span><span>${res.status} ${res.statusText || 'Error'}</span>`;
      } else if (res.status >= 500) {
        badge.className = 'li-status-badge li-status-5xx';
        badge.innerHTML = `<span class="li-badge-dot"></span><span>${res.status} Server Error</span>`;
      } else {
        badge.className = 'li-status-badge li-status-error';
        badge.innerHTML = `<span class="li-badge-dot"></span><span>${res.statusText || 'Network Error'}</span>`;
      }
    });
  }

  /**
   * Wire buttons inside the interactive popup card
   */
  function attachCardActionHandlers(url, anchorText) {
    if (!activeCard) return;

    // 1. Copy URL
    const btnCopyUrl = activeCard.querySelector('#li-ctrl-copy-url');
    if (btnCopyUrl) {
      btnCopyUrl.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(url).then(() => {
          triggerButtonFeedback(btnCopyUrl, 'Copied!');
        });
      });
    }

    // 2. Clean URL (Strip UTM and tracking parameters)
    const btnCleanUrl = activeCard.querySelector('#li-ctrl-clean-url');
    if (btnCleanUrl) {
      btnCleanUrl.addEventListener('click', (e) => {
        e.stopPropagation();
        const cleanUrl = stripTrackingParams(url);
        navigator.clipboard.writeText(cleanUrl).then(() => {
          triggerButtonFeedback(btnCleanUrl, 'Cleaned!');
          showToast(`🧹 Copied Clean URL: ${truncateText(cleanUrl, 45)}`);
        });
      });
    }

    // 3. Copy Markdown
    const btnCopyMd = activeCard.querySelector('#li-ctrl-copy-md');
    if (btnCopyMd) {
      btnCopyMd.addEventListener('click', (e) => {
        e.stopPropagation();
        const md = `[${anchorText || url}](${url})`;
        navigator.clipboard.writeText(md).then(() => {
          triggerButtonFeedback(btnCopyMd, 'Copied!');
        });
      });
    }

    // 4. Re-Check Status
    const btnCheck = activeCard.querySelector('#li-ctrl-check');
    if (btnCheck) {
      btnCheck.addEventListener('click', (e) => {
        e.stopPropagation();
        btnCheck.classList.add('li-btn-loading');
        const badge = activeCard.querySelector('#li-card-badge');
        if (badge) {
          badge.className = 'li-status-badge li-status-loading';
          badge.innerHTML = `<span class="li-badge-dot li-dot-pulse"></span><span>Checking...</span>`;
        }
        fetchAndDisplayLinkStatus(url, () => {
          btnCheck.classList.remove('li-btn-loading');
          triggerButtonFeedback(btnCheck, 'Checked!');
        });
      });
    }

    // 5. Highlight Instances on Page
    const btnHighlight = activeCard.querySelector('#li-ctrl-highlight');
    if (btnHighlight) {
      btnHighlight.addEventListener('click', (e) => {
        e.stopPropagation();
        const matchingLinks = Array.from(document.querySelectorAll('a')).filter(a => a.href === url);
        matchingLinks.forEach((a) => {
          a.classList.add('li-flash-target');
        });
        triggerButtonFeedback(btnHighlight, `${matchingLinks.length} Found`);
        showToast(`⚡ Highlighted ${matchingLinks.length} matching link(s) on page`);

        setTimeout(() => {
          matchingLinks.forEach(a => a.classList.remove('li-flash-target'));
        }, 3000);
      });
    }
  }

  function triggerButtonFeedback(btn, feedbackText) {
    const label = btn.querySelector('.li-btn-label');
    const originalText = label ? label.textContent : '';
    btn.classList.add('li-btn-success');
    if (label) label.textContent = feedbackText;

    setTimeout(() => {
      btn.classList.remove('li-btn-success');
      if (label) label.textContent = originalText;
    }, 1500);
  }

  function createCardElement() {
    const card = document.createElement('div');
    card.id = 'link-inspector-card';
    card.innerHTML = `
      <div class="li-card-header">
        <div class="li-card-title-group">
          <span>🔍</span>
          <span class="li-card-title">Link Inspector</span>
        </div>
        <div class="li-header-right">
          <div id="li-card-badge" class="li-status-badge li-status-loading">
            <span class="li-badge-dot"></span><span>Checking...</span>
          </div>
          <button id="li-btn-close-card" class="li-btn-close" title="Close (Esc)">✕</button>
        </div>
      </div>
      <div class="li-card-body"></div>
    `;

    // Mouse bridge: when mouse moves into card, keep it open
    card.addEventListener('mouseenter', () => {
      isMouseOverCard = true;
      clearTimeout(closeTimeout);
    });

    card.addEventListener('mouseleave', () => {
      isMouseOverCard = false;
      clearTimeout(closeTimeout);
      closeTimeout = setTimeout(() => {
        hideInspectorCard();
      }, 300);
    });

    // Close button listener
    const closeBtn = card.querySelector('#li-btn-close-card');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideInspectorCard();
      });
    }

    return card;
  }

  function hideInspectorCard() {
    clearTimeout(openTimeout);
    clearTimeout(closeTimeout);
    currentTargetLink = null;
    isMouseOverCard = false;
    if (activeCard) {
      activeCard.classList.remove('li-visible');
    }
  }

  /**
   * Update body cursor class based on pointerStyle preference
   */
  function updatePointerStyleClass() {
    document.body.classList.remove('li-cursor-magnifier', 'li-cursor-crosshair', 'li-cursor-target');
    if (isInspectorEnabled && pointerStyle && pointerStyle !== 'default') {
      document.body.classList.add(`li-cursor-${pointerStyle}`);
    }
  }

  /**
   * Strip tracking / marketing tokens from URL
   */
  function stripTrackingParams(rawUrl) {
    try {
      const u = new URL(rawUrl);
      TRACKING_PARAMS.forEach((param) => {
        u.searchParams.delete(param);
      });
      return u.toString();
    } catch (e) {
      return rawUrl;
    }
  }

  function checkHasTrackingParams(rawUrl) {
    try {
      const u = new URL(rawUrl);
      return TRACKING_PARAMS.some(p => u.searchParams.has(p));
    } catch (e) {
      return false;
    }
  }

  /**
   * Apply Visual Highlighting Classes to <a> Elements
   */
  function applyLinkHighlights() {
    const links = document.querySelectorAll('a[href]');
    links.forEach((a) => {
      removeLinkHighlightFromElement(a);

      const url = a.href;
      const rel = (a.getAttribute('rel') || '').toLowerCase();
      const external = isUrlExternal(url);

      if (highlightConfig.nofollow && (rel.includes('nofollow') || rel.includes('sponsored'))) {
        a.classList.add('li-highlight-nofollow');
      } else if (highlightConfig.external && external) {
        a.classList.add('li-highlight-external');
      } else if (highlightConfig.internal && !external) {
        a.classList.add('li-highlight-internal');
      }
    });
  }

  function removeLinkHighlights() {
    const highlighted = document.querySelectorAll('.li-highlight-internal, .li-highlight-external, .li-highlight-nofollow, .li-highlight-broken');
    highlighted.forEach(removeLinkHighlightFromElement);
  }

  function removeLinkHighlightFromElement(el) {
    el.classList.remove('li-highlight-internal', 'li-highlight-external', 'li-highlight-nofollow', 'li-highlight-broken');
  }

  /**
   * Summarize links on page
   */
  function getPageLinksSummary() {
    const links = Array.from(document.querySelectorAll('a[href]'));
    let internal = 0;
    let external = 0;
    let nofollow = 0;
    let insecure = 0;
    let weakSeo = 0;

    const linkList = links.map((a) => {
      const href = a.href;
      const rawHref = a.getAttribute('href') || '';
      const isExt = isUrlExternal(href);
      const rel = (a.getAttribute('rel') || '').toLowerCase();
      const isNoFollow = rel.includes('nofollow') || rel.includes('sponsored');
      const isInsec = href.startsWith('http://');
      const text = (a.innerText || a.title || getImgAltInLink(a) || '').trim();
      const isWeak = !text || GENERIC_ANCHOR_TEXTS.includes(text.toLowerCase()) || rawHref === '#';

      if (isExt) external++; else internal++;
      if (isNoFollow) nofollow++;
      if (isInsec) insecure++;
      if (isWeak) weakSeo++;

      return {
        url: href,
        text: text.slice(0, 100),
        target: a.getAttribute('target') || '_self',
        rel: a.getAttribute('rel') || '',
        isExternal: isExt,
        isNofollow: isNoFollow,
        isInsecure: isInsec,
        isWeakSeo: isWeak,
        hasTracking: checkHasTrackingParams(href)
      };
    });

    return {
      total: links.length,
      internal,
      external,
      nofollow,
      insecure,
      weakSeo,
      links: linkList
    };
  }

  /**
   * Scan & check all page links
   */
  async function scanAndCheckAllPageLinks() {
    const summary = getPageLinksSummary();
    const urls = summary.links.map(l => l.url);

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'BATCH_CHECK_STATUS', urls }, (statusMap) => {
        let brokenCount = 0;
        let redirectCount = 0;

        summary.links.forEach((item) => {
          const st = statusMap[item.url] || { status: 0, ok: false, statusText: 'Error' };
          item.status = st.status;
          item.statusText = st.statusText;
          item.ok = st.ok;
          item.redirected = st.redirected;
          item.finalUrl = st.finalUrl;

          if (st.status >= 300 && st.status < 400) {
            redirectCount++;
          }

          if (!st.ok && st.status !== 200 && !st.isSpecial) {
            brokenCount++;
            // Highlight broken link on DOM
            const domElements = Array.from(document.querySelectorAll('a')).filter(a => a.href === item.url);
            domElements.forEach(el => el.classList.add('li-highlight-broken'));
          }
        });

        summary.broken = brokenCount;
        summary.redirects = redirectCount;
        showToast(`Scan Complete: ${brokenCount} broken, ${redirectCount} redirects`);
        resolve(summary);
      });
    });
  }

  /**
   * Helper Utilities
   */
  function isUrlExternal(url) {
    try {
      const linkHost = new URL(url).hostname;
      return linkHost !== window.location.hostname;
    } catch (e) {
      return false;
    }
  }

  function getImgAltInLink(a) {
    const img = a.querySelector('img');
    return img ? img.getAttribute('alt') || '' : '';
  }

  function truncateText(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen) + '…' : str;
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function showToast(text) {
    let toast = document.getElementById('link-inspector-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'link-inspector-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add('li-toast-active');
    setTimeout(() => toast.classList.remove('li-toast-active'), 3000);
  }
})();
