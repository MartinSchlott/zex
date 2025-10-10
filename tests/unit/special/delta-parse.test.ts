import { zex, ZexError } from '../../_imports.js';
import { expectOk, expectFail } from '../../_utils.js';

console.log("\n=== UNIT: special (delta-parse) ===");

// Build a representative schema
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

const SpecialKeys = zex.object({
  'a/b': zex.object({ 'c~d': zex.string() })
});

const User = zex.object({
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
  pets: zex.array(Pet),
  misc: SpecialKeys
});

// Root parsing via parseDelta
expectOk('parseDelta on root with "" works', () => (User as any).parseDelta('', {
  id: '550e8400-e29b-41d4-a716-446655440000',
  profile: { name: 'Jane', age: 30, contacts: [] },
  coords: [1, 2],
  settings: { theme: 'light', flags: {} },
  pets: [],
  misc: { 'a/b': { 'c~d': 'x' } }
}));

expectOk('parseDelta on root with "/" works', () => (User as any).parseDelta('/', {
  id: '550e8400-e29b-41d4-a716-446655440000',
  profile: { name: 'Jane', age: 30, contacts: [] },
  coords: [1, 2],
  settings: { theme: 'light', flags: {} },
  pets: [],
  misc: { 'a/b': { 'c~d': 'x' } }
}));

// Path without leading slash
expectOk('parseDelta without leading slash works', () => (User as any).parseDelta('profile/name', 'Alice'));
expectFail('parseDelta validates min length', () => (User as any).parseDelta('profile/name', 'A'));

// JSON Pointer escapes
expectOk('parseDelta decodes ~1 as / and ~0 as ~', () => (User as any).parseDelta('/misc/a~1b/c~0d', 'hello'));

// Arrays and indices
expectOk('parseDelta validates array element type', () => (User as any).parseDelta('/profile/contacts/0', { kind: 'email', value: 'a@b.de' }));
expectFail('parseDelta rejects non-numeric index', () => (User as any).parseDelta('/profile/contacts/x', { kind: 'email', value: 'a@b.de' } as any));

// Tuple index resolution
expectOk('parseDelta validates tuple element', () => (User as any).parseDelta('/coords/1', 10));
expectFail('parseDelta tuple index out of range', () => (User as any).parseDelta('/coords/2', 10));

// Record dynamic key
expectOk('parseDelta resolves record value schema', () => (User as any).parseDelta('/settings/flags/featureX', true));
expectFail('parseDelta fails record value type', () => (User as any).parseDelta('/settings/flags/featureX', 'yes' as any));

// Plain union deeper traversal without instance should fail
expectOk('parseDelta can validate union value at leaf', () => (User as any).parseDelta('/pets/0', { type: 'dog', barks: true }));
expectFail('parseDelta cannot traverse inside union without instance', () => (User as any).parseDelta('/pets/0/meows', true));

// Discriminated union: allow discriminator field validation
expectOk('parseDelta can validate discriminant field itself', () => (User as any).parseDelta('/pets/0/type', 'dog'));
expectFail('parseDelta discriminant rejects wrong literal', () => (User as any).parseDelta('/pets/0/type', 'bird'));

// Safe variant returns structured error instead of throwing
{
  const r1 = (User as any).safeParseDelta('/profile/age', -1);
  if (!r1 || (r1 as any).success !== false) throw new Error('expected failure for negative age');
}
{
  const r2 = (User as any).safeParseDelta('/settings/flags/enabled', true);
  if (!r2 || (r2 as any).success !== true) throw new Error('expected success for boolean flag');
}


