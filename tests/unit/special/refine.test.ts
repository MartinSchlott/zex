import { zex } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: special (refine) ===");

// Schema:
// user: {
//   id: string uuid
//   profile: { name: string min 2; age: number >= 0; contacts: Array<{ kind: 'email' | 'phone'; value: string }> }
//   settings: { theme: 'light' | 'dark'; flags: Record<string, boolean> }
//   pets: DiscriminatedUnion<'type', Dog | Cat>
// }
// Custom refine rules:
// - contacts must contain at least one 'email'
// - if theme === 'dark' then flags.darkMode === true

const EmailContact = zex.object({
  kind: zex.literal('email'),
  value: zex.string().email()
});
const PhoneContact = zex.object({
  kind: zex.literal('phone'),
  value: zex.string().pattern('^\\\+?[0-9]{7,15}$')
});

const Contact = zex.union(EmailContact, PhoneContact);

const Dog = zex.object({ type: zex.literal('dog'), barks: zex.boolean() });
const Cat = zex.object({ type: zex.literal('cat'), meows: zex.boolean() });
const Pet = zex.discriminatedUnion('type', Dog, Cat);

const UserBase = zex.object({
  id: zex.string().uuid(),
  profile: zex.object({
    name: zex.string().min(2),
    age: zex.number().nonnegative(),
    contacts: zex.array(Contact)
  }),
  settings: zex.object({
    theme: zex.enum(['light', 'dark']),
    flags: zex.record(zex.boolean())
  }),
  pets: zex.array(Pet)
});

const User = (UserBase as any)
  .refine((u: any) => Array.isArray(u.profile?.contacts) && u.profile.contacts.some((c: any) => c?.kind === 'email'), 'At least one email contact required')
  .refine((u: any) => u.settings?.theme !== 'dark' || u.settings?.flags?.darkMode === true, 'flags.darkMode must be true for dark theme');

const validUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  profile: {
    name: 'Jane',
    age: 30,
    contacts: [
      { kind: 'phone', value: '+493012345678' },
      { kind: 'email', value: 'jane@example.com' }
    ]
  },
  settings: {
    theme: 'dark',
    flags: { darkMode: true }
  },
  pets: [ { type: 'dog', barks: true } ]
};

const invalidNoEmail = {
  ...validUser,
  profile: {
    ...validUser.profile,
    contacts: [ { kind: 'phone', value: '+493012345678' } ]
  }
};

const invalidDarkNoFlag = {
  ...validUser,
  settings: { theme: 'dark', flags: { darkMode: false } }
};

expectOk('refine passes with valid nested data', () => (User as any).parse(validUser));
expectFail('refine fails when no email contact present', () => (User as any).parse(invalidNoEmail));
expectFail('refine fails when dark theme without darkMode flag', () => (User as any).parse(invalidDarkNoFlag));

