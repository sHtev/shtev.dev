import { createHash } from 'node:crypto';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from './clients.js';

const TWO_HOURS = 2 * 60 * 60;

/** Counts messages per hashed IP per hour; false once the hourly limit is passed. Raw IPs are never stored. */
export async function checkRateLimit(ip: string, now: Date): Promise<boolean> {
  const limit = Number(process.env.RATE_LIMIT_PER_HOUR ?? '5');
  const hour = now.toISOString().slice(0, 13); // e.g. 2026-11-01T14
  const hash = createHash('sha256').update(ip).digest('hex');
  const result = await ddb.send(
    new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { pk: `rate#${hash}#${hour}` },
      UpdateExpression: 'ADD #count :one SET #ttl = :ttl',
      ExpressionAttributeNames: { '#count': 'count', '#ttl': 'ttl' },
      ExpressionAttributeValues: { ':one': 1, ':ttl': Math.floor(now.getTime() / 1000) + TWO_HOURS },
      ReturnValues: 'UPDATED_NEW',
    }),
  );
  return Number(result.Attributes?.count ?? 0) <= limit;
}
