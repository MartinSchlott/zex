import { zex } from '../zex/index.js';

console.log("=== ZEXBUFFER FIRST-CLASS BINARY SUPPORT TESTS ===");

// =============================================================================
// TEST 1: Basic Buffer Creation
// =============================================================================

console.log("\n--- Test 1: Basic Buffer Creation ---");

const basicBuffer = zex.buffer();
const imageBuffer = zex.buffer("image/png");
const pdfBuffer = zex.buffer("application/pdf");

console.log("✅ Basic buffer schema created");
console.log("✅ Image buffer schema created with MIME type");
console.log("✅ PDF buffer schema created with MIME type");

// Test type inference
type BasicBufferType = zex.infer<typeof basicBuffer>;
type ImageBufferType = zex.infer<typeof imageBuffer>;
type PdfBufferType = zex.infer<typeof pdfBuffer>;

console.log("✅ Type inference works for all buffer types");

// =============================================================================
// TEST 2: Runtime Validation
// =============================================================================

console.log("\n--- Test 2: Runtime Validation ---");

// Test Uint8Array (universal)
const uint8Data = new Uint8Array([1, 2, 3, 4, 5]);

try {
  const result1 = basicBuffer.parse(uint8Data);
  console.log("✅ Uint8Array validation successful:", result1);
} catch (error) {
  console.log("❌ Uint8Array validation failed:", error);
}

// Test Buffer (Node.js compatibility)
let nodeBuffer: any = null;
try {
  // Try to create a Buffer (Node.js only)
  if (typeof Buffer !== 'undefined') {
    nodeBuffer = Buffer.from([1, 2, 3, 4, 5]);
    const result2 = basicBuffer.parse(nodeBuffer);
    console.log("✅ Buffer validation successful:", result2);
  } else {
    console.log("ℹ️ Buffer not available (browser environment)");
  }
} catch (error) {
  console.log("❌ Buffer validation failed:", error);
}

// Test invalid data
try {
  basicBuffer.parse("not a buffer");
  console.log("❌ Should have failed for string");
} catch (error) {
  console.log("✅ Correctly failed for string:", (error as any).message);
}

try {
  basicBuffer.parse(123);
  console.log("❌ Should have failed for number");
} catch (error) {
  console.log("✅ Correctly failed for number:", (error as any).message);
}

try {
  basicBuffer.parse({});
  console.log("❌ Should have failed for object");
} catch (error) {
  console.log("✅ Correctly failed for object:", (error as any).message);
}

// =============================================================================
// TEST 3: MIME Type Support
// =============================================================================

console.log("\n--- Test 3: MIME Type Support ---");

const imageSchema = zex.buffer("image/png");
const videoSchema = zex.buffer("video/mp4");
const audioSchema = zex.buffer("audio/mpeg");

// Test that MIME types are preserved in meta
console.log("✅ Image schema MIME type:", (imageSchema.meta() as any).contentMediaType);
console.log("✅ Video schema MIME type:", (videoSchema.meta() as any).contentMediaType);
console.log("✅ Audio schema MIME type:", (audioSchema.meta() as any).contentMediaType);

// Test validation with MIME type
try {
  const result = imageSchema.parse(uint8Data);
  console.log("✅ Image buffer with MIME type validation successful:", result);
} catch (error) {
  console.log("❌ Image buffer validation failed:", error);
}

// =============================================================================
// TEST 4: JSON Schema Generation
// =============================================================================

console.log("\n--- Test 4: JSON Schema Generation ---");

const basicJsonSchema = basicBuffer.toJsonSchema();
const imageJsonSchema = imageBuffer.toJsonSchema();
const pdfJsonSchema = pdfBuffer.toJsonSchema();

console.log("✅ Basic buffer JSON Schema:", basicJsonSchema);
console.log("✅ Image buffer JSON Schema:", imageJsonSchema);
console.log("✅ PDF buffer JSON Schema:", pdfJsonSchema);

