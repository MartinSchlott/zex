import { zex } from '../zex/index.js';
import { ZexBase } from '../zex/base.js';

// Test der einzelnen Schemas
const nameSchema = zex.string();
const nicknameSchema = zex.string().optional();

// Type-Inspector für einzelne Schemas
type Inspect<T> = { [K in keyof T]: T[K] };

// Test der Flags für einzelne Schemas
type NameFlags = typeof nameSchema extends ZexBase<any, infer F> ? F : never;
type NicknameFlags = typeof nicknameSchema extends ZexBase<any, infer F> ? F : never;

type DebugNameFlags = Inspect<NameFlags>;
type DebugNicknameFlags = Inspect<NicknameFlags>;

// Test der Objekt-Schemas
const SimpleUserSchema = zex.object({
  name: zex.string(),
  nickname: zex.string().optional(),
});

// Test der Flags für Objekt-Properties
type NamePropertyFlags = typeof SimpleUserSchema.shape.name extends ZexBase<any, infer F> ? F : never;
type NicknamePropertyFlags = typeof SimpleUserSchema.shape.nickname extends ZexBase<any, infer F> ? F : never;

type DebugNamePropertyFlags = Inspect<NamePropertyFlags>;
type DebugNicknamePropertyFlags = Inspect<NicknamePropertyFlags>;

// Test der inferierten Typen
type SimpleUser = zex.infer<typeof SimpleUserSchema>;

// Test-Zuweisungen
const user1: SimpleUser = {
  name: "John",
  nickname: "JD"
};

const user2: SimpleUser = {
  name: "John"
};

// const user3: SimpleUser = {
//   nickname: "JD"
// }; // Sollte Fehler werfen

// const user4: SimpleUser = {}; // Sollte Fehler werfen

// Debug-Ausgaben
console.log("=== FLAG DEBUG ===");
console.log("nameSchema type:", typeof nameSchema);
console.log("nicknameSchema type:", typeof nicknameSchema);
console.log("nameSchema config:", (nameSchema as any).config);
console.log("nicknameSchema config:", (nicknameSchema as any).config);

console.log("=== OBJECT SHAPE DEBUG ===");
console.log("SimpleUserSchema shape:", (SimpleUserSchema as any).shape);
console.log("name property type:", typeof (SimpleUserSchema as any).shape.name);
console.log("nickname property type:", typeof (SimpleUserSchema as any).shape.nickname);
console.log("name property config:", ((SimpleUserSchema as any).shape.name as any).config);
console.log("nickname property config:", ((SimpleUserSchema as any).shape.nickname as any).config);

console.log("=== TEST RESULTS ===");
console.log("user1:", user1);
console.log("user2:", user2);
// console.log("user3:", user3);
// console.log("user4:", user4); 