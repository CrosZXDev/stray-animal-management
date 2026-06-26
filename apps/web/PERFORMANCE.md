# Performance Guide — Stray Animal Management Web

## Target

- **Mobile Lighthouse Performance Score**: > 80
- **Accessibility Score**: > 90 (warning threshold)
- **Best Practices Score**: > 90 (warning threshold)
- **SEO Score**: > 90 (warning threshold)

## Key Optimizations Applied

### Image Optimization
- Use `next/image` for all images (automatic WebP/AVIF, lazy loading, responsive sizes)
- Animal photos served via CDN (CloudFront) with optimized formats
- Placeholder blur images for perceived performance

### Code Splitting
- Next.js App Router automatic route-based code splitting
- Dynamic imports for heavy components (map, charts):
  ```tsx
  const MapView = dynamic(() => import('@/features/map/MapView'), {
    loading: () => <MapSkeleton />,
    ssr: false,
  });
  ```
- Leaflet and Recharts loaded only on pages that use them

### Font Optimization
- Use `next/font` for self-hosted fonts (no external requests)
- Font display: swap for fast text rendering
  ```tsx
  import { Noto_Sans_Thai } from 'next/font/google';
  const notoSansThai = Noto_Sans_Thai({ subsets: ['thai'], display: 'swap' });
  ```

### Bundle Size
- Tree-shaking via ES modules
- Only import specific icons from `@heroicons/react`
- Avoid importing full libraries (e.g., `import { BarChart } from 'recharts'`)

### Rendering Strategy
- Static pages where possible (animal listing with ISR)
- Server Components by default (reduce client JS)
- Client Components only for interactivity

### Caching
- HTTP caching headers for API responses
- Next.js Data Cache for server-side fetches
- Service Worker for offline map tiles (future)

## Running Lighthouse Locally

### Prerequisites
- Chrome/Chromium installed
- App built and running locally

### Steps

```bash
# 1. Build the production app
pnpm run build

# 2. Run Lighthouse CI (starts server automatically)
pnpm run lighthouse

# 3. Or run mobile-specific audit
pnpm run lighthouse:mobile
```

### Manual Audit (Chrome DevTools)
1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Select **Mobile** device
4. Check **Performance** category
5. Click **Analyze page load**

## Common Issues and Fixes

### Low Performance Score

| Issue | Fix |
|-------|-----|
| Large images | Use `next/image` with `sizes` prop, serve WebP |
| Unused JavaScript | Dynamic import heavy components, check bundle analyzer |
| Render-blocking resources | Ensure fonts use `display: swap`, defer non-critical CSS |
| Large DOM size | Virtualize long lists (animal cards), paginate results |
| Slow server response (TTFB) | Check API latency, enable ISR/caching |
| Layout shifts (CLS) | Set explicit `width`/`height` on images, reserve space for dynamic content |

### Low Accessibility Score

| Issue | Fix |
|-------|-----|
| Missing alt text | Add descriptive `alt` to all `<Image>` components |
| Low contrast | Ensure text meets WCAG AA (4.5:1 ratio) |
| Missing labels | Add `aria-label` or `<label>` to form inputs |
| Missing landmarks | Use semantic HTML (`<main>`, `<nav>`, `<header>`) |

### Low SEO Score

| Issue | Fix |
|-------|-----|
| Missing meta description | Add `metadata` export in layout/page files |
| Missing viewport meta | Already handled by Next.js |
| Non-crawlable links | Use `<Link>` component, avoid JS-only navigation |

## Bundle Analysis

To analyze the production bundle:

```bash
# Install analyzer (if not already)
pnpm add -D @next/bundle-analyzer

# Run with analysis enabled
ANALYZE=true pnpm run build
```

Configure in `next.config.js`:
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer(nextConfig);
```

## CI Integration

Lighthouse CI runs automatically in the GitHub Actions pipeline. It:
1. Builds the production app
2. Starts the server
3. Audits 4 key pages (home, animals, reports/new, map)
4. Fails the build if mobile performance < 80
5. Uploads results to temporary public storage for review

See `.github/workflows/ci.yml` for the pipeline configuration.
