// mysite.js - small helpers

document.addEventListener('DOMContentLoaded', function () {
  // Intercept theme change forms inside dropdowns
  document.querySelectorAll('form[action$="set-theme/"]').forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var data = new FormData(form);
      fetch(form.action, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: data
      }).then(function(resp){
        if (!resp.ok) throw new Error('Network response was not ok');
        // update body class
        var theme = data.get('theme') || 'light';
        document.body.classList.remove('light','dark');
        document.body.classList.add(theme);
        showToast('Theme updated', 'Your theme has been updated to ' + theme + '.');
      }).catch(function(err){
        console.error(err);
        showToast('Error', 'Could not update theme.');
      });
    });
  });

  function showToast(title, message) {
    // create container if not exists
    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.position = 'fixed';
      container.style.top = '1rem';
      container.style.right = '1rem';
      container.style.zIndex = 1080;
      document.body.appendChild(container);
    }

    var toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = '\n+      <div class="toast-header">\n+        <strong class="me-auto">' + escapeHtml(title) + '</strong>\n+        <small class="text-muted">just now</small>\n+        <button type="button" class="btn-close ms-2 mb-1" data-bs-dismiss="toast" aria-label="Close"></button>\n+      </div>\n+      <div class="toast-body">' + escapeHtml(message) + '</div>\n+';

    container.appendChild(toastEl);
    var bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
    bsToast.show();
    // cleanup after hidden
    toastEl.addEventListener('hidden.bs.toast', function () { toastEl.remove(); });
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

});
