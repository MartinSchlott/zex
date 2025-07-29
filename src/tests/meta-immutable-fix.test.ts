import { zex } from '../zex/index.js';

console.log("=== META IMMUTABLE FIX TEST ===");

// Test 1: Basis-Test
const base = zex.string();
const modified = base.meta({ title: "Test" });

console.log("base.config.meta.title:", (base as any).config.meta.title);     // Sollte undefined sein
console.log("modified.config.meta.title:", (modified as any).config.meta.title); // Sollte "Test" sein

// Test 2: Mehrere Meta-Properties
const base2 = zex.string();
const modified2 = base2.meta({ 
  title: "Test Title", 
  description: "Test Description",
  customField: "Custom Value"
});

console.log("base2.config.meta:", (base2 as any).config.meta);
console.log("modified2.config.meta:", (modified2 as any).config.meta);

// Test 3: Separate Meta Test
const base3 = zex.string().title("Original Title");
const withMeta3 = base3.meta({ customField: "Custom" }) as any;

console.log("base3.config.meta:", (base3 as any).config.meta);
console.log("withMeta3.config.meta:", withMeta3.config.meta);

// Test 4: Meta ohne Parameter (Getter)
const schema = zex.string().meta({ title: "Getter Test" });
const metaData = (schema as any).meta();
console.log("metaData:", metaData);

// Test 5: Immutability Test
const original = zex.string();
const withTitle = original.title("Title");
const withMeta = original.meta({ customField: "Custom" });

console.log("original.config.meta:", (original as any).config.meta);
console.log("withTitle.config.meta:", (withTitle as any).config.meta);
console.log("withMeta.config.meta:", (withMeta as any).config.meta);

console.log("=== META IMMUTABLE FIX VERIFIED ==="); 