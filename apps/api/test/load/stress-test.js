import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * Stress Test — Beyond capacity
 * Ramps to 2000 VUs to find the API breaking point.
 * Focuses on write operations (reports, adoptions).
 * Run: k6 run test/load/stress-test.js
 */

// Custom metrics
const errorRate = new Rate('stress_error_rate');
const breakingPointVUs = Counter('breaking_point_reached');
const reportWriteDuration = new Trend('report_write_duration');
const adoptionWriteDuration = new Trend('adoption_write_duration');

export const options = {
  stages: [
    { duration: '1m', target: 200 },    // Warm up
    { duration: '2m', target: 500 },    // Moderate load
    { duration: '2m', target: 1000 },   // High load
    { duration: '2m', target: 1500 },   // Very high load
    { duration: '2m', target: 2000 },   // Beyond capacity — find breaking point
    { duration: '2m', target: 2000 },   // Sustain peak
    { duration: '1m', target: 0 },      // Ramp down
  ],
  thresholds: {
    // Stress test thresholds are intentionally more lenient
    // The goal is to find the breaking point, not pass thresholds
    http_req_duration: ['p(95)<2000'],   // 2s tolerance for stress
    stress_error_rate: ['rate<0.10'],    // Up to 10% errors acceptable for stress
  },
  tags: {
    testType: 'stress',
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

/**
 * Stress test focuses on write-heavy operations:
 * - POST /api/v1/reports (create report) — 50%
 * - POST /api/v1/adoption/applications — 30%
 * - POST /api/v1/feeding-stations/:id/check-in — 20%
 */
export default function () {
  const roll = Math.random();

  if (roll < 0.5) {
    stressCreateReport();
  } else if (roll < 0.8) {
    stressAdoptionApplication();
  } else {
    stressFeedingCheckIn();
  }

  sleep(0.5);
}

function stressCreateReport() {
  group('STRESS: POST /api/v1/reports', () => {
    const reportTypes = ['STRAY_FOUND', 'INJURED', 'AGGRESSIVE', 'ABUSE', 'NOISE'];
    const type = reportTypes[Math.floor(Math.random() * reportTypes.length)];

    const payload = JSON.stringify({
      type,
      description: `Stress test - ${type} report at ${Date.now()}`,
      location: {
        lat: 13.65 + Math.random() * 0.3,
        lng: 100.35 + Math.random() * 0.3,
        address: `Stress test address ${Math.floor(Math.random() * 1000)}`,
        district: ['วัฒนา', 'บางกะปิ', 'จตุจักร'][Math.floor(Math.random() * 3)],
      },
      animalType: Math.random() > 0.5 ? 'DOG' : 'CAT',
      estimatedCount: Math.floor(Math.random() * 5) + 1,
      anonymous: Math.random() > 0.5,
      images: [],
    });

    const res = http.post(`${BASE_URL}/api/v1/reports`, payload, {
      headers,
      tags: { name: 'stress-create-report' },
    });

    reportWriteDuration.add(res.timings.duration);

    const success = check(res, {
      'report created': (r) => r.status === 201 || r.status === 200,
      'not rate limited (429)': (r) => r.status !== 429,
      'not server error (5xx)': (r) => r.status < 500,
    });

    errorRate.add(!success);

    if (res.status >= 500) {
      breakingPointVUs.add(1);
    }
  });
}

function stressAdoptionApplication() {
  group('STRESS: POST /api/v1/adoption/applications', () => {
    const animalId = Math.floor(Math.random() * 100) + 1;

    const payload = JSON.stringify({
      animalId: `ANM-20240101-${String(animalId).padStart(4, '0')}`,
      applicant: {
        name: `Stress Test User ${Date.now()}`,
        phone: `08${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        email: `stress-${Date.now()}@test.local`,
        address: 'Test address, Bangkok',
        housingType: ['HOUSE', 'CONDO', 'TOWNHOUSE'][Math.floor(Math.random() * 3)],
        hasYard: Math.random() > 0.5,
        hasOtherPets: Math.random() > 0.7,
        hasChildren: Math.random() > 0.6,
      },
      questionnaire: {
        experience: ['NONE', 'BASIC', 'EXPERIENCED'][Math.floor(Math.random() * 3)],
        hoursAlone: Math.floor(Math.random() * 8) + 2,
        reason: 'Stress test adoption application',
      },
    });

    const res = http.post(`${BASE_URL}/api/v1/adoption/applications`, payload, {
      headers,
      tags: { name: 'stress-adoption-apply' },
    });

    adoptionWriteDuration.add(res.timings.duration);

    const success = check(res, {
      'application submitted': (r) => r.status === 201 || r.status === 200,
      'not rate limited (429)': (r) => r.status !== 429,
      'not server error (5xx)': (r) => r.status < 500,
    });

    errorRate.add(!success);

    if (res.status >= 500) {
      breakingPointVUs.add(1);
    }
  });
}

function stressFeedingCheckIn() {
  group('STRESS: POST /api/v1/feeding-stations/:id/check-in', () => {
    const stationId = Math.floor(Math.random() * 50) + 1;

    const payload = JSON.stringify({
      foodType: ['DRY', 'WET', 'MIXED'][Math.floor(Math.random() * 3)],
      waterRefilled: Math.random() > 0.3,
      animalsPresent: Math.floor(Math.random() * 10) + 1,
      notes: `Stress check-in at ${new Date().toISOString()}`,
      location: {
        lat: 13.7 + Math.random() * 0.1,
        lng: 100.5 + Math.random() * 0.1,
      },
    });

    const res = http.post(
      `${BASE_URL}/api/v1/feeding-stations/${stationId}/check-in`,
      payload,
      { headers, tags: { name: 'stress-feeding-checkin' } }
    );

    const success = check(res, {
      'check-in recorded': (r) => r.status === 201 || r.status === 200,
      'not server error (5xx)': (r) => r.status < 500,
    });

    errorRate.add(!success);

    if (res.status >= 500) {
      breakingPointVUs.add(1);
    }
  });
}
