/**
 * RC01 Mutatron: prepare antipodal cells with >=5 occupied neighbours,
 * then use EACH charged cell independently for a selected Polytron.
 *
 * Once activated, a cell remembers its charge regardless of who occupies it.
 * 3-4 current neighbours gives +1; 5-6 gives +5; 0-2 blocks mutation.
 * A successful transformation consumes this cell and begins a three-action
 * cooldown, ended immediately by a real local rearrangement or by waiting.
 * Failed attempts are FREE and never advance a turn or consume a cell.
 */
import type {RCBoard} from "@/polytron/rc01Board";
import {intrinsicEnergy} from "@/polytron/mindeleevLife";
import {rcAwardMnemes} from "@/polytron/rc01Mneme";
import {rcAdvanceCellResonance,rcCellResonanceState,rcOccupiedNeighbourCount,
 rcMutationStep,RC_RESONANCE_COOLDOWN_ACTIONS} from "@/polytron/rc01Resonance";
import {rcBoardSymmetry,rcTotalEnergy,rcRecordManifestation,
 validateRCGame,pawnIdentity,type RCGame,type RCPawn,type RCMutatronChange
} from "@/polytron/rc01Game";

export const MUTATRON_INVOCATION_COST=1;
export const mutatronGroup=(n:number)=>((n-1)%5)+1;
export const mutatronPeriod=(n:number)=>Math.floor((n-1)/5)+1;
export const MUTATRON_GROUP_NAMES=["Tetrahedron","Cube","Octahedron",
 "Dodecahedron","Icosahedron"] as const;
export const mutatronIntrinsic=(p:RCPawn)=>intrinsicEnergy(p.number,0);
export const mutatronEnergyTotal=rcTotalEnergy;
export const mutatronSymmetry=(game:RCGame,board:RCBoard)=>
 rcBoardSymmetry(game.pawns,board);
