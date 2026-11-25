/**
 * General-purpose difficulty analyzer for arbitrary kaleidoscope requests.
 *
 * The evaluator is exact for a supplied composition. Search is intentionally
 * an explicitly LABELLED heuristic: bounded greedy budgeted maximum coverage,
 * not a proof of the global optimum or of the true minimum cost to solve.
 * It runs in a dedicated Web Worker so mobile interaction remains responsive.
 */
import type {KaleidoLayout,KaleidoTile,KaleidoPoint} from "@/polytron/kaleidoscopeGenerator";
import {
 evaluateResonance,resonanceComplexity,resonanceHexDistance,
 resonanceFalloff,resonanceCost,resonanceCompatibility,
 RESONANCE_WEIGHTS,DEFAULT_RESONANCE_SETTINGS,
 type ResonancePawn,type ResonanceSettings
} from "@/polytron/resonanceField";

export type DifficultyBand={budget:number;score:number;spent:number;pieces:number};
export type DifficultyReport={
 structural:ReturnType<typeof resonanceComplexity>;
 bands:DifficultyBand[];
 budget:number;
 expectedScore:number;spent:number;placements:number;
 estimatedCost70:number|null;
 rating:"accessibile"|"intermedia"|"impegnativa";
 baselineSolution:ResonancePawn[];
 nextMove:ResonancePawn|null;
 nextMoveQuality:number|null;
 method:"bounded-greedy-estimate";
};
type Template=Pick<ResonancePawn,"number"|"paletteRow"|"paletteCol">;
type Candidate={pawn:ResonancePawn;cost:number;
 color:Float32Array;group:Float32Array;period:Float32Array};
type SearchResult={score:number;spent:number;placements:ResonancePawn[]};
const MAX_STEPS=17;
const TARGET_QUALITY=70;
const CLOSE_ENOUGH=.0000001;
const PALETTE_LIMIT=8;

