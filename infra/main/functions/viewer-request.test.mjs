// Run with: node --test infra/main/functions
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// CloudFront Functions are plain scripts (no exports), so load the handler by evaluating the file.
const code = readFileSync(new URL('./viewer-request.js', import.meta.url), 'utf8');
const handler = new Function(`${code}; return handler;`)();

const run = (uri, host = 'shtev.dev') => handler({ request: { uri, headers: { host: { value: host } }, querystring: {} } });

test('rewritesDirectoryPaths', () => {
  assert.equal(run('/about').uri, '/about/index.html');
  assert.equal(run('/about/').uri, '/about/index.html');
  assert.equal(run('/').uri, '/index.html');
  assert.equal(run('/case-studies/nhs-img').uri, '/case-studies/nhs-img/index.html');
});

test('leavesFilesAlone', () => {
  assert.equal(run('/cv.pdf').uri, '/cv.pdf');
  assert.equal(run('/_astro/page.abc123.js').uri, '/_astro/page.abc123.js');
});

test('redirectsWww', () => {
  const res = run('/about/', 'www.shtev.dev');
  assert.equal(res.statusCode, 301);
  assert.equal(res.headers.location.value, 'https://shtev.dev/about/');
});

test('leavesApiAlone', () => {
  assert.equal(run('/api/contact').uri, '/api/contact');
});
