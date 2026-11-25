/**
 * Polytron Dance for the Kaleidoscope Resonance Playground only.
 * Reuses the same resonance/economics evaluator as Difficulty Analyzer.
 * This is an instantaneous repositioning, NOT a new manifestation.
 */
import {kaleidoOrbits,type KaleidoLayout} from "@/polytron/kaleidoscopeGenerator";
import {
 scoreResonance,resonanceReward,type ResonancePawn,type ResonanceSettings
} from "@/polytron/resonanceField";

export type DanceResult<T extends ResonancePawn>={
 pawns:T[];beforeReward:number;afterReward:number;
 beforeSymmetry:number;afterSymmetry:number;moved:number;
};
function rng(seed:number):()=>number{
 let state=seed>>>0;
 return ()=>{
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  return state/4294967296;
 };
}
function shuffle<T>(items:readonly T[],random:()=>number):T[]{
 const result=[...items];
 for(let i=result.length-1;i>0;i--){
  const j=Math.floor(random()*(i+1));
  [result[i],result[j]]=[result[j],result[i]];
 }
 return result;
}
/**
 * Search a set of orbit-aware layouts and accept only a dance whose
 * post-evolution commission reward is unchanged or one unit lower.
 * No seals, manifestations, palettes or intrinsic energies are changed.
 * A failure to find a safe movement keeps the board unchanged.
 */
export function polytronDance<T extends ResonancePawn>(
 layout:KaleidoLayout,pawns:readonly T[],settings:ResonanceSettings
):DanceResult<T>{
 const original=[...pawns];
 const before=scoreResonance(layout,original,settings);
 const beforeReward=resonanceReward(layout,before.quality);
 const empty: DanceResult<T>={
  pawns:original,beforeReward,afterReward:beforeReward,
  beforeSymmetry:before.symmetry,afterSymmetry:before.symmetry,moved:0
 };
 if(!pawns.length)return empty;
 const random=rng((layout.params.seed^Math.imul(layout.params.generation+1,2654435761)^
  Math.imul(pawns.length,2246822519))>>>0);
 const cells=layout.cells.filter(c=>c.ring>0);
 const orbits=kaleidoOrbits(layout.cells,layout.params.symmetry)
  .filter(o=>o.ring>0);
 const n=pawns.length;
 let best=empty;
 let bestUtility=-Infinity;
 const evaluate=(keys:string[])=>{
  if(keys.length!==n||new Set(keys).size!==n)return;
  const shuffled=shuffle(original,random);
  const trial=shuffled.map((p,i)=>({...p,key:keys[i]}));
  const moved=trial.filter(p=>original.some(old=>
   "seal" in p&&"seal" in old?old.seal===p.seal&&old.key!==p.key:
    old.number===p.number&&old.key!==p.key)).length;
  if(!moved)return;
  const score=scoreResonance(layout,trial,settings);
  const reward=resonanceReward(layout,score.quality);
  const delta=reward-beforeReward;
  if(delta>0||delta< -1)return;
  // Symmetry dominates; neutral reward is preferable to a one-E penalty.
  // Small deterministic movement preference breaks equal-score ties.
  const utility=score.symmetry*100+(delta===0?2:0)+moved/n;
  if(utility>bestUtility){
   bestUtility=utility;
   best={pawns:trial,beforeReward,afterReward:reward,
    beforeSymmetry:before.symmetry,afterSymmetry:score.symmetry,moved};
  }
 };
 // Include permutations on the same cells: useful when the board is full.
 for(let i=0;i<24;i++)evaluate(original.map(p=>p.key));
 for(let trial=0;trial<280;trial++){
  const picked:string[]=[];
  const chosen=new Set<string>();
  // Fill as many complete symmetry orbits as possible, then residual cells.
  for(const orbit of shuffle(orbits,random)){
   if(picked.length+orbit.cells.length>n)continue;
   if(random()<.18&&trial%4!==0)continue;
   for(const cell of orbit.cells){picked.push(cell.key);chosen.add(cell.key);}
   if(picked.length===n)break;
  }
  for(const cell of shuffle(cells,random)){
   if(picked.length>=n)break;
   if(!chosen.has(cell.key)){picked.push(cell.key);chosen.add(cell.key);}
  }
  evaluate(shuffle(picked,random));
 }
 return best;
}
