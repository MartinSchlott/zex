import { zex } from '../zex/index.js';
import { ZexBase } from '../zex/base.js';

// Test 1: Einzelne Schemas
const nameSchema = zex.string();
const nicknameSchema = zex.string().optional();

type NameType = zex.infer<typeof nameSchema>;
type NicknameType = zex.infer<typeof nicknameSchema>;

// Test 2: Objekt-Schema
const SimpleUserSchema = zex.object({
  name: zex.string(),
  nickname: zex.string().optional(),
});

type SimpleUser = zex.infer<typeof SimpleUserSchema>;

// =============================================================================
// NEUER DEBUGGING-SCHRITT: TYP-INSPEKTION
// =============================================================================

// Ein Helfer, um Typen zu inspizieren. In deiner IDE, fahre mit der Maus
// über die unten definierten `Inspect...`-Typen, um zu sehen, was TypeScript "sieht".
type Inspect<T> = { [K in keyof T]: T[K] };

// Welche Flags hat die 'name'-Eigenschaft?
// ERWARTET: {} (oder zumindest nichts mit 'optional')
type InspectedNameFlags = typeof SimpleUserSchema.shape.name extends ZexBase<any, infer F> ? F : never;
type DebugNameFlags = Inspect<InspectedNameFlags>;

// Welche Flags hat die 'nickname'-Eigenschaft?
// ERWARTET: { optional: true }
type InspectedNicknameFlags = typeof SimpleUserSchema.shape.nickname extends ZexBase<any, infer F> ? F : never;
type DebugNicknameFlags = Inspect<InspectedNicknameFlags>;

// =============================================================================

// Test 3: Explizite Type-Checks
const test1: NameType = "test"; // Sollte OK sein
// const test2: NameType = 123; // Sollte Fehler werfen

const test3: NicknameType = "test"; // Sollte OK sein
// const test4: NicknameType = undefined; // Sollte OK sein
// const test5: NicknameType = 123; // Sollte Fehler werfen

// Test 4: Objekt-Tests
const user1: SimpleUser = {
  name: "John",
  nickname: "JD"
}; // Sollte OK sein

const user2: SimpleUser = {
  name: "John"
}; // Sollte OK sein

// const user3: SimpleUser = {
//   nickname: "JD"
// }; // Sollte Fehler werfen (fehlende name)

// const user4: SimpleUser = {}; // Sollte Fehler werfen (fehlende name)

// Debug-Ausgaben
console.log("=== TYPE INFERENCE DEBUG ===");
console.log("NameType:", typeof nameSchema);
console.log("NicknameType:", typeof nicknameSchema);
console.log("SimpleUserType:", typeof SimpleUserSchema);

// Test der konkreten Typen
const nameValue: NameType = "test";
const nicknameValue: NicknameType = "test";
const userValue: SimpleUser = { name: "test" };

console.log("✅ nameValue:", nameValue);
console.log("✅ nicknameValue:", nicknameValue);
console.log("✅ userValue:", userValue);

// Test der Schema-Konfiguration
console.log("nameSchema config:", (nameSchema as any).config);
console.log("nicknameSchema config:", (nicknameSchema as any).config);
console.log("SimpleUserSchema shape:", (SimpleUserSchema as any).shape);

// Test der inferierten Typen
console.log("=== INFERRED TYPES ===");
console.log("NameType inferred:", typeof nameValue);
console.log("NicknameType inferred:", typeof nicknameValue);
console.log("SimpleUserType inferred:", typeof userValue);

// Test der Objekt-Properties
console.log("user1.name:", user1.name);
console.log("user1.nickname:", user1.nickname);
console.log("user2.name:", user2.name);
console.log("user2.nickname:", user2.nickname);
// console.log("user3.name:", user3.name);
// console.log("user3.nickname:", user3.nickname);
// console.log("user4.name:", user4.name);
// console.log("user4.nickname:", user4.nickname);

// Debug der Shape-Properties
console.log("=== SHAPE DEBUG ===");
console.log("SimpleUserSchema.shape.name:", (SimpleUserSchema as any).shape.name);
console.log("SimpleUserSchema.shape.nickname:", (SimpleUserSchema as any).shape.nickname);
console.log("name config:", ((SimpleUserSchema as any).shape.name as any).config);
console.log("nickname config:", ((SimpleUserSchema as any).shape.nickname as any).config); 