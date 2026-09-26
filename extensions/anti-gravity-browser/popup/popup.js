/**
 * Anti-Gravity Web Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const masterToggle = document.getElementById('master-toggle');
  const powerText = document.getElementById('power-text');
  const powerSubtext = document.getElementById('power-subtext');
  const statusBadge = document.getElementById('status-badge');

  const modeButtons = document.querySelectorAll('.mode-card');
  const toolButtons = document.querySelectorAll('.tool-btn');
  const dpadButtons = document.querySelectorAll('.dpad-btn');
  const gravityArrow = document.getElementById('gravity-arrow');
  const gravityDirLabel = document.getElementById('gravity-dir-label');
  const gravitySlider = document.getElementById('gravity-slider');
  const gravityStrengthVal = document.getElementById('gravity-strength-val');

  const statElements = document.getElementById('stat-elements');
  const statScore = document.getElementById('stat-score');
  const btnAudioToggle = document.getElementById('btn-audio-toggle');
  const audioIcon = document.getElementById('audio-icon');
  const btnRestore = document.getElementById('btn-restore');
  const btnTutorial = document.getElementById('btn-tutorial');
  const btnClosePopup = document.getElementById('btn-close-popup');
  const stageButtons = document.querySelectorAll('.stage-pill');

  let activeTabId = null;
  let currentGravity = { x: 0, y: 0, strength: 1.0, isZeroG: true };

  // Get active tab
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        activeTabId = tab.id;
        queryTabStatus();
      }
    } catch (e) {
      updateUIInactive();
    }
  } else {
    // Standalone preview fallback state
    updateUIInactive();
  }

  /**
   * Fetch current state from content script
   */
  async function queryTabStatus() {
    try {
      const res = await chrome.tabs.sendMessage(activeTabId, { action: 'GET_STATUS' });
      if (res) {
        updateUIFromState(res);
      }
    } catch (err) {
      // Content script may not be running yet or page is chrome://
      updateUIInactive();
    }
  }

  function updateUIInactive() {
    masterToggle.checked = false;
    statusBadge.textContent = 'INACTIVE';
    statusBadge.className = 'badge badge-inactive';
    powerText.textContent = 'Activate Anti-Gravity';
    powerSubtext.textContent = 'Float and play with page elements';
    statElements.textContent = '0';
    statScore.textContent = '0';
    updateCompass(0, 0, true);
  }

  function updateUIFromState(state) {
    masterToggle.checked = state.isActive;

    if (state.isActive) {
      statusBadge.textContent = 'ACTIVE';
      statusBadge.className = 'badge badge-active';
      powerText.textContent = 'Anti-Gravity Active';
      powerSubtext.textContent = 'Zero-G physics running on page';
    } else {
      updateUIInactive();
    }

    // Set Mode
    modeButtons.forEach((btn) => {
      if (btn.getAttribute('data-mode') === state.mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Set Stage
    if (state.stage) {
      stageButtons.forEach((btn) => {
        if (parseInt(btn.getAttribute('data-stage')) === state.stage) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    // Set Tool
    toolButtons.forEach((btn) => {
      if (btn.getAttribute('data-tool') === state.mouseTool) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Set Gravity
    if (state.gravity) {
      currentGravity = state.gravity;
      gravitySlider.value = state.gravity.strength;
      gravityStrengthVal.textContent = `${state.gravity.strength.toFixed(1)}x`;
      updateCompass(state.gravity.x, state.gravity.y, state.gravity.isZeroG);
    }

    // Set Stats
    statElements.textContent = state.totalElements || '0';
    statScore.textContent = state.mode === 'katamari' ? (state.absorbed || '0') : (state.score || '0');
    audioIcon.textContent = state.muted ? '🔇' : '🔊';
  }

  function updateCompass(x, y, isZeroG) {
    dpadButtons.forEach((btn) => btn.classList.remove('active-dir'));

    if (isZeroG || (x === 0 && y === 0)) {
      gravityArrow.style.transform = 'scale(0.3)';
      gravityArrow.style.opacity = '0.3';
      gravityDirLabel.textContent = 'ZERO-G';
      document.getElementById('dpad-zero')?.classList.add('active-dir');
    } else {
      const deg = Math.atan2(y, x) * (180 / Math.PI) - 90;
      gravityArrow.style.transform = `rotate(${deg}deg) scale(1)`;
      gravityArrow.style.opacity = '1';

      if (y > 0 && x === 0) {
        gravityDirLabel.textContent = 'DOWN';
        document.getElementById('dpad-down')?.classList.add('active-dir');
      } else if (y < 0 && x === 0) {
        gravityDirLabel.textContent = 'UP';
        document.getElementById('dpad-up')?.classList.add('active-dir');
      } else if (x < 0 && y === 0) {
        gravityDirLabel.textContent = 'LEFT';
        document.getElementById('dpad-left')?.classList.add('active-dir');
      } else if (x > 0 && y === 0) {
        gravityDirLabel.textContent = 'RIGHT';
        document.getElementById('dpad-right')?.classList.add('active-dir');
      }
    }
  }

  /**
   * Event Listeners
   */

  // Master Power Switch
  masterToggle.addEventListener('change', async () => {
    if (!activeTabId) return;

    try {
      const res = await chrome.tabs.sendMessage(activeTabId, { action: 'TOGGLE_ANTIGRAVITY' });
      queryTabStatus();
    } catch (err) {
      // Inject scripts if not loaded
      try {
        await chrome.scripting.insertCSS({
          target: { tabId: activeTabId },
          files: ['content/content.css']
        });
        await chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          files: ['lib/matter.min.js', 'content/content.js']
        });
        await chrome.tabs.sendMessage(activeTabId, { action: 'TOGGLE_ANTIGRAVITY' });
        queryTabStatus();
      } catch (injectErr) {
        console.warn('Cannot activate on this page:', injectErr);
        masterToggle.checked = false;
      }
    }
  });

  // Game Mode Selection
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const mode = e.currentTarget.getAttribute('data-mode');
      modeButtons.forEach((b) => b.classList.remove('active'));
      e.currentTarget.classList.add('active');

      if (activeTabId) {
        await chrome.tabs.sendMessage(activeTabId, { action: 'SET_MODE', mode }).catch(() => {});
        queryTabStatus();
      }
    });
  });

  // Stage / Difficulty Selection
  stageButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const stage = parseInt(e.currentTarget.getAttribute('data-stage'));
      stageButtons.forEach((b) => b.classList.remove('active'));
      e.currentTarget.classList.add('active');

      if (activeTabId) {
        await chrome.tabs.sendMessage(activeTabId, { action: 'SET_STAGE', stage }).catch(() => {});
        queryTabStatus();
      }
    });
  });

  // How to Play Tutorial Trigger
  if (btnTutorial) {
    btnTutorial.addEventListener('click', async () => {
      if (activeTabId) {
        try {
          await chrome.tabs.sendMessage(activeTabId, { action: 'SHOW_TUTORIAL' });
        } catch (e) {
          // If content script not injected yet, toggle power then show
          masterToggle.checked = true;
          masterToggle.dispatchEvent(new Event('change'));
          setTimeout(() => {
            chrome.tabs.sendMessage(activeTabId, { action: 'SHOW_TUTORIAL' }).catch(() => {});
          }, 500);
        }
      }
    });
  }

  // Mouse Tool Selection
  toolButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const tool = e.currentTarget.getAttribute('data-tool');
      toolButtons.forEach((b) => b.classList.remove('active'));
      e.currentTarget.classList.add('active');

      if (activeTabId) {
        await chrome.tabs.sendMessage(activeTabId, { action: 'SET_MOUSE_TOOL', tool }).catch(() => {});
      }
    });
  });

  // Gravity D-Pad Controls
  const setGravityVec = async (x, y, isZeroG) => {
    currentGravity.x = x;
    currentGravity.y = y;
    currentGravity.isZeroG = isZeroG;
    updateCompass(x, y, isZeroG);

    if (activeTabId) {
      await chrome.tabs.sendMessage(activeTabId, {
        action: 'SET_GRAVITY',
        x,
        y,
        strength: currentGravity.strength,
        isZeroG
      }).catch(() => {});
    }
  };

  document.getElementById('dpad-up').addEventListener('click', () => setGravityVec(0, -1, false));
  document.getElementById('dpad-down').addEventListener('click', () => setGravityVec(0, 1, false));
  document.getElementById('dpad-left').addEventListener('click', () => setGravityVec(-1, 0, false));
  document.getElementById('dpad-right').addEventListener('click', () => setGravityVec(1, 0, false));
  document.getElementById('dpad-zero').addEventListener('click', () => setGravityVec(0, 0, true));

  // Gravity Strength Slider
  gravitySlider.addEventListener('input', async (e) => {
    const val = parseFloat(e.target.value);
    currentGravity.strength = val;
    gravityStrengthVal.textContent = `${val.toFixed(1)}x`;

    if (activeTabId) {
      await chrome.tabs.sendMessage(activeTabId, {
        action: 'SET_GRAVITY',
        x: currentGravity.x,
        y: currentGravity.y,
        strength: val,
        isZeroG: currentGravity.isZeroG
      }).catch(() => {});
    }
  });

  // Audio Toggle
  btnAudioToggle.addEventListener('click', async () => {
    if (activeTabId) {
      const res = await chrome.tabs.sendMessage(activeTabId, { action: 'TOGGLE_SOUND' }).catch(() => null);
      if (res) {
        audioIcon.textContent = res.muted ? '🔇' : '🔊';
      }
    }
  });

  // Restore Webpage
  btnRestore.addEventListener('click', async () => {
    if (activeTabId) {
      await chrome.tabs.sendMessage(activeTabId, { action: 'RESTORE' }).catch(() => {});
      queryTabStatus();
    }
  });

  // Close Popup
  if (btnClosePopup) {
    btnClosePopup.addEventListener('click', () => {
      window.close();
    });
  }
});