export function mutatronCounts(game:RCGame):readonly number[]{
 const counts=[0,0,0,0,0];
 for(const pawn of game.pawns)counts[mutatronGroup(pawn.number)-1]++;
 return counts;
}
export type RCPreviewStatus="evolve"|"charge"|"energy"|"blocked"|"cooldown";
export type RCMutatronForecastCell={
 key:string;status:RCPreviewStatus;number:number;target:number;
 neighbours:number;charge:number;cooldown:number;energyCost:number;
 reason:string;
};
export type RCMutatronForecast={
 next:RCGame;invocationCost:number;canInvoke:boolean;
 cells:RCMutatronForecastCell[];cost:number;
 reservoirBefore:number;reservoirAfter:number;
 transforms:RCMutatronChange[];summary:string;
};
export function forecastRCMutatron(
 game:RCGame,board:RCBoard,selectedSeal:number|null=null
):RCMutatronForecast{
 const occupied=new Map(game.pawns.map(p=>[p.cellKey,p]));
 const pawn=game.pawns.find(p=>p.seal===selectedSeal);
 const cell=pawn?board.cells.find(c=>c.key===pawn.cellKey):undefined;
 const neighbours=cell?rcOccupiedNeighbourCount(cell,occupied):0;
 const step=rcMutationStep(neighbours);
 const target=pawn?pawn.number+step:0;
 const delta=pawn&&step?
  intrinsicEnergy(target,0)-intrinsicEnergy(pawn.number,0):0;
 const status=cell?rcCellResonanceState(game,cell.key):0;
 const ready=!!pawn&&!!cell&&status===1&&step>0;
 const canPay=ready&&game.mutatron.energyReserve>=delta+MUTATRON_INVOCATION_COST;
 const canInvoke=!!canPay;
 const cells:RCMutatronForecastCell[]=[];
 for(const c of board.cells){
  if(c.nucleus)continue;
  const resonance=rcCellResonanceState(game,c.key);
  if(resonance===0&&c.key!==cell?.key)continue;
  const resident=occupied.get(c.key);
  const adjacent=rcOccupiedNeighbourCount(c,occupied);
  const jump=rcMutationStep(adjacent);
  const to=resident?resident.number+jump:0;
  const energyCost=resident&&jump?
   intrinsicEnergy(to,0)-intrinsicEnergy(resident.number,0):0;
  const chosen=c.key===cell?.key;
  const kind:RCPreviewStatus=resonance<0?"cooldown":
   resonance===0||chosen&&!jump?"blocked":
   chosen&&!canPay?"energy":chosen?"evolve":"charge";
  const message=resonance===0?"Dormant: activate an antipodal pair with 5 neighbours each.":
   resonance<0?"Cooldown "+(-resonance)+"/"+
    RC_RESONANCE_COOLDOWN_ACTIONS+
    " actions; change this cell or its six neighbours to reset immediately.":
   !resident?"Charged: place a Polytron here to use this cell.":
   jump===0?"Charged: needs at least 3 occupied neighbours.":
   "Charged: "+adjacent+" neighbours yield "+
    (jump===5?"+5":"+1")+(chosen&&!canPay?
    "; insufficient Field E.":".");
  // The selected cell remains inspectable even when dormant.
  cells.push({key:c.key,status:kind,number:resident?.number??0,
   target:to,neighbours:adjacent,
   charge:resonance<0?Math.max(1,Math.ceil(-resonance*6/
    RC_RESONANCE_COOLDOWN_ACTIONS)):resonance>0?6:0,
   cooldown:Math.max(0,-resonance),energyCost,reason:message});
 }
 let summary:string;
 if(!pawn||!cell)summary="Select a Polytron on the board to evolve it.";
 else if(status===0)summary=pawnIdentity(pawn)+
  ": cell dormant · activate an antipodal pair with 5 neighbours each.";
 else if(status<0)summary=pawnIdentity(pawn)+
  ": cell cooling for "+(-status)+" more actions · rearrange a neighbour to reset.";
 else if(!step)summary=pawnIdentity(pawn)+
  ": charged cell, but fewer than 3 occupied neighbours.";
 else if(!canPay)summary=pawnIdentity(pawn)+
  ": "+pawn.number+" → "+target+" requires "+
  (delta+MUTATRON_INVOCATION_COST)+" Field E (unavailable).";
 else summary=pawnIdentity(pawn)+": "+pawn.number+" → "+target+
  " ("+(step===5?"+5":"+1")+") · "+
  (delta+MUTATRON_INVOCATION_COST)+" Field E including invocation.";
 if(!canInvoke||!pawn||!cell)return {
  next:game,invocationCost:0,canInvoke:false,cells,cost:0,
  reservoirBefore:game.mutatron.energyReserve,
  reservoirAfter:game.mutatron.energyReserve,transforms:[],summary
 };
 const mutation:RCMutatronChange={
  seal:pawn.seal,cellKey:cell.key,from:pawn.number,to:target,
  kind:step===5?"emergence":"symmetry"
 };
 const nextPawn:RCPawn={...pawn,number:target,
  manifestations:rcRecordManifestation(pawn.manifestations,
   {...pawn,number:target})};
 const provisional:RCGame={
  ...game,
  pawns:game.pawns.map(p=>p.seal===pawn.seal?nextPawn:p),
  homeCycles:game.homeCycles+1,
  mutatron:{...game.mutatron,generation:game.mutatron.generation+1,
   energyReserve:game.mutatron.energyReserve-delta-MUTATRON_INVOCATION_COST,
   dissipatedEnergy:game.mutatron.dissipatedEnergy+MUTATRON_INVOCATION_COST,
   symmetry:0,changes:[mutation],lastNote:summary},
  lastAction:"MUTATRON · "+summary
 };
 const evolved=rcAdvanceCellResonance(game,provisional,board,
  {action:true,consumeKey:cell.key});
 const rewarded=rcAwardMnemes(game,evolved);
 rewarded.mutatron.symmetry=rcBoardSymmetry(rewarded.pawns,board);
 if(!validateRCGame(rewarded,board))
  throw Error("Invalid targeted Mutatron evolution");
 if(mutatronEnergyTotal(rewarded)!==mutatronEnergyTotal(game))
  throw Error("Non-conservative targeted Mutatron evolution");
 return {next:rewarded,cells,cost:delta,invocationCost:MUTATRON_INVOCATION_COST,
  canInvoke:true,reservoirBefore:game.mutatron.energyReserve,
  reservoirAfter:rewarded.mutatron.energyReserve,
  transforms:[mutation],summary:rewarded.lastAction.slice("MUTATRON · ".length)};
}
export function evolveRCMutatron(
 game:RCGame,board:RCBoard,selectedSeal:number|null=null
):RCGame{
 return forecastRCMutatron(game,board,selectedSeal).next;
}
