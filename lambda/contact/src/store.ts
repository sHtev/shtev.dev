import { randomUUID } from 'node:crypto';
import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from './clients.js';
import type { Contact } from './validate.js';

const ONE_YEAR = 365 * 24 * 60 * 60;

/** Saves the message before notifying, so nothing is lost if the email fails. Returns its key. */
export async function storeMessage(msg: Contact, now: Date): Promise<string> {
  const pk = `msg#${randomUUID()}`;
  await ddb.send(
    new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        pk,
        ...msg,
        createdAt: now.toISOString(),
        notified: false,
        ttl: Math.floor(now.getTime() / 1000) + ONE_YEAR,
      },
    }),
  );
  return pk;
}

export async function markNotified(pk: string): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { pk },
      UpdateExpression: 'SET notified = :true',
      ExpressionAttributeValues: { ':true': true },
    }),
  );
}
