module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm run start',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/animals',
        'http://localhost:3000/reports/new',
        'http://localhost:3000/map',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 812,
          deviceScaleFactor: 3,
        },
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
