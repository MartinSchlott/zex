import { zex } from '../zex/index.js';

// Test der korrekten Type-Inferenz
const UserSchema = zex.object({
  name: zex.string(),
  age: zex.number().optional(),
  email: zex.string().email().optional(),
});

type User = zex.infer<typeof UserSchema>;

// Diese sollten alle korrekt sein (keine Fehler)
const user1: User = {
  name: "John Doe",
  age: 30,
  email: "john@example.com"
};

const user2: User = {
  name: "Jane Doe",
  age: 25
};

const user3: User = {
  name: "Bob Smith",
  email: "bob@example.com"
};

const user4: User = {
  name: "Alice Johnson"
};

// Diese sollten Fehler werfen
// const user5: User = {
//   age: 30,
//   email: "test@example.com"
// }; // Fehler: name fehlt

// const user6: User = {
//   age: 30
// }; // Fehler: name fehlt

// const user7: User = {}; // Fehler: name fehlt

console.log("✅ Type inference works correctly!");
console.log("user1:", user1);
console.log("user2:", user2);
console.log("user3:", user3);
console.log("user4:", user4); 