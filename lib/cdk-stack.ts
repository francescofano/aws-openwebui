import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class OpenWebUiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC
    const vpc = new ec2.Vpc(this, 'OpenWebUiVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Create ECS Cluster
    const cluster = new ecs.Cluster(this, 'OpenWebUiCluster', {
      vpc,
      containerInsights: true,
    });

    // Create EFS Security Group
    const efsSecurityGroup = new ec2.SecurityGroup(this, 'OpenWebUiEfsSecurityGroup', {
      vpc,
      description: 'Security group for Open WebUI EFS',
      allowAllOutbound: true,
    });

    // Create EFS File System
    const fileSystem = new efs.FileSystem(this, 'OpenWebUiEfsFileSystem', {
      vpc,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      securityGroup: efsSecurityGroup,
      encrypted: true,
    });

    // Create EFS Access Point for the backend data
    const accessPoint = fileSystem.addAccessPoint('OpenWebUiEfsAccessPoint', {
      path: '/app/backend/data',  // Match the exact path in the container
      createAcl: {
        ownerGid: '1000',
        ownerUid: '1000',
        permissions: '755'
      },
      posixUser: {
        gid: '1000',
        uid: '1000'
      },
    });

    // Create Task Role with EFS access
    const taskRole = new iam.Role(this, 'OpenWebUiTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Add EFS permissions to Task Role
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'elasticfilesystem:ClientMount',
        'elasticfilesystem:ClientWrite',
        'elasticfilesystem:ClientRootAccess'
      ],
      resources: [fileSystem.fileSystemArn],
    }));

    // Create Task Execution Role
    const executionRole = new iam.Role(this, 'OpenWebUiExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Add required permissions to Task Execution Role
    executionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
    );

    // Create the log group explicitly
    const logGroup = new logs.LogGroup(this, 'OpenWebUiLogGroup', {
      logGroupName: 'OpenWebUiStack-OpenWebUiServiceTaskDefwebLogGroup86593CDD-8KNWRI7vZfCc',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      retention: logs.RetentionDays.TWO_WEEKS
    });

    // Create Fargate Service with ALB
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'OpenWebUiService', {
      cluster,
      cpu: 1024,
      memoryLimitMiB: 2048,
      desiredCount: 1,
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('ghcr.io/open-webui/open-webui:main'),
        containerPort: 8080,
        environment: {
          OLLAMA_API_BASE_URL: 'https://api.openrouter.ai/api/v1',
        },
        taskRole: taskRole,
        executionRole: executionRole,
      },
      publicLoadBalancer: true,
      assignPublicIp: true,
    });

    // Add volume configuration
    const volumeConfig: ecs.Volume = {
      name: 'open-webui-data',
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId,
        rootDirectory: '/',  // Mount the root directory
        transitEncryption: 'ENABLED',
        authorizationConfig: {
          accessPointId: accessPoint.accessPointId,
          iam: 'ENABLED'
        }
      }
    };

    // Add the volume to the task definition
    const taskDef = fargateService.taskDefinition;
    taskDef.addVolume(volumeConfig);

    // Add the mount point to the container
    const container = taskDef.defaultContainer!;
    container.addMountPoints({
      sourceVolume: 'open-webui-data',
      containerPath: '/app/backend/data',
      readOnly: false
    });

    // Allow EFS access from the task's security group
    efsSecurityGroup.addIngressRule(
      fargateService.service.connections.securityGroups[0],
      ec2.Port.tcp(2049),
      'Allow EFS access from Fargate tasks'
    );

    // Add security group rule to allow inbound traffic on port 8080
    fargateService.service.connections.allowFromAnyIpv4(ec2.Port.tcp(8080));

    // Output the ALB DNS name
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'The DNS name of the load balancer',
    });

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
