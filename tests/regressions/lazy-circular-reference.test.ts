import { zex } from '../_imports.js';
import { expectFail, expectOk } from '../_utils.js';

console.log("\n=== REGRESSION: lazy circular reference detection ===");

// A self-referencing lazy schema should throw circular_reference, not cause infinite recursion
type TreeNode = { value: string; children?: TreeNode[] };
const treeSchema: any = zex.object({
  value: zex.string(),
  children: zex.array(zex.lazy(() => treeSchema)).optional()
});

expectOk('lazy schema parses valid tree', () =>
  treeSchema.parse({ value: 'root', children: [{ value: 'child' }] })
);

expectOk('lazy schema parses tree without children', () =>
  treeSchema.parse({ value: 'leaf' })
);

// Direct self-reference: lazy(() => self) should detect the cycle
const selfRef: any = zex.lazy(() => selfRef);
expectFail('direct self-referencing lazy schema throws', () =>
  selfRef.parse('anything')
);
