import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import type { LambdaFunctionURLEvent } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it } from 'vitest';
import { handler } from '../src/handler.js';
import { subjectFor } from '../src/notify.js';

const ddb = mockClient(DynamoDBDocumentClient);
const sns = mockClient(SNSClient);
const ssm = mockClient(SSMClient);

const SECRET = 's3cret';
const VIEWER_IP = '203.0.113.7';

function event(opts: { body: string; json?: boolean; secret?: string | null; base64?: boolean }): LambdaFunctionURLEvent {
  const headers: Record<string, string> = {
    'content-type': opts.json ? 'application/json' : 'application/x-www-form-urlencoded',
    accept: opts.json ? 'application/json' : 'text/html',
    'cloudfront-viewer-address': `${VIEWER_IP}:51234`,
  };
  if (opts.secret !== null) headers['x-origin-secret'] = opts.secret ?? SECRET;
  return {
    headers,
    body: opts.base64 ? Buffer.from(opts.body).toString('base64') : opts.body,
    isBase64Encoded: !!opts.base64,
    requestContext: { http: { method: 'POST', sourceIp: '10.0.0.1' } },
  } as unknown as LambdaFunctionURLEvent;
}

const FORM = 'name=Ada&email=ada%40example.com&message=Hello';
const JSON_BODY = JSON.stringify({ name: 'Ada', email: 'ada@example.com', message: 'Hello' });

beforeEach(() => {
  process.env.TABLE_NAME = 'contact';
  process.env.TOPIC_ARN = 'arn:aws:sns:eu-west-2:123456789012:contact';
  process.env.ORIGIN_SECRET_PARAM = '/shtev-dev/origin-secret';
  process.env.RATE_LIMIT_PER_HOUR = '5';
  ddb.reset();
  sns.reset();
  ssm.reset();
  ssm.on(GetParameterCommand).resolves({ Parameter: { Value: SECRET } });
  ddb.on(UpdateCommand).resolves({ Attributes: { count: 1 } });
  ddb.on(PutCommand).resolves({});
  sns.on(PublishCommand).resolves({ MessageId: 'm1' });
});

describe('handler', () => {
  it('rejectsMissingOriginSecret', async () => {
    const res = await handler(event({ body: FORM, secret: null }));
    expect(res.statusCode).toBe(403);
    expect(ddb.commandCalls(PutCommand)).toHaveLength(0);
  });

  it('rejectsWrongOriginSecret', async () => {
    expect((await handler(event({ body: FORM, secret: 'nope' }))).statusCode).toBe(403);
  });

  it('redirectsHtmlFormPosts', async () => {
    const res = await handler(event({ body: FORM }));
    expect(res.statusCode).toBe(303);
    expect(res.headers?.Location).toBe('/contact/sent/');
  });

  it('redirectsInvalidHtmlFormPostsToError', async () => {
    const res = await handler(event({ body: 'name=&email=x&message=' }));
    expect(res.statusCode).toBe(303);
    expect(res.headers?.Location).toBe('/contact/error/');
  });

  it('jsonResponsesForFetch', async () => {
    const res = await handler(event({ body: JSON_BODY, json: true }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body!)).toEqual({ ok: true });
    const bad = await handler(event({ body: JSON.stringify({ name: 'Ada' }), json: true }));
    expect(bad.statusCode).toBe(400);
    expect(JSON.parse(bad.body!)).toEqual({ error: 'email' });
  });

  it('handlesBase64Bodies', async () => {
    const res = await handler(event({ body: JSON_BODY, json: true, base64: true }));
    expect(res.statusCode).toBe(200);
  });

  it('storesAndNotifies', async () => {
    await handler(event({ body: JSON_BODY, json: true }));
    const item = ddb.commandCalls(PutCommand)[0].args[0].input.Item!;
    expect(item).toMatchObject({ name: 'Ada', email: 'ada@example.com', message: 'Hello', notified: false });
    expect(item.pk).toMatch(/^msg#/);
    const publish = sns.commandCalls(PublishCommand)[0].args[0].input;
    expect(publish.Message).toContain('ada@example.com');
    expect(publish.Message).toContain('Hello');
  });

  it('honeypotLooksLikeSuccess', async () => {
    const res = await handler(event({ body: `${FORM}&website=http%3A%2F%2Fspam` }));
    expect(res.statusCode).toBe(303);
    expect(res.headers?.Location).toBe('/contact/sent/');
    expect(ddb.commandCalls(PutCommand)).toHaveLength(0);
    expect(sns.commandCalls(PublishCommand)).toHaveLength(0);
  });

  it('rateLimitBlocksSixthPerHour', async () => {
    ddb.on(UpdateCommand).resolves({ Attributes: { count: 6 } });
    const res = await handler(event({ body: JSON_BODY, json: true }));
    expect(res.statusCode).toBe(429);
    expect(ddb.commandCalls(PutCommand)).toHaveLength(0);
  });

  it('rateLimitHashesIp', async () => {
    await handler(event({ body: JSON_BODY, json: true }));
    const everything = JSON.stringify([...ddb.calls().map((c) => c.args[0].input)]);
    expect(everything).not.toContain(VIEWER_IP);
    const key = ddb.commandCalls(UpdateCommand)[0].args[0].input.Key!.pk as string;
    expect(key).toMatch(/^rate#[0-9a-f]{64}#\d{4}-\d{2}-\d{2}T\d{2}$/);
  });

  it('keepsMessageWhenNotifyFails', async () => {
    sns.on(PublishCommand).rejects(new Error('SNS down'));
    const res = await handler(event({ body: JSON_BODY, json: true }));
    expect(res.statusCode).toBe(502);
    expect(ddb.commandCalls(PutCommand)).toHaveLength(1);
    const marked = ddb
      .commandCalls(UpdateCommand)
      .some((c) => String(c.args[0].input.UpdateExpression).includes('notified'));
    expect(marked).toBe(false);
  });

  it('marksNotifiedOnSuccess', async () => {
    await handler(event({ body: JSON_BODY, json: true }));
    const marked = ddb
      .commandCalls(UpdateCommand)
      .some((c) => String(c.args[0].input.UpdateExpression).includes('notified'));
    expect(marked).toBe(true);
  });
});

describe('subjectFor', () => {
  it('subjectStripsNewlines', () => {
    expect(subjectFor('Ada\r\nBcc: x')).toBe('shtev.dev contact: Ada Bcc: x');
  });

  it('subjectIsTruncated', () => {
    expect(subjectFor('a'.repeat(300)).length).toBe(100);
  });
});
