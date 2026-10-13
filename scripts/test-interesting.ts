/* Benchmark + self-test for the interesting-polytron catalog (Node). */
import { ensureInterestingRanks, interestingCodeAt, runInterestingSelfTests } from "../src/polytron/interesting";

for (const target of [10, 100, 1951]) {
  const t0 = performance.now();
  const r = ensureInterestingRanks(target, 60_000);
  const ms = (performance.now() - t0).toFixed(0);
  console.log(`target ${target} -> found ${r.found}, scanned ${r.scanned}, complete ${r.complete} (${ms}ms)`);
}
console.log("rank 0/1/1950 codes:", interestingCodeAt(0), interestingCodeAt(1), interestingCodeAt(1950));

const t = performance.now();
const tests = runInterestingSelfTests();
console.log(`self-tests: ${tests.passed} passed, ${tests.failed.length} failed (${(performance.now() - t).toFixed(0)}ms)`);
for (const f of tests.failed) console.log(`  FAIL ${f.label}: ${f.detail}`);
process.exit(tests.failed.length === 0 ? 0 : 1);
