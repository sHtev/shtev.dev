export type Group = 'phd' | 'crossmodal' | 'affective' | 'bci';

/** Page order of the publication groups, with headings for the full list. */
export const GROUPS: { id: Group; heading: string; period: string }[] = [
  { id: 'phd', heading: 'PhD and follow-on work', period: 'York and Newcastle, 2002–2008' },
  { id: 'crossmodal', heading: 'Crossmodal and public displays', period: 'Newcastle, 2006–2007' },
  { id: 'affective', heading: 'Affective and multimodal interaction', period: 'Teesside, 2007–2012' },
  { id: 'bci', heading: 'Brain-computer interfaces and neurofeedback', period: 'Teesside, 2013–2015' },
];

// "Stephen W. Gilroy", "SW Gilroy", "S Gilroy", "S GILROY"
const ME = /^S(tephen)?\.?\s*(W(illiam)?\.?)?\s*Gilroy$/i;

export function authorParts(authors: string[]): { name: string; me: boolean }[] {
  return authors.map((name) => ({ name, me: ME.test(name.trim()) }));
}

/** The link for a title: a free copy if there is one, otherwise the publisher's page. */
export function primaryLink(p: { openUrl?: string; doi?: string }): string | undefined {
  return p.openUrl ?? p.doi;
}
