/**
 * Resonance Playground · pure, deterministic evaluation of a player's
 * composition against ANY Kaleidoscope Lab target.
 *
 * A target tile is a *hint*, never an obligatory pawn position.
 * The evaluator supports many-to-many spatial influence: each bought Polytron
 * can resonate with several hints, and several Polytrons saturate one hint.
 * Chromatica uses perceptual OKLab distances; group affinity honors the
 * genuine duals C/O and D/I, and T's self-duality.
 *
 * NO time/entropy and NO automatic reward farming in this first laboratory.
 */
import {kaleidoOrbits,kaleidoTransform,type KaleidoLayout,type KaleidoPoint,type KaleidoTile} from "@/polytron/kaleidoscopeGenerator";
import {rcRing} from "@/polytron/rc01Board";
import {intrinsicEnergy,groupOf,periodOf} from "@/polytron/mindeleevLife";
import {LATIN_SOURCES,GREEK_DESTINATIONS,oklab} from "@/polytron/gradientPalettes";

export type ResonancePawn={
 key:string;number:number;paletteRow:number;paletteCol:number
};
export type ResonanceSettings={reach:1|2|3};
export const DEFAULT_RESONANCE_SETTINGS:ResonanceSettings={reach:2};
export const RESONANCE_WEIGHTS={color:.65,group:.25,period:.10} as const;
/**
 * Separate evaluator axes:
 * 78% LOCAL spatial resonance (Chromatica/dual groups/period)
 * 22% GLOBAL geometric harmony measured on the player's actual board.
 * Graph and symmetry DO NOT reuse hint saturation as their source.
 */
export const TOTAL_WEIGHTS={hints:.78,graph:.12,symmetry:.10} as const;
const HEX_FALLOFF=[1,.74,.36,.14] as const;
const ROOT_GROUPS=new Map<number,number>([[1,1],[2,3],[3,2],[4,5],[5,4]]);
const LATIN_LABS=LATIN_SOURCES.map(c=>oklab(c.hex));
const GREEK_LABS=GREEK_DESTINATIONS.map(c=>oklab(c.hex));

