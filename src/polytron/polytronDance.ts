/**
 * Polytron Dance · Kaleidoscope Resonance Playground only.
 *
 * The Difficulty Analyzer and Dance use the same scoreResonance/reward functions.
 * Evolve changes the request first; the Dance then moves existing individuals.
 * The Dance itself never credits the treasury or changes intrinsic energy.
 */
import {
 kaleidoOrbits,kaleidoTransform,type KaleidoLayout
} from "@/polytron/kaleidoscopeGenerator";
import {
 scoreResonance,resonanceReward,type ResonancePawn,type ResonanceSettings
} from "@/polytron/resonanceField";

export type DanceResult<T extends ResonancePawn>={
 pawns:T[];beforeReward:number;afterReward:number;
 beforeSymmetry:number;afterSymmetry:number;moved:number;
 beforeVisualSymmetry:number;afterVisualSymmetry:number;
 /** target = 0/-1 E; relaxed = larger loss; fallback = closest available movement. */
 status:"target"|"relaxed"|"fallback"|"empty";
};
function rng(seed:number):()=>number{
 let state=seed>>>0;
 return ()=>{
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  return state/4294967296;
 };
}
function shuffle<T>(input:readonly T[],random:()=>number):T[]{
 const a=[...input];
 for(let i=a.length-1;i>0;i--){
  const j=Math.floor(random()*(i+1));
  [a[i],a[j]]=[a[j],a[i]];
 }
 return a;
}
function visualSymmetry(layout:KaleidoLayout,keys:readonly string[]):number{
 if(keys.length<2)return 0;
 const occupied=new Set(keys);
 const rotations=layout.params.symmetry==="C2"?[3]:
  layout.params.symmetry==="C3"?[2,4]:[1,2,3,4,5];
 const transforms=rotations.map(rotation=>({rotation,mirrored:false}));
 if(layout.params.symmetry==="D6"){
  for(let rotation=0;rotation<6;rotation++)
   transforms.push({rotation,mirrored:true});
 }
 let best=0;
 for(const t of transforms){
  let matching=0;
  for(const key of keys){
   const [q,r]=key.split(",").map(Number);
   const p=kaleidoTransform({q,r},t.rotation,t.mirrored);
   if(occupied.has(p.q+","+p.r))matching++;
  }
  best=Math.max(best,matching/keys.length);
 }
 return 100*best;
}
export function polytronDance<T extends ResonancePawn>(
 layout:KaleidoLayout,pawns:readonly T[],settings:ResonanceSettings
):DanceResult<T>{
 const original=[...pawns];
 const score=scoreResonance(layout,original,settings);
 const beforeReward=resonanceReward(layout,score.quality);
 const originalKeys=original.map(p=>p.key);
 const beforeVisualSymmetry=visualSymmetry(layout,originalKeys);
 const unchanged:DanceResult<T>={
  pawns:original,beforeReward,afterReward:beforeReward,
  beforeSymmetry:score.symmetry,afterSymmetry:score.symmetry,
  beforeVisualSymmetry,afterVisualSymmetry:beforeVisualSymmetry,
  moved:0,status:"empty"
 };
 if(!original.length)return unchanged;
 const cells=layout.cells.filter(c=>c.ring>0);
 if(cells.length<2)return unchanged;
 const random=rng((layout.params.seed^Math.imul(layout.params.generation+1,2654435761)^
  Math.imul(original.length,2246822519))>>>0);
 const orbits=kaleidoOrbits(layout.cells,layout.params.symmetry)
  .filter(orbit=>orbit.ring>0);
 const n=original.length;
 type Choice={result:DanceResult<T>;rank:number};
 const choices:{target?:Choice;relaxed?:Choice;fallback?:Choice}={};
 const originalOccupied=new Set(originalKeys);
 const evaluate=(keys:readonly string[])=>{
  if(keys.length!==n||new Set(keys).size!==n)return;
  const moved=keys.reduce((total,key,i)=>total+(key!==original[i].key?1:0),0);
  if(!moved)return;
  const trial=original.map((pawn,i)=>({...pawn,key:keys[i]}));
  const next=scoreResonance(layout,trial,settings);
  const afterReward=resonanceReward(layout,next.quality);
  const delta=afterReward-beforeReward;
  const afterVisualSymmetry=visualSymmetry(layout,keys);
  const changedPositions=keys.some(key=>!originalOccupied.has(key));
  const result:DanceResult<T>={
   pawns:trial,beforeReward,afterReward,
   beforeSymmetry:score.symmetry,afterSymmetry:next.symmetry,
   beforeVisualSymmetry,afterVisualSymmetry,moved,status:"target"
  };
  // Meaningful change of occupied positions wins ties over swapping identities.
  const aesthetic=afterVisualSymmetry*10+next.symmetry;
  const visualBonus=changedPositions?0.25:0;
  const moveBonus=moved/n*.1;
  if(delta<=0&&delta>=-1&&next.symmetry+1e-8>=score.symmetry){
   const rank=aesthetic+(delta===0?.8:0)+visualBonus+moveBonus;
   if(!choices.target||rank>choices.target.rank)choices.target={result,rank};
  }else if(delta<0&&next.symmetry+1e-8>=score.symmetry){
   // Larger losses are allowed only if no near-neutral movement exists.
   const rank=aesthetic-Math.abs(delta)*2+visualBonus+moveBonus;
   if(!choices.relaxed||rank>choices.relaxed.rank)
    choices.relaxed={result:{...result,status:"relaxed"},rank};
  }
  // Last resort: move visibly while retaining the actual energy of every Pawn.
  // The UI explicitly reports when the forecast reward constraint could not hold.
  const rank=aesthetic-Math.abs(delta)*6+
   (delta>0?-15:0)+visualBonus+moveBonus;
  if(!choices.fallback||rank>choices.fallback.rank)
   choices.fallback={result:{...result,status:"fallback"},rank};
 };
 // For sparse boards, exhaustively check the complete space of placements.
 // In particular two Polytrons can form a 180° pair even in a D6 request.
 if(n===1){
  for(const cell of cells)evaluate([cell.key]);
 }else if(n===2&&cells.length<=36){
  for(const a of cells)for(const b of cells)
   if(a.key!==b.key)evaluate([a.key,b.key]);
 }else{
  // Existing slots can still dance on a full board.
  for(let i=0;i<36;i++)evaluate(shuffle(originalKeys,random));
  // Orbit-first candidate generation, followed by local variations.
  for(let attempt=0;attempt<560;attempt++){
   const keys:string[]=[];
   const chosen=new Set<string>();
   if(attempt%4!==0){
    for(const orbit of shuffle(orbits,random)){
     if(keys.length+orbit.cells.length>n)continue;
     if(attempt%3===0&&random()<.3)continue;
     for(const cell of orbit.cells){
      keys.push(cell.key);chosen.add(cell.key);
     }
     if(keys.length===n)break;
    }
   }
   for(const cell of shuffle(cells,random)){
    if(keys.length>=n)break;
    if(!chosen.has(cell.key)){keys.push(cell.key);chosen.add(cell.key);}
   }
   evaluate(shuffle(keys,random));
  }
  // Local mutations can preserve the score but still shift the pattern.
  for(let attempt=0;attempt<140;attempt++){
   const keys=[...originalKeys];
   const i=Math.floor(random()*n);
   const destination=cells[Math.floor(random()*cells.length)].key;
   const other=keys.indexOf(destination);
   if(other>=0)[keys[i],keys[other]]=[keys[other],keys[i]];
   else keys[i]=destination;
   evaluate(keys);
  }
 }
 return (choices.target??choices.relaxed??choices.fallback)?.result??unchanged;
}
