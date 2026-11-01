import { describe, expect, it } from 'vitest';
import { validate } from '../src/validate.js';

const ok = { name: 'Ada', email: 'ada@example.com', message: 'Hello' };

describe('validate', () => {
  it('validateTrims', () => {
    expect(validate({ name: '  Ada ', email: ' ada@example.com ', message: ' Hi \n' })).toEqual({
      ok: true,
      value: { name: 'Ada', email: 'ada@example.com', message: 'Hi' },
    });
  });

  it('validateMessageCountsCodePoints', () => {
    expect(validate({ ...ok, message: '😀'.repeat(5000) }).ok).toBe(true);
    expect(validate({ ...ok, message: '😀'.repeat(5001) })).toEqual({ ok: false, reason: 'message' });
  });

  it('validateMessageRejectsWhitespaceOnly', () => {
    expect(validate({ ...ok, message: ' \n\t ' })).toEqual({ ok: false, reason: 'message' });
  });

  it('validateRejectsBadEmail', () => {
    expect(validate({ ...ok, email: 'not-an-email' })).toEqual({ ok: false, reason: 'email' });
    expect(validate({ ...ok, email: `${'a'.repeat(250)}@x.io` })).toEqual({ ok: false, reason: 'email' });
  });

  it('validateRejectsMissingOrLongName', () => {
    expect(validate({ ...ok, name: undefined })).toEqual({ ok: false, reason: 'name' });
    expect(validate({ ...ok, name: 'a'.repeat(201) })).toEqual({ ok: false, reason: 'name' });
  });

  it('honeypotIsReported', () => {
    expect(validate({ ...ok, website: 'http://spam' })).toEqual({ ok: false, reason: 'honeypot' });
  });
});
