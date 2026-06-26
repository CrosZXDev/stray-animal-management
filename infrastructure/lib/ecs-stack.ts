import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface EcsStackProps extends cdk.StackProps {
  environment: 'dev' | 'staging' | 'production';
}

export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    const env = props.environment;
    const prefix = `stray-animal-${env}`;

    // ─── VPC ──────────────────────────────────────────────────────────────────
    const vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `${prefix}-vpc`,
      maxAzs: 2,
      natGateways: env === 'production' ? 2 : 1,
    });

    // ─── Security Groups ──────────────────────────────────────────────────────
    const albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc,
      description: 'ALB Security Group',
      allowAllOutbound: true,
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP redirect');

    const ecsSg = new ec2.SecurityGroup(this, 'EcsSg', {
      vpc,
      description: 'ECS Tasks Security Group',
      allowAllOutbound: true,
    });
    ecsSg.addIngressRule(albSg, ec2.Port.tcp(3000), 'From ALB to Web');
    ecsSg.addIngressRule(albSg, ec2.Port.tcp(3001), 'From ALB to API');

    const dbSg = new ec2.SecurityGroup(this, 'DbSg', {
      vpc,
      description: 'Database Security Group',
    });
    dbSg.addIngressRule(ecsSg, ec2.Port.tcp(5432), 'From ECS to PostgreSQL');

    const redisSg = new ec2.SecurityGroup(this, 'RedisSg', {
      vpc,
      description: 'Redis Security Group',
    });
    redisSg.addIngressRule(ecsSg, ec2.Port.tcp(6379), 'From ECS to Redis');

    // ─── RDS PostgreSQL + PostGIS ─────────────────────────────────────────────
    const dbInstance = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `${prefix}-db`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_3,
      }),
      instanceType: env === 'production'
        ? ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE)
        : ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [dbSg],
      databaseName: 'stray_animal',
      multiAz: env === 'production',
      allocatedStorage: 20,
      maxAllocatedStorage: env === 'production' ? 100 : 50,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(env === 'production' ? 14 : 7),
      deletionProtection: env === 'production',
      removalPolicy: env === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // ─── ElastiCache Redis ────────────────────────────────────────────────────
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnets', {
      description: `Redis subnet group for ${env}`,
      subnetIds: vpc.privateSubnets.map(s => s.subnetId),
      cacheSubnetGroupName: `${prefix}-redis-subnets`,
    });

    const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      clusterName: `${prefix}-redis`,
      engine: 'redis',
      cacheNodeType: env === 'production' ? 'cache.r6g.large' : 'cache.t4g.micro',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [redisSg.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName!,
      engineVersion: '7.1',
    });
    redisCluster.addDependency(redisSubnetGroup);

    // ─── ECS Cluster ──────────────────────────────────────────────────────────
    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `stray-animal-cluster-${env}`,
      vpc,
      containerInsights: env === 'production',
    });

    // ─── ECR Repositories ─────────────────────────────────────────────────────
    const apiRepo = ecr.Repository.fromRepositoryName(this, 'ApiRepo', 'stray-animal-api');
    const webRepo = ecr.Repository.fromRepositoryName(this, 'WebRepo', 'stray-animal-web');

    // ─── Task Execution Role ──────────────────────────────────────────────────
    const taskExecRole = new iam.Role(this, 'TaskExecRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
      resources: ['arn:aws:s3:::stray-animal-images/*'],
    }));

    // ─── API Task Definition ──────────────────────────────────────────────────
    const apiTaskDef = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      memoryLimitMiB: env === 'production' ? 1024 : 512,
      cpu: env === 'production' ? 512 : 256,
      executionRole: taskExecRole,
      taskRole,
    });

    apiTaskDef.addContainer('api', {
      image: ecs.ContainerImage.fromEcrRepository(apiRepo, 'latest'),
      containerName: 'stray-animal-api',
      portMappings: [{ containerPort: 3001 }],
      environment: {
        NODE_ENV: env,
        PORT: '3001',
        AWS_REGION: 'ap-southeast-1',
        AWS_S3_BUCKET: 'stray-animal-images',
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSsmParameter(
          cdk.aws_ssm.StringParameter.fromStringParameterName(this, 'DbUrl', `/${prefix}/database-url`),
        ),
        JWT_SECRET: ecs.Secret.fromSsmParameter(
          cdk.aws_ssm.StringParameter.fromStringParameterName(this, 'JwtSecret', `/${prefix}/jwt-secret`),
        ),
        REDIS_URL: ecs.Secret.fromSsmParameter(
          cdk.aws_ssm.StringParameter.fromStringParameterName(this, 'RedisUrl', `/${prefix}/redis-url`),
        ),
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'api',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      healthCheck: {
        command: ['CMD-SHELL', 'wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(15),
      },
    });

    // ─── Web Task Definition ──────────────────────────────────────────────────
    const webTaskDef = new ecs.FargateTaskDefinition(this, 'WebTaskDef', {
      memoryLimitMiB: env === 'production' ? 1024 : 512,
      cpu: env === 'production' ? 512 : 256,
      executionRole: taskExecRole,
      taskRole,
    });

    webTaskDef.addContainer('web', {
      image: ecs.ContainerImage.fromEcrRepository(webRepo, 'latest'),
      containerName: 'stray-animal-web',
      portMappings: [{ containerPort: 3000 }],
      environment: {
        NODE_ENV: env,
        NEXT_PUBLIC_API_URL: `https://api.stray-animal.example.com`,
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'web',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      healthCheck: {
        command: ['CMD-SHELL', 'wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(15),
      },
    });

    // ─── ALB ──────────────────────────────────────────────────────────────────
    const alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      loadBalancerName: `${prefix}-alb`,
    });

    // API Target Group
    const apiTg = new elbv2.ApplicationTargetGroup(this, 'ApiTg', {
      vpc,
      port: 3001,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/api/v1/health',
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // Web Target Group
    const webTg = new elbv2.ApplicationTargetGroup(this, 'WebTg', {
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // HTTP Listener (redirect to HTTPS in production)
    const httpListener = alb.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    // Path-based routing: /api/* → API, everything else → Web
    httpListener.addTargetGroups('ApiRoute', {
      targetGroups: [apiTg],
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*'])],
      priority: 10,
    });
    httpListener.addTargetGroups('WebRoute', {
      targetGroups: [webTg],
      conditions: [elbv2.ListenerCondition.pathPatterns(['/*'])],
      priority: 20,
    });

    // ─── ECS Services ─────────────────────────────────────────────────────────
    const apiService = new ecs.FargateService(this, 'ApiService', {
      cluster,
      taskDefinition: apiTaskDef,
      serviceName: 'stray-animal-api-service',
      desiredCount: env === 'production' ? 2 : 1,
      securityGroups: [ecsSg],
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      circuitBreaker: { rollback: true },
    });
    apiService.attachToApplicationTargetGroup(apiTg);

    const webService = new ecs.FargateService(this, 'WebService', {
      cluster,
      taskDefinition: webTaskDef,
      serviceName: 'stray-animal-web-service',
      desiredCount: env === 'production' ? 2 : 1,
      securityGroups: [ecsSg],
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      circuitBreaker: { rollback: true },
    });
    webService.attachToApplicationTargetGroup(webTg);

    // ─── Auto Scaling ─────────────────────────────────────────────────────────
    if (env === 'production') {
      const apiScaling = apiService.autoScaleTaskCount({
        minCapacity: 2,
        maxCapacity: 6,
      });
      apiScaling.scaleOnCpuUtilization('ApiCpuScaling', {
        targetUtilizationPercent: 70,
        scaleInCooldown: cdk.Duration.seconds(60),
        scaleOutCooldown: cdk.Duration.seconds(30),
      });

      const webScaling = webService.autoScaleTaskCount({
        minCapacity: 2,
        maxCapacity: 6,
      });
      webScaling.scaleOnCpuUtilization('WebCpuScaling', {
        targetUtilizationPercent: 70,
        scaleInCooldown: cdk.Duration.seconds(60),
        scaleOutCooldown: cdk.Duration.seconds(30),
      });
    }

    // ─── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'AlbDns', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS',
    });

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: dbInstance.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL Endpoint',
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: redisCluster.attrRedisEndpointAddress || 'pending',
      description: 'ElastiCache Redis Endpoint',
    });
  }
}
