import { timingSafeEqual } from 'node:crypto';
import { GetParameterCommand } from '@aws-sdk/client-ssm';
import type { APIGatewayProxyStructuredResultV2 as Result, LambdaFunctionURLEvent } from 'aws-lambda';
import { ssm } from './clients.js';
import { notify } from './notify.js';
import { checkRateLimit } from './rateLimit.js';
import { markNotified, storeMessage } from './store.js';
import { validate, type ContactInput } from './validate.js';

let originSecret: string | undefined; // cached for the container's lifetime

async function getOriginSecret(): Promise<string> {
  if (!originSecret) {
    const res = await ssm.send(
      new GetParameterCommand({ Name: process.env.ORIGIN_SECRET_PARAM, WithDecryption: true }),
    );
    originSecret = res.Parameter?.Value ?? '';
  }
  return originSecret;
}

function sameSecret(given: string | undefined, expected: string): boolean {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseBody(event: LambdaFunctionURLEvent): ContactInput {
  const raw = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString('utf8') : (event.body ?? '');
  if ((event.headers['content-type'] ?? '').includes('application/json')) {
    try {
      return JSON.parse(raw) as ContactInput;
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

/** The visitor's IP, from CloudFront's viewer header ("ip:port", IPv6 included). */
function viewerIp(event: LambdaFunctionURLEvent): string {
  const viewer = event.headers['cloudfront-viewer-address'];
  if (viewer) return viewer.slice(0, viewer.lastIndexOf(':'));
  return event.headers['x-forwarded-for']?.split(',')[0].trim() ?? event.requestContext.http.sourceIp;
}

export async function handler(event: LambdaFunctionURLEvent): Promise<Result> {
  // Only CloudFront knows the secret header, so the Function URL can't be called directly.
  if (!sameSecret(event.headers['x-origin-secret'], await getOriginSecret())) {
    return { statusCode: 403, body: 'Forbidden' };
  }

  // fetch() asks for JSON; a plain HTML form post gets a redirect to a result page.
  const wantsJson = (event.headers.accept ?? '').includes('application/json');
  const reply = (status: number, body: object): Result =>
    wantsJson
      ? { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : { statusCode: 303, headers: { Location: status === 200 ? '/contact/sent/' : '/contact/error/' } };

  const result = validate(parseBody(event));
  if (!result.ok) {
    // Bots that fill the honeypot get a normal-looking success.
    return result.reason === 'honeypot' ? reply(200, { ok: true }) : reply(400, { error: result.reason });
  }

  const now = new Date();
  if (!(await checkRateLimit(viewerIp(event), now))) return reply(429, { error: 'rate' });

  const pk = await storeMessage(result.value, now);
  try {
    await notify(result.value);
  } catch (err) {
    console.error('notify failed; message kept with notified=false', pk, err);
    return reply(502, { error: 'notify' });
  }
  await markNotified(pk);
  return reply(200, { ok: true });
}
