import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { authorParts } from '../../src/lib/publications';

interface Pub {
  id: string;
  title: string;
  kind: string;
  group: string;
  selected: boolean;
  order?: number;
  summary?: string;
  [key: string]: unknown;
}

const pubs: Pub[] = parse(readFileSync(join(__dirname, '../../src/content/publications.yaml'), 'utf8'));

describe('publications', () => {
  it('allPublicationsListed', () => {
    expect(pubs).toHaveLength(29);
    expect(new Set(pubs.map((p) => p.id)).size).toBe(29);
  });

  it('oneThesis', () => {
    const theses = pubs.filter((p) => p.kind === 'thesis');
    expect(theses).toHaveLength(1);
    expect(theses[0]).toMatchObject({ group: 'phd', selected: true, order: 0 });
  });

  it('selectedHaveSummaries', () => {
    const selected = pubs.filter((p) => p.selected && p.kind !== 'thesis');
    expect(selected).toHaveLength(10);
    for (const p of selected) expect(p.summary?.trim(), p.id).toBeTruthy();
    expect(new Set(selected.map((p) => p.order)).size).toBe(10);
    const first = [...selected].sort((a, b) => a.order! - b.order!)[0];
    expect(first.title).toBe('A Brain-Computer Interface to a Plan-Based Narrative');
  });

  it('noDuplicatesFromScholar', () => {
    for (const title of [
      'Evaluating multimodal affective fusion using physiological signals',
      'CROSSBOARD: Crossmodal Access of Dense Public Displays',
      'E-tree: emotionally driven augmented reality art',
    ]) {
      expect(pubs.filter((p) => p.title.toLowerCase() === title.toLowerCase()), title).toHaveLength(1);
    }
  });

  it('noCitationCounts', () => {
    for (const p of pubs) expect(p, p.id).not.toHaveProperty('citations');
  });

  it('authorPartsBoldsSteve', () => {
    const parts = authorParts(['Marc Cavazza', 'Stephen W. Gilroy', 'SW Gilroy', 'S Gilroy', 'S GILROY', 'Julie Porteous']);
    expect(parts.map((p: { me: boolean }) => p.me)).toEqual([false, true, true, true, true, false]);
  });
});
