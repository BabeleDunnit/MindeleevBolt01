/**
 * RC01 Mutatron -- one deterministic local cellular rule with a LIVE
 * what-if preview. The preview and the committed tick share this code.
 *
 * A mirrored pair is supported when EACH end has:
 *  - >= 3 occupied neighbours of its six hexagonal neighbours;
 *  - >= 2 distinct Platonic groups across the two local neighbourhoods.
 * Balanced axes are no longer needed for basic resonance; they still
 * contribute to priority and gate advanced period changes.
 *
 * Support charges a CELL-PAIR resonance (not a Polytron's identity).
 * Charge >=2 permits an adjacent group step; charge >=3, together with
 * two supported axes and three groups, permits an adjacent period step.
 * Exactly ONE antipodal pair is chosen per tick, from a frozen snapshot.
 * The target must be no more than one group/period step away from EACH
 * affected Polytron. The Mutatron does not invent shapes ex nihilo.
 *
 * The intrinsic energy increase is deducted from a finite FIELD reserve.
 * Thus on every evolution E(all Polytrons, including Home)+E(reserve)
 * is constant. The field budget is an explicit prototype resource.
 * Drag-capture energy accounting is outside this rule and still TBD.
 */
import {rcKey,type RCBoard,type RCCell} from "@/polytron/rc01Board";
import {intrinsicEnergy} from "@/polytron/mindeleevLife";
import {rcAwardMnemes} from "@/polytron/rc01Mneme";
import {rcBoardSymmetry,rcTotalEnergy,rcRecordManifestation,
 validateRCGame,
 type RCGame,type RCPawn,type RCMutatronChange} from "@/polytron/rc01Game";

export const MUTATRON_NEIGHBOURS=[
 [1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]
] as const;
export const MUTATRON_MIN_NEIGHBOURS=3;
export const MUTATRON_MIN_GROUPS=2;
export const MUTATRON_GROUP_CHARGE=2;
export const MUTATRON_PERIOD_CHARGE=3;
export const MUTATRON_MAX_CHARGE=6;
export const MUTATRON_INVOCATION_COST=1;

export const mutatronGroup=(n:number)=>((n-1)%5)+1;
export const mutatronPeriod=(n:number)=>Math.floor((n-1)/5)+1;
export const MUTATRON_GROUP_NAMES=["Tetrahedron","Cube","Octahedron",
 "Dodecahedron","Icosahedron"] as const;
export const mutatronIntrinsic=(p:RCPawn)=>intrinsicEnergy(p.number,0);
export const mutatronEnergyTotal=rcTotalEnergy;
export function mutatronSymmetry(game:RCGame,board:RCBoard):number{
 return rcBoardSymmetry(game.pawns,board);
}
export function mutatronCounts(game:RCGame):readonly number[]{
 const counts=[0,0,0,0,0];
 for(const pawn of game.pawns)counts[mutatronGroup(pawn.number)-1]++;
 return counts;
}

export type RCPreviewStatus="evolve"|"charge"|"energy"|"blocked";
export type RCMutatronForecastCell={
 key:string;status:RCPreviewStatus;number:number;target:number;
 neighbours:number;axes:number;groups:number;charge:number;needed:number;
 energyCost:number;reason:string
};
export type RCMutatronForecast={
 /** A NEXT-generation game derived from this exact frozen input snapshot. */
 next:RCGame;
 invocationCost:number;
 canInvoke:boolean;
 cells:RCMutatronForecastCell[];
 cost:number;
 reservoirBefore:number;reservoirAfter:number;
 /** Reconciles exactly with the changes made by next. */
 transforms:RCMutatronChange[];
 summary:string;
};

type Pair={id:string;a:RCCell;b:RCCell};
type Local={neighbours:number;axes:number;groups:number[];near:RCPawn[]};
type Candidate={
 pair:Pair;p:RCPawn;q:RCPawn;
 a:Local;b:Local;diversity:number;score:number;charge:number;
 target:number;needed:number;cost:number;reason:string;
 supported:boolean;canPay:boolean;
};

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
function localAt(cell:RCCell,occupied:ReadonlyMap<string,RCPawn>):Local{
 const around=MUTATRON_NEIGHBOURS.map(([q,r])=>
  occupied.get(rcKey(cell.q+q,cell.r+r))??null);
 const near=around.filter((p):p is RCPawn=>p!==null);
 return {
  neighbours:near.length,
  axes:[0,1,2].filter(i=>around[i]&&around[i+3]).length,
  groups:[...new Set(near.map(p=>mutatronGroup(p.number)))],
  near
 };
}

 
/** The only geometrically permitted numerical movements:
 * n -> n+1 within the same period (one group)
 * n -> n+5 within the same group (one period)
 * and n -> max(n,m) when two opposed neighbours differ by exactly 1.
 * No full Collatz 3n+1 jumps, because those break local predictability.
 */
