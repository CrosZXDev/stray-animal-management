# Deployment Guide — ระบบจัดการสัตว์จรจัด

## Quick Start (Local Development)

```bash
# 1. Start databases
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Setup database
cd apps/api && npx prisma migrate deploy && npx prisma db seed
cd ../..

# 4. Run both apps
pnpm run dev
```

- Web: http://localhost:3000
- API: http://localhost:3001/api/v1
- Swagger: http://localhost:3001/api/docs

## Production-like Local Run (Docker)

```bash
# Build and run everything in containers
docker compose -f docker-compose.prod.yml up --build

# Run database migrations inside the API container
docker exec stray-animal-api sh -c "npx prisma migrate deploy"
```

## Deployment Architecture

```
Internet → ALB → Path Routing
                 ├── /api/* → ECS Fargate (API, port 3001)
                 └── /*     → ECS Fargate (Web, port 3000)

API → PostgreSQL+PostGIS (RDS)
API → Redis (ElastiCache)
API → S3 (images) → CloudFront (CDN)
```

## Environments

| Environment | Branch   | URL                              |
|-------------|----------|----------------------------------|
| dev         | local    | localhost:3000 / localhost:3001   |
| staging     | develop  | staging.stray-animal.example.com |
| production  | main     | app.stray-animal.example.com     |

## AWS Infrastructure Setup

### Prerequisites

1. AWS CLI configured
2. AWS CDK bootstrapped: `cdk bootstrap aws://ACCOUNT_ID/ap-southeast-1`
3. ECR repositories created:
   ```bash
   aws ecr create-repository --repository-name stray-animal-api
   aws ecr create-repository --repository-name stray-animal-web
   ```
4. SSM Parameters created:
   ```bash
   aws ssm put-parameter --name "/stray-animal-production/database-url" --type SecureString --value "postgresql://..."
   aws ssm put-parameter --name "/stray-animal-production/jwt-secret" --type SecureString --value "..."
   aws ssm put-parameter --name "/stray-animal-production/redis-url" --type SecureString --value "redis://..."
   ```

### Deploy Infrastructure

```bash
cd infrastructure
pnpm install

# Deploy CDN
DEPLOY_ENV=production pnpm run deploy -- StrayAnimalCdnStack

# Deploy ECS + RDS + Redis
DEPLOY_ENV=production pnpm run deploy -- StrayAnimalEcs-production
```

### Deploy Application (via CI/CD)

Push to `develop` → deploys to staging
Push to `main` → deploys to production

### Manual Deploy

```bash
# Login to ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com

# Build & push API
docker build -f apps/api/Dockerfile -t ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/stray-animal-api:latest .
docker push ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/stray-animal-api:latest

# Build & push Web
docker build -f apps/web/Dockerfile -t ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/stray-animal-web:latest .
docker push ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/stray-animal-web:latest

# Force new deployment
aws ecs update-service --cluster stray-animal-cluster-production --service stray-animal-api-service --force-new-deployment
aws ecs update-service --cluster stray-animal-cluster-production --service stray-animal-web-service --force-new-deployment
```

## GitHub Actions Secrets

Set these in your repository settings:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user key for CI/CD |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret |

## Health Checks

- API: `GET /api/v1/health` → returns `{ status: "ok" }`
- Web: `GET /` → returns 200

## Auto-scaling (Production)

- Min: 2 tasks, Max: 6 tasks
- Scale out: CPU > 70% for 30s
- Scale in: CPU < 70% for 60s
- Circuit breaker: auto-rollback on deployment failures

## Database Migrations

```bash
# In the API container or CI pipeline:
npx prisma migrate deploy
```

## Monitoring

- CloudWatch Container Insights (production)
- CloudWatch Logs: `/ecs/stray-animal-api`, `/ecs/stray-animal-web`
- ALB health check metrics
- ECS service CPU/Memory metrics
