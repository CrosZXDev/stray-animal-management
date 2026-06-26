import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface CdnStackProps extends cdk.StackProps {
  /**
   * Name of the existing S3 bucket containing images.
   */
  bucketName: string;
}

/**
 * CDK Stack for CloudFront distribution serving stray animal images from S3.
 *
 * Features:
 * - Origin Access Control (OAC) for private S3 bucket access
 * - Cache policy optimized for immutable hashed image filenames (24h TTL)
 * - Custom error responses (403 → 404 for missing images)
 * - HTTPS-only with HTTP→HTTPS redirect
 */
export class CdnStack extends cdk.Stack {
  public readonly distribution: cloudfront.Distribution;
  public readonly distributionDomainName: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: CdnStackProps) {
    super(scope, id, props);

    // Import existing S3 bucket
    const imageBucket = s3.Bucket.fromBucketName(
      this,
      'ImageBucket',
      props.bucketName,
    );

    // Create Origin Access Control for secure S3 access
    const oac = new cloudfront.S3OriginAccessControl(this, 'ImageOAC', {
      signing: cloudfront.Signing.SIGV4_ALWAYS,
      description: 'OAC for stray-animal-images S3 bucket',
    });

    // Custom cache policy for images
    // - max-age: 86400 (24 hours) for all images
    // - Hashed filenames (timestamp-based keys) are effectively immutable
    const imageCachePolicy = new cloudfront.CachePolicy(this, 'ImageCachePolicy', {
      cachePolicyName: 'StrayAnimalImageCachePolicy',
      comment: 'Cache policy for stray animal images — 24h TTL, immutable hashed keys',
      defaultTtl: cdk.Duration.hours(24),
      minTtl: cdk.Duration.hours(1),
      maxTtl: cdk.Duration.days(365),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
    });

    // Response headers policy — add Cache-Control immutable for hashed assets
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      'ImageResponseHeaders',
      {
        responseHeadersPolicyName: 'StrayAnimalImageHeaders',
        comment: 'Response headers for stray animal images',
        customHeadersBehavior: {
          customHeaders: [
            {
              header: 'Cache-Control',
              value: 'public, max-age=86400, immutable',
              override: true,
            },
          ],
        },
        securityHeadersBehavior: {
          contentTypeOptions: { override: true },
          frameOptions: {
            frameOption: cloudfront.HeadersFrameOption.DENY,
            override: true,
          },
          strictTransportSecurity: {
            accessControlMaxAge: cdk.Duration.days(365),
            includeSubdomains: true,
            override: true,
          },
        },
      },
    );

    // CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'ImageCdn', {
      comment: 'Stray Animal Image CDN',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(imageBucket, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: imageCachePolicy,
        responseHeadersPolicy,
        compress: true,
      },
      // Custom error responses: 403 (S3 Access Denied for missing objects) → 404
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: undefined,
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: undefined,
          ttl: cdk.Duration.minutes(5),
        },
      ],
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
      enabled: true,
    });

    // Grant CloudFront access to read from S3 bucket via bucket policy
    // (Required for OAC — the bucket must allow the distribution to read)
    this.addBucketPolicy(imageBucket, this.distribution);

    // Outputs
    this.distributionDomainName = new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL — use as AWS_CLOUDFRONT_URL env var',
      exportName: 'StrayAnimalCdnUrl',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID (for cache invalidation)',
      exportName: 'StrayAnimalCdnDistributionId',
    });
  }

  /**
   * Add a bucket policy allowing CloudFront OAC to read objects.
   * This is needed because the bucket is private (no public access).
   */
  private addBucketPolicy(bucket: s3.IBucket, distribution: cloudfront.Distribution): void {
    const bucketPolicy = new s3.BucketPolicy(this, 'ImageBucketPolicy', {
      bucket,
    });

    bucketPolicy.document.addStatements(
      new iam.PolicyStatement({
        sid: 'AllowCloudFrontOACAccess',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [bucket.arnForObjects('*')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${cdk.Aws.ACCOUNT_ID}:distribution/${distribution.distributionId}`,
          },
        },
      }),
    );
  }
}
