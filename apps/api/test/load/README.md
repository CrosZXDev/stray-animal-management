# Load Testing — Stray Animal Management API

Performance tests using [k6](https://k6.io/) to validate the API under load.

## Prerequisites

### Install k6

**macOS (Homebrew):**
```bash
brew install k6
```

**Windows (Chocolatey):**
```bash
choco install k6
```

**Windows (winget):**
```bash
winget install k6 --source winget
```

**Linux (Debian/Ubuntu):**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Docker:**
```bash
docker run --rm -i grafana/k6 run - <test/load/load-test.js
```

## Test Scripts

| Script | Purpose | VUs | Duration |
|--------|---------|-----|----------|
| `smoke.js` | Quick sanity check | 1 | 30s |
| `load-test.js` | Main load test (target: 1000 VUs) | 1000 | ~8 min |
| `stress-test.js` | Find breaking point | 2000 | ~12 min |

## Running Tests

Make sure the API is running before executing tests.

### Smoke Test
Quick validation that the API is healthy:
```bash
k6 run test/load/smoke.js
```

### Load Test (Main)
Validates the API can handle 1000 concurrent users:
```bash
k6 run test/load/load-test.js
```

Or using the npm script from `apps/api`:
```bash
pnpm test:load
```

### Stress Test
Pushes beyond capacity to find the breaking point:
```bash
k6 run test/load/stress-test.js
```

### Custom Base URL
All tests default to `http://localhost:3000`. Override with:
```bash
k6 run -e BASE_URL=https://staging.example.com test/load/load-test.js
```

### With Auth Token
Supply a real JWT token for authenticated endpoints:
```bash
k6 run -e AUTH_TOKEN=eyJhbG... test/load/load-test.js
```

## Thresholds

### Load Test Thresholds
| Metric | Target |
|--------|--------|
| `http_req_duration` p95 | < 500ms |
| `http_req_failed` rate | < 1% |
| `http_reqs` rate | > 100 req/s |

### Stress Test Thresholds (lenient)
| Metric | Target |
|--------|--------|
| `http_req_duration` p95 | < 2000ms |
| `stress_error_rate` | < 10% |

## Interpreting Results

After a run, k6 outputs a summary like:

```
     ✓ animals list returns 200
     ✓ response time < 500ms

     checks.........................: 98.5%  ✓ 15234  ✗ 231
     http_req_duration..............: avg=120ms  min=5ms  med=95ms  max=2.1s  p(90)=310ms  p(95)=450ms
     http_req_failed................: 0.8%   ✓ 120    ✗ 14880
     http_reqs......................: 15000  156.25/s
```

**Key metrics to watch:**

- **http_req_duration p(95):** 95% of requests should complete within the threshold. High values indicate bottlenecks.
- **http_req_failed:** Percentage of failed requests. Spikes indicate the server is overloaded.
- **http_reqs rate:** Requests per second throughput. Should exceed 100 req/s for the load test.
- **checks:** Percentage of assertions that passed. Low values indicate response format issues.

**Common issues:**

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| High p95, low error rate | Slow queries | Add database indexes, optimize queries |
| High error rate at high VUs | Connection pool exhaustion | Increase pool size, add connection limits |
| 429 responses | Rate limiting triggered | Adjust rate limiter for expected traffic |
| Gradual slowdown | Memory leak | Profile with heap snapshots |
| Sudden 5xx spike | OOM or crash | Check resource limits, add graceful degradation |

## Traffic Distribution (Load Test)

| Endpoint | Weight | Notes |
|----------|--------|-------|
| `GET /api/v1/animals` | 40% | Paginated list with filters |
| `GET /api/v1/map/heatmap` | 20% | Spatial aggregation query |
| `POST /api/v1/reports` | 15% | Write operation |
| `GET /api/v1/dashboard/overview` | 15% | Cached aggregation |
| `GET /api/v1/adoption/profiles` | 10% | Filtered list |

## Output Formats

Export results to JSON for analysis:
```bash
k6 run --out json=results.json test/load/load-test.js
```

Export to InfluxDB for Grafana dashboards:
```bash
k6 run --out influxdb=http://localhost:8086/k6 test/load/load-test.js
```

## CI Integration

For CI pipelines, use the `--quiet` flag and rely on thresholds for pass/fail:
```bash
k6 run --quiet test/load/smoke.js
```

k6 exits with code 99 if any threshold fails, which can be used for CI gating.
