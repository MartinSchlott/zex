import { zex, infer } from '../zex/index.js';

// 1. Definiere ein extrem einfaches Schema
// - Ein erforderlicher String
// - Ein optionaler String
const SimpleUserSchema = zex.object({
  name: zex.string(),
  nickname: zex.string().optional(),
});

// 2. Leite den Typ ab
type SimpleUser = zex.infer<typeof SimpleUserSchema>;

// 3. Teste den abgeleiteten Typ
//    Fahre mit der Maus über `SimpleUser` in deiner IDE.
//    Was wird angezeigt?
//    ERWARTET: { name: string; nickname?: string; }
//    WENN FEHLERHAFT: { name?: string; nickname?: string; } oder any oder {}

// 4. Testzuweisungen, um TypeScript-Fehler zu provozieren

// DIES SOLLTE EINEN FEHLER WERFEN (Fehlende Eigenschaft 'name')
// Wenn hier kein roter Kringel erscheint, ist die Inferenz definitiv kaputt.
// const user1: SimpleUser = {
//   nickname: 'Buddy',
// };

// // DIES SOLLTE EINEN FEHLER WERFEN (Fehlende Eigenschaft 'name')
// const user2: SimpleUser = {};
const user2: SimpleUser = {
  name: 'John Doe',
};
const user1: SimpleUser = {
  name: 'John Doe',
  nickname: 'JD',
};

// DIES SOLLTE KORREKT SEIN
const user3: SimpleUser = {
  name: 'John Doe',
};

// DIES SOLLTE AUCH KORREKT SEIN
const user4: SimpleUser = {
  name: 'John Doe',
  nickname: 'JD',
};

// Gib die Typen zur Sicherheit in der Konsole aus (hat keinen Einfluss auf TS-Fehler)
console.log(user1, user2, user3, user4);

// Debug: Teste einzelne Schemas
const nameSchema = zex.string();
const nicknameSchema = zex.string().optional();

type NameType = zex.infer<typeof nameSchema>;
type NicknameType = zex.infer<typeof nicknameSchema>;

console.log("✅ Name schema type:", typeof nameSchema);
console.log("✅ Nickname schema type:", typeof nicknameSchema);
console.log("✅ Name schema config:", (nameSchema as any).config);
console.log("✅ Nickname schema config:", (nicknameSchema as any).config);

// Test: Versuche die Properties explizit zu verwenden
console.log("✅ user1.name:", user1.name);
console.log("✅ user1.nickname:", user1.nickname);
console.log("✅ user2.name:", user2.name);
console.log("✅ user2.nickname:", user2.nickname); 