import { generatePoly } from "@/polyhedronisme/polyhedronisme";
import { CODE_PALETTES, SEEDS, TOTAL_CHAINS, indexToChain } from "@/polytron/mapping";

// "Interesting" polytrons: shapes with at least TWO distinct face-classes.
// Interestingness depends only on the operator chain + seed — never on the
// palette — so each chain/seed combo is tested once and memoized for the
// session. The catalog is filled lazily by scanning the polytronic-number
// space in ascending order until enough interesting shapes are found; the
// scan resumes where it left off if more ranks are ever needed.

const P = CODE_PALETTES.length; // palette slots folded into a code (10)
const S = SEEDS.length; // 5

// Verdict per chain+seed combo: 0 untested, 1 dull, 2 interesting.
const verdicts = new Uint8Array(TOTAL_CHAINS * S);
let scannedUpTo = 0; // next combo index (ascending shape order) to test
// Ascending polytronic numbers (palette slot 0) of interesting shapes.
const interestingBases: number[] = [];

const shapeCode = (chainIdx: number, seedIdx: number) => chainIdx * (P * S) + seedIdx * P;

function testShape(chainIdx: number, seedIdx: number): boolean {
  const recipe = indexToChain(chainIdx).join("") + SEEDS[seedIdx];
  try {
    const poly = generatePoly(recipe);
    return new Set(poly.faceClasses).size >= 2;
  } catch {
    return false;
  }
}

// Test combos in ascending polytronic order until `count` interesting shapes
// are ranked (or the space is exhausted). Returns whether the target was
// reached; the scan can be resumed by calling again.
export function ensureInterestingRanks(
  count: number,
  timeBudgetMs = Infinity
): { complete: boolean; found: number; scanned: number } {
  const start = performance.now();
  while (interestingBases.length < count && scannedUpTo < verdicts.length) {
    if (performance.now() - start > timeBudgetMs) break;
    const chainIdx = Math.floor(scannedUpTo / S);
    const seedIdx = scannedUpTo % S;
    const interesting = testShape(chainIdx, seedIdx);
    verdicts[scannedUpTo] = interesting ? 2 : 1;
    if (interesting) interestingBases.push(shapeCode(chainIdx, seedIdx));
    scannedUpTo++;
  }
  return {
    complete: interestingBases.length >= count || scannedUpTo >= verdicts.length,
    found: interestingBases.length,
    scanned: scannedUpTo,
  };
}

// Rank -> polytronic number. Wraps modulo the ranked shapes. The palette slot
// varies with the rank so consecutive cells sweep palettes like normal mode
// (verdicts are palette-independent). Returns null only if nothing has been
// scanned yet.
export function interestingCodeAt(rank: number): number | null {
  const n = interestingBases.length;
  if (n === 0) return null;
  return interestingBases[rank % n] + (rank % P);
}

export function interestingRankCount(): number {
  return interestingBases.length;
}

export function scannedShapeCount(): number {
  return scannedUpTo;
}

// Re-test a combo directly, bypassing the memo — used by self-tests to
// confirm cached verdicts match a fresh build.
export function retestShape(chainIdx: number, seedIdx: number): boolean {
  return testShape(chainIdx, seedIdx);
}

// ---------- self-tests ----------

export function runInterestingSelfTests(): { passed: number; failed: Array<{ label: string; detail: string }> } {
  const failed: Array<{ label: string; detail: string }> = [];
  let passed = 0;
  const expect = (cond: boolean, label: string, detail: string) => {
    if (cond) passed++;
    else failed.push({ label, detail });
  };

  // Fill enough ranks to cover the visible world (25 rings -> 1951 cells),
  // time-boxed so a pathological space cannot hang the test run.
  const target = 1951;
  const res = ensureInterestingRanks(target, 30_000);
  expect(res.found > 0, "found-some", "scan ranked no interesting shapes");
  if (res.found === 0) return { passed, failed };

  // Polytronic numbers are strictly increasing across ranks (no wrap).
  let strictlyIncreasing = true;
  let prev = -1;
  for (let rank = 0; rank < res.found; rank++) {
    const code = interestingCodeAt(rank)!;
    if (code <= prev) {
      strictlyIncreasing = false;
      failed.push({ label: "strictly-increasing", detail: `rank ${rank}: ${code} <= ${prev}` });
      break;
    }
    prev = code;
  }
  expect(strictlyIncreasing, "strictly-increasing", "codes not ascending");

  // Wrap-around is safe and stays in range.
  const wrapped = interestingCodeAt(res.found * 3 + 7);
  expect(wrapped !== null && wrapped! >= 0 && wrapped! < TOTAL_CHAINS * S * P, "wrap-safe", `got ${wrapped}`);

  // Sampled ranks agree with a fresh (unmemoized) build: every ranked shape
  // really has >= 2 face classes.
  const sampleStep = Math.max(1, Math.floor(res.found / 25));
  for (let rank = 0; rank < res.found; rank += sampleStep) {
    const code = interestingCodeAt(rank)!;
    const chainIdx = Math.floor(code / (P * S));
    const seedIdx = Math.floor(code / P) % S;
    expect(retestShape(chainIdx, seedIdx), `rank-${rank}-is-interesting`, `code ${code} re-tested dull`);
  }

  // Sampled dull verdicts agree too: unranked combos in the scanned prefix
  // must re-test as dull (only meaningful for combos actually scanned).
  let dullChecked = 0;
  for (let shape = 0; shape < scannedShapeCount() && dullChecked < 25; shape += 97) {
    if (verdicts[shape] !== 1) continue;
    const chainIdx = Math.floor(shape / S);
    const seedIdx = shape % S;
    expect(!retestShape(chainIdx, seedIdx), `dull-${shape}-retest`, "memoized dull but re-tested interesting");
    dullChecked++;
  }

  return { passed, failed };
}