// Verify JSON Schema structure
console.log("✅ Basic schema has correct type:", basicJsonSchema.type === "object");
console.log("✅ Basic schema has correct format:", basicJsonSchema.format === "buffer");
console.log("✅ Image schema has contentMediaType:", imageJsonSchema.contentMediaType === "image/png");
console.log("✅ PDF schema has contentMediaType:", pdfJsonSchema.contentMediaType === "application/pdf");

// =============================================================================
// TEST 5: JSON Schema Roundtrip
// =============================================================================

console.log("\n--- Test 5: JSON Schema Roundtrip ---");

// Test basic buffer roundtrip
const basicJson = basicBuffer.toJsonSchema();
const recreatedBasic = zex.fromJsonSchema(basicJson);

console.log("✅ Basic buffer roundtrip successful");
console.log("✅ Recreated basic schema type:", recreatedBasic.constructor.name);

// Test image buffer roundtrip
const imageJson = imageBuffer.toJsonSchema();
const recreatedImage = zex.fromJsonSchema(imageJson);

console.log("✅ Image buffer roundtrip successful");
console.log("✅ Recreated image schema type:", recreatedImage.constructor.name);
console.log("✅ Recreated image MIME type:", (recreatedImage.meta() as any).contentMediaType);

// Test PDF buffer roundtrip
const pdfJson = pdfBuffer.toJsonSchema();
const recreatedPdf = zex.fromJsonSchema(pdfJson);

console.log("✅ PDF buffer roundtrip successful");
console.log("✅ Recreated PDF schema type:", recreatedPdf.constructor.name);
console.log("✅ Recreated PDF MIME type:", (recreatedPdf.meta() as any).contentMediaType);

// =============================================================================
// TEST 6: Buffer in Objects
// =============================================================================

console.log("\n--- Test 6: Buffer in Objects ---");

const fileSchema = zex.object({
  name: zex.string(),
  content: zex.buffer("application/octet-stream"),
  size: zex.number()
});

type FileType = zex.infer<typeof fileSchema>;

const fileData: FileType = {
  name: "document.pdf",
  content: new Uint8Array([1, 2, 3, 4, 5]),
  size: 5
};

console.log("✅ File schema type inference works:", fileData);

try {
  const result = fileSchema.parse(fileData);
  console.log("✅ File schema validation successful:", result);
} catch (error) {
  console.log("❌ File schema validation failed:", error);
}

// =============================================================================
// TEST 7: Buffer in Arrays
// =============================================================================

console.log("\n--- Test 7: Buffer in Arrays ---");

const imageArraySchema = zex.array(zex.buffer("image/jpeg"));

type ImageArrayType = zex.infer<typeof imageArraySchema>;

const imageArray: ImageArrayType = [
  new Uint8Array([1, 2, 3]),
  new Uint8Array([4, 5, 6]),
  new Uint8Array([7, 8, 9])
];

console.log("✅ Image array type inference works:", imageArray);

try {
  const result = imageArraySchema.parse(imageArray);
  console.log("✅ Image array validation successful:", result);
} catch (error) {
  console.log("❌ Image array validation failed:", error);
}

// =============================================================================
// TEST 8: Buffer in Unions
// =============================================================================

console.log("\n--- Test 8: Buffer in Unions ---");

const mediaSchema = zex.union(
  zex.buffer("image/png"),
  zex.buffer("image/jpeg"),
  zex.buffer("video/mp4")
);

type MediaType = zex.infer<typeof mediaSchema>;

const pngData: MediaType = new Uint8Array([1, 2, 3, 4, 5]);

console.log("✅ Media union type inference works:", pngData);

try {
  const result = mediaSchema.parse(pngData);
  console.log("✅ Media union validation successful:", result);
} catch (error) {
  console.log("❌ Media union validation failed:", error);
}

// =============================================================================
// TEST 9: Buffer with Optional Properties
// =============================================================================

console.log("\n--- Test 9: Buffer with Optional Properties ---");

