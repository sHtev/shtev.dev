import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const robots = readFileSync(join(__dirname, '../../public/robots.txt'), 'utf8');

/** The Disallow lines that apply to one user agent's group. */
function rulesFor(agent: string): string[] {
  const groups = robots.split(/\n\s*\n/);
  const group = groups.find((g) => g.split('\n').some((l) => l.trim() === `User-agent: ${agent}`));
  return group ? group.split('\n').filter((l) => /^(Allow|Disallow):/.test(l.trim())).map((l) => l.trim()) : [];
}

describe('robots.txt', () => {
  it('blocksAiCrawlers', () => {
    for (const bot of ['GPTBot', 'CCBot', 'Google-Extended', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot', 'Bytespider']) {
      expect(rulesFor(bot), bot).toEqual(['Disallow: /']);
    }
  });

  it('allowsEveryoneElse', () => {
    expect(rulesFor('*')).toEqual(['Allow: /']);
  });
});
