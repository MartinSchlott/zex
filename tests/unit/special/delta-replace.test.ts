import { zex, ZexError } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: special (delta-replace) ===");

// Schema similar to refine.test to stress cross-field rules
const EmailContact = zex.object({
  kind: zex.literal('email'),
  value: zex.string().email()
});
const PhoneContact = zex.object({
  kind: zex.literal('phone'),
  value: zex.string().pattern('^\\+?[0-9]{7,15}$')
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
    nickname: zex.string().optional(),
    contacts: zex.array(Contact)
  }),
  coords: zex.tuple([zex.number(), zex.number()]),
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
    nickname: 'JJ',
    contacts: [ { kind: 'email', value: 'jane@example.com' } ]
  },
  coords: [1, 2],
  settings: { theme: 'light', flags: {} },
  pets: [ { type: 'dog', barks: true } ]
};

// Root replace
expectOk('replace on root with "" replaces whole document', () => {
  const next = (User as any).replace(validUser, '', { ...validUser, profile: { ...validUser.profile, name: 'Alice' } });
  if (next.profile.name !== 'Alice') throw new Error('root replace failed');
});

expectOk('safeReplace returns success on root "/"', () => {
  const res = (User as any).safeReplace(validUser, '/', { ...validUser, profile: { ...validUser.profile, name: 'Bob' } });
  if (!res.success) throw new Error('expected success');
});

expectFail('replace root with undefined is invalid', () => (User as any).replace(validUser, '/', undefined));

// Nested leaf replace
expectOk('replace nested leaf string', () => {
  const next = (User as any).replace(validUser, '/profile/name', 'Carla');
  if (next.profile.name !== 'Carla') throw new Error('nested replace failed');
});

// Optional deletion
expectOk('delete optional property via undefined', () => {
  const next = (User as any).replace(validUser, '/profile/nickname', undefined);
  if ('nickname' in next.profile) throw new Error('optional deletion failed');
});

expectFail('delete required property via undefined is rejected', () => (User as any).replace(validUser, '/id', undefined));

// Arrays
expectOk('replace array element by index', () => {
  const next = (User as any).replace(validUser, '/pets/0', { type: 'dog', barks: false });
  if (next.pets[0].barks !== false) throw new Error('array element replace failed');
});

expectFail('delete array element via undefined is rejected', () => (User as any).replace(validUser, '/pets/0', undefined));

expectFail('replace with out-of-range index fails', () => (User as any).replace(validUser, '/pets/2', { type: 'cat', meows: true }));

// Tuple indices
expectOk('replace tuple element', () => {
  const next = (User as any).replace(validUser, '/coords/1', 5);
  if (next.coords[1] !== 5) throw new Error('tuple element replace failed');
});

expectFail('tuple index out of range fails', () => (User as any).replace(validUser, '/coords/2', 5));

// Records via flags
expectOk('replace record entry boolean', () => {
  const next = (User as any).replace(validUser, '/settings/flags/darkMode', true);
  if (next.settings.flags.darkMode !== true) throw new Error('record replace failed');
});

// Cross-field refine: setting dark theme requires flags.darkMode === true
expectOk('replace dark theme with matching flag passes', () => {
  const withFlag = (User as any).replace(validUser, '/settings/flags/darkMode', true);
  const next = (User as any).replace(withFlag, '/settings/theme', 'dark');
  if (next.settings.theme !== 'dark') throw new Error('theme replace failed');
});

expectFail('replace dark theme without flag fails root validation', () => {
  const cleared = (User as any).replace(validUser, '/settings/flags/darkMode', false);
  return (User as any).replace(cleared, '/settings/theme', 'dark');
});

// Discriminated union deeper path using instance-driven resolution
expectOk('replace field inside discriminated union element', () => {
  const next = (User as any).replace(validUser, '/pets/0/barks', false);
  if (next.pets[0].barks !== false) throw new Error('disc union field replace failed');
});

// Changing discriminant should revalidate whole element
expectOk('replace whole DU element to cat with meows in one step', () => {
  const b = (User as any).replace(validUser, '/pets/0', { type: 'cat', meows: true });
  if (b.pets[0].type !== 'cat' || b.pets[0].meows !== true) throw new Error('disc change failed');
});

expectFail('changing only discriminator without required fields fails', () => {
  return (User as any).replace(validUser, '/pets/0/type', 'cat');
});

expectFail('setting barks on cat fails', () => {
  const a = (User as any).replace(validUser, '/pets/0', { type: 'cat', meows: true });
  return (User as any).replace(a, '/pets/0/barks', true);
});

// Path normalization
expectOk('replace without leading slash', () => {
  const next = (User as any).replace(validUser, 'profile/name', 'Zoe');
  if (next.profile.name !== 'Zoe') throw new Error('missing leading slash normalization failed');
});