export type ResonanceChannels={color:number;group:number;period:number};
export type ResonanceContribution={
 pawnKey:string;hintKey:string;distance:number;
 strength:number;color:number;group:number;period:number
};
export type ResonanceHint=ResonanceChannels&{
 key:string;overall:number;orbit:string;coveredBy:number;
 paletteRow:number;paletteCol:number;number:number
};
export type ResonanceGraphEdge={
 from:string;to:string;kind:string;coverage:number
};
export type ResonanceScore={
 quality:number;
 color:number;group:number;period:number;
 hints:number;graph:number;symmetry:number;
 local:number;structural:number;
 hintResults:ResonanceHint[];
 graphResults:ResonanceGraphEdge[];
 contributions:ResonanceContribution[];
 perPawnGain:Record<string,number>;
 totalCost:number;
};
export function resonanceCost(number:number):number{
 return intrinsicEnergy(number,0);
}
export function resonanceHexDistance(a:Pick<KaleidoPoint,"q"|"r">,
 b:Pick<KaleidoPoint,"q"|"r">):number{
 return rcRing(a.q-b.q,a.r-b.r);
}
export function resonanceFalloff(distance:number,settings:ResonanceSettings):number{
 if(!Number.isInteger(settings.reach)||settings.reach<1||settings.reach>3)
  throw Error("Reach must be 1, 2 or 3");
 return Number.isInteger(distance)&&distance>=0&&distance<=settings.reach?
  HEX_FALLOFF[distance]:0;
}
function perceptualAffinity(a:readonly number[],b:readonly number[]):number{
 const dist=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
 // Distant colors have NO affinity; close but not identical colors partly resonate.
 return Math.max(0,1-dist/.38);
}
export function resonancePaletteAffinity(
 row:number,col:number,targetRow:number,targetCol:number
):number{
 if(row===targetRow&&col===targetCol)return 1;
 const latin=perceptualAffinity(LATIN_LABS[row],LATIN_LABS[targetRow]);
 const greek=perceptualAffinity(GREEK_LABS[col],GREEK_LABS[targetCol]);
 return Math.max(0,Math.min(1,.52*latin+.48*greek));
}
export function resonanceGroupAffinity(a:number,b:number):number{
 const ga=groupOf(a),gb=groupOf(b);
 if(ga===gb)return 1;
 if(ROOT_GROUPS.get(ga)===gb)return .82;
 return .07;
}
export function resonancePeriodAffinity(a:number,b:number):number{
 const d=Math.abs(periodOf(a)-periodOf(b));
 return d===0?1:d===1?.7:d===2?.43:d===3?.23:.06;
}
export function resonanceCompatibility(
 pawn:Pick<ResonancePawn,"number"|"paletteRow"|"paletteCol">,
 hint:Pick<KaleidoTile,"number"|"paletteRow"|"paletteCol">
):ResonanceChannels{
 return {
  color:resonancePaletteAffinity(pawn.paletteRow,pawn.paletteCol,
   hint.paletteRow,hint.paletteCol),
  group:resonanceGroupAffinity(pawn.number,hint.number),
  period:resonancePeriodAffinity(pawn.number,hint.number)
 };
}
const saturate=(remaining:number,influence:number)=>
 remaining*(1-Math.max(0,Math.min(1,influence)));
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
function scoreCore(
 layout:KaleidoLayout,pawns:ResonancePawn[],settings:ResonanceSettings,
 includeLinks:boolean
):Omit<ResonanceScore,"perPawnGain">{
 const valid=new Map(layout.cells.map(cell=>[cell.key,cell]));
 const pawnCells=pawns.map(pawn=>{
  const cell=valid.get(pawn.key);
  if(!cell||cell.ring===0)throw Error("Resonance pawn outside the playable Mutatron");
  if(!Number.isInteger(pawn.paletteRow)||pawn.paletteRow<0||pawn.paletteRow>11||
     !Number.isInteger(pawn.paletteCol)||pawn.paletteCol<0||pawn.paletteCol>11)
   throw Error("Invalid Chromatica endpoints");
  resonanceCost(pawn.number);
  return {pawn,cell};
 });
 if(new Set(pawns.map(p=>p.key)).size!==pawns.length)
  throw Error("At most one purchased Polytron per cell");
 const contributions:ResonanceContribution[]=[];
 const hintResults:ResonanceHint[]=layout.tiles.map(hint=>{
  let colorRemaining=1,groupRemaining=1,periodRemaining=1,coveredBy=0;
  for(const {pawn,cell} of pawnCells){
   const distance=resonanceHexDistance(cell,hint);
   const falloff=resonanceFalloff(distance,settings);
   if(falloff===0)continue;
   const match=resonanceCompatibility(pawn,hint);
   const color=falloff*match.color;
   const group=falloff*match.group;
   const period=falloff*match.period;
   const strength=RESonance(color,group,period);
   if(strength>.025){
    coveredBy++;
    if(includeLinks)contributions.push({
     pawnKey:pawn.key,hintKey:hint.key,distance,
     strength,color,group,period
    });
   }
   colorRemaining=saturate(colorRemaining,color);
   groupRemaining=saturate(groupRemaining,group);
   periodRemaining=saturate(periodRemaining,period);
  }
  const color=clamp(1-colorRemaining),group=clamp(1-groupRemaining),
   period=clamp(1-periodRemaining);
  return {
   key:hint.key,orbit:hint.orbit,
   number:hint.number,paletteRow:hint.paletteRow,paletteCol:hint.paletteCol,
   color,group,period,coveredBy,
   overall:RESonance(color,group,period)
  };
 });
 const hints=hintResults.length?
  hintResults.reduce((sum,h)=>sum+h.overall,0)/hintResults.length:0;
 const color=hintResults.length?
  hintResults.reduce((sum,h)=>sum+h.color,0)/hintResults.length:0;
 const group=hintResults.length?
  hintResults.reduce((sum,h)=>sum+h.group,0)/hintResults.length:0;
 const period=hintResults.length?
  hintResults.reduce((sum,h)=>sum+h.period,0)/hintResults.length:0;
 /*
  * GLOBAL TOPOLOGY: the user's own pairwise connections are compared to
  * geometrical motifs of the requested graph, invariant under rotations and
  * reflections. NO hint-coverage field is consulted in these calculations.
  * Each valid pair supports a real player graph edge; isolated pieces and
  * mismatched spatial relations reduce structural coherence.
  */
 const signature=(dq:number,dr:number)=>{
  const all:string[]=[];
  for(let mirror=0;mirror<=1;mirror++)for(let rotation=0;rotation<6;rotation++){
   const p=kaleidoTransform({q:dq,r:dr},rotation,mirror===1);
   all.push(p.q+","+p.r);
  }
  return all.sort()[0];
 };
 const targetCells=new Map(layout.cells.map(cell=>[cell.key,cell]));
 const motifs=new Set<string>();
 let maxMotifDistance=0;
 for(const edge of layout.edges){
  if(edge.from==="0,0"||edge.to==="0,0")continue;
  const a=targetCells.get(edge.from),b=targetCells.get(edge.to);
  if(!a||!b)continue;
  const d=resonanceHexDistance(a,b);
  maxMotifDistance=Math.max(maxMotifDistance,d);
  motifs.add(signature(a.q-b.q,a.r-b.r));
 }
 const graphResults:ResonanceGraphEdge[]=[];
 const connected=new Set<string>();
 let nearbyPairs=0;
 for(let i=0;i<pawnCells.length;i++)for(let j=i+1;j<pawnCells.length;j++){
  const a=pawnCells[i],b=pawnCells[j];
  const distance=resonanceHexDistance(a.cell,b.cell);
  if(distance>maxMotifDistance)continue;
  nearbyPairs++;
  const motif=signature(a.cell.q-b.cell.q,a.cell.r-b.cell.r);
  if(!motifs.has(motif))continue;
  graphResults.push({
   from:a.pawn.key,to:b.pawn.key,kind:"motif",coverage:1
  });
  connected.add(a.pawn.key);connected.add(b.pawn.key);
 }
 const n=pawnCells.length;
 const coherence=nearbyPairs?graphResults.length/nearbyPairs:0;
 const participation=n?connected.size/n:0;
 const richness=n?Math.min(1,graphResults.length/(.75*n)):0;
 const graph=clamp(.55*coherence*richness+.45*participation);
 /*
  * GLOBAL SYMMETRY: same occupied-cell orbit under the REQUESTED group.
  * We don't inspect hint satisfaction. A lone pawn has symmetry score 0;
  * completing a C2 pair or C6/D6 orbit scores highly.
  */
 const occupancy=new Set(pawns.map(p=>p.key));
 let symmetry=0;
 if(pawns.length){
  for(const orbit of kaleidoOrbits(layout.cells,layout.params.symmetry)){
   if(orbit.ring===0||orbit.cells.length<=1)continue;
   const count=orbit.cells.filter(c=>occupancy.has(c.key)).length;
   if(count===0)continue;
   symmetry+=count*(count-1)/(orbit.cells.length-1);
  }
  symmetry=clamp(symmetry/pawns.length);
 }
 const local=100*hints;
 const structural=100*(TOTAL_WEIGHTS.graph*graph+
  TOTAL_WEIGHTS.symmetry*symmetry)/
  (TOTAL_WEIGHTS.graph+TOTAL_WEIGHTS.symmetry);
 const quality=clamp(TOTAL_WEIGHTS.hints*hints+
  TOTAL_WEIGHTS.graph*graph+TOTAL_WEIGHTS.symmetry*symmetry)*100;
 return {quality,color:100*color,group:100*group,period:100*period,
  hints:local,graph:100*graph,symmetry:100*symmetry,
  local,structural,
  hintResults,graphResults,contributions,
  totalCost:pawns.reduce((sum,p)=>sum+resonanceCost(p.number),0)};
}
function RESonance(color:number,group:number,period:number):number{
 return RESONANCE_WEIGHTS.color*color+
  RESONANCE_WEIGHTS.group*group+RESONANCE_WEIGHTS.period*period;
}
/**
 * Exact overall score without O(pawns) marginal re-evaluations.
 * Use for budget-search candidates and large samples of hypothetical moves.
 */
