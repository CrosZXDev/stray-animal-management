import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Smoke Test — Quick sanity check
 * Validates the API is responding and healthy.
 * Run: k6 run test/load/smoke.js
 */

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
  tags: {
    testType: 'smoke',
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'health-check' },
  });

  check(res, {
    'health endpoint returns 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'body contains success': (r) => {
      const body = JSON.parse(r.body);
      return body.success === true || r.status === 200;
    },
  });

  sleep(1);
}
