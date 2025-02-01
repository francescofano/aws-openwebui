# Open WebUI AWS CDK Deployment

This project contains the AWS CDK infrastructure code to deploy Open WebUI on AWS using ECS Fargate.

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

## Infrastructure Components

- VPC with public and private subnets
- ECS Cluster running on Fargate
- Application Load Balancer
- ECS Task and Service for Open WebUI
- Security Groups and IAM roles

## Useful Commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

## Cost Considerations

This deployment includes:
- NAT Gateway (hourly cost)
- Application Load Balancer (hourly cost)
- Fargate tasks (per vCPU and memory)
- Data transfer costs

Consider these costs when deploying to production.

## Security Note

The `.env` file contains sensitive information. Make sure to:
1. Never commit it to version control (it's already in .gitignore)
2. Keep it secure on your local machine
