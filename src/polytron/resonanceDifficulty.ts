/**
 * Difficulty analysis for any Kaleidoscope request, with conserved Polytron E.
 * "Budget" is max energy COMMITTED ON THE BOARD, not an expense or a debit.
 * Only the reward of a submitted commission changes available total energy.
 * The bounded greedy search is heuristic, not a global optimization proof.
 */
import type {KaleidoLayout,KaleidoTile} from "@/polytron/kaleidoscopeGenerator";
import {
 evaluateResonance,resonanceComplexity,resonanceHexDistance,
 resonanceFalloff,resonanceEnergy,resonanceCompatibility,
 resonancePaletteAffinity,resonanceEconomics,scoreResonance,
 resonanceReward,RESONANCE_WEIGHTS,DEFAULT_RESONANCE_SETTINGS,
 type ResonancePawn,type ResonanceSettings,type ResonanceEconomics
} from "@/polytron/resonanceField";

export type DifficultyBand={
 budget:number;score:number;energy:number;pieces:number;
 reward:number;efficiency:number|null
};
export type DifficultyScenario=ResonanceEconomics&{
 id:"quality"|"efficient"|"literal"|"unplanned"|"incompatible";
 name:string;description:string;
 placements:ResonancePawn[];budget:number
};
export type PoorPlacement={
 pawn:ResonancePawn;scoreGain:number;rewardGain:number;
 energy:number;yield:number
};
export type PoorRelocation={
 from:string;to:string;scoreChange:number;rewardChange:number
};
export type PlacementRisk={
 placementsSampled:number;lowYieldPlacements:number;
 negligiblePlacements:number;worseningPlacements:number;
 worstPlacement:PoorPlacement|null;
 relocationsSampled:number;worseningRelocations:number;
 worstRelocation:PoorRelocation|null
};
export type DifficultyReport={
 structural:ReturnType<typeof resonanceComplexity>;
 bands:DifficultyBand[];
 scenarios:DifficultyScenario[];
 placementRisk:PlacementRisk;
 budget:number;
 expectedScore:number;energy:number;placements:number;
 estimatedEnergy70:number|null;
 rating:"accessibile"|"intermedia"|"impegnativa";
 baselineSolution:ResonancePawn[];
 nextMove:ResonancePawn|null;
 nextMoveQuality:number|null;
 nextMoveRewardGain:number|null;
 nextMoveEnergy:number|null;
 nextMoveYield:number|null;
 method:"bounded-greedy-estimate"
};
type Template=Pick<ResonancePawn,"number"|"paletteRow"|"paletteCol">;
type Candidate={pawn:ResonancePawn;energy:number;
 color:Float32Array;group:Float32Array;period:Float32Array};
type SearchResult={score:number;energy:number;placements:ResonancePawn[]};
const MAX_STEPS=17;
const TARGET_QUALITY=70;
const CLOSE_ENOUGH=.0000001;
const PALETTE_LIMIT=8;

