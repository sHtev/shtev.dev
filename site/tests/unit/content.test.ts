import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SITE = join(__dirname, '../..');
const CONTENT = join(SITE, 'src/content');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const markdown = walk(CONTENT).filter((f) => f.endsWith('.md'));

describe('content', () => {
  it('everyEntryHasDraftFlag', () => {
    expect(markdown.length).toBeGreaterThan(0);
    for (const file of markdown) {
      const frontMatter = readFileSync(file, 'utf8').split('---')[1] ?? '';
      expect(frontMatter, relative(SITE, file)).toMatch(/^draft: (true|false)$/m);
    }
  });

  it('noPrivateContactDetails', () => {
    const files = [...walk(join(SITE, 'src')), ...walk(join(SITE, 'public'))];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const secret of ['REDACTED', 'REDACTED', 'REDACTED', 'REDACTED', 'REDACTED']) {
        expect(text.includes(secret), `${relative(SITE, file)} contains ${secret}`).toBe(false);
      }
    }
  });

  it('promptLinesIncludeSteveWording', () => {
    const lines: string[] = JSON.parse(readFileSync(join(CONTENT, 'prompt-lines.json'), 'utf8'));
    expect(lines).toContain('deploy bedrock && generate skills');
  });

  it('caseStudySlugs', () => {
    const slugs = readdirSync(join(CONTENT, 'case-studies'))
      .map((f) => f.replace(/\.md$/, ''))
      .sort();
    expect(slugs).toEqual(['REDACTED', 'REDACTED-pipelines', 'REDACTED', 'perspective']);
  });
});
