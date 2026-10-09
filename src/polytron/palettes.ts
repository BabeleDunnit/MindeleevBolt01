// Palettes 00-99. A palette is a sequence of 6-digit hex colors; each
// congruence class of a polyhedron takes the next color, wrapping around.
// Only 00-09 are defined; anything else falls back to palette 00.
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