export function scoreResonance(
 layout:KaleidoLayout,pawns:ResonancePawn[],
 settings:ResonanceSettings=DEFAULT_RESONANCE_SETTINGS
):Omit<ResonanceScore,"perPawnGain">{
 return scoreCore(layout,pawns,settings,false);
}
/**
 * Acquisition is paid once, upkeep is paid EVERY Mutatron evolution.
 * A cycle on an already-owned board pays reward-upkeep; a first cycle
 * from scratch additionally deducts purchase expense.
 * Values may be negative. Resale and future cycles are excluded.
 */
export type ResonanceEconomics={
 quality:number;spent:number;upkeep:number;reward:number;
 cycleNet:number;net:number;
 efficiency:number|null;pieces:number
};
export function resonanceEconomics(
 layout:KaleidoLayout,pawns:ResonancePawn[],
 settings:ResonanceSettings=DEFAULT_RESONANCE_SETTINGS
):ResonanceEconomics{
 const score=scoreResonance(layout,pawns,settings);
 const reward=resonanceReward(layout,score.quality);
 const upkeep=score.totalCost;
 return {
  quality:score.quality,spent:score.totalCost,upkeep,reward,
  cycleNet:reward-upkeep,
  net:reward-upkeep-score.totalCost,
  efficiency:upkeep?reward/upkeep:null,
  pieces:pawns.length
 };
}
export function evaluateResonance(
 layout:KaleidoLayout,pawns:ResonancePawn[],
 settings:ResonanceSettings=DEFAULT_RESONANCE_SETTINGS
):ResonanceScore{
 const full=scoreCore(layout,pawns,settings,true);
 const perPawnGain:Record<string,number>={};
 // Marginal influence of each bought Polytron, including the graph
 // and symmetry bonus, so individual links have a meaningful tooltip.
 for(const pawn of pawns){
  const without=scoreCore(layout,pawns.filter(p=>p.key!==pawn.key),
   settings,false);
  // Negative means this pawn harms global structure more than it
  // helps local resonance; retain that information for gameplay analysis.
  perPawnGain[pawn.key]=full.quality-without.quality;
 }
 return {...full,perPawnGain};
}
export function resonanceReward(
 layout:KaleidoLayout,quality:number
):number{
 const maximum=6+layout.params.radius*4+
  Math.ceil(layout.tiles.length*.7);
 return Math.max(0,Math.round(maximum*clamp(quality/100)));
}
export function resonanceComplexity(layout:KaleidoLayout){
 const orbits=new Set(layout.tiles.map(t=>t.orbit)).size;
 const palettes=new Set(layout.tiles.map(t=>t.paletteRow+","+t.paletteCol)).size;
 const groups=new Set(layout.tiles.map(t=>(t.number-1)%5)).size;
 const periods=new Set(layout.tiles.map(t=>Math.floor((t.number-1)/5))).size;
 const occupiedRings=new Set(layout.tiles.map(t=>t.ring)).size;
 // Descriptive, structural only. It is NOT a gameplay difficulty score.
 const index=orbits*2+palettes*3+groups*2+periods+
  occupiedRings*2+Math.sqrt(layout.edges.length);
 return {index:Math.round(index*10)/10,
  orbits,palettes,groups,periods,occupiedRings,
  hints:layout.tiles.length,edges:layout.edges.length};
}