function hash(a:number,b:number,c:number):number{
 let v=(a*1664525+b*1013904223+c*2246822519)>>>0;
 v^=v>>>16;v=Math.imul(v,0x7feb352d);
 v^=v>>>15;return v>>>0;
}
function templatesForLayout(layout:KaleidoLayout):Template[]{
 const counts=new Map<string,{count:number;row:number;col:number;
  tiles:KaleidoTile[]}>();
 for(const tile of layout.tiles){
  const key=tile.paletteRow+","+tile.paletteCol;
  let bucket=counts.get(key);
  if(!bucket){
   bucket={count:0,row:tile.paletteRow,col:tile.paletteCol,tiles:[]};
   counts.set(key,bucket);
  }
  bucket.count++;bucket.tiles.push(tile);
 }
 const palettes=[...counts.values()].sort((a,b)=>b.count-a.count||
  a.row-b.row||a.col-b.col).slice(0,PALETTE_LIMIT);
 const pool:Template[]=[];
 const seen=new Set<string>();
 for(const palette of palettes){
  const numbers=[1,2,3,4,5,...new Set(palette.tiles.map(t=>t.number))];
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
 const affordable=6+Math.max(5,layout.params.radius*15);
 const cells=layout.cells.filter(c=>c.ring>0);
 const distances=cells.map(cell=>targets.map(t=>resonanceHexDistance(cell,t)));
 const candidates:Candidate[]=[];
 for(const template of templates){
  const energy=resonanceEnergy(template.number);
  if(energy>affordable)continue;
  const matches=targets.map(hint=>resonanceCompatibility(template,hint));
  for(let j=0;j<cells.length;j++){
   const color=new Float32Array(targets.length);
   const group=new Float32Array(targets.length);
   const period=new Float32Array(targets.length);
   let reaches=false;
   for(let i=0;i<targets.length;i++){
    const k=resonanceFalloff(distances[j][i],settings);
    color[i]=k*matches[i].color;
    group[i]=k*matches[i].group;
    period[i]=k*matches[i].period;
    if(k>0)reaches=true;
   }
   if(reaches)candidates.push({
    pawn:{...template,key:cells[j].key},energy,color,group,period
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
 let committed=initial.reduce((sum,p)=>sum+resonanceEnergy(p.number),0);
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
 if(committed>=budget)return {
  score:scoreResonance(layout,placements,settings).quality,
  energy:committed,placements
 };
 for(let step=0;step<MAX_STEPS&&committed<budget;step++){
  let best:Candidate|undefined,bestValue=0,bestGain=0;
  for(const candidate of candidates){
   if(occupied.has(candidate.pawn.key)||candidate.energy>budget-committed)continue;
   let gain=0;
   for(let i=0;i<n;i++){
    gain+=RESONANCE_WEIGHTS.color*remColor[i]*candidate.color[i]+
     RESONANCE_WEIGHTS.group*remGroup[i]*candidate.group[i]+
     RESONANCE_WEIGHTS.period*remPeriod[i]*candidate.period[i];
   }
   gain/=n||1;
   const value=gain/Math.pow(candidate.energy,.78);
   if(value>bestValue+CLOSE_ENOUGH){
    best=candidate;bestValue=value;bestGain=gain;
   }
  }
  if(!best||bestGain<.001)break;
  placements.push(best.pawn);occupied.add(best.pawn.key);
  committed+=best.energy;
  for(let i=0;i<n;i++){
   remColor[i]*=1-best.color[i];
   remGroup[i]*=1-best.group[i];
   remPeriod[i]*=1-best.period[i];
  }
 }
 return {score:scoreResonance(layout,placements,settings).quality,
  energy:committed,placements};
}
function solution(
 id:DifficultyScenario["id"],name:string,description:string,
 layout:KaleidoLayout,budget:number,pawns:ResonancePawn[],
 settings:ResonanceSettings
):DifficultyScenario{
 const stats=resonanceEconomics(layout,pawns,settings);
 if(stats.energy>budget)throw Error("Generated scenario exceeds its capacity");
 return {id,name,description,budget,placements:pawns,...stats};
}
/** Keep the prefix with the best quality gain per unit of committed energy. */
function energyEfficientPrefix(
 layout:KaleidoLayout,order:ResonancePawn[],
 settings:ResonanceSettings
):ResonancePawn[]{
 let best:ResonancePawn[]=[],bestRatio=-Infinity,bestQuality=0;
 for(let n=1;n<=order.length;n++){
  const trial=order.slice(0,n);
  const current=resonanceEconomics(layout,trial,settings);
  const ratio=current.energy?current.quality/current.energy:0;
  if(ratio>bestRatio||ratio===bestRatio&&current.quality>bestQuality){
   best=trial;bestRatio=ratio;bestQuality=current.quality;
  }
 }
 return best;
}
/** A literal copier pays for the requested tiles, ignoring distance benefits. */
function literalCopy(layout:KaleidoLayout,budget:number):ResonancePawn[]{
 const available=[...layout.tiles].sort((a,b)=>
  resonanceEnergy(a.number)-resonanceEnergy(b.number)||
  a.ring-b.ring||a.idx-b.idx);
 const picks:ResonancePawn[]=[];
 let spent=0;
 for(const t of available){
  const cost=resonanceEnergy(t.number);
  if(spent+cost>budget)continue;
  picks.push({key:t.key,number:t.number,
   paletteRow:t.paletteRow,paletteCol:t.paletteCol});
  spent+=cost;
 }
 return picks;
}
/** Deterministic, affordable, non-optimizing placements. */
function unplanned(layout:KaleidoLayout,budget:number):ResonancePawn[]{
 const cells=layout.cells.filter(c=>c.ring>0);
 const tiles=layout.tiles;
 if(!tiles.length)return [];
 const indices=cells.map((cell,i)=>({cell,h:hash(layout.params.seed,
  layout.params.generation,i)})).sort((a,b)=>a.h-b.h);
 const choices:ResonancePawn[]=[];
 let spent=0;
 for(let i=0;i<indices.length&&choices.length<Math.min(12,cells.length);i++){
  const t=tiles[hash(i,layout.params.seed,47)%tiles.length];
  const number=[1,2,3,4,5,11,16,21][hash(i,layout.params.seed,83)%8];
  const cost=resonanceEnergy(number);
  if(spent+cost>budget)continue;
  const row=(t.paletteRow+3+i%6)%12;
  const col=(t.paletteCol+7+i%5)%12;
  choices.push({key:indices[i].cell.key,number,
   paletteRow:row,paletteCol:col});
  spent+=cost;
 }
 return choices;
}
/** Deliberately expensive and chromatically mismatched purchase. */
function incompatible(layout:KaleidoLayout,budget:number):ResonancePawn[]{
 const cells=layout.cells.filter(c=>c.ring>0);
 if(!cells.length||budget<2)return [];
 const hints=layout.tiles;
 const dominant=hints[0];
 if(!dominant)return [];
 let worstRow=0,worstCol=0,minAffinity=Infinity;
 for(let row=0;row<12;row++)for(let col=0;col<12;col++){
  const affinity=hints.reduce((sum,h)=>sum+
   resonancePaletteAffinity(row,col,h.paletteRow,h.paletteCol),0);
  if(affinity<minAffinity){
   minAffinity=affinity;worstRow=row;worstCol=col;
  }
 }
 const cell=[...cells].sort((a,b)=>{
  const ad=hints.reduce((s,t)=>s+resonanceHexDistance(a,t),0);
  const bd=hints.reduce((s,t)=>s+resonanceHexDistance(b,t),0);
  return bd-ad||a.key.localeCompare(b.key);
 })[0];
 const cost=Math.min(budget,96);
 // Numbers 1,6,11,... are always group T and cost 2,3,4,...E.
 const number=1+5*(cost-2);
 return [{key:cell.key,number,paletteRow:worstRow,paletteCol:worstCol}];
}
/**
 * Sample placements and relocations on the player's existing board.
 * "Bad" means low reward relative to occupied energy, tiny improvement
 * or degradation of the actual geometric score, NOT a monetary loss.
 */
function samplePlacementRisks(
 layout:KaleidoLayout,budget:number,
 settings:ResonanceSettings,owned:ResonancePawn[]
):PlacementRisk{
 const occupied=new Set(owned.map(p=>p.key));
 const free=layout.cells.filter(c=>c.ring>0&&!occupied.has(c.key));
 const current=scoreResonance(layout,owned,settings).quality;
 const currentReward=resonanceReward(layout,current);
 const currentEnergy=owned.reduce((sum,p)=>sum+resonanceEnergy(p.number),0);
 const palettes=[...new Map(layout.tiles.map(t=>[
  t.paletteRow+","+t.paletteCol,[t.paletteRow,t.paletteCol] as const
 ])).values()];
 const paletteOptions:readonly (readonly [number,number])[]=[
  ...palettes.slice(0,5),[0,0],[1,1],[10,10],[11,11],[4,8]
 ];
 const numbers=[1,2,3,4,5,11,26,
  1+5*(Math.max(0,Math.min(budget,96)-2))];
 let placementsSampled=0,lowYieldPlacements=0,negligiblePlacements=0,
  worseningPlacements=0;
 let worstPlacement:PoorPlacement|null=null;
 const maxSamples=Math.min(100,free.length*paletteOptions.length);
 for(let i=0;i<maxSamples;i++){
  const cell=free[(i*7+Math.floor(i/Math.max(1,free.length)))%free.length];
  const [row,col]=paletteOptions[(i*3+Math.floor(i/7))%paletteOptions.length];
  const number=numbers[(i+Math.floor(i/5))%numbers.length];
  const energy=resonanceEnergy(number);
  if(currentEnergy+energy>budget)continue;
  const pawn={key:cell.key,number,paletteRow:row,paletteCol:col};
  const quality=scoreResonance(layout,[...owned,pawn],settings).quality;
  const scoreGain=quality-current;
  const rewardGain=resonanceReward(layout,quality)-currentReward;
  const yieldPerEnergy=rewardGain/energy;
  placementsSampled++;
  if(yieldPerEnergy<.2)lowYieldPlacements++;
  if(Math.abs(scoreGain)<.01)negligiblePlacements++;
  if(scoreGain<-.000001)worseningPlacements++;
  if(!worstPlacement||yieldPerEnergy<worstPlacement.yield)
   worstPlacement={pawn,scoreGain,rewardGain,energy,yield:yieldPerEnergy};
 }
 let relocationsSampled=0,worseningRelocations=0;
 let worstRelocation:PoorRelocation|null=null;
 for(const pawn of owned.slice(0,6)){
  for(const cell of free.slice(0,16)){
   const trial=owned.map(p=>p.key===pawn.key?{...p,key:cell.key}:p);
   const quality=scoreResonance(layout,trial,settings).quality;
   const scoreChange=quality-current;
   const rewardChange=resonanceReward(layout,quality)-currentReward;
   relocationsSampled++;
   if(scoreChange<-.01)worseningRelocations++;
   if(!worstRelocation||scoreChange<worstRelocation.scoreChange)
    worstRelocation={from:pawn.key,to:cell.key,scoreChange,rewardChange};
  }
 }
 return {placementsSampled,lowYieldPlacements,negligiblePlacements,
  worseningPlacements,worstPlacement,relocationsSampled,
  worseningRelocations,worstRelocation};
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
  computed.set(b,better);
  const economics=resonanceEconomics(layout,better.placements,settings);
  bands.push({budget:b,score:better.score,
   energy:better.energy,pieces:better.placements.length,
   reward:economics.reward,efficiency:economics.efficiency});
 }
 const selected=computed.get(budget)!;
 const efficient=energyEfficientPrefix(layout,selected.placements,settings);
 const scenarios:DifficultyScenario[]=[
  solution("quality","Copertura greedy",
   "Massimizza la risonanza con le manifestazioni disponibili.",
   layout,budget,selected.placements,settings),
  solution("efficient","Miglior resa energetica",
   "Massima qualità per unità di energia impegnata, tra i prefissi trovati.",
   layout,budget,efficient,settings),
  solution("literal","Copia dei tiles",
   "Manifesta i Polytroni indicati sopra gli indizi, senza sfruttare la distanza.",
   layout,budget,literalCopy(layout,budget),settings),
  solution("unplanned","Piazzamenti casuali",
   "Collocazioni senza ottimizzazione della risonanza.",
   layout,budget,unplanned(layout,budget),settings),
  solution("incompatible","Piazzamento sfavorevole",
   "Una manifestazione energeticamente impegnativa e poco compatibile.",
   layout,budget,incompatible(layout,budget),settings)
 ];
 const energy70=bands.find(b=>b.score>=TARGET_QUALITY);
 const estimatedEnergy70=energy70?.energy??null;
 const currentEnergy=owned.reduce((sum,p)=>sum+resonanceEnergy(p.number),0);
 const suggestion=greedy(layout,candidates,Math.max(budget,currentEnergy),
  settings,owned);
 const nextMove=suggestion.placements[owned.length]??null;
 const currentQuality=scoreResonance(layout,owned,settings).quality;
 const nextMoveQuality=nextMove?
  scoreResonance(layout,[...owned,nextMove],settings).quality:null;
 const nextMoveRewardGain=nextMoveQuality===null?null:
  resonanceReward(layout,nextMoveQuality)-resonanceReward(layout,currentQuality);
 const nextMoveEnergy=nextMove===null?null:resonanceEnergy(nextMove.number);
 const nextMoveYield=nextMoveRewardGain===null||nextMoveEnergy===null?
  null:nextMoveRewardGain/nextMoveEnergy;
 const rating=selected.score>=78?"accessibile":
  selected.score>=55?"intermedia":"impegnativa";
 return {
  structural:resonanceComplexity(layout),bands,scenarios,
  placementRisk:samplePlacementRisks(layout,budget,settings,owned),
  budget,expectedScore:selected.score,energy:selected.energy,
  placements:selected.placements.length,estimatedEnergy70,rating,
  baselineSolution:selected.placements,
  nextMove,nextMoveQuality,nextMoveRewardGain,nextMoveEnergy,nextMoveYield,
  method:"bounded-greedy-estimate"
 };
}
