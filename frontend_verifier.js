const http = require('http');

const routes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/member/my-coach',
  '/member/tasks',
  '/member/workouts',
  '/member/diet',
  '/member/progress',
  '/member/community',
  '/member/community/challenges',
  '/member/coaches',
  '/member/appointments',
  '/member/payments',
  '/member/profile',
  '/coach/dashboard',
  '/coach/clients',
  '/coach/tasks',
  '/coach/programs',
  '/coach/diet',
  '/coach/earnings',
  '/coach/progress',
  '/coach/inbox',
  '/coach/schedule',
  '/coach/profile',
  '/admin/dashboard',
  '/admin/users',
  '/admin/coaches',
  '/admin/content',
  '/admin/memberships',
  '/admin/payments',
  '/admin/reports',
  '/admin/settings'
];

async function verifyRoutes() {
  console.log('=== VERIFYING ALL FRONTEND PAGES & ROUTES ===\n');
  let passed = 0;
  let failed = 0;

  for (const r of routes) {
    try {
      const res = await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3000' + r, (resp) => {
          resolve(resp);
        });
        req.on('error', reject);
      });

      if (res.statusCode === 200) {
        passed++;
        console.log(`  [PASS] HTTP ${res.statusCode} -> ${r}`);
      } else {
        failed++;
        console.log(`  [WARN] HTTP ${res.statusCode} -> ${r}`);
      }
    } catch (e) {
      failed++;
      console.log(`  [ERR] ${r} -> ${e.message}`);
    }
  }

  console.log('\n========================================');
  console.log(`TOTAL FRONTEND ROUTES: ${routes.length}`);
  console.log(`COMPILED (HTTP 200):   ${passed}`);
  console.log(`FAILED:                ${failed}`);
  console.log(`SUCCESS RATE:          ${Math.round((passed / routes.length) * 100)}%`);
  console.log('========================================\n');
}

verifyRoutes();
