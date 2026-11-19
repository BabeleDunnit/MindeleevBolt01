/**
 * RC01 experimental Mutatron -- a synchronous, geometry-driven symmetry
 * engine, independent of Rapier, the player turn order and Conway operators.
 *
 * One explicit evolution uses a FROZEN board snapshot:
 *  - local 6-neighbour occupancy and diversity generate a coherence field;
 *  - 180-degree opposite cells are evaluated as one symmetric pair;
 *  - persistent resonance permits rare Platonic families to emerge;
 *  - once diverse, mismatched opposite pairs can repair manifestations and
 *    eventually their Chromatica. A fixed point is allowed.
 *
 * No Polytron moves, disappears, or changes its permanent identity.
 * Its history records emergent manifestations; Home is unaffected.
 */
import {rcKey,type RCBoard,type RCCell} from "@/polytron/rc01Board";
import {RC01_OPENING_PALETTE,validateRCGame,
 type RCGame,type RCPawn,type RCMutatronChange}
 from "@/polytron/rc01Game";

export const MUTATRON_NEIGHBOURS=[
 [1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]
] as const;

export const mutatronGroup=(number:number)=>((number-1)%5)+1;
export const MUTATRON_GROUP_NAMES=["Tetrahedron","Cube","Octahedron",
 "Dodecahedron","Icosahedron"] as const;

/** Rotational pairs, rather than signed directions, make the rule invariant
 * under 180-degree rotations of the entire Mutatron.
 */
type Pair={id:string;a:RCCell;b:RCCell};
function oppositePairs(board:RCBoard):Pair[]{
 const cells=new Map(board.cells.map(c=>[c.key,c]));
 const pairs:Pair[]=[];
 for(const a of board.cells){
  if(a.nucleus)continue;
  const b=cells.get(rcKey(-a.q,-a.r));
  if(!b||a.key>=b.key)continue;
  pairs.push({id:a.key+"|"+b.key,a,b});
 }
 return pairs.sort((x,y)=>x.a.ring-y.a.ring||x.id.localeCompare(y.id));
}
type Local={occupied:number;pairedAxes:number;groups:number[];near:RCPawn[]};
function localAt(cell:RCCell,occupied:ReadonlyMap<string,RCPawn>):Local{
 const neighbours=MUTATRON_NEIGHBOURS.map(([q,r])=>
  occupied.get(rcKey(cell.q+q,cell.r+r))??null);
 const near=neighbours.filter((p):p is RCPawn=>p!==null);
 return {
  occupied:near.length,
  pairedAxes:[0,1,2].filter(i=>neighbours[i]&&neighbours[i+3]).length,
  groups:[...new Set(near.map(p=>mutatronGroup(p.number)))],
  near
 };
}
export function mutatronSymmetry(game:RCGame,board:RCBoard):number{
 const occupied=new Map(game.pawns.map(p=>[p.cellKey,p]));
 const pairs=oppositePairs(board);
 if(!pairs.length)return 100;
 const matches=pairs.filter(({a,b})=>{
  const p=occupied.get(a.key),q=occupied.get(b.key);
  if(!p&&!q)return true;
  return !!p&&!!q&&p.number===q.number&&
   p.row===q.row&&p.col===q.col;
 }).length;
 return Math.round(matches*100/pairs.length);
}
export function mutatronCounts(game:RCGame):readonly number[]{
 const counts=[0,0,0,0,0];
 for(const pawn of game.pawns)counts[mutatronGroup(pawn.number)-1]++;
 return counts;
}
type Candidate={
 pair:Pair;p:RCPawn;q:RCPawn;
 a:Local;b:Local;score:number;resonance:number
};
const paletteForGroup=(group:number)=>({
 row:(RC01_OPENING_PALETTE.row+group)%12,
 col:(RC01_OPENING_PALETTE.col+group)%12
});
const append=(history:readonly number[],n:number)=>
 history.includes(n)?[...history]:[...history,n];

/**
 * A single global tick; only snapshot-derived candidate scores are read.
 * The symmetry resolver selects at most one antipodal pair per generation:
 * this deliberately favours readable, observable changes over mass updates.
 */