function targetFor(p:RCPawn,q:RCPawn,a:Local,b:Local,diversity:number){
 const low=Math.min(p.number,q.number),high=Math.max(p.number,q.number);
 const adjacent=low===high||
  (mutatronPeriod(low)===mutatronPeriod(high)&&
   mutatronGroup(high)===mutatronGroup(low)+1)||
  (mutatronGroup(low)===mutatronGroup(high)&&
   mutatronPeriod(high)===mutatronPeriod(low)+1);
 if(!adjacent)return {
  target:high,needed:2,
  reason:"Opposed cells differ by more than one group or period."
 };
 if(low!==high)return {
  target:high,needed:MUTATRON_GROUP_CHARGE,
  reason:"One adjacent group step repairs the opposed pair."
 };
 const catalyticNeighbour=[...a.near,...b.near].some(p=>
  mutatronPeriod(p.number)>mutatronPeriod(high));
 const periodReady=Math.min(a.axes,b.axes)>=2&&
  diversity>=3&&catalyticNeighbour;
 // A leap in period requires an evolved neighbour of a later period,
 // EXCEPT for group 5, which naturally opens the next period.
 if(mutatronGroup(high)===5||periodReady)return {
  target:high+5,needed:MUTATRON_PERIOD_CHARGE,
  reason:"Strong balanced axes sustain a one-period transition."
 };
 return {
  target:high+1,needed:MUTATRON_GROUP_CHARGE,
  reason:"Diverse local neighbours sustain a one-group transition."
 };
}
/** Pure preview and turn engine: no mutations to game, board, or Polytrons. */
export function forecastRCMutatron(game:RCGame,board:RCBoard):RCMutatronForecast{
 const canInvoke=game.mutatron.energyReserve>=MUTATRON_INVOCATION_COST;
 const occupied=new Map(game.pawns.map(p=>[p.cellKey,p]));
 const resonance:Record<string,number>={};
 const counts=mutatronCounts(game);
 const candidates:Candidate[]=[];
 for(const pair of oppositePairs(board)){
  const p=occupied.get(pair.a.key),q=occupied.get(pair.b.key);
  if(!p||!q)continue;
  const a=localAt(pair.a,occupied),b=localAt(pair.b,occupied);
  const diversity=new Set([mutatronGroup(p.number),mutatronGroup(q.number),
   ...a.groups,...b.groups]).size;
  const localSupport=Math.min(a.neighbours,b.neighbours)>=MUTATRON_MIN_NEIGHBOURS&&
   diversity>=MUTATRON_MIN_GROUPS;
  const proposed=targetFor(p,q,a,b,diversity);
  // Do not erase the last pair of an emergent family by upgrading it.
  // The players must create more seed sites before pushing farther.
  const rarePreserved=!(p.number===q.number&&mutatronGroup(p.number)>=4&&
   counts[mutatronGroup(p.number)-1]<=2);
  const adjacent=p.number===q.number||
   (mutatronPeriod(p.number)===mutatronPeriod(q.number)&&
    Math.abs(mutatronGroup(p.number)-mutatronGroup(q.number))===1)||
   (mutatronGroup(p.number)===mutatronGroup(q.number)&&
    Math.abs(mutatronPeriod(p.number)-mutatronPeriod(q.number))===1);
  const localMax=Math.max(0,...a.near.map(p=>p.number),
   ...b.near.map(p=>p.number));
  // A player cannot farm arbitrarily large N by repeatedly clicking on
  // one isolated seed. One-step group changes need supporting neighbours
  // within 1 group; period changes need another seed within 1 period.
  const neighbourhoodCap=proposed.target<=localMax+
   (mutatronPeriod(proposed.target)>mutatronPeriod(Math.max(p.number,q.number))?5:1);
  const supported=localSupport&&rarePreserved&&adjacent&&neighbourhoodCap;
  const charge=supported?
   Math.min(MUTATRON_MAX_CHARGE,(game.mutatron.resonance[pair.id]??0)+1):
   Math.max(0,(game.mutatron.resonance[pair.id]??0)-1);
  if(charge)resonance[pair.id]=charge;
  const cost=intrinsicEnergy(proposed.target,0)*2-
   intrinsicEnergy(p.number,0)-intrinsicEnergy(q.number,0);
  const canPay=cost>=0&&
   cost+MUTATRON_INVOCATION_COST<=game.mutatron.energyReserve;
  // Highest geometry/coherence first, but give advancing periods a
  // small boost to ensure eventual forms beyond the first five.
  const score=3*diversity+2*Math.min(a.axes,b.axes)+
   Math.min(a.neighbours,b.neighbours)+Math.min(3,mutatronPeriod(proposed.target))+
   (p.number!==q.number?3:0);
  candidates.push({pair,p,q,a,b,diversity,score,charge,
   target:proposed.target,needed:proposed.needed,cost,
   supported,canPay,reason:proposed.reason});
 }
 candidates.sort((a,b)=>b.score-a.score||
  b.charge-a.charge||a.pair.a.ring-b.pair.a.ring||
  a.pair.id.localeCompare(b.pair.id));
 const selected=canInvoke?candidates.find(c=>
  c.supported&&c.charge>=c.needed&&c.canPay&&
  (c.p.number!==c.target||c.q.number!==c.target)):undefined;
 const updates=new Map<number,RCPawn>();
 const transforms:RCMutatronChange[]=[];
 if(selected){
  // Chromatica belongs to each Seal: transmutation never changes row/col.
  for(const pawn of [selected.p,selected.q]){
   if(pawn.number===selected.target)continue;
   updates.set(pawn.seal,{...pawn,number:selected.target,
    manifestations:rcRecordManifestation(pawn.manifestations,
     {...pawn,number:selected.target})});
   transforms.push({seal:pawn.seal,cellKey:pawn.cellKey,
    from:pawn.number,to:selected.target,
    kind:mutatronPeriod(selected.target)>mutatronPeriod(pawn.number)?
     "emergence":"symmetry"});
  }
  resonance[selected.pair.id]=0;
 }
 const cost=selected?.cost??0;
 const cells:RCMutatronForecastCell[]=[];
 for(const c of candidates){
  const status:RCPreviewStatus=c===selected?"evolve":
   !c.supported?"blocked":!c.canPay?"energy":"charge";
  // Preview only real evolution candidates, charging cells and
  // energy-starved sites. Don't flood the mobile board with dead pairs.
  if(status==="blocked"&&c.charge===0)continue;
  const reason=status==="evolve"?
   "Next evolution: Polytrons #"+c.p.seal+" and #"+c.q.seal+
   " · numbers "+c.p.number+"/"+c.q.number+" → "+c.target+
   "; "+(c.cost+MUTATRON_INVOCATION_COST)+" E including invocation.":
   status==="energy"?
   "Insufficient field energy: needs "+(c.cost+MUTATRON_INVOCATION_COST)+" E.":
   status==="charge"?
    (c.charge>=c.needed?
     "Ready: charge "+c.charge+", threshold "+c.needed+
     "; waiting behind a higher-priority pair. ":
     "Charging: "+c.charge+" of "+c.needed+" needed. ")+c.reason:c.reason;
  for(const [pawn,local] of [[c.p,c.a],[c.q,c.b]] as const){
   // Do not highlight a Polytron whose number is already at target.
   if(status==="evolve"&&pawn.number===c.target)continue;
   cells.push({key:pawn.cellKey,status,number:pawn.number,
    target:c.target,neighbours:local.neighbours,axes:local.axes,
    groups:c.diversity,charge:c.charge,needed:c.needed,
    energyCost:c.cost,reason});
  }
 }
 const summary=!canInvoke?
  "Field depleted: recover at least 1 E to invoke the Mutatron.":
  selected?
  "Polytrons #"+selected.p.seal+" and #"+selected.q.seal+
  " · numbers "+selected.p.number+"/"+selected.q.number+" → "+
  selected.target+"; "+cost+" E transmutation + 1 E invocation.":
  candidates.some(c=>c.supported&&!c.canPay&&c.charge>=c.needed)?
   "Insufficient field energy for the charged pairs.":
  candidates.some(c=>c.supported)?
   "Resonance charging; evolve again or move Polytrons to change the field.":
   "No antipodal pair has enough occupied and diverse neighbours.";
 const next:RCGame={
  ...game,
  homeCycles:game.homeCycles+(canInvoke?1:0),
  pawns:game.pawns.map(p=>updates.get(p.seal)??p),
  mutatron:{
   ...game.mutatron,
   generation:game.mutatron.generation+(canInvoke?1:0),
   resonance:canInvoke?resonance:game.mutatron.resonance,
   changes:canInvoke?transforms:[],
   energyReserve:game.mutatron.energyReserve-cost-
    (canInvoke?MUTATRON_INVOCATION_COST:0),
   dissipatedEnergy:game.mutatron.dissipatedEnergy+
    (canInvoke?MUTATRON_INVOCATION_COST:0),
   symmetry:0,lastNote:summary
  },
  lastAction:"MUTATRON · "+summary
 };
 const rewarded=rcAwardMnemes(game,next);
 rewarded.mutatron.symmetry=rcBoardSymmetry(rewarded.pawns,board);
 if(!validateRCGame(rewarded,board))
  throw Error("Invalid Mutatron preview state");
 if(mutatronEnergyTotal(rewarded)!==mutatronEnergyTotal(game))
  throw Error("Mutatron energy was not conserved");
 return {next:rewarded,cells,cost,
  invocationCost:canInvoke?MUTATRON_INVOCATION_COST:0,
  canInvoke,
  reservoirBefore:game.mutatron.energyReserve,
  reservoirAfter:rewarded.mutatron.energyReserve,
  transforms,summary:rewarded.lastAction.slice("MUTATRON · ".length)};
}
export function evolveRCMutatron(game:RCGame,board:RCBoard):RCGame{
 return forecastRCMutatron(game,board).next;
}
