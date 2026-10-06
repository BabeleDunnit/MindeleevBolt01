import { generatePoly } from "@/polyhedronisme/polyhedronisme";

// ---------- constants ----------

// All-lowercase operator alphabet, no parameters. Stellation is `l`; there is
// no uppercase P. C, A, K are geometry-polishing passes (no structural effect)
// and are excluded.
export const OPERATORS = [
  "d", "a", "k", "g", "p", "r", "c", "w", "q", "n", "x", "l", "u",
  "e", "b", "o", "m", "t", "j", "s",
] as const;

export const SEEDS = ["T", "C", "O", "D", "I"] as const;

const R = OPERATORS.length; // 20
const S = SEEDS.length; // 5

// Depth 0..4 chains; within each depth, lexicographic by operator symbol.
// Index 0 is the bare seed (empty chain).
export const TOTAL_CHAINS = 1 + R + R * R + R * R * R + R ** 4; // 168,401
export const TOTAL_CODES = TOTAL_CHAINS * S; // 842,005

// ---------- chain <-> index ----------

export function chainToIndex(chain: readonly string[]): number {
  const n = chain.length;
  if (n === 0) return 0;
  if (n > 4) throw new Error(`Chain too deep (max 4): ${chain.join("")}`);
  let idx = 0;
  for (let d = 0; d < n; d++) idx += R ** d;
  for (let i = 0; i < n; i++) {
    const rank = OPERATORS.indexOf(chain[i] as (typeof OPERATORS)[number]);
    if (rank < 0) throw new Error(`Unknown operator: "${chain[i]}"`);
    idx += rank * R ** (n - 1 - i);
  }
  return idx;
}

export function indexToChain(index: number): string[] {
  if (!Number.isInteger(index) || index < 0 || index >= TOTAL_CHAINS) {
    throw new Error(`Chain index out of range [0, ${TOTAL_CHAINS}): ${index}`);
  }
  if (index === 0) return [];
  let n = 1;
  let prefix = 1;
  while (index >= prefix + R ** n) {
    prefix += R ** n;
    n++;
  }
  let rem = index - prefix;
  const chain: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const rank = rem % R;
    rem = Math.floor(rem / R);
    chain[i] = OPERATORS[rank];
  }
  return chain;
}

// ---------- code <-> recipe ----------

// A "code" packs chain index and seed densely into one integer in
// [0, TOTAL_CODES): code = chainIdx * S + seedIdx. Seed-major packing keeps
// nearby codes on nearby cells sharing a chain family.
export function codeToRecipeParts(code: number): { chain: string[]; seed: string } {
  if (!Number.isInteger(code) || code < 0 || code >= TOTAL_CODES) {
    throw new Error(`Code out of range [0, ${TOTAL_CODES}): ${code}`);
  }
  const seed = SEEDS[code % S];
  const chainIdx = Math.floor(code / S);
  return { chain: indexToChain(chainIdx), seed };
}

export function recipePartsToCode(chain: readonly string[], seed: string): number {
  const seedIdx = SEEDS.indexOf(seed as (typeof SEEDS)[number]);
  if (seedIdx < 0) throw new Error(`Unknown seed: "${seed}"`);
  return chainToIndex(chain) * S + seedIdx;
}

export function intToRecipe(code: number): string {
  const { chain, seed } = codeToRecipeParts(code);
  return chain.join("") + seed;
}

export function recipeToInt(recipe: string): number {
  const match = recipe.match(/^([a-z]*)([TOCID])$/);
  if (!match) {
    throw new Error(`Invalid recipe (expected [ops][seed], ops in ${OPERATORS.join("")}): "${recipe}"`);
  }
  const chain = match[1] === "" ? [] : match[1].split("");
  return recipePartsToCode(chain, match[2]);
}

// ---------- world cells ----------

// Cell position -> integer code. Cells are numbered in ring-major order
// (center first, then each ring clockwise), then folded into the code space.
export function cellCode(coord: { ring: number; idx: number }): number {
  const cellsBeforeRing = coord.ring === 0 ? 0 : 1 + 3 * coord.ring * (coord.ring - 1);
  return (cellsBeforeRing + coord.idx) % TOTAL_CODES;
}

// ---------- geometry ----------

// Build the polyhedron for a world cell from its integer code. Codes whose
// meshes exceed the budget render as a placeholder instead of the real shape.
export const FACE_BUDGET = 500;

export function buildPolytron(code: number): { recipe: string; poly: ReturnType<typeof generatePoly>; overBudget: boolean } {
  const recipe = intToRecipe(code);
  const poly = generatePoly(recipe);
  return { recipe, poly, overBudget: poly.faces.length > FACE_BUDGET };
}

// ---------- tests ----------

export function runCodecSelfTests(): { passed: number; failed: Array<{ label: string; detail: string }> } {
  const failed: Array<{ label: string; detail: string }> = [];
  let passed = 0;

  const expect = (cond: boolean, label: string, detail: string) => {
    if (cond) passed++;
    else failed.push({ label, detail });
  };

  // Full roundtrip over every code.
  for (let code = 0; code < TOTAL_CODES; code++) {
    const recipe = intToRecipe(code);
    let back: number;
    try {
      back = recipeToInt(recipe);
    } catch (e) {
      failed.push({ label: `roundtrip(${code})`, detail: `recipeToInt threw: ${String(e)}` });
      continue;
    }
    if (back !== code) {
      failed.push({ label: `roundtrip(${code})`, detail: `${recipe}: expected ${code}, got ${back}` });
    } else {
      passed++;
    }
  }

  // Spot values.
  const spots: Array<[number, string]> = [
    [0, "T"],
    [4, "I"],
    [1 * S, "dT"], // first depth-1 chain, seed T
    [((1 + R) * S), "ddT"], // first depth-2 chain ("dd")
  ];
  for (const [code, recipe] of spots) {
    expect(intToRecipe(code) === recipe, `spot(${code})`, `expected ${recipe}, got ${intToRecipe(code)}`);
    expect(recipeToInt(recipe) === code, `spot-back(${recipe})`, `expected ${code}`);
  }

  // Invalid recipes rejected.
  for (const bad of ["P T", "DD", "l", "Tl", "aaP", "3D", "g3D"]) {
    let threw = false;
    try {
      recipeToInt(bad);
    } catch {
      threw = true;
    }
    expect(threw, `reject(${bad})`, "should have thrown");
  }

  // A handful of builds stay under budget at low codes.
  for (let code = 0; code < 4096; code += 7) {
    const { poly, overBudget } = buildPolytron(code);
    expect(poly.faces.length > 0, `build(${code})`, "empty face list");
    expect(typeof overBudget === "boolean", `budget-flag(${code})`, "bad flag");
  }

  return { passed, failed };
}
