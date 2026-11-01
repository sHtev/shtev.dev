import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SNSClient } from '@aws-sdk/client-sns';
import { SSMClient } from '@aws-sdk/client-ssm';

// Created once per Lambda container and reused across invocations.
export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
export const sns = new SNSClient({});
export const ssm = new SSMClient({});
