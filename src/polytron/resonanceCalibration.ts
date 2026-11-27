/**
 * Resonance calibration library.
 *
 * The artistic generator is the sole source of requests: presets select
 * existing generator parameters and DO NOT replace, filter or rewrite tiles.
 * All diagnostics are read-only and have no effect on rewards or difficulty.
 */
import type {KaleidoLayout,KaleidoParams} from "@/polytron/kaleidoscopeGenerator";

export type ResonanceCalibrationPreset={
 id:"A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I";
 title:string;
 intention:string;
 params:Pick<KaleidoParams,"radius"|"family"|"symmetry"|"seed">;
 /** Baseline number of requested tiles for generation 0, to detect regressions. */
 expectedHints:number;
};

export const RESONANCE_CALIBRATION_PRESETS:readonly ResonanceCalibrationPreset[]=[
 {
  id:"A",title:"Compatto meno denso",
  intention:"Confronta il margine di spazio visivo di una richiesta D6 compatta.",
  params:{family:"metatron",symmetry:"D6",radius:2,seed:7},expectedHints:12
 },
 {
  id:"B",title:"Compatto pieno",
  intention:"Stessa grammatica e raggio di A, con indizi su tutte le celle.",
  params:{family:"metatron",symmetry:"D6",radius:2,seed:0},expectedHints:18
 },
 {
  id:"C",title:"Intermedio aperto",
  intention:"Metà delle celle con indizi: confronta distribuzione e risonanza.",
  params:{family:"crystal",symmetry:"D6",radius:3,seed:5},expectedHints:18
 },
 {
  id:"D",title:"Intermedio pieno",
  intention:"Richiesta Cristalli D6 a copertura completa per confronto con C.",
  params:{family:"crystal",symmetry:"D6",radius:3,seed:1},expectedHints:36
 },
 {
  id:"E",title:"Ampio aperto",
  intention:"Rosette a raggio 5, molti spazi senza indizi e più orbite da leggere.",
  params:{family:"rosette",symmetry:"D6",radius:5,seed:55},expectedHints:36
 },
 {
  id:"F",title:"Ampio pieno",
  intention:"Rosette a raggio 5 completamente coperto: prova di leggibilità.",
  params:{family:"rosette",symmetry:"D6",radius:5,seed:17},expectedHints:90
 },
 // Controlled symmetry comparison: same family, radius and seed as C.
 {
  id:"G",title:"Cristalli · rotazione C6",
  intention:"Come C, ma con simmetria ciclica C6: rotazioni senza specchi.",
  params:{family:"crystal",symmetry:"C6",radius:3,seed:5},expectedHints:24
 },
 {
  id:"H",title:"Cristalli · rotazione C3",
  intention:"Come C, ma con simmetria ciclica C3: terne a 120°.",
  params:{family:"crystal",symmetry:"C3",radius:3,seed:5},expectedHints:24
 },
 {
  id:"I",title:"Cristalli · rotazione C2",
  intention:"Come C, ma con simmetria ciclica C2: coppie opposte.",
  params:{family:"crystal",symmetry:"C2",radius:3,seed:5},expectedHints:26
 }
] as const;

export function calibrationPresetFor(params:KaleidoParams){
 return RESONANCE_CALIBRATION_PRESETS.find(p=>
  p.params.radius===params.radius&&p.params.family===params.family&&
  p.params.symmetry===params.symmetry&&p.params.seed===params.seed)??null;
}

export type ResonanceRingDensity={
 ring:number;hints:number;slots:number;withoutHints:number;playerOccupied:number;
};
export type ResonanceDensityDiagnostics={
 playableCells:number;hintCells:number;withoutHintCells:number;
 hintPercent:number;playerOccupiedCells:number;freePlacementCells:number;
 playersOnHints:number;
 occupiedOrbits:number;availableOrbits:number;distinctPalettes:number;
 distinctGroups:number;
 rings:ResonanceRingDensity[];
};
/**
 * An indizio does not occupy a gameplay slot. Only player-owned Pawns do.
 * Keep visual hint density distinct from physical placement availability.
 */
export function inspectResonanceDensity(
 layout:KaleidoLayout,playerKeys:readonly string[]=[]
):ResonanceDensityDiagnostics{
 const playable=layout.cells.filter(c=>c.ring>0);
 const playableSet=new Set(playable.map(c=>c.key));
 const hintKeys=new Set(layout.tiles.map(t=>t.key));
 const pawnKeys=new Set(playerKeys.filter(k=>playableSet.has(k)));
 const rings:Array<ResonanceRingDensity>=Array.from(
  {length:layout.params.radius},(_,idx)=>{
   const ring=idx+1;
   const slots=playable.filter(c=>c.ring===ring).length;
   const hints=layout.tiles.filter(t=>t.ring===ring).length;
   const playerOccupied=playable.filter(c=>
    c.ring===ring&&pawnKeys.has(c.key)).length;
   return {ring,hints,slots,withoutHints:slots-hints,playerOccupied};
  });
 return {
  playableCells:playable.length,
  hintCells:hintKeys.size,
  withoutHintCells:playable.length-hintKeys.size,
  hintPercent:playable.length?100*hintKeys.size/playable.length:0,
  playerOccupiedCells:pawnKeys.size,
  freePlacementCells:playable.length-pawnKeys.size,
  playersOnHints:[...pawnKeys].filter(k=>hintKeys.has(k)).length,
  occupiedOrbits:new Set(layout.tiles.map(t=>t.orbit)).size,
  availableOrbits:layout.symmetryOrbits,
  distinctPalettes:new Set(layout.tiles.map(t=>
   t.paletteRow+","+t.paletteCol)).size,
  distinctGroups:new Set(layout.tiles.map(t=>
   (t.number-1)%5)).size,
  rings
 };
}
