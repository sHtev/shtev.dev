export interface ContactInput {
  name?: string;
  email?: string;
  message?: string;
  website?: string; // honeypot: hidden from people, so only bots fill it in
}

export interface Contact {
  name: string;
  email: string;
  message: string;
}

export type Validation = { ok: true; value: Contact } | { ok: false; reason: 'honeypot' | 'name' | 'email' | 'message' };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const length = (s: string) => [...s].length; // code points, so emoji count as one

export function validate(input: ContactInput): Validation {
  if (input.website?.trim()) return { ok: false, reason: 'honeypot' };
  const name = input.name?.trim() ?? '';
  const email = input.email?.trim() ?? '';
  const message = input.message?.trim() ?? '';
  if (!name || length(name) > 200) return { ok: false, reason: 'name' };
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, reason: 'email' };
  if (!message || length(message) > 5000) return { ok: false, reason: 'message' };
  return { ok: true, value: { name, email, message } };
}
