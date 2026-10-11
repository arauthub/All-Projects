// API Pulse Pro - Test Playground Script

(function () {
  const consoleEl = document.getElementById('test-console');

  function logOutput(msg) {
    const time = new Date().toLocaleTimeString();
    consoleEl.textContent = `[${time}] ${msg}\n\n` + consoleEl.textContent;
  }

  document.getElementById('btn-clear-console')?.addEventListener('click', () => {
    consoleEl.textContent = '// Console cleared.';
  });

  // JWT Helper for realistic auth tokens
  function createMockJwt(email) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: 'usr_94821',
      email: email,
      role: 'Staff Engineer',
      permissions: ['api:read', 'api:write', 'admin:access'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 * 24 // 24 hours
    }));
    return `${header}.${payload}.MOCK_SIGNATURE_HASH_${Date.now()}`;
  }

  // Pre-seed mock rules into API Pulse if empty
  window.__API_PULSE_MOCKS__ = window.__API_PULSE_MOCKS__ || [];
  if (window.__API_PULSE_MOCKS__.length === 0) {
    window.__API_PULSE_MOCKS__.push(
      {
        id: 'mock_test_login',
        enabled: true,
        urlPattern: '/api/v1/auth/login',
        method: 'POST',
        statusCode: 200,
        delayMs: 120,
        responseBody: JSON.stringify({
          success: true,
          token: createMockJwt('alex.engineer@example.com'),
          user: { id: 'usr_94821', email: 'alex.engineer@example.com', role: 'Staff Engineer' }
        }, null, 2)
      },
      {
        id: 'mock_test_checkout',
        enabled: true,
        urlPattern: '/api/v1/orders/checkout',
        method: 'POST',
        statusCode: 201,
        delayMs: 250,
        responseBody: JSON.stringify({
          status: 'success',
          confirmationNumber: 'CHK-948210',
          totalPaid: 159.00,
          currency: 'USD',
          estimatedDelivery: '2026-10-15T10:00:00Z'
        }, null, 2)
      },
      {
        id: 'mock_test_gql',
        enabled: true,
        urlPattern: '/graphql',
        method: 'POST',
        statusCode: 200,
        delayMs: 100,
        responseBody: JSON.stringify({
          data: {
            addComment: {
              id: 'comment_7721',
              author: { name: 'Alex Engineer', avatar: 'https://avatar.dev/alex' },
              createdAt: '2026-10-11T14:30:00Z'
            }
          }
        }, null, 2)
      },
      {
        id: 'mock_test_slow',
        enabled: true,
        urlPattern: '/api/v1/analytics/heavy-report',
        method: 'POST',
        statusCode: 200,
        delayMs: 1500,
        responseBody: JSON.stringify({
          reportId: 'rep_monthly_098',
          metrics: { p50: 34, p95: 180, errorRate: 0.002, totalRequests: 1420930 }
        }, null, 2)
      },
      {
        id: 'mock_test_err',
        enabled: true,
        urlPattern: '/api/v1/payments/charge',
        method: 'POST',
        statusCode: 500,
        delayMs: 200,
        responseBody: JSON.stringify({
          error: 'PaymentProcessorUnavailable',
          message: 'The upstream payment gateway timed out (500). Please retry.',
          code: 'GATEWAY_ERROR'
        }, null, 2)
      },
      {
        id: 'mock_test_get_users',
        enabled: true,
        urlPattern: '/api/v1/users',
        method: 'GET',
        statusCode: 200,
        delayMs: 80,
        responseBody: JSON.stringify({
          total: 2,
          users: [
            { id: 1, name: 'Alice Developer', role: 'Frontend Lead' },
            { id: 2, name: 'Bob Systems', role: 'DevOps Architect' }
          ]
        }, null, 2)
      },
      {
        id: 'mock_test_profile',
        enabled: true,
        urlPattern: '/api/v1/profile/settings',
        method: 'PUT',
        statusCode: 200,
        delayMs: 90,
        responseBody: JSON.stringify({ updated: true, settings: { theme: 'dark', autoSave: true } }, null, 2)
      },
      {
        id: 'mock_test_del',
        enabled: true,
        urlPattern: '/api/v1/items/42',
        method: 'DELETE',
        statusCode: 204,
        delayMs: 50,
        responseBody: ''
      }
    );
  }

  // 1. User Login (POST)
  document.getElementById('btn-fire-login')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;

    try {
      // Mocked endpoint that fetch() will intercept
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Platform': 'Chrome Extension Test Lab'
        },
        body: JSON.stringify({ email, password, clientVersion: '2.4.0' })
      });

      let data;
      try { data = await res.json(); } catch (_) {
        data = {
          success: true,
          token: createMockJwt(email),
          user: { id: 'usr_94821', email, role: 'Staff Engineer' }
        };
      }
      logOutput(`POST /api/v1/auth/login -> Status ${res.status}\n${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      logOutput(`POST /api/v1/auth/login failed: ${err.message}`);
    }
  });

  // 2. Checkout (POST)
  document.getElementById('btn-fire-checkout')?.addEventListener('click', async () => {
    const payload = {
      orderId: 'ord_' + Math.floor(Math.random() * 90000 + 10000),
      items: [
        { id: 'sku_pro_lens', name: 'API Pulse Pro License', qty: 1, price: 99.00 },
        { id: 'sku_cloud_sync', name: 'Team Workspace Add-on', qty: 5, price: 12.00 }
      ],
      billingAddress: {
        country: 'US',
        state: 'CA',
        city: 'San Francisco',
        postal: '94107'
      },
      paymentMethod: 'pm_card_visa',
      total: 159.00,
      currency: 'USD'
    };

    try {
      const res = await fetch('/api/v1/orders/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + createMockJwt('alex.engineer@example.com'),
          'X-Idempotency-Key': 'idemp_' + Date.now()
        },
        body: JSON.stringify(payload)
      });
      const data = await res.text();
      logOutput(`POST /api/v1/orders/checkout -> Status ${res.status}\n${data}`);
    } catch (err) {
      logOutput(`POST /api/v1/orders/checkout: ${err.message}`);
    }
  });

  // 3. GraphQL Mutation (POST)
  document.getElementById('btn-fire-graphql')?.addEventListener('click', async () => {
    const gqlBody = {
      operationName: 'AddComment',
      query: `mutation AddComment($postId: ID!, $text: String!) {
  addComment(postId: $postId, text: $text) {
    id
    author { name avatar }
    createdAt
  }
}`,
      variables: {
        postId: 'post_8492',
        text: 'API Pulse Pro is an incredible inspector! Testing GraphQL interception.'
      }
    };

    try {
      const res = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GraphQL-Client': 'Apollo/v3.8'
        },
        body: JSON.stringify(gqlBody)
      });
      const data = await res.text();
      logOutput(`POST /graphql (AddComment) -> Status ${res.status}\n${data}`);
    } catch (err) {
      logOutput(`POST /graphql: ${err.message}`);
    }
  });

  // 4. Slow POST
  document.getElementById('btn-fire-slow')?.addEventListener('click', async () => {
    logOutput('Triggering slow request (1.5s delay)...');
    const t0 = performance.now();
    try {
      const res = await fetch('/api/v1/analytics/heavy-report?range=30d&format=json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: ['latency', 'throughput', 'error_rate'], granularity: '1h' })
      });
      const data = await res.text();
      const dur = Math.round(performance.now() - t0);
      logOutput(`Slow POST finished in ${dur}ms -> Status ${res.status}`);
    } catch (err) {
      const dur = Math.round(performance.now() - t0);
      logOutput(`Slow POST completed after ${dur}ms: ${err.message}`);
    }
  });

  // 5. Failed POST (500 Error)
  document.getElementById('btn-fire-error')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/v1/payments/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 9999, currency: 'EUR', cardToken: 'tok_invalid_charge' })
      });
      const data = await res.text();
      logOutput(`Failing POST -> Status ${res.status} ${res.statusText}\n${data}`);
    } catch (err) {
      logOutput(`Failing POST -> Network Error: ${err.message}`);
    }
  });

  // 6. GET / PUT / DEL
  document.getElementById('btn-fire-get')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/v1/users?limit=10&page=1', { method: 'GET' });
      const data = await res.text();
      logOutput(`GET /api/v1/users -> Status ${res.status}\n${data}`);
    } catch (err) {
      logOutput(`GET /api/v1/users: ${err.message}`);
    }
  });

  document.getElementById('btn-fire-put')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/v1/profile/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: 'dark', notifications: true, autoSave: true })
      });
      const data = await res.text();
      logOutput(`PUT /api/v1/profile/settings -> Status ${res.status}\n${data}`);
    } catch (err) {
      logOutput(`PUT /api/v1/profile/settings: ${err.message}`);
    }
  });

  document.getElementById('btn-fire-del')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/v1/items/42', { method: 'DELETE' });
      const data = await res.text();
      logOutput(`DELETE /api/v1/items/42 -> Status ${res.status}\n${data}`);
    } catch (err) {
      logOutput(`DELETE /api/v1/items/42: ${err.message}`);
    }
  });

  // 7. Auto Traffic Generator
  let autoTimer = null;
  document.getElementById('check-auto-traffic')?.addEventListener('change', (e) => {
    if (e.target.checked) {
      logOutput('Traffic simulation activated: firing API calls every 4 seconds.');
      const actions = [
        () => document.getElementById('btn-fire-login').click(),
        () => document.getElementById('btn-fire-checkout').click(),
        () => document.getElementById('btn-fire-graphql').click(),
        () => document.getElementById('btn-fire-get').click()
      ];
      autoTimer = setInterval(() => {
        const randAct = actions[Math.floor(Math.random() * actions.length)];
        randAct();
      }, 4000);
    } else {
      if (autoTimer) clearInterval(autoTimer);
      logOutput('Traffic simulation stopped.');
    }
  });
})();
