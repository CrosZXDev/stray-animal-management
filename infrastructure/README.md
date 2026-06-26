# Infrastructure — Stray Animal Management

AWS CDK infrastructure for the Stray Animal Management system. Currently manages the CloudFront CDN distribution for image delivery.

## Architecture

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│   Client     │────▶│   CloudFront    │────▶│   S3 Bucket          │
│   (Browser)  │     │   (HTTPS only)  │     │   stray-animal-images│
└──────────────┘     └─────────────────┘     └──────────────────────┘
                          │
                          ├─ Origin Access Control (OAC)
                          ├─ Cache: 24h TTL, immutable
                          ├─ 403 → 404 error mapping
                          └─ HTTP/2 + HTTP/3
```

## Prerequisites

1. **AWS CLI** configured with credentials:
   ```bash
   aws configure
   ```

2. **Node.js** >= 20 and **pnpm** >= 9

3. **AWS CDK CLI**:
   ```bash
   npm install -g aws-cdk
   ```

4. **S3 Bucket** `stray-animal-images` must already exist in `ap-southeast-1`

## Setup

```bash
cd infrastructure
pnpm install
```

## Deploy

### First-time setup (bootstrap CDK in your account/region)

```bash
cdk bootstrap aws://ACCOUNT_ID/ap-southeast-1
```

### Deploy the CDN stack

```bash
# Set environment variables
export AWS_REGION=ap-southeast-1
export AWS_S3_BUCKET=stray-animal-images

# Preview changes
pnpm run diff

# Deploy
pnpm run deploy
```

After deployment, the output will show the CloudFront distribution URL:

```
Outputs:
StrayAnimalCdnStack.DistributionDomainName = https://d1234567890.cloudfront.net
StrayAnimalCdnStack.DistributionId = E1234567890
```

Update your `.env` with the distribution URL:
```env
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

## Stack Details

### CdnStack (`StrayAnimalCdnStack`)

| Resource | Purpose |
|----------|---------|
| CloudFront Distribution | CDN for image delivery |
| Origin Access Control (OAC) | Secure S3 access without public bucket |
| Cache Policy | 24h default TTL, immutable for hashed filenames |
| Response Headers Policy | Security headers + Cache-Control: immutable |
| S3 Bucket Policy | Allows CloudFront to read objects |

### Cache Behavior

- **Default TTL**: 24 hours (86400 seconds)
- **Min TTL**: 1 hour
- **Max TTL**: 365 days
- **Cache-Control header**: `public, max-age=86400, immutable`
- **Compression**: Gzip + Brotli enabled

Images use timestamp-based keys (e.g., `animals/abc123/1718234567-photo.jpg`), making them effectively immutable — the same key always serves the same content.

### Error Handling

| Origin Status | Viewer Status | TTL | Reason |
|---------------|---------------|-----|--------|
| 403 | 404 | 5 min | S3 returns 403 for missing objects in private buckets |
| 404 | 404 | 5 min | Standard not found |

### Security

- **HTTPS only** — HTTP requests redirected to HTTPS
- **HSTS** — Strict-Transport-Security: max-age=31536000; includeSubdomains
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- No public bucket access — all traffic goes through CloudFront OAC

## Custom Domain (Optional)

To use a custom domain (e.g., `cdn.stray-animal.example.com`):

1. Request an ACM certificate in `us-east-1` (required for CloudFront):
   ```bash
   aws acm request-certificate \
     --domain-name cdn.stray-animal.example.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. Add the domain and certificate to the distribution in `cdn-stack.ts`:
   ```typescript
   domainNames: ['cdn.stray-animal.example.com'],
   certificate: acm.Certificate.fromCertificateArn(this, 'Cert', 'arn:aws:acm:us-east-1:...')
   ```

3. Create a CNAME DNS record pointing to the distribution domain.

## Cache Invalidation

To invalidate cached images (e.g., after deletion):

```bash
aws cloudfront create-invalidation \
  --distribution-id E1234567890 \
  --paths "/animals/abc123/*"
```

Note: Invalidations are rarely needed because image keys include timestamps and are effectively immutable.

## Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm run build` | Compile TypeScript |
| `pnpm run synth` | Synthesize CloudFormation template |
| `pnpm run diff` | Preview infrastructure changes |
| `pnpm run deploy` | Deploy stack to AWS |
| `pnpm run destroy` | Tear down the stack |

## Cost Estimate

CloudFront pricing for `ap-southeast-1` (Price Class 200):
- First 10 TB/month: ~$0.085/GB
- HTTP requests: ~$0.0090 per 10,000
- HTTPS requests: ~$0.0120 per 10,000

For a system with ~10,000 animal records with ~3 images each (avg 500KB):
- Storage: ~15 GB in S3
- Monthly transfer (estimated): ~50 GB → ~$4.25/month CDN cost
