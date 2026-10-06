/* Standalone codec test runner (Node). Run with: npm run test:codec */
import { runCodecSelfTests } from "../src/polytron/mapping";

const result = runCodecSelfTests();
console.log(`passed: ${result.passed}, failed: ${result.failed.length}`);
for (const f of result.failed) console.log(`  FAIL ${f.label}: ${f.detail}`);
process.exit(result.failed.length === 0 ? 0 : 1);
