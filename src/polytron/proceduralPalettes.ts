// Procedural palette generators (suggestions 1-4). Each takes a base-hue
// slot (0-9) and returns a fixed array of face-class colors; the codec
// wraps classes around the array like any hand-written palette.
// Deterministic: same slot always yields the same palette.

const CLASSES = 8;

// Hue slot -> dominant hue, spread evenly around the wheel.
const baseHue = (slot: number) => slot * 36;

function hsvToHex(h: number, s: number, v: number): number {
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to255 = (f: number) => Math.round((f + m) * 255);
  return (to255(r) << 16) | (to255(g) << 8) | to255(b);
}

// 1. Hue Shifting (Algoritmo di Spostamento Armonico della Tonalita'):
// shadows drift cool (teal/blue), highlights drift warm (yellow/orange),
// around one dominant hue. H = Hbase + dH * (V - 0.5).
export function hueShiftPalette(slot: number): number[] {
  const hBase = baseHue(slot);
  const colors: number[] = [];
  for (let ci = 0; ci < CLASSES; ci++) {
    const v = 0.88 - ci * 0.085;
    const h = hBase + 55 * (v - 0.5);
    const s = Math.min(0.5 + ci * 0.045, 0.85);
    colors.push(hsvToHex(h, s, Math.max(v, 0.22)));
  }
  return colors;
}

// 2. Analogous ("Analoghe Protette"): dominant hue stays dominant; secondary
// face classes vibrate in small steps (+-18/32/48/64 deg) around it.
export function analogousPalette(slot: number): number[] {
  const hBase = baseHue(slot);
  const offsets = [0, 18, -18, 32, -32, 48, -48, 64];
  const colors: number[] = [];
  for (let ci = 0; ci < CLASSES; ci++) {
    colors.push(hsvToHex(hBase + offsets[ci % offsets.length], 0.68, 0.8 - ci * 0.07));
  }
  return colors;
}

// 3. Trigonometric wave generation: H(t) = a + b*cos(2pi(c*t + d)) over the
// normalized face-class id, with V following a quarter-shifted wave so
// brightness and hue move together like Polyhedronisme gradients.
export function wavePalette(slot: number): number[] {
  const a = baseHue(slot);
  const b = 75;
  const c = 0.33;
  const d = slot * 0.07;
  const colors: number[] = [];
  for (let ci = 0; ci < CLASSES; ci++) {
    const t = ci / CLASSES;
    const phase = 2 * Math.PI * (c * t + d);
    const h = a + b * Math.cos(phase);
    // Brightness peaks where the hue peaks, so the dominant hue is the
    // brightest band instead of the darkest (inverting it floods the world
    // with green/teal, since that band sits ~75 deg from most base hues).
    const v = 0.62 + 0.24 * Math.cos(phase);
    colors.push(hsvToHex(h, 0.72, v));
  }
  return colors;
}

// 4. Clustered split-complementarity: most face classes vary the dominant
// hue; every third class leaps to the opposite side of the wheel
// (180 deg +- 30) at high saturation for chromatic focal points.
export function splitComplementPalette(slot: number): number[] {
  const hBase = baseHue(slot);
  const colors: number[] = [];
  for (let ci = 0; ci < CLASSES; ci++) {
    if (ci % 3 === 2) {
      const jitter = ci === 2 ? -28 : 26;
      colors.push(hsvToHex(hBase + 180 + jitter, 0.92, 0.85));
    } else {
      colors.push(hsvToHex(hBase + (ci - 2) * 9, 0.62, 0.82 - ci * 0.07));
    }
  }
  return colors;
}