export function evolveRCMutatron(game:RCGame,board:RCBoard):RCGame{
 const occupied=new Map(game.pawns.map(p=>[p.cellKey,p]));
 const pairs=oppositePairs(board);
 const resonance:Record<string,number>={};
 const candidates:Candidate[]=[];
 for(const pair of pairs){
  const p=occupied.get(pair.a.key),q=occupied.get(pair.b.key);
  if(!p||!q)continue;
  const a=localAt(pair.a,occupied),b=localAt(pair.b,occupied);
  const diversity=new Set([
   mutatronGroup(p.number),mutatronGroup(q.number),
   ...a.groups,...b.groups
  ]).size;
  // A viable local resonance needs bilateral neighbour support AND at least
  // two present Platonic families. Pure uniform regions cannot invent D/I.
  const eligible=Math.min(a.occupied,b.occupied)>=3&&
   Math.min(a.pairedAxes,b.pairedAxes)>=1&&diversity>=2;
  const previous=game.mutatron.resonance[pair.id]??0;
  const charge=eligible?Math.min(6,previous+1):Math.max(0,previous-1);
  if(charge)resonance[pair.id]=charge;
  if(!eligible)continue;
  const score=3*diversity+2*Math.min(a.pairedAxes,b.pairedAxes)+
   Math.min(a.occupied,b.occupied)+(p.number!==q.number?3:0);
  candidates.push({pair,p,q,a,b,score,resonance:charge});
 }
 candidates.sort((a,b)=>b.score-a.score||
  a.pair.a.ring-b.pair.a.ring||
  a.pair.id.localeCompare(b.pair.id));

 const counts=mutatronCounts(game);
 const minPopulation=Math.min(4,Math.max(2,Math.floor(game.pawns.length/12)));
 const absentOrRare=[4,5].filter(group=>counts[group-1]<minPopulation)
  .sort((a,b)=>counts[a-1]-counts[b-1]||a-b);
 let selected:Candidate|undefined;
 let target:number|undefined;
 let kind:RCMutatronChange["kind"]|undefined;
 let note="No symmetric neighbourhood has enough diversity to mutate.";
 for(const group of absentOrRare){
  const found=candidates.find(c=>{
   if(c.resonance<(group===5?3:2))return false;
   if(group===5){
    // Icosahedra need a preceding dodecahedral seed nearby.
    const vicinity=[c.p,c.q,...c.a.near,...c.b.near];
    if(!vicinity.some(p=>mutatronGroup(p.number)===4))return false;
   }
   return true;
  });
  if(found){selected=found;target=group;kind="emergence";break;}
 }
 if(!selected&&absentOrRare.length===0){
  // The Mutatron may heal a broken antipodal pair, while choosing the
  // locally rarer family. It never collapses the entire board to #1.
  selected=candidates.find(c=>c.resonance>=2&&c.p.number!==c.q.number);
  if(selected){
   const x=mutatronGroup(selected.p.number);
   const y=mutatronGroup(selected.q.number);
   const support=(group:number)=>[...selected!.a.near,...selected!.b.near]
    .filter(p=>mutatronGroup(p.number)===group).length;
   target=(counts[x-1]<counts[y-1]||
    counts[x-1]===counts[y-1]&&support(x)>=support(y))?
     selected.p.number:selected.q.number;
   kind="symmetry";
  }else{
   selected=candidates.find(c=>c.resonance>=2&&
    c.p.number===c.q.number&&
    (c.p.row!==c.q.row||c.p.col!==c.q.col));
   if(selected){target=selected.p.number;kind="chromatic";}
  }
 }

 const changes:RCMutatronChange[]=[];
 const updates=new Map<number,RCPawn>();
 if(selected&&target!==undefined&&kind){
  const both=[selected.p,selected.q];
  const chosenPalette=kind==="chromatic"?{
   row:Math.round((both[0].row+both[1].row)/2)%12,
   col:Math.round((both[0].col+both[1].col)/2)%12
  }:paletteForGroup(mutatronGroup(target));
  for(const p of both){
   if(p.number===target&&p.row===chosenPalette.row&&
      p.col===chosenPalette.col)continue;
   const changed:RCPawn={
    ...p,number:target,
    row:chosenPalette.row,col:chosenPalette.col,
    manifestations:append(p.manifestations,target)
   };
   updates.set(p.seal,changed);
   changes.push({seal:p.seal,cellKey:p.cellKey,
    from:p.number,to:target,kind});
  }
  resonance[selected.pair.id]=0;
  if(kind==="emergence")
   note=MUTATRON_GROUP_NAMES[mutatronGroup(target)-1]+
    " resonance: opposite cells crystallized into #"+target+
    " after persistent mirrored, diverse neighbours.";
  else if(kind==="symmetry")
   note="Symmetry repair: opposite Polytrons adopt the rarer supported manifestation.";
  else note="Chromatic repair: opposite Polytrons adopt a shared palette.";
 }else if(candidates.length){
  note="Resonance accumulating in "+candidates.length+
   " balanced local pairs; no crystallization yet.";
 }
 const updated:RCGame={
  ...game,
  pawns:game.pawns.map(p=>updates.get(p.seal)??p),
  mutatron:{
   generation:game.mutatron.generation+1,
   resonance,changes,symmetry:0,lastNote:note
  },
  lastAction:"MUTATRON · "+note
 };
 updated.mutatron.symmetry=mutatronSymmetry(updated,board);
 if(!validateRCGame(updated,board))
  throw Error("Mutatron evolution violated identities or game-state invariants");
 return updated;
}
