#!/usr/bin/env node
import 'source-map-support/register';
import * as dotenv from 'dotenv';
import * as cdk from 'aws-cdk-lib';
import { OpenWebUiStack } from '../lib/cdk-stack';

// Load environment variables
dotenv.config();

const app = new cdk.App();
new OpenWebUiStack(app, 'OpenWebUiStack', {
  env: {
    account: process.env.AWS_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION,
  },
});