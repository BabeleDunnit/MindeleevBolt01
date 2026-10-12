import { hueShiftPalette, analogousPalette, wavePalette, splitComplementPalette } from "@/polytron/proceduralPalettes";

// Palettes 00-99. A palette is a sequence of 6-digit hex colors; each
// congruence class of a polyhedron takes the next color, wrapping around.
// Defined here: 00-09 mineral, 10-19 neon. 20-59 are procedural sets
// (see proceduralPalettes.ts) exposed as static arrays below so the codec,
// tests and the catalog all see one uniform table.
export const PALETTES: ReadonlyArray<ReadonlyArray<number> | undefined> = [
  // 00 Amethyst — violet-quartz banded tones
  [0xb57edc, 0x7a4fa3, 0xe6d0f2, 0x9966cc, 0x4a2c6b],
  // 01 Malachite — green banded copper carbonate
  [0x0b6e4f, 0x2fa36b, 0x7ed9a4, 0x144d33, 0xa8e6c3],
  // 02 Azurite — deep blue copper mineral
  [0x1f4788, 0x3f74c9, 0x89aede, 0x16305f, 0x5c8ad4],
  // 03 Pyrite — brassy metallic golds
  [0xb8860b, 0xd4a017, 0x8a6d1a, 0xf0c94a, 0x6b5510],
  // 04 Rose Quartz — soft pink translucents
  [0xe8a0bf, 0xd77fa3, 0xf6d5e3, 0xc46a8e, 0xfae9f0],
  // 05 Turquoise — blue-green hydrated phosphate
  [0x30b5b0, 0x1f8a87, 0x7cd4cf, 0x16605e, 0xa9e2de],
  // 06 Garnet — deep red silicates
  [0x8c2f39, 0xb04a55, 0x5c1f26, 0xd17b83, 0x3d151a],
  // 07 Opal — shifting milky iridescents
  [0xc9d8e8, 0xa8d8c8, 0xe8d8b8, 0xd8b8d8, 0xb8c8e8],
  // 08 Jade — nephrite greens with cream
  [0x4d8f5f, 0x2f6b44, 0x8fbf9f, 0x1d4a2e, 0xd4e8d8],
  // 09 Citrine — pale golden quartz
  [0xe4c44a, 0xc9a227, 0xf4e0a0, 0x9c7d1d, 0xfaf0cc],
  // 10 Neon Rose — hot pink / magenta glow
  [0xff2d78, 0xff5ca8, 0xc9105a, 0xff8ecb, 0x8a0a3d],
  // 11 Neon Lime — acid green glow
  [0xaaff00, 0x7cff2d, 0xd4ff7c, 0x5cc90a, 0xe6ffb8],
  // 12 Neon Cyan — electric ice blue
  [0x00fff0, 0x5cfff5, 0x00c4b8, 0xa8fbff, 0x008a80],
  // 13 Neon Tangerine — blazing orange
  [0xff7a00, 0xffa53d, 0xd45c00, 0xffc98e, 0x8a3d00],
  // 14 Neon Violet — UV purple glow
  [0xc44aff, 0xdd7cff, 0x9a2dd4, 0xedb8ff, 0x6b0a8a],
  // 15 Neon Chartreuse — yellow-green laser
  [0xd4ff00, 0xe8ff5c, 0xa8c900, 0xf2ffb8, 0x7c8a00],
  // 16 Neon Azure — deep electric blue
  [0x2d7cff, 0x5ca8ff, 0x0a4fc9, 0x8ecbff, 0x00308a],
  // 17 Neon Coral — glowing salmon red
  [0xff5040, 0xff8a7c, 0xd42d1d, 0xffb8b0, 0x8a150a],
  // 18 Neon Mint — glowing spearmint
  [0x40ffa8, 0x7cffc4, 0x1dd482, 0xb0ffe0, 0x0a8a56],
  // 19 Neon Gold — radiant yellow
  [0xffd400, 0xffe85c, 0xd4ab00, 0xfff2b0, 0x8a7000],
  // 20-29 Procedural "Hue Shift" — cool shadows, warm highlights
  ...Array.from({ length: 10 }, (_, i) => hueShiftPalette(i)),
  // 30-39 Procedural "Analogous" — dominant hue with harmonic neighbors
  ...Array.from({ length: 10 }, (_, i) => analogousPalette(i)),
  // 40-49 Procedural "Wave" — trigonometric hue curves
  ...Array.from({ length: 10 }, (_, i) => wavePalette(i)),
  // 50-59 Procedural "Split Complement" — dominant hue + rare contrasting pops
  ...Array.from({ length: 10 }, (_, i) => splitComplementPalette(i)),
];

export const TOTAL_PALETTES = 100;

function paletteAt(index: number): ReadonlyArray<number> {
  return PALETTES[index % TOTAL_PALETTES] ?? PALETTES[0]!;
}

// Color for a congruence class, wrapping if the palette is shorter.
export function paletteColor(paletteIndex: number, classIndex: number): number {
  const colors = paletteAt(paletteIndex);
  return colors[classIndex % colors.length];
}
