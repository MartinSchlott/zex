import { zex } from '../zex/index.js';

console.log("=== URI & URL VALIDATION TEST ===");

// =============================================================================
// TEST: URI vs URL Validation
// =============================================================================

console.log("\n--- Test: URI vs URL Validation ---");

// Test 1: URI Validation
console.log("\n--- Test 1: URI Validation ---");

const uriSchema = zex.uri();

// Valid URIs
const validUris = [
  "http://example.com",
  "https://example.com/path",
  "ftp://ftp.example.com",
  "mailto:user@example.com",
  "tel:+1234567890",
  "file:///path/to/file",
  "data:text/plain;base64,SGVsbG8=",
  "urn:isbn:0-486-27557-4",
  "git://github.com/user/repo.git",
  "ssh://user@host:port/path"
];

console.log("✅ Testing valid URIs:");
for (const uri of validUris) {
  try {
    const result = uriSchema.parse(uri);
    console.log(`  ✅ "${uri}" -> ${result}`);
  } catch (error) {
    console.log(`  ❌ "${uri}" -> ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Invalid URIs
const invalidUris = [
  "not-a-uri",
  "example.com",
  "/relative/path",
  "C:\\path\\to\\file",
  "just text",
  "",
  "://example.com" // missing scheme
];

console.log("\n❌ Testing invalid URIs:");
for (const uri of invalidUris) {
  try {
    const result = uriSchema.parse(uri);
    console.log(`  ❌ "${uri}" -> Should have failed but got: ${result}`);
  } catch (error) {
    console.log(`  ✅ "${uri}" -> Correctly rejected: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Test 2: URL Validation
console.log("\n--- Test 2: URL Validation ---");

const urlSchema = zex.url();

// Valid URLs (HTTP/HTTPS only)
const validUrls = [
  "http://example.com",
  "https://example.com",
  "http://example.com/path",
  "https://example.com/path?query=value",
  "http://example.com/path#fragment",
  "https://subdomain.example.com",
  "http://example.com:8080",
  "https://example.com:443/path?q=1&r=2#section",
  "http://example.com/api/users?page=1&limit=10&sort=name",
  "https://api.example.com/v1/data?filter=active&include=details&format=json"
];

console.log("✅ Testing valid URLs:");
for (const url of validUrls) {
  try {
    const result = urlSchema.parse(url);
    console.log(`  ✅ "${url}" -> ${result}`);
  } catch (error) {
    console.log(`  ❌ "${url}" -> ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Invalid URLs
const invalidUrls = [
  "ftp://example.com", // not HTTP/HTTPS
  "mailto:user@example.com", // not HTTP/HTTPS
  "tel:+1234567890", // not HTTP/HTTPS
  "file:///path/to/file", // not HTTP/HTTPS
  "not-a-url",
  "example.com", // missing scheme
  "http://example", // incomplete domain
  "http://.com", // invalid domain
  "http://example..com" // invalid domain
];

console.log("\n❌ Testing invalid URLs:");
for (const url of invalidUrls) {
  try {
    const result = urlSchema.parse(url);
    console.log(`  ❌ "${url}" -> Should have failed but got: ${result}`);
  } catch (error) {
    console.log(`  ✅ "${url}" -> Correctly rejected: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Test 3: JSON Schema Generation
console.log("\n--- Test 3: JSON Schema Generation ---");

const uriJsonSchema = uriSchema.toJsonSchema();
const urlJsonSchema = urlSchema.toJsonSchema();

console.log("✅ URI JSON Schema:", JSON.stringify(uriJsonSchema, null, 2));
console.log("✅ URL JSON Schema:", JSON.stringify(urlJsonSchema, null, 2));

// Test 4: JSON Schema Roundtrip
console.log("\n--- Test 4: JSON Schema Roundtrip ---");

try {
  const recreatedUri = zex.fromJsonSchema(uriJsonSchema);
  const recreatedUrl = zex.fromJsonSchema(urlJsonSchema);
  
  console.log("✅ URI roundtrip successful:", recreatedUri.constructor.name);
  console.log("✅ URL roundtrip successful:", recreatedUrl.constructor.name);
  
  // Test that recreated schemas work the same
  const testUri = "http://example.com";
  const testUrl = "https://example.com";
  
  const uriResult1 = uriSchema.parse(testUri);
  const uriResult2 = recreatedUri.parse(testUri);
  console.log("✅ URI validation consistent:", uriResult1 === uriResult2);
  
  const urlResult1 = urlSchema.parse(testUrl);
  const urlResult2 = recreatedUrl.parse(testUrl);
  console.log("✅ URL validation consistent:", urlResult1 === urlResult2);
  
} catch (error) {
  console.log("❌ JSON Schema roundtrip failed:", error);
}

// Test 5: URI vs URL Distinction
console.log("\n--- Test 5: URI vs URL Distinction ---");

const httpUri = "http://example.com";
const ftpUri = "ftp://example.com";

console.log("✅ Testing URI vs URL distinction:");
console.log(`  URI accepts HTTP: ${uriSchema.safeParse(httpUri).success}`);
console.log(`  URI accepts FTP: ${uriSchema.safeParse(ftpUri).success}`);
console.log(`  URL accepts HTTP: ${urlSchema.safeParse(httpUri).success}`);
console.log(`  URL accepts FTP: ${urlSchema.safeParse(ftpUri).success}`);

console.log("\n✅ Summary:");
console.log("  - URI: Accepts any valid URI scheme (http, https, ftp, mailto, etc.)");
console.log("  - URL: Accepts only HTTP and HTTPS URLs");

console.log("=== URI & URL VALIDATION TEST COMPLETE ==="); 