function templatesForLayout(layout:KaleidoLayout):Template[]{
 const paletteCounts=new Map<string,{count:number;row:number;col:number;tiles:KaleidoTile[]}>();
 for(const tile of layout.tiles){
  const key=tile.paletteRow+","+tile.paletteCol;
  let bucket=paletteCounts.get(key);
  if(!bucket){
   bucket={count:0,row:tile.paletteRow,col:tile.paletteCol,tiles:[]};
   paletteCounts.set(key,bucket);
  }
  bucket.count++;bucket.tiles.push(tile);
 }
 const paletteBuckets=[...paletteCounts.values()].sort((a,b)=>b.count-a.count||
  a.row-b.row||a.col-b.col).slice(0,PALETTE_LIMIT);
 const pool:Template[]=[];
 const seen=new Set<string>();
 for(const palette of paletteBuckets){
  const numbers=[1,2,3,4,5,
   ...new Set(palette.tiles.map(t=>t.number))];
  for(const number of numbers){
   const signature=number+"|"+palette.row+"|"+palette.col;
   if(seen.has(signature))continue;
   seen.add(signature);
   pool.push({number,paletteRow:palette.row,paletteCol:palette.col});
  }
 }
 return pool;
}
function compileCandidates(layout:KaleidoLayout,settings:ResonanceSettings):Candidate[]{
 const targets=layout.tiles;
 const templates=templatesForLayout(layout);
 const costAffordable=6+Math.max(5,layout.params.radius*15);
 const candidates:Candidate[]=[];
 const cellDistances=new Map<string,number[]>();
 for(const cell of layout.cells.filter(c=>c.ring>0))
  cellDistances.set(cell.key,targets.map(t=>resonanceHexDistance(cell,t)));
 for(const template of templates){
  const cost=resonanceCost(template.number);
  // Avoid filling the solver with expensive choices that cannot be reached
  // by any of its operating budget bands.
  if(cost>costAffordable)continue;
  const matches=targets.map(hint=>resonanceCompatibility(template,hint));
  for(const [key,distances] of cellDistances){
   const color=new Float32Array(targets.length);
   const group=new Float32Array(targets.length);
   const period=new Float32Array(targets.length);
   let reaches=false;
   for(let i=0;i<targets.length;i++){
    const k=resonanceFalloff(distances[i],settings);
    color[i]=k*matches[i].color;
    group[i]=k*matches[i].group;
    period[i]=k*matches[i].period;
    if(k>0)reaches=true;
   }
   if(reaches)candidates.push({
    pawn:{...template,key},cost,color,group,period
   });
  }
 }
 return candidates;
}
function greedy(
 layout:KaleidoLayout,candidates:Candidate[],budget:number,
 settings:ResonanceSettings,initial:ResonancePawn[]=[]
):SearchResult{
 const n=layout.tiles.length;
 const remColor=new Float64Array(n).fill(1);
 const remGroup=new Float64Array(n).fill(1);
 const remPeriod=new Float64Array(n).fill(1);
 const occupied=new Set(initial.map(p=>p.key));
 const placements=[...initial];
 let spent=initial.reduce((sum,p)=>sum+resonanceCost(p.number),0);
 // Pre-apply the purchased Polytrons, so the solver can also suggest a
 // next move from an existing player-built composition.
 for(const p of initial){
  const cell=layout.cells.find(c=>c.key===p.key);
  if(!cell)continue;
  for(let i=0;i<n;i++){
   const hint=layout.tiles[i],k=resonanceFalloff(
    resonanceHexDistance(cell,hint),settings);
   if(k===0)continue;
   const m=resonanceCompatibility(p,hint);
   remColor[i]*=1-k*m.color;
   remGroup[i]*=1-k*m.group;
   remPeriod[i]*=1-k*m.period;
  }
 }
 const allowable=budget-spent;
 if(allowable<=0)return {
  score:evaluateResonance(layout,placements,settings).quality,
  spent,placements
 };
 for(let step=0;step<MAX_STEPS&&spent<budget;step++){
  let best:Candidate|undefined,bestValue=0,bestGain=0;
  for(const candidate of candidates){
   if(occupied.has(candidate.pawn.key)||candidate.cost>budget-spent)continue;
   let gain=0;
   for(let i=0;i<n;i++){
    gain+=RESONANCE_WEIGHTS.color*remColor[i]*candidate.color[i]+
     RESONANCE_WEIGHTS.group*remGroup[i]*candidate.group[i]+
     RESONANCE_WEIGHTS.period*remPeriod[i]*candidate.period[i];
   }
   gain/=n||1;
   // Economy vs coverage: favor cheap high-yield polytrons, but not so
   // strongly that an expensive exact match is always discarded.
   const value=gain/Math.pow(candidate.cost,.78);
   if(value>bestValue+CLOSE_ENOUGH){
    best=candidate;bestValue=value;bestGain=gain;
   }
  }
  if(!best||bestGain<.001)break;
  placements.push(best.pawn);occupied.add(best.pawn.key);spent+=best.cost;
  for(let i=0;i<n;i++){
   remColor[i]*=1-best.color[i];
   remGroup[i]*=1-best.group[i];
   remPeriod[i]*=1-best.period[i];
  }
 }
 return {score:evaluateResonance(layout,placements,settings).quality,
  spent,placements};
}
export function analyzeResonanceDifficulty(
 layout:KaleidoLayout,budget:number,
 settings:ResonanceSettings=DEFAULT_RESONANCE_SETTINGS,
 owned:ResonancePawn[]=[]
):DifficultyReport{
 if(!Number.isSafeInteger(budget)||budget<2||budget>10000)
  throw Error("Invalid analysis budget");
 const candidates=compileCandidates(layout,settings);
 const budgets=[Math.max(2,Math.floor(budget*.5)),budget,
  Math.ceil(budget*1.5),Math.ceil(budget*2)];
 const computed=new Map<number,SearchResult>();
 const bands:DifficultyBand[]=[];
 let better:SearchResult|undefined;
 for(const b of [...new Set(budgets)]){
  const trial=greedy(layout,candidates,b,settings);
  if(!better||trial.score>better.score)better=trial;
  // Keep the best actually-found feasible solution at increasing budgets.
  computed.set(b,better);
  bands.push({budget:b,score:better.score,
   spent:better.spent,pieces:better.placements.length});
 }
 const selected=computed.get(budget)!;
 const cost70=bands.find(b=>b.score>=TARGET_QUALITY);
 const estimatedCost70=cost70?.spent??null;
 const currentCost=owned.reduce((sum,p)=>sum+resonanceCost(p.number),0);
 const nextBudget=Math.min(10000,Math.max(2,Math.floor(budget-currentCost)));
 const suggestion=greedy(layout,candidates,Math.max(currentCost+nextBudget,
  currentCost+2),settings,owned);
 const nextMove=suggestion.placements[owned.length]??null;
 const nextMoveQuality=nextMove?
  evaluateResonance(layout,[...owned,nextMove],settings).quality:null;
 const rating=selected.score>=78?"accessibile":
  selected.score>=55?"intermedia":"impegnativa";
 return {
  structural:resonanceComplexity(layout),bands,budget,
  expectedScore:selected.score,spent:selected.spent,
  placements:selected.placements.length,
  estimatedCost70,rating,
  baselineSolution:selected.placements,
  nextMove,nextMoveQuality,method:"bounded-greedy-estimate"
 };
}
