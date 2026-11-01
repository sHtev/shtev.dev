import { PublishCommand } from '@aws-sdk/client-sns';
import { sns } from './clients.js';
import type { Contact } from './validate.js';

/** Email subject: single line (no header injection), max 100 characters (the SNS limit). */
export function subjectFor(name: string): string {
  return `shtev.dev contact: ${name.replace(/[\r\n]+/g, ' ')}`.slice(0, 100);
}

export async function notify(msg: Contact): Promise<void> {
  await sns.send(
    new PublishCommand({
      TopicArn: process.env.TOPIC_ARN,
      Subject: subjectFor(msg.name),
      Message: `From: ${msg.name} <${msg.email}>\n\n${msg.message}\n`,
    }),
  );
}