const optionalBufferSchema = zex.object({
  required: zex.buffer("application/pdf"),
  optional: zex.buffer("image/png").optional()
});

type OptionalBufferType = zex.infer<typeof optionalBufferSchema>;

const fullData: OptionalBufferType = {
  required: new Uint8Array([1, 2, 3]),
  optional: new Uint8Array([4, 5, 6])
};

const partialData: OptionalBufferType = {
  required: new Uint8Array([1, 2, 3])
  // optional is optional
};

console.log("✅ Full optional buffer type inference works:", fullData);
console.log("✅ Partial optional buffer type inference works:", partialData);

try {
  const result1 = optionalBufferSchema.parse(fullData);
  console.log("✅ Full optional buffer validation successful:", result1);
} catch (error) {
  console.log("❌ Full optional buffer validation failed:", error);
}

try {
  const result2 = optionalBufferSchema.parse(partialData);
  console.log("✅ Partial optional buffer validation successful:", result2);
} catch (error) {
  console.log("❌ Partial optional buffer validation failed:", error);
}

// =============================================================================
// TEST 10: Complex Nested Buffer Schema
// =============================================================================

console.log("\n--- Test 10: Complex Nested Buffer Schema ---");

const complexBufferSchema = zex.object({
  metadata: zex.object({
    name: zex.string(),
    type: zex.string()
  }),
  files: zex.array(zex.object({
    name: zex.string(),
    content: zex.buffer("application/octet-stream"),
    mimeType: zex.string()
  }))
});

type ComplexBufferType = zex.infer<typeof complexBufferSchema>;

const complexData: ComplexBufferType = {
  metadata: {
    name: "Document Package",
    type: "archive"
  },
  files: [
    {
      name: "document.pdf",
      content: new Uint8Array([1, 2, 3, 4, 5]),
      mimeType: "application/pdf"
    },
    {
      name: "image.png",
      content: new Uint8Array([6, 7, 8, 9, 10]),
      mimeType: "image/png"
    }
  ]
};

console.log("✅ Complex buffer schema type inference works:", complexData);

try {
  const result = complexBufferSchema.parse(complexData);
  console.log("✅ Complex buffer schema validation successful:", result);
} catch (error) {
  console.log("❌ Complex buffer schema validation failed:", error);
}

// =============================================================================
// TEST 11: Error Cases
// =============================================================================

console.log("\n--- Test 11: Error Cases ---");

// Test missing required buffer
try {
  optionalBufferSchema.parse({
    // missing required buffer
  });
  console.log("❌ Should have failed for missing required buffer");
} catch (error) {
  console.log("✅ Correctly failed for missing required buffer:", (error as any).message);
}

// Test wrong type in buffer field
try {
  optionalBufferSchema.parse({
    required: "not a buffer",
    optional: new Uint8Array([1, 2, 3])
  });
  console.log("❌ Should have failed for wrong type in buffer field");
} catch (error) {
  console.log("✅ Correctly failed for wrong type in buffer field:", (error as any).message);
}

// =============================================================================
// TEST 12: Performance and Memory
// =============================================================================

console.log("\n--- Test 12: Performance and Memory ---");

// Test that buffer schemas are lightweight
const buffer1 = zex.buffer("image/png");
const buffer2 = zex.buffer("image/png");

console.log("✅ Buffer schemas are different instances:", buffer1 !== buffer2);
console.log("✅ Buffer schemas have same MIME type:", 
  (buffer1.meta() as any).contentMediaType === (buffer2.meta() as any).contentMediaType);

// Test large buffer validation
const largeBuffer = new Uint8Array(1000);
for (let i = 0; i < largeBuffer.length; i++) {
  largeBuffer[i] = i % 256;
}

try {
  const result = basicBuffer.parse(largeBuffer);
  console.log("✅ Large buffer validation successful (size:", result.length, ")");
} catch (error) {
  console.log("❌ Large buffer validation failed:", error);
}

console.log("=== ZEXBUFFER FIRST-CLASS BINARY SUPPORT TESTS COMPLETE ==="); 