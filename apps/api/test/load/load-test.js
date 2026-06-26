import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * Load Test — Main performance test
 * Target: 1000 concurrent users across key API endpoints.
 * Run: k6 run test/load/load-test.js
 */

// Custom metrics
const errorRate = new Rate('custom_error_rate');
const animalListDuration = new Trend('animal_list_duration');
const heatmapDuration = new Trend('heatmap_duration');
const reportCreateDuration = new Trend('report_create_duration');
const dashboardDuration = new Trend('dashboard_duration');
const adoptionDuration = new Trend('adoption_duration');

export const options = {
  stages: [
    { duration: '2m', target: 1000 },  // Ramp up to 1000 VUs over 2 minutes
    { duration: '5m', target: 1000 },  // Sustain 1000 VUs for 5 minutes
    { duration: '1m', target: 0 },     // Ramp down over 1 minute
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95th percentile < 500ms
    http_req_failed: ['rate<0.01'],     // Error rate < 1%
    http_reqs: ['rate>100'],            // Throughput > 100 req/s
    custom_error_rate: ['rate<0.01'],
    animal_list_duration: ['p(95)<500'],
    heatmap_duration: ['p(95)<500'],
    report_create_duration: ['p(95)<500'],
    dashboard_duration: ['p(95)<500'],
    adoption_duration: ['p(95)<500'],
  },
  tags: {
    testType: 'load',
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Simulated auth token (in real tests, obtain via login flow)
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

/**
 * Traffic distribution:
 * - GET /api/v1/animals        — 40%
 * - GET /api/v1/map/heatmap    — 20%
 * - POST /api/v1/reports       — 15%
 * - GET /api/v1/dashboard/overview — 15%
 * - GET /api/v1/adoption/profiles  — 10%
 */
export default function () {
  const roll = Math.random();

  if (roll < 0.4) {
    testAnimalList();
  } else if (roll < 0.6) {
    testHeatmap();
  } else if (roll < 0.75) {
    testCreateReport();
  } else if (roll < 0.9) {
    testDashboard();
  } else {
    testAdoptionProfiles();
  }

  sleep(1);
}

function testAnimalList() {
  group('GET /api/v1/animals', () => {
    const page = Math.floor(Math.random() * 10) + 1;
    const types = ['DOG', 'CAT'];
    const type = types[Math.floor(Math.random() * types.length)];

    const res = http.get(
      `${BASE_URL}/api/v1/animals?page=${page}&limit=20&type=${type}`,
      { headers, tags: { name: 'animal-list' } }
    );

    animalListDuration.add(res.timings.duration);

    const success = check(res, {
      'animals list returns 200': (r) => r.status === 200,
      'response has data array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data) || body.success === true;
        } catch {
          return false;
        }
      },
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
  });
}

function testHeatmap() {
  group('GET /api/v1/map/heatmap', () => {
    // Simulate Bangkok bounding box with slight variations
    const lat = 13.7 + Math.random() * 0.2;
    const lng = 100.4 + Math.random() * 0.2;
    const bounds = `${lat - 0.05},${lng - 0.05},${lat + 0.05},${lng + 0.05}`;

    const res = http.get(
      `${BASE_URL}/api/v1/map/heatmap?bounds=${bounds}`,
      { headers, tags: { name: 'heatmap' } }
    );

    heatmapDuration.add(res.timings.duration);

    const success = check(res, {
      'heatmap returns 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
  });
}

function testCreateReport() {
  group('POST /api/v1/reports', () => {
    const reportTypes = ['STRAY_FOUND', 'INJURED', 'AGGRESSIVE', 'ABUSE'];
    const urgencyMap = {
      STRAY_FOUND: 'MEDIUM',
      INJURED: 'HIGH',
      AGGRESSIVE: 'HIGH',
      ABUSE: 'CRITICAL',
    };

    const type = reportTypes[Math.floor(Math.random() * reportTypes.length)];

    const payload = JSON.stringify({
      type,
      description: `Load test report - ${type} spotted at test location`,
      location: {
        lat: 13.7 + Math.random() * 0.2,
        lng: 100.4 + Math.random() * 0.2,
        address: 'Test location, Bangkok',
      },
      animalType: Math.random() > 0.5 ? 'DOG' : 'CAT',
      urgency: urgencyMap[type],
      anonymous: Math.random() > 0.7,
    });

    const res = http.post(`${BASE_URL}/api/v1/reports`, payload, {
      headers,
      tags: { name: 'create-report' },
    });

    reportCreateDuration.add(res.timings.duration);

    const success = check(res, {
      'report created (201 or 200)': (r) => r.status === 201 || r.status === 200,
      'response has tracking ID': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.trackingId;
        } catch {
          return false;
        }
      },
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
  });
}

function testDashboard() {
  group('GET /api/v1/dashboard/overview', () => {
    const districts = ['วัฒนา', 'บางกะปิ', 'จตุจักร', 'ลาดพร้าว', 'สาทร'];
    const district = districts[Math.floor(Math.random() * districts.length)];

    const res = http.get(
      `${BASE_URL}/api/v1/dashboard/overview?district=${encodeURIComponent(district)}`,
      { headers, tags: { name: 'dashboard' } }
    );

    dashboardDuration.add(res.timings.duration);

    const success = check(res, {
      'dashboard returns 200': (r) => r.status === 200,
      'response has stats': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data || body.success === true;
        } catch {
          return false;
        }
      },
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
  });
}

function testAdoptionProfiles() {
  group('GET /api/v1/adoption/profiles', () => {
    const sizes = ['SMALL', 'MEDIUM', 'LARGE'];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const childFriendly = Math.random() > 0.5;

    const res = http.get(
      `${BASE_URL}/api/v1/adoption/profiles?size=${size}&childFriendly=${childFriendly}&page=1&limit=20`,
      { headers, tags: { name: 'adoption-profiles' } }
    );

    adoptionDuration.add(res.timings.duration);

    const success = check(res, {
      'adoption profiles returns 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
  });
}
