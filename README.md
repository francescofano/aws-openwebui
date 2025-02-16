# Open WebUI AWS CDK Deployment

This project contains the AWS CDK infrastructure code to deploy Open WebUI on AWS using ECS Fargate with persistent storage.

## Features

- Runs on AWS ECS Fargate
- Persistent data storage using EFS
- Load balanced with ALB
- Secure configuration with proper IAM roles
- Data survives stack destroy/redeploy cycles

## Prerequisites

1. AWS CLI installed and configured with appropriate credentials
2. Node.js and npm installed
3. AWS CDK CLI installed (`npm install -g aws-cdk`)

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and fill in your values:
   ```bash
   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCOUNT=your-aws-account-id
   ```

## Deployment Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Deploy the stack:
   ```bash
   npx cdk deploy
   ```

After deployment, the ALB DNS name will be output to the console. You can access Open WebUI using this URL.

## Updating Open WebUI

You can update Open WebUI either through AWS CLI or AWS Management Console.

### Using AWS CLI

To update Open WebUI to the latest version:

```bash
aws ecs update-service --force-new-deployment \
  --cluster [YOUR-CLUSTER-NAME] \
  --service [YOUR-SERVICE-NAME]
```

Replace `[YOUR-CLUSTER-NAME]` and `[YOUR-SERVICE-NAME]` with your actual values. You can find these in the AWS Console or by running:
```bash
aws ecs list-clusters
aws ecs list-services --cluster [YOUR-CLUSTER-NAME]
```

### Using AWS Management Console

1. Go to AWS Console → ECS
2. Click on your cluster (named like "OpenWebUiStack-OpenWebUiCluster...")
3. Select the "Services" tab
4. Check the box next to your service (named like "OpenWebUiStack-OpenWebUiService...")
5. Click "Update" button
6. In the update form:
   - Leave all settings as they are
   - Check "Force new deployment" checkbox
7. Click "Update" to start the deployment

The update process:
1. Pulls the latest Open WebUI image
2. Performs a zero-downtime deployment
3. Automatically rolls back if the new version is unhealthy
4. Preserves all your data as it's stored in EFS

## Data Persistence

This deployment uses Amazon EFS for persistent storage. This means:
- Your data (user accounts, settings, etc.) persists across container restarts
- Data survives stack destroy/redeploy cycles
- Data is stored in a highly available and durable way

### Starting Fresh

If you want to start with a clean slate:
1. Destroy the stack: `npx cdk destroy`
2. Go to AWS Console → EFS
3. Manually delete the EFS filesystem named "OpenWebUiEfsFileSystem"
4. Redeploy the stack: `npx cdk deploy`

## Infrastructure Components

- VPC with public and private subnets
- ECS Cluster running on Fargate
- Application Load Balancer
- ECS Task and Service for Open WebUI
- EFS filesystem for persistent storage
- Security Groups and IAM roles

## Cost Considerations

This deployment includes:
- NAT Gateway (hourly cost)
- Application Load Balancer (hourly cost)
- Fargate tasks (per vCPU and memory)
- EFS storage (per GB-month)
- Data transfer costs

Consider these costs when deploying to production.

## Security Features

- EFS encryption enabled
- Proper IAM roles and policies
- Security groups configured for least privilege
- Transit encryption enabled for EFS

## Useful Commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
* `npx cdk destroy` destroy the stack but preserve data (EFS is retained)

## Security Note

The `.env` file contains sensitive information. Make sure to:
1. Never commit it to version control (it's already in .gitignore)
2. Keep it secure on your local machine
