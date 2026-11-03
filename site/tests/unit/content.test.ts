import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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
    for (const file of [...walk(join(SITE, 'src')), ...walk(join(SITE, 'public'))]) {
      const text = readFileSync(file, 'utf8');
      const emails = text.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) ?? [];
      for (const email of emails) {
        expect(email, relative(SITE, file)).toMatch(/@shtev\.dev$/);
      }
      expect(text, `${relative(SITE, file)} contains a mobile number`).not.toMatch(/(\+44\s?|\b0)7\d{3}\s?\d{3}\s?\d{3}/);
    }
  });

  // The deploy sets GO_LIVE=1 once the site is public: nothing may still be a draft.
  it.runIf(process.env.GO_LIVE === '1')('noDraftsWhenGoingLive', () => {
    for (const file of markdown) {
      const frontMatter = readFileSync(file, 'utf8').split('---')[1] ?? '';
      expect(frontMatter, relative(SITE, file)).toMatch(/^draft: false$/m);
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
    expect(slugs).toEqual(['azure-aws-pipelines', 'nhs-img', 'perspective', 'raspberry-pi', 'university-web-team']);
  });

  // Private terms (client names, personal details) live in a git-ignored file, one per line.
  const privateTerms = join(SITE, 'tests/private-terms.txt');

  it.skipIf(!existsSync(privateTerms))('noPrivateTerms', () => {
    const terms = readFileSync(privateTerms, 'utf8')
      .split('\n')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    for (const file of [...walk(join(SITE, 'src')), ...walk(join(SITE, 'public'))]) {
      // File names too: slugs become public URLs.
      const text = (relative(SITE, file) + readFileSync(file, 'utf8')).toLowerCase();
      for (const term of terms) {
        expect(text.includes(term), `${relative(SITE, file)} contains a private term`).toBe(false);
      }
    }
  });
});
