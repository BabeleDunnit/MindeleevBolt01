/**
 * RC01 cell resonance: the GRID remembers an activation, independently of
 * the permanent Polytron Seal and of the shape/palette in that cell.
 *
 * Positive 1 = charged; negative -3..-1 = cooldown actions remaining.
 * Missing key = dormant. A qualifying antipodal pair activates BOTH cells
 * exactly once, when BOTH are occupied and have >=5 occupied neighbours.
 *
 * Consuming an evolution starts a 3-action cooldown. During cooldown a
 * change in the occupant's SEAL in the cell or any of its six neighbours
 * resets that cell immediately to charged. Otherwise each valid action
 * counts down; when it expires the cell becomes charged automatically.
 */
import {rcKey,type RCBoard,type RCCell} from "@/polytron/rc01Board";
import type {RCGame,RCPawn} from "@/polytron/rc01Game";

export const RC_RESONANCE_ACTIVATION_NEIGHBOURS=5;
export const RC_RESONANCE_MUTATION_NEIGHBOURS=3;
export const RC_RESONANCE_COOLDOWN_ACTIONS=3;
export const RC_RESONANCE_DIRECTIONS=[
 [1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]
] as const;

export const rcCellResonanceState=(game:RCGame,key:string)=>
 game.mutatron.resonance[key]??0;
export const rcCellCooldown=(game:RCGame,key:string)=>
 Math.max(0,-rcCellResonanceState(game,key));
export const rcCellCharged=(game:RCGame,key:string)=>
 rcCellResonanceState(game,key)>0;

export function rcOccupiedNeighbourCount(
 cell:RCCell,occupied:ReadonlyMap<string,RCPawn>
):number{
 return RC_RESONANCE_DIRECTIONS.reduce((n,[q,r])=>
  n+(occupied.has(rcKey(cell.q+q,cell.r+r))?1:0),0);
}
export const rcMutationStep=(neighbours:number)=>
 neighbours>=5?5:neighbours>=3?1:0;

function localOccupantsChanged(
 cell:RCCell,before:ReadonlyMap<string,RCPawn>,
 after:ReadonlyMap<string,RCPawn>
):boolean{
 for(const [dq,dr] of [[0,0],...RC_RESONANCE_DIRECTIONS]){
  const key=rcKey(cell.q+dq,cell.r+dr);
  if(before.get(key)?.seal!==after.get(key)?.seal)return true;
 }
 return false;
}
function activateNewPairs(
 resonance:Record<string,number>,board:RCBoard,
 occupied:ReadonlyMap<string,RCPawn>
){
 const byKey=new Map(board.cells.map(c=>[c.key,c]));
 for(const cell of board.cells){
  if(cell.nucleus||!occupied.has(cell.key))continue;
  const opposite=byKey.get(rcKey(-cell.q,-cell.r));
  if(!opposite||cell.key>=opposite.key||!occupied.has(opposite.key))continue;
  if(rcOccupiedNeighbourCount(cell,occupied)<RC_RESONANCE_ACTIVATION_NEIGHBOURS||
     rcOccupiedNeighbourCount(opposite,occupied)<RC_RESONANCE_ACTIVATION_NEIGHBOURS)
   continue;
  // Existing activations must NEVER overwrite a cooldown.
  if(!(cell.key in resonance))resonance[cell.key]=1;
  if(!(opposite.key in resonance))resonance[opposite.key]=1;
 }
}
/** Create the 72-Seal opening with the resonance that already exists on it. */
export function rcPrimeCellResonance(game:RCGame,board:RCBoard):RCGame{
 const resonance:Record<string,number>={};
 const occupied=new Map(game.pawns.map(p=>[p.cellKey,p]));
 activateNewPairs(resonance,board,occupied);
 return {...game,mutatron:{...game.mutatron,resonance}};
}
/**
 * Apply a completed action after the ordinary board/energy transition.
 * The consumed cell is excluded from immediate recharge even when its
 * own number changes: only occupant IDs/positions count as local changes.
 */
export function rcAdvanceCellResonance(
 previous:RCGame,next:RCGame,board:RCBoard,
 options:{action?:boolean;consumeKey?:string}={}
):RCGame{
 const before=new Map(previous.pawns.map(p=>[p.cellKey,p]));
 const after=new Map(next.pawns.map(p=>[p.cellKey,p]));
 const resonance={...previous.mutatron.resonance};
 const byKey=new Map(board.cells.map(c=>[c.key,c]));
 for(const [key,status] of Object.entries(resonance)){
  if(status>=0)continue;
  const cell=byKey.get(key);
  if(!cell)continue;
  if(localOccupantsChanged(cell,before,after)){
   resonance[key]=1;
  }else if(options.action){
   resonance[key]=status===-1?1:status+1;
  }
 }
 activateNewPairs(resonance,board,after);
 if(options.consumeKey){
  if(resonance[options.consumeKey]!==1)
   throw Error("Cannot consume an uncharged Mutatron cell");
  resonance[options.consumeKey]=-RC_RESONANCE_COOLDOWN_ACTIONS;
 }
 return {...next,mutatron:{...next.mutatron,resonance}};
}
