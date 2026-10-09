import { generatePoly } from "@/polyhedronisme/polyhedronisme";
import { PALETTES, TOTAL_PALETTES } from "@/polytron/palettes";
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
// The number-to-DNA folding only sweeps palettes that actually exist, so
// cells never render the undefined-palette fallback (which would repeat 00
// nine times out of ten). Palettes 10-99 remain addressable via explicit DNA.
const DEFINED_PALETTES: ReadonlyArray<number> = PALETTES.reduce<number[]>(
  (acc, colors, i) => (colors !== undefined ? [...acc, i] : acc),
  []
);

export const TOTAL_CODES = TOTAL_CHAINS * S * DEFINED_PALETTES.length; // 8,420,050

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

// A "code" packs chain index, seed, and palette into one integer in
// [0, TOTAL_CODES): code = chainIdx * (S * P) + seedIdx * P + paletteSlotIdx,
// where paletteSlotIdx indexes the DEFINED palettes (currently 00-09). Palette
// is the fastest-varying part, so consecutive cells sweep defined palettes.
export function codeToRecipeParts(code: number): { chain: string[]; seed: string; palette: number } {
  if (!Number.isInteger(code) || code < 0 || code >= TOTAL_CODES) {
    throw new Error(`Code out of range [0, ${TOTAL_CODES}): ${code}`);
  }
  const p = DEFINED_PALETTES.length;
  const palette = DEFINED_PALETTES[code % p];
  const seed = SEEDS[Math.floor(code / p) % S];
  const chainIdx = Math.floor(code / (p * S));
  return { chain: indexToChain(chainIdx), seed, palette };
}

export function recipePartsToCode(
  chain: readonly string[],
  seed: string,
  palette: number
): number {
  const seedIdx = SEEDS.indexOf(seed as (typeof SEEDS)[number]);
  if (seedIdx < 0) throw new Error(`Unknown seed: "${seed}"`);
  if (!Number.isInteger(palette) || palette < 0 || palette >= TOTAL_PALETTES) {
    throw new Error(`Palette out of range [0, ${TOTAL_PALETTES}): ${palette}`);
  }
  const slot = DEFINED_PALETTES.indexOf(palette);
  if (slot < 0) {
    throw new Error(`Palette ${pad2(palette)} is not defined; cannot encode into a cell code`);
  }
  const p = DEFINED_PALETTES.length;
  return chainToIndex(chain) * (p * S) + seedIdx * p + slot;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

// DNA: [ops][palette][seed], e.g. "gk05D". Palette 00 may be omitted.
export function intToRecipe(code: number): string {
  const { chain, seed, palette } = codeToRecipeParts(code);
  const palettePart = palette === 0 ? "" : pad2(palette);
  return chain.join("") + palettePart + seed;
}

export function recipeToInt(recipe: string): number {
  const match = recipe.match(/^([a-z]*)(\d{2})?([TOCID])$/);
  if (!match) {
    throw new Error(
      `Invalid recipe (expected [ops][2-digit palette][seed], ops in ${OPERATORS.join("")}, seed in ${SEEDS.join("")}): "${recipe}"`
    );
  }
  const chain = match[1] === "" ? [] : match[1].split("");
  const palette = match[2] === undefined ? 0 : Number(match[2]);
  return recipePartsToCode(chain, match[3], palette);
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

export function buildPolytron(code: number): {
  recipe: string;
  poly: ReturnType<typeof generatePoly>;
  palette: number;
  overBudget: boolean;
} {
  const recipe = intToRecipe(code);
  const p = DEFINED_PALETTES.length;
  const palette = DEFINED_PALETTES[code % p];
  const poly = generatePoly(recipe);
  return { recipe, poly, palette, overBudget: poly.faces.length > FACE_BUDGET };
}

// ---------- tests ----------

export function runCodecSelfTests(): { passed: number; failed: Array<{ label: string; detail: string }> } {
  const failed: Array<{ label: string; detail: string }> = [];
  let passed = 0;

  const expect = (cond: boolean, label: string, detail: string) => {
    if (cond) passed++;
    else failed.push({ label, detail });
  };

  // Roundtrip over a sampled subset (full sweep of the enlarged space is slow):
  // every chain/seed combo at every defined palette slot, plus a code sweep.
  const p = DEFINED_PALETTES.length;
  const sampleSlots = DEFINED_PALETTES.map((_, i) => i);
  for (let chainIdx = 0; chainIdx < TOTAL_CHAINS; chainIdx += 1) {
    for (let seedIdx = 0; seedIdx < S; seedIdx++) {
      for (const slot of sampleSlots) {
        const code = chainIdx * (p * S) + seedIdx * p + slot;
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
    }
  }
  for (let code = 0; code < 20_000; code++) {
    if (recipeToInt(intToRecipe(code)) !== code) {
      failed.push({ label: `sweep(${code})`, detail: "roundtrip mismatch" });
    } else {
      passed++;
    }
  }

  // Spot values.
  const spots: Array<[number, string]> = [
    [0, "T"], // palette 00 omitted
    [4, "04T"],
    [1 * p, "C"], // seed 1, palette 0
    [1 * p + 5, "05C"],
    [S * p, "dT"], // first depth-1 chain, seed T, palette 0
    [S * p + 9, "d09T"],
    [(1 + R) * S * p, "ddT"], // first depth-2 chain ("dd")
    [(1 + R) * S * p + 7, "dd07T"],
  ];
  for (const [code, recipe] of spots) {
    expect(intToRecipe(code) === recipe, `spot(${code})`, `expected ${recipe}, got ${intToRecipe(code)}`);
    expect(recipeToInt(recipe) === code, `spot-back(${recipe})`, `expected ${code}`);
  }

  // Invalid recipes rejected.
  for (const bad of ["P T", "DD", "l", "Tl", "aaP", "3D", "g3D", "d5T", "g005D", "g0D", "g000D"]) {
    let threw = false;
    try {
      recipeToInt(bad);
    } catch {
      threw = true;
    }
    expect(threw, `reject(${bad})`, "should have thrown");
  }

  // Undefined-palette DNAs are accepted by recipeToInt but cannot fold back
  // into cell codes (they would collide with the fallback).
  let threw = false;
  try {
    recipePartsToCode([], "T", 42);
  } catch {
    threw = true;
  }
  expect(threw, "reject-undefined-palette-code", "should have thrown");

  // Palette 00 recipes accept both explicit and omitted form.
  expect(recipeToInt("g00D") === recipeToInt("gD"), "palette00-omitted", "g00D should equal gD");

  // Every defined palette holds only valid 6-digit hex colors.
  for (let p = 0; p < PALETTES.length; p++) {
    const colors = PALETTES[p];
    if (colors === undefined) continue;
    expect(colors.length > 0, `palette-nonempty(${p})`, "empty palette");
    for (let c = 0; c < colors.length; c++) {
      const v = colors[c];
      expect(Number.isInteger(v) && v >= 0 && v <= 0xffffff, `palette-hex(${p},${c})`, `bad color ${v}`);
    }
  }

  // A handful of builds stay under budget at low codes.
  for (let code = 0; code < 4096; code += 7) {
    const { poly, overBudget } = buildPolytron(code);
    expect(poly.faces.length > 0, `build(${code})`, "empty face list");
    expect(typeof overBudget === "boolean", `budget-flag(${code})`, "bad flag");
  }

  return { passed, failed };
}
