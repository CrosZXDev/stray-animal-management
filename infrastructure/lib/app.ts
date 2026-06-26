#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdnStack } from './cdn-stack';
import { EcsStack } from './ecs-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.AWS_REGION || 'ap-southeast-1',
};

// CDN Stack (shared across environments)
new CdnStack(app, 'StrayAnimalCdnStack', {
  env,
  description: 'CloudFront CDN distribution for stray animal image delivery',
  bucketName: process.env.AWS_S3_BUCKET || 'stray-animal-images',
});

// ECS Stacks per environment
const targetEnv = (process.env.DEPLOY_ENV || 'dev') as 'dev' | 'staging' | 'production';

new EcsStack(app, `StrayAnimalEcs-${targetEnv}`, {
  env,
  description: `ECS Fargate stack for stray animal system — ${targetEnv}`,
  environment: targetEnv,
});

app.synth();